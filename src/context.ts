import * as SYMBOLS from './symbols';
import { ObjectLike } from './types';
import { isObjectLike, newReference, traverse } from './utils';

export const descriptorDefaults = {
    configurable: true,
    writable: false,
    enumerable: false,
};

export const inherit = (target: ObjectLike, destination?: ObjectLike): void => {
    if (!isObjectLike(target)) return;

    const reference = getReference(target) || newReference();
    const destinationRef = getReference(destination);

    Object.defineProperties(
        target,
        {
            [SYMBOLS.Reference]: {
                ...descriptorDefaults,
                value: reference
            },
            [SYMBOLS.DestinationReference]: {
                ...descriptorDefaults,
                value: destinationRef
            },
            [SYMBOLS.CreatedAt]: {
                ...descriptorDefaults,
                value: Reflect.get(target, SYMBOLS.CreatedAt) || new Date().getTime()
            },
            [SYMBOLS.UpdatedAt]: {
                ...descriptorDefaults,
                value: new Date().getTime()
            },
            [SYMBOLS.UpdateIndex]: {
                ...descriptorDefaults,
                value: `${process.hrtime.bigint()}`
            }
        }
    )
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
                // console.log({ key, value, isRef: key === SYMBOLS.Reference, ref: getReference(source), val: (source as any)[key] })
                if (options.isDefinedOnly || value !== undefined) {
                    Reflect.set(acc, key, { ...descriptorDefaults, value });
                }
            }
            return acc;
        }, {});
}

export const set = (source: ObjectLike, properties: PropertyDescriptorMap, options: { asSymbolKey: boolean } = { asSymbolKey: false }) => {
    if (!isObjectLike(source)) {
        throw new Error('Source must be an ObjectLike.');
    }

    const newProperties = Reflect.ownKeys(properties).reduce((acc, rKey) => {
        const descriptor = Reflect.get(properties, rKey);
        const key = options.asSymbolKey ? SYMBOLS.toSymbol(rKey) : rKey;
        Reflect.set(acc, key, descriptor);
        // if ('hey' in source) console.log({ key, rKey, descriptor, acc, ref: getReference(acc) })
        return acc;
    }, {});

    Object.defineProperties(source, {
        ...Object.getOwnPropertyDescriptors(source),
        ...newProperties,
    });

    // if ('hey' in source) console.log({ source, pp: Object.getOwnPropertyDescriptors(source)[Symbol('Cagibi__Reference')], properties, newProperties, ref: getReference(source) })
}

export const copy = (source: ObjectLike, destination: ObjectLike) => {
    // Retrieve interesting context only
    const properties: Record<string, PropertyDescriptor> = get(source);
    set(destination, properties);

    return destination;
}

export const getUpdateIndex = (target: any): BigInt | void => {
    if (!isObjectLike(target)) return;
    const updateIndexString = Reflect.get(target, SYMBOLS.UpdateIndex);
    if (updateIndexString) {
        return BigInt(updateIndexString);
    }
}

export const getCreatedAt = (target: any): string => isObjectLike(target) ? Reflect.get(target, SYMBOLS.UpdatedAt) : undefined;

export const getUpdatedAt = (target: any): string => isObjectLike(target) ? Reflect.get(target, SYMBOLS.UpdatedAt) : undefined;

export const getReference = (target: any): string => isObjectLike(target) ? Reflect.get(target, SYMBOLS.Reference) : undefined;

export const getDestinationReference = (target: any): string => isObjectLike(target) ? Reflect.get(target, SYMBOLS.DestinationReference) : undefined;

export const getSource = <T = any>(target: T): T => (isObjectLike(target) ? Reflect.get(target as any, SYMBOLS.Source) : undefined) as T;

export const getReferences = (target: any): Map<string, ObjectLike> => {
    const deps = new Map();

    const walker = (_: any, value: any) => {
        const Reference = getReference(value);
        if (Reference) deps.set(Reference, value);
    }

    traverse({ target }, walker);

    return deps;
}

export const getDestinationReferences = (target: any): string[] => {
    const deps = new Set<string>();

    const walker = (_: any, value: any) => {
        const DestinationReference = getDestinationReference(value);
        if (DestinationReference) deps.add(DestinationReference);
    }

    traverse(target, walker);
    return [...deps.values()];
}

export const sortByOldestUpdate = (a: ObjectLike, z: ObjectLike): number => {
    const aUpdatedAt = getUpdateIndex(a) || 0n;
    const zUpdatedAt = getUpdateIndex(z) || 0n;
    return aUpdatedAt > zUpdatedAt ? 1 : -1;
}
