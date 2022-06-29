import cloneDeepWith from 'lodash.clonedeepwith';
import mergeWith from 'lodash.mergewith';
import { getId, getParentId, getReferences, getSource } from './accessors';
import { ContextSymbols, InstanceId, InstanceSource, ParentInstanceId } from './symbols';
import { ObjectLike, WithProperties } from './types';
import { get, isObject, makeId, reduceDeep, set } from './utils';

export const unwrap = <T extends ObjectLike>(target: T): T => {
  return getSource<T>(target) || target;
}

const addContext = (target: ObjectLike, parent?: ObjectLike) => {
  if (!isObject(target)) return target;

  Object.defineProperties(
    target,
    {
      [InstanceId]: {
        configurable: true,
        writable: false,
        enumerable: false,
        value: Reflect.get(target, InstanceId) || makeId()
      },
      [ParentInstanceId]: {
        configurable: true,
        writable: false,
        enumerable: false,
        value: Reflect.get(target, ParentInstanceId) || Reflect.get(parent || {}, InstanceId)
      }
    }
  )
};

const getContextProperties = (source: ObjectLike) => {
  return Object.getOwnPropertySymbols(source).reduce((acc, symbol) => {
    if (ContextSymbols.includes(symbol)) {
      Reflect.set(acc, symbol, {
        writable: false,
        configurable: true,
        enumerable: false,
        value: Reflect.get(source, symbol)
      })
    }
    return acc;
  }, {});
}

const setContextProperties = (source: ObjectLike, properties: PropertyDescriptorMap) => {
  Object.defineProperties(source, {
    ...Object.getOwnPropertyDescriptors(source),
    ...properties
  });
}

export const copyContext = (source: ObjectLike, destination: ObjectLike) => {

  // Retrieve interesting context
  const properties: Record<string, PropertyDescriptor> = getContextProperties(source);
  setContextProperties(destination, properties);

  return destination;
}


export const wrap = <T extends ObjectLike>(target: T, parent?: ObjectLike): WithProperties<T> => {

  const proxy = <T extends object = any>(value: T): T => {
    if (!isObject(value)) return value;

    return new Proxy(value, {
      get(gTarget, gKey) {
        if (gKey === InstanceSource) return gTarget;
        const gValue = get(gTarget, gKey);
        // if (isObject(gValue)) return proxy(gValue);
        return gValue;
      },
      set(sTarget, sKey, sValue, sReceiver) {
        const wrapped = wrap(sValue, sTarget);
        set(sTarget, sKey, wrapped, sReceiver);
        return true;
      }
    })
  }

  const cloned = clone(target);
  addContext(cloned, parent);

  const reduced = reduceDeep<T, any>(cloned, (rParent: any, rValue: any, rKey?: any) => {
    if (isObject(rValue)) {
      addContext(rValue as ObjectLike, rParent);
    }

    if (isObject(rParent)) {
      rParent[rKey] = rValue;
    }

    return rParent;
  }, cloned);

  const proxied = proxy(reduced);

  return proxied;
};

export const clone = <T = any>(source: T): T => {
  return Reflect.get(cloneDeepWith({ source }, (value: any, key: any) => {
    if (isObject(value)) {
      const properties = getContextProperties(value);
      setContextProperties(value, properties);

      return value;
    }
  }), 'source');
}

export const merge = (target: any, source?: any) => {
  return Reflect.get(
    mergeWith({ root: target }, { root: source }, (targetValue: any, sourceValue: any, key: string) => {
      // Custom merge arrays
      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        const destinationArray = clone(targetValue);

        if (Array.isArray(sourceValue)) {
          // Loop items from source
          for (const destinationItem of destinationArray) {
            const matchedItem = isObject(destinationItem) && sourceValue.find((x: any) => getId(x) === getId(destinationItem));
            if (matchedItem) Object.assign(destinationItem, merge(destinationItem, matchedItem));
          }

          // Loop items from target
          for (const item of sourceValue) {
            const itemExists = isObject(item) && destinationArray.findIndex((x: any) => getId(x) === getId(item)) > -1;
            if (!itemExists) destinationArray.push(item);
          }
        }

        return destinationArray;
      }
    }), 'root');
}

export const join = <T extends ObjectLike>(source: T, ...targets: ObjectLike[]): T => {
  let references = new Set(getReferences(source).keys());
  let cloned = clone(source);

  let iterationsWithoutChange = 0;

  while (targets.length && iterationsWithoutChange < targets.length) {
    const target = targets.shift() as ObjectLike;
    const targetId = getId(target);
    const targetParentId = getParentId(target);


    // Merge target into cloned when no parent id is set
    if (!targetParentId) {
      cloned = merge(cloned, target);
    }
    // Check all parents are present in the target
    else if (references.has(targetParentId)) {
      // Reference all the children in the target
      const targetReferences = getReferences(target);
      references = new Set([...references, ...targetReferences.keys()]);
      iterationsWithoutChange = 0;

      console.log({ cloned: (cloned as any).work, id: getId((cloned as any).work) })

      cloned = Reflect.get(reduceDeep<{ root: T }, any>({ root: cloned }, (rParent, rValue, rKey) => {

        if (getId(rValue) === targetParentId && Array.isArray(rValue)) {
          rParent[rKey] = merge(rValue, [target]);
          console.log(rKey, { merged: rParent[rKey] })

        } else if (getId(rValue) === targetId) {
          rParent[rKey] = merge(rValue, target);
        }

        // console.log({ rKey, targetParentId, id: getId(rValue), array: Array.isArray(rValue), rValue, rParent })

        if (isObject(rParent)) {
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

  return cloned;
};



// export const copy = (source: ObjectLike) => {
//   return wrap(getSource(source));
// }




// Need it differently

// export const flatten = <T extends ObjectLike>(source: T): any => {
//   const transform = (value: any, parent?: any): any => {
//     if (isObject(value)) {
//       Object.defineProperties(
//         value,
//         {
//           ...Object.getOwnPropertyDescriptors(value),
//           [InstanceId.toString()]: {
//             writable: true,
//             configurable: true,
//             enumerable: true,
//             value: Reflect.get(value, InstanceId)
//           },
//           [ParentInstanceId.toString()]: {
//             writable: true,
//             configurable: true,
//             enumerable: true,
//             value: Reflect.get(value, ParentInstanceId) || Reflect.get(parent || {}, InstanceId)
//           }
//         }
//       );
//     }

//     return value;
//   }

//   const flattened = clone(source, transform);
//   transform(flattened);

//   return flattened;
// }