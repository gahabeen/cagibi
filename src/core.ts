import mergeWith from 'lodash.mergewith';
import * as Context from './context';
import { isWritten, read } from './io';
import * as SYMBOLS from './symbols';
import { ObjectLike, WithProperties } from './types';
import { get, isObjectLike, reduceDeep, set } from './utils';

/**
 * Makes a stitchable copy of an object.
 * @param target Object to make sticheable recursively
 * @param parent Parent object to which target should be stitched to
 * @returns Cloned sticheable object
 */
export const make = <T extends ObjectLike>(target: T, parent?: ObjectLike): WithProperties<T> => {
    const cloned = clone(target);

    const parsedParent = parse(parent);

    if (parsedParent !== undefined && !Context.getReference(parsedParent)) {
        throw new Error(`Parent object doesn't include any references. Run it through make() first.`);
    }

    Context.inherit(cloned, parsedParent);

    const reduced = reduceDeep<T, any>(cloned, (rParent: any, rValue: any, rKey?: any) => {
        // Inherit parent context for all ObjectLike values
        if (isObjectLike(rValue)) {
            Context.inherit(rValue, rParent);
        }

        // Set values to parent when ObjectLike (skips when reducing on text/number/symbol)
        if (isObjectLike(rParent)) {
            rParent[rKey] = rValue;
        }

        return rParent;
    });

    const proxied = proxy(reduced);

    return proxied;
};

export const proxy = <T extends object = any>(value: T): T => {
    if (!isObjectLike(value)) return value;

    return new Proxy(value, {
        get(gTarget, gKey) {
            if (gKey === SYMBOLS.IsProxied) return true;
            if (gKey === SYMBOLS.Source) return gTarget;
            return get(gTarget, gKey);
        },
        set(sTarget, sKey, sValue, sReceiver) {
            const state = make(sValue, sTarget);
            set(sTarget, sKey, state, sReceiver);
            return true;
        }
    })
}

export const clone = <T extends any = any>(source: T, options: { withContext: boolean } = { withContext: true }): T => {
    if (!isObjectLike(source)) return source;

    const cloned = Array.isArray(source) ? [] : {};

    if (options.withContext) {
        const properties = Context.get(source as ObjectLike);
        Context.set(cloned, properties);
    }

    for (const key of Object.keys(source as ObjectLike)) {
        Reflect.set(cloned, key, clone(Reflect.get(source as any, key), options))
    }

    return cloned as T;
}

export const unmake = <T extends ObjectLike>(target: T): T => {
    return clone(Context.getSource<T>(target) || target, { withContext: false });
}

export const merge = (target: any, source?: any) => {
    return Reflect.get(
        mergeWith({ root: clone(target) }, { root: clone(source) }, (targetValue: any, sourceValue: any) => {
            // Custom merge arrays
            if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
                const parentArray = clone(targetValue);

                if (Array.isArray(sourceValue)) {
                    // Loop items from source
                    for (const parentItem of parentArray) {
                        const matchedItem = isObjectLike(parentItem) && sourceValue.find((x: any) => Context.getReference(x) === Context.getReference(parentItem));
                        if (matchedItem) Object.assign(parentItem, merge(parentItem, matchedItem));
                    }

                    // Loop items from target
                    for (const item of sourceValue) {
                        const itemExists = isObjectLike(item) && parentArray.findIndex((x: any) => Context.getReference(x) === Context.getReference(item)) > -1;
                        if (!itemExists) parentArray.push(item);
                    }
                }

                return parentArray;
            }

            return undefined;
        }), 'root');
}

export const report = <T extends ObjectLike>(firstTarget: T, ...targets: T[]): { data: T, operations: any[] } => {
    let references = new Set(Context.getReferences(firstTarget).keys());
    let cloned = clone(firstTarget);

    let iterationsWithoutChange = 0;
    const operations: any[] = [];

    while (targets.length && iterationsWithoutChange < targets.length) {
        const target = targets.shift() as T;
        const targetRef = Context.getReference(target);
        const targetParentReference = Context.getParentReference(target);

        if (!targetRef && !targetParentReference) {
            cloned = merge(cloned, target);
        }

        // Check all parents are present in the target
        else if (references.has(targetRef) || references.has(targetParentReference)) {
            // Reference all the children in the target
            const targetReferences = Context.getReferences(target);
            references = new Set([...references, ...targetReferences.keys()]);
            iterationsWithoutChange = 0;

            cloned = Reflect.get(reduceDeep<{ root: T }, any>({ root: cloned }, (rParent, rValue, rKey) => {

                if (Context.getReference(rValue) === targetParentReference && Array.isArray(rValue)) {
                    rParent[rKey] = merge(rValue, [target]);
                    // console.log(rKey, { stitched: rParent[rKey] })

                } else if (Context.getReference(rValue) === targetRef) {
                    rParent[rKey] = merge(rValue, target);
                }
                else if (isObjectLike(rParent)) {
                    rParent[rKey] = rValue;
                }

                return rParent;
            }, { root: cloned }), 'root');

        }
        else {
            targets.push(target);
            iterationsWithoutChange++;
        }
    }

    return {
        data: cloned,
        operations,
    };
};

export const parse = <T extends ObjectLike = any>(source: T | string): T => {
    if (isWritten(source)) return read(source);
    return source as T;
};

/**
 * Stitch all target objects to the source object.
 * @param source Main object to stitch from.
 * @param targets All sub-objects to stitch to the main object
 * @returns Stitched object
 */
export const stitch = (...targets: ObjectLike[]): any => {
    const [target, ...otherTargets] = targets.map(parse).sort(Context.sortByOldestUpdate);

    return report(target, ...otherTargets).data;
};
