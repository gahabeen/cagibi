import mergeWith from 'lodash.mergewith';
import clone from './clone';
import * as Context from './context';
import { isWritten, read } from './io';
import * as SYMBOLS from './symbols';
import { ObjectLike, PatchedObject, ReallyAny, WithProperties } from './types';
import { deepFreeze, get, isObjectLike, reduceDeep, set } from './utils';

/**
 * Makes a stitchable copy of an object.
 * @param target Object to make sticheable recursively
 * @param parent Parent object to which target should be stitched to
 * @returns Cloned sticheable object
 */
export const make = <T extends ObjectLike>(target: T, parent?: PatchedObject): WithProperties<T> => {
    const cloned = clone(parse(target));
    const parsedParent = parse(parent);

    if (parsedParent !== undefined && !Context.getReference(parsedParent)) {
        throw new Error(`Parent object doesn't include any references. Run it through make() first. ${parsedParent}`);
    }

    Context.inherit(cloned, parsedParent, { forceNewReference: false });

    const reduced = reduceDeep<T, ReallyAny>(cloned, (rParent: ReallyAny, rValue: ReallyAny, rKey?: ReallyAny) => {
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

export const proxy = <T extends ObjectLike = ReallyAny>(value: T): T => {
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
        },
    });
};

export const unmake = <T extends PatchedObject>(target: T): T => {
    return clone(Context.getSource<T>(target) || target, { withContext: false });
};

export const merge = (target: ReallyAny, source?: ReallyAny) => {
    return Reflect.get(
        mergeWith({ root: clone(target) }, { root: clone(source) }, (targetValue: ReallyAny, sourceValue: ReallyAny) => {
            // Custom merge arrays
            if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
                const parentArray = clone(targetValue);

                if (Array.isArray(sourceValue)) {
                    // Loop items from source
                    for (const parentItem of parentArray) {
                        const matchedItem = isObjectLike(parentItem)
                            && sourceValue.find((x: ReallyAny) => Context.getReference(x) === Context.getReference(parentItem));
                        if (matchedItem) Object.assign(parentItem, merge(parentItem, matchedItem));
                    }

                    // Loop items from target
                    for (const item of sourceValue) {
                        const itemExists = isObjectLike(item)
                            && parentArray.findIndex((x: ReallyAny) => Context.getReference(x) === Context.getReference(item)) > -1;
                        if (!itemExists) parentArray.push(item);
                    }
                }

                return parentArray;
            }

            return undefined;
        }), 'root');
};

export const findMainPatch = <T extends PatchedObject = PatchedObject>(...patches: PatchedObject[]): T => {
    const allChildrenReferences = patches.reduce<Set<string>>((acc, patch) => {
        const [, ...childrenReferences] = Array.from(Context.getReferences(patch).keys());
        for (const childrenReference of childrenReferences) {
            acc.add(childrenReference);
        }
        return acc;
    }, new Set());

    return patches.find((patch) => !allChildrenReferences.has(Context.getReference(patch))) as T;
};

export const report = <T extends PatchedObject = PatchedObject>(...patches: PatchedObject[])
    : { data: T, unstitchedPatches: ReallyAny[], stitchedPatchesCount: number } => {
    const unstitchedPatches = patches.map(parse).sort(Context.sortByOldestUpdate);
    const firstPatch = findMainPatch(...unstitchedPatches) as T;

    if (!firstPatch) {
        return {
            data: undefined,
            unstitchedPatches,
            stitchedPatchesCount: 0,
        };
    }

    unstitchedPatches.splice(unstitchedPatches.indexOf(firstPatch), 1);

    let references = new Set(Context.getReferences(firstPatch).keys());
    let cloned = clone(firstPatch);

    let iterationsWithoutChange = 0;
    let stitchedPatchesCount = 1;

    while (unstitchedPatches.length && iterationsWithoutChange < unstitchedPatches.length) {
        const patch = unstitchedPatches.shift() as T;
        const patchRef = Context.getReference(patch);
        const patchParentReference = Context.getParentReference(patch);

        if (!patchRef && !patchParentReference) {
            cloned = merge(cloned, patch);

            stitchedPatchesCount++;
            // Check all parents are present in the patch
        } else if (references.has(patchRef) || references.has(patchParentReference)) {
            // Reference all the children in the patch
            const patchReferences = Context.getReferences(patch);
            references = new Set([...references, ...patchReferences.keys()]);
            iterationsWithoutChange = 0;

            cloned = Reflect.get(reduceDeep<{ root: T }, ReallyAny>({ root: cloned }, (rParent, rValue, rKey) => {
                if (Context.getReference(rValue) === patchParentReference && Array.isArray(rValue)) {
                    rParent[rKey] = merge(rValue, [patch]);
                    // console.log(rKey, { stitched: rParent[rKey] })
                } else if (Context.getReference(rValue) === patchRef) {
                    rParent[rKey] = merge(rValue, patch);
                } else if (isObjectLike(rParent)) {
                    rParent[rKey] = rValue;
                }

                return rParent;
            }, { root: cloned }), 'root');

            stitchedPatchesCount++;
        } else {
            unstitchedPatches.push(patch);
            iterationsWithoutChange++;
        }
    }

    return {
        data: cloned,
        unstitchedPatches,
        stitchedPatchesCount,
    };
};

export const parse = <T extends PatchedObject = ReallyAny>(source: T | string): T => {
    if (isWritten(source)) return read(source);
    return source as T;
};

/**
 * Stitch all target objects to the source object.
 * @param patches All sub-objects to stitch to the main object
 * @returns Stitched object
 */
export const stitch = <T extends PatchedObject = ReallyAny>(...patches: PatchedObject[]): T => {
    const { data, unstitchedPatches, stitchedPatchesCount } = report<T>(...patches);
    if (!stitchedPatchesCount) {
        throw new Error(`Could not determine a way to stitch the patches.`);
    }

    if (unstitchedPatches.length) {
        throw new Error(`Could not stitch all patches.`);
    }

    return data;
};

/**
 * Protects all keys from being written to the target object.
 * @param target Object to protect keys from
 * @param keys List of keys to protect
 * @returns Cloned target with protected keys
 */
export const protect = <T extends PatchedObject = ReallyAny>(target: T, ...keys: PropertyKey[]): T => {
    const cloned = clone(target);
    return Object.defineProperties(cloned, keys.reduce((acc, key) => {
        acc[key] = {
            writable: false,
            value: deepFreeze(Reflect.get(cloned, key)),
        };
        return acc;
    }, {}));
};
