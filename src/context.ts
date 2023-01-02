import * as SYMBOLS from './symbols';
import { ObjectLike, ReallyAny } from './types';
import { isObjectLike, newReference, traverse } from './utils';

export const descriptorDefaults = {
    configurable: true,
    writable: false,
    enumerable: false,
};

export const inherit = (target: ObjectLike, origin?: ObjectLike, options?: { forceNewReference?: boolean }): void => {
    if (!isObjectLike(target)) return;
    const { forceNewReference = true } = options || {};

    let reference = getReference(target) || newReference();
    let originReference = getReference(origin);
    let createdAt = getCreatedAt(target) || new Date().getTime();

    if (!forceNewReference && isObjectLike(origin) && !Array.isArray(origin)) {
        if (getOriginReference(target) !== originReference) {
            reference = originReference;
            originReference = getOriginReference(origin);
            createdAt = getCreatedAt(origin);
        }
    } else if (reference === originReference) {
        throw new Error(`Origin (${originReference}) can't have the same reference as the target ${reference}`);
    }

    Object.defineProperties(
        target,
        {
            [SYMBOLS.Reference]: {
                ...descriptorDefaults,
                value: reference,
            },
            [SYMBOLS.OriginReference]: {
                ...descriptorDefaults,
                value: originReference,
            },
            [SYMBOLS.CreatedAt]: {
                ...descriptorDefaults,
                value: createdAt,
            },
            [SYMBOLS.UpdatedAt]: {
                ...descriptorDefaults,
                value: new Date().getTime(),
            },
            [SYMBOLS.UpdateIndex]: {
                ...descriptorDefaults,
                value: `${process.hrtime.bigint()}`,
            },
        },
    );
};

export const get = (source: ObjectLike, options: { asStringKey?: boolean, isDefinedOnly?: boolean } = { asStringKey: false, isDefinedOnly: true }) => {
    if (!isObjectLike(source)) {
        throw new Error('Source must be an ObjectLike.');
    }

    return Object.getOwnPropertySymbols(source)
        .reduce((acc, rSymbol) => {
            if (SYMBOLS.ContextSymbols.includes(rSymbol)) {
                const key = options.asStringKey ? SYMBOLS.toString(rSymbol) : rSymbol;
                const value = Reflect.get(source, rSymbol);
                // console.log({ key, value, isRef: key === SYMBOLS.Reference, ref: getReference(source), val: (source as ReallyAny)[key] })
                if (options.isDefinedOnly || value !== undefined) {
                    Reflect.set(acc, key, { ...descriptorDefaults, value });
                }
            }
            return acc;
        }, {});
};

export const set = (source: ObjectLike, properties: PropertyDescriptorMap, options: { asSymbolKey: boolean } = { asSymbolKey: false }) => {
    if (!isObjectLike(source)) {
        throw new Error('Source must be an ObjectLike.');
    }

    const newProperties = Reflect.ownKeys(properties).reduce((acc, rKey) => {
        const descriptor = Reflect.get(properties, rKey);
        const key = options.asSymbolKey ? SYMBOLS.toSymbol(rKey) : rKey;
        Reflect.set(acc, key, descriptor);
        return acc;
    }, {});

    Object.defineProperties(source, {
        ...Object.getOwnPropertyDescriptors(source),
        ...newProperties,
    });
};

export const copy = (fromSource: ObjectLike, toTarget: ObjectLike) => {
    // Retrieve interesting context only
    const properties: Record<string, PropertyDescriptor> = get(fromSource);
    set(toTarget, properties);

    return toTarget;
};

export const getUpdateIndex = (target: ReallyAny): bigint | void => {
    if (!isObjectLike(target)) return;
    const updateIndexString = Reflect.get(target, SYMBOLS.UpdateIndex);
    if (updateIndexString) {
        return BigInt(updateIndexString);
    }
};

export const getCreatedAt = (target: ReallyAny): string => (isObjectLike(target) ? Reflect.get(target, SYMBOLS.UpdatedAt) : undefined);

export const getUpdatedAt = (target: ReallyAny): string => (isObjectLike(target) ? Reflect.get(target, SYMBOLS.UpdatedAt) : undefined);

export const getReference = (target: ReallyAny): string => (isObjectLike(target) ? Reflect.get(target, SYMBOLS.Reference) : undefined);

export const getOriginReference = (target: ReallyAny): string => (isObjectLike(target) ? Reflect.get(target, SYMBOLS.OriginReference) : undefined);

export const getSource = <T = ReallyAny>(target: T): T => (isObjectLike(target) ? Reflect.get(target as ReallyAny, SYMBOLS.Source) : undefined) as T;

export const getReferences = (target: ReallyAny): Map<string, ObjectLike> => {
    const deps = new Map();

    const walker = (_: ReallyAny, value: ReallyAny) => {
        const Reference = getReference(value);
        if (Reference) deps.set(Reference, value);
    };

    traverse({ target }, walker);

    return deps;
};

export const getOriginReferences = (target: ReallyAny): string[] => {
    const deps = new Set<string>();

    const walker = (_: ReallyAny, value: ReallyAny) => {
        const OriginReference = getOriginReference(value);
        if (OriginReference) deps.add(OriginReference);
    };

    traverse(target, walker);
    return [...deps.values()];
};

export const sortByOldestUpdate = (a: ObjectLike, z: ObjectLike): number => {
    const aUpdatedAt = getUpdateIndex(a) || Infinity;
    const zUpdatedAt = getUpdateIndex(z) || Infinity;
    return aUpdatedAt > zUpdatedAt ? 1 : -1;
};
