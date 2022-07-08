import reduce from 'lodash.reduce';
import { customAlphabet } from 'nanoid';
import { ObjectLike, ReallyAny } from './types';

export const UID_LENGTH = 12;
export const TS_LENGTH = 10;

export const uid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', UID_LENGTH);

export const isObjectLike = (target: ReallyAny): boolean => typeof target === 'object' && target !== null;

export const newReference = (): string => `${uid()}${process.hrtime.bigint().toString(36)}`;

// export const readId = (id: string): { uid: string, ts: Date } => ({
//   uid: id.slice(0, UID_LENGTH),
//   ts: new Date(parseInt(id.slice(UID_LENGTH), 36)),
// });

export const parseKey = (target: ObjectLike, key: string | number | symbol) => {
    if (typeof key === 'symbol') return key;
    return Array.isArray(target) && typeof (+key) === 'number' && !Number.isNaN(+key) ? +key : `${key}`;
};

export const get = (target: ObjectLike, key: ReallyAny) => {
    const reducer = (rOutput: ReallyAny, rKey: ReallyAny) => {
        const parsedKey = parseKey(rOutput, rKey);
        return Reflect.get(rOutput, parsedKey);
    };

    if (typeof key !== 'string') return reducer(target, key);
    return `${key}`.split('.').reduce(reducer, target);
};

export const set = (target: ObjectLike, key: ReallyAny, value: ReallyAny, receiver: ReallyAny = target): boolean => {
    const parsedKey = parseKey(target, key);
    return Reflect.set(target, parsedKey, value, receiver);
};

export const traverse = (target: ObjectLike, walker: (key: string | number | symbol, value: ReallyAny, parent?: ReallyAny) => void) => {
    for (const k of Reflect.ownKeys(target)) {
        const value = Reflect.get(target, k);
        if (isObjectLike(value)) {
            walker(k, value, target);
            traverse(value, walker);
        }
    }
};

export const reduceDeep = <T extends object = ReallyAny, O = ReallyAny>(target: T, reducer:
    (parent: ReallyAny, value: ReallyAny, key?: ReallyAny) => ReallyAny, initialValue: ReallyAny = target): O => {
    return reduce<T, O>(target, (parent: ReallyAny, value: ReallyAny, key: ReallyAny) => {
        const newParent = reducer(parent, value, key);
        if (isObjectLike(newParent[key])) {
            parent[key] = reduceDeep(parent[key], reducer);
        } else {
            parent = newParent;
        }

        return parent;
    }, initialValue);
};

export const flatKeys = (obj: ObjectLike) => {
    return Object.keys(obj).reduce((keys, key) => {
        const value = Reflect.get(obj, key);
        Array.prototype.push.call(keys, key);

        if (isObjectLike(value)) {
            Array.prototype.push.apply(keys, flatKeys(value).map((flatKey) => `${key}.${flatKey}`));
        }

        return keys;
    }, []);
};

export const deepFreeze = (obj: ObjectLike) => {
    Object.freeze(obj);
    if (obj === undefined) {
        return obj;
    }

    Object.getOwnPropertyNames(obj).forEach((prop) => {
        if (obj[prop] !== null
            && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function')
            && !Object.isFrozen(obj[prop])) {
            deepFreeze(obj[prop]);
        }
    });

    return obj;
};
