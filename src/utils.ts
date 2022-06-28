import { customAlphabet } from 'nanoid';
import { ObjectLike } from './types';

export const UID_LENGTH = 12;
export const TS_LENGTH = 8;

export const isObject = (target: any): boolean => typeof target === 'object' && target !== null;

export const makeId = (): string => `${customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', UID_LENGTH)()}${new Date().getTime().toString(36)}`;

export const readId = (id: string): { uid: string, ts: Date } => ({
  uid: id.slice(0, UID_LENGTH),
  ts: new Date(parseInt(id.slice(UID_LENGTH), 36)),
});

export const parseKey = (target: ObjectLike, key: string | number | symbol) => {
  if (typeof key === 'symbol') return key;
  return Array.isArray(target) && typeof (+key) === 'number' && !isNaN(+key) ? +key : `${key}`;
}

export const get = (target: ObjectLike, key: any) => {
  const parsedKey = parseKey(target, key);
  return Reflect.get(target, parsedKey);
};

export const set = (target: ObjectLike, key: any, value: any, receiver: any = target): boolean => {
  const parsedKey = parseKey(target, key);
  return Reflect.set(target, parsedKey, value, receiver);
};

export const intersect = (target: Set<any> | Array<any> | IterableIterator<any>, against: Set<any> | Array<any> | IterableIterator<any>) => {
  const againstSet = new Set(against);
  for (const item of new Set(target)) {
    if (!againstSet.has(item)) return false;
  }
}

// export const subtract = (target: Set<any> | Array<any> | IterableIterator<any>, against: Set<any> | Array<any> | IterableIterator<any>) => {
//   const againstSet = new Set(against);
//   return [...new Set(target)].filter(x => !againstSet.has(x));
// }

export const traverse = (target: ObjectLike, walker: (key: string, value: any) => void) => {
  for (const k of Object.keys(target)) {
    const value = Reflect.get(target, k);
    if (isObject(value)) {
      walker(k, value);
      traverse(value, walker);
    } else {
      // Do something with obj[k]
    }
  }
};