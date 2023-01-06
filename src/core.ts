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
 * @param origin Origin object to which target should be stitched to
 * @returns Cloned sticheable object
 */
export const make = <T extends ObjectLike>(target: T, origin?: PatchedObject): WithProperties<T> => {
    const cloned = clone(parse(target));

    link(cloned, origin);

    const reduced = reduceDeep<T, ReallyAny>(cloned, (rOrigin: ReallyAny, rValue: ReallyAny, rKey?: ReallyAny) => {
        // Inherit origin context for all ObjectLike values
        if (isObjectLike(rValue)) {
            Context.inherit(rValue, rOrigin);
        }

        // Set values to origin when ObjectLike (skips when reducing on text/number/symbol)
        if (isObjectLike(rOrigin)) {
            rOrigin[rKey] = rValue;
        }

        return rOrigin;
    });

    const proxied = proxy(reduced);

    return proxied;
};

export const link = <T extends ObjectLike>(target: T, origin: PatchedObject): void => {
    const parsedOrigin = parse(origin);

    if (parsedOrigin !== undefined && !Context.getReference(parsedOrigin)) {
        throw new Error(`Origin object doesn't include any references. Run it through make() first. ${parsedOrigin}`);
    }

    Context.inherit(target, parsedOrigin, { forceNewReference: false });
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

export const merge = (target: ReallyAny, source?: ReallyAny,
    customizer?: (value: ReallyAny, srcValue: ReallyAny, key: string, object: ReallyAny, source: ReallyAny) => ReallyAny) => {
    customizer = customizer || ((targetValue: ReallyAny, sourceValue: ReallyAny) => {
        // Custom merge arrays
        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            const originArray = clone(targetValue);

            if (Array.isArray(sourceValue)) {
                // Loop items from source
                for (const originItem of originArray) {
                    const matchedItem = isObjectLike(originItem)
                        && sourceValue.find((x: ReallyAny) => Context.getReference(x) && Context.getReference(x) === Context.getReference(originItem));
                    if (matchedItem) Object.assign(originItem, merge(originItem, matchedItem, customizer));
                }

                // Loop items from target
                for (const item of sourceValue) {
                    const itemExists = isObjectLike(item)
                        && originArray.findIndex((x: ReallyAny) => Context.getReference(x) && Context.getReference(x) === Context.getReference(item)) > -1;
                    if (!itemExists) originArray.push(item);
                }
            }

            return originArray;
        }

        return undefined;
    });

    return Reflect.get(
        mergeWith({ root: clone(target) }, { root: clone(source) }, customizer), 'root');
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

export const customReport = (customizer?: (value: ReallyAny, srcValue: ReallyAny, key: string, object: ReallyAny, source: ReallyAny) => ReallyAny) => {
    return <T extends PatchedObject = PatchedObject>(...patches: PatchedObject[])
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

        const references = new Set(Context.getReferences(firstPatch).keys());
        let cloned = clone(firstPatch);

        let iterationsWithoutChange = 0;
        let stitchedPatchesCount = 1;

        while (unstitchedPatches.length && iterationsWithoutChange < unstitchedPatches.length) {
            const patch = unstitchedPatches.shift() as T;
            const patchRef = Context.getReference(patch);
            const patchOriginReference = Context.getOriginReference(patch);

            if (!patchRef && !patchOriginReference) {
                cloned = merge(cloned, patch, customizer);

                stitchedPatchesCount++;
                // Check all origins are present in the patch
            } else if (references.has(patchRef) || references.has(patchOriginReference)) {
                // Reference all the children in the patch
                const patchReferences = Context.getReferences(patch);
                for (const ref of Array.from(patchReferences.keys())) references.add(ref);
                iterationsWithoutChange = 0;

                cloned = Reflect.get(reduceDeep<{ root: T }, ReallyAny>({ root: cloned }, (rOrigin, rValue, rKey) => {
                    if (Context.getReference(rValue) === patchOriginReference && Array.isArray(rValue)) {
                        rOrigin[rKey] = merge(rValue, [patch], customizer);
                        // console.log(rKey, { stitched: rOrigin[rKey] })
                    } else if (Context.getReference(rValue) === patchRef) {
                        rOrigin[rKey] = merge(rValue, patch, customizer);
                    } else if (isObjectLike(rOrigin)) {
                        rOrigin[rKey] = rValue;
                    }

                    return rOrigin;
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
};

export const report = customReport();

export const parse = <T extends PatchedObject = ReallyAny>(source: T | string): T => {
    if (isWritten(source)) return read(source);
    return source as T;
};

/**
 * Stitch all target objects to the source object.
 * @param customizer Custom merge function
 * @param patches All sub-objects to stitch to the main object
 * @returns Stitched object
 */
export const customStitch = (customizer?: (value: ReallyAny, srcValue: ReallyAny, key: string, object: ReallyAny, source: ReallyAny) => ReallyAny) => {
    return <T extends PatchedObject = ReallyAny>(...patches: PatchedObject[]): T => {
        const { data, unstitchedPatches, stitchedPatchesCount } = customReport(customizer)<T>(...patches);
        if (!stitchedPatchesCount) {
            throw new Error(`Could not determine a way to stitch the patches.`);
        }

        if (unstitchedPatches.length) {
            throw new Error(`Could not stitch all patches.`);
        }

        return data;
    };
};

/**
 * Stitch all target objects to the source object.
 * @param patches All sub-objects to stitch to the main object
 * @returns Stitched object
 */
export const stitch = customStitch();

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
