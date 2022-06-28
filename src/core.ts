import { getId, getParentId, getReferences } from './accessors';
import { InstanceId, InstanceSource, ParentInstanceId } from './symbols';
import { ObjectLike } from './types';
import { get, isObject, makeId, set, traverse } from './utils';

export const make = (target: ObjectLike, parent?: ObjectLike) => {
  if (!isObject(target)) return target;
  const cloned = Object.defineProperties(
    clone(target, make),
    {
      [InstanceId]: {
        writable: false,
        enumerable: false,
        value: Reflect.get(target, InstanceId) || makeId()
      },
      [ParentInstanceId]: {
        writable: false,
        enumerable: false,
        value: Reflect.get(target, ParentInstanceId) || Reflect.get(parent || {}, InstanceId)
      }
    }
  );

  return new Proxy(cloned, {
    get(getTarget, key) {
      if (key === InstanceSource) return getTarget;
      return get(getTarget, key);
    },
    set(setTarget, key, value, receiver) {
      const wrapped = make(value, setTarget);
      set(setTarget, key, wrapped, receiver);
      return true;
    }
  })
};

export const clone = (source: any, transform: (value: any, parent?: any) => any = v => v): any => {
  if (!isObject(source)) return transform(source);

  const newSource = Array.isArray(source) ? [] : {};

  // Pass the symbols through
  const symbols = Object.getOwnPropertySymbols(source);
  for (const symbol of symbols) {
    Object.defineProperty(
      newSource,
      symbol,
      {
        writable: false,
        enumerable: false,
        value: Reflect.get(source, symbol)
      }
    )
  }

  if (Array.isArray(source)) {
    for (const item of Object.values(source)) {
      (newSource as any[]).push(transform(clone(item), source));
    }
    return newSource;

  } else if (isObject(source)) {
    return Object.keys(source).reduce((acc: any, key) => {
      acc[key] = transform(clone(source[key]), source);
      return acc;
    }, newSource);

  } else {
    return transform(source);
  }
}


export const mergeInternal = (source: any, target?: any) => {
  const sourceClone = clone(source);
  if (target === undefined) return sourceClone;

  const targetClone = clone(target);
  // When source is an array
  if (Array.isArray(sourceClone)) {
    if (Array.isArray(targetClone)) {
      // Loop items from source
      for (const sourceItem of sourceClone) {
        const matchedItem = isObject(sourceItem) && targetClone.find((x: any) => getId(x) === getId(sourceItem));
        if (matchedItem) Object.assign(sourceItem, mergeInternal(sourceItem, matchedItem));
      }

      // Loop items from target
      for (const item of targetClone) {
        const itemExists = isObject(item) && sourceClone.findIndex((x: any) => getId(x) === getId(item)) > -1;
        if (!itemExists) sourceClone.push(item);
      }
    }

    return sourceClone;

  }
  // When source is an object
  else if (isObject(sourceClone)) {
    if (isObject(targetClone)) {
      for (const key of Object.keys(targetClone)) {
        sourceClone[key] = mergeInternal(Reflect.get(sourceClone, key), Reflect.get(targetClone, key));
      }
    }

    return sourceClone;
  }
  // When source is a primitive type
  else {
    return target || source;
  }
}


export const merge = (source: ObjectLike, ...targets: ObjectLike[]): any => {
  let references = new Set(getReferences(source).keys());
  let cloned = clone(source);

  let iterationsWithoutChange = 0;

  while (targets.length && iterationsWithoutChange < targets.length) {
    const target = targets.shift() as ObjectLike;
    const targetId = getId(target);
    const targetParentId = getParentId(target);


    // Merge target into cloned when no parent id is set
    if (!targetParentId) {
      cloned = mergeInternal(cloned, target);
    }
    // Check all parents are present in the target
    else if (references.has(targetParentId)) {
      // Reference all the children in the target
      const targetReferences = getReferences(target);
      references = new Set([...references, ...targetReferences.keys()]);
      iterationsWithoutChange = 0;

      traverse(cloned, (key, value) => {
        if (getId(value) === targetParentId && Array.isArray(value)) {
          const merged = mergeInternal(value, [target]);
          set(cloned, key, merged);
        } else if (getId(value) === targetId) {
          const merged = mergeInternal(value, target);
          set(cloned, key, merged);
        }
      });

    }
    //
    else {
      targets.push(target);
      iterationsWithoutChange++;
    }
  }

  return cloned;
};