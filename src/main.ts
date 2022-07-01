import mergeWith from 'lodash.mergewith';
import * as Context from './context';
import * as SYMBOLS from './symbols';
import { ObjectLike, WithProperties } from './types';
import { get, isObjectLike, reduceDeep, set } from './utils';

export const make = <T extends ObjectLike>(target: T, destination?: ObjectLike): WithProperties<T> => {
  const cloned = clone(target);

  if (destination !== undefined && !Context.getReference(destination)) {
    throw new Error(`Destination object doesn't include any references. Run it through make() first.`);
  }

  Context.inherit(cloned, destination);

  const reduced = reduceDeep<T, any>(cloned, (rParent: any, rValue: any, rKey?: any) => {
    // Inherit destination context for all ObjectLike values
    if (isObjectLike(rValue)) {
      Context.inherit(rValue, rParent);
    }

    // Set values to destination when ObjectLike (skips when reducing on text/number/symbol)
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
      const gValue = get(gTarget, gKey);
      // if (isObjectLike(gValue)) return proxy(gValue);
      return gValue;
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

  let cloned;

  if (Array.isArray(source)) cloned = [];
  else cloned = {};

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
  const unmade = clone(Context.getSource<T>(target) || target, { withContext: false });

  return unmade;
}

export const merge = (target: any, source?: any) => {
  return Reflect.get(
    mergeWith({ root: clone(target) }, { root: clone(source) }, (targetValue: any, sourceValue: any, key: string) => {
      // Custom merge arrays
      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        const destinationArray = clone(targetValue);

        if (Array.isArray(sourceValue)) {
          // Loop items from source
          for (const destinationItem of destinationArray) {
            const matchedItem = isObjectLike(destinationItem) && sourceValue.find((x: any) => Context.getReference(x) === Context.getReference(destinationItem));
            if (matchedItem) Object.assign(destinationItem, merge(destinationItem, matchedItem));
          }

          // Loop items from target
          for (const item of sourceValue) {
            const itemExists = isObjectLike(item) && destinationArray.findIndex((x: any) => Context.getReference(x) === Context.getReference(item)) > -1;
            if (!itemExists) destinationArray.push(item);
          }
        }

        return destinationArray;
      }
    }), 'root');
}

export const join = <T extends ObjectLike>(source: T, ...targets: ObjectLike[]): T => {
  let references = new Set(Context.getReferences(source).keys());
  let cloned = clone(source);

  let iterationsWithoutChange = 0;

  while (targets.length && iterationsWithoutChange < targets.length) {
    const target = targets.shift() as ObjectLike;
    const targetRef = Context.getReference(target);
    const targetDestinationReference = Context.getDestinationReference(target);

    // Merge target into cloned when no reference
    if (!targetRef && !targetDestinationReference) {
      cloned = merge(cloned, target);
    }
    // Check all destinations are present in the target
    else if (references.has(targetRef) || references.has(targetDestinationReference)) {
      // Reference all the children in the target
      const targetReferences = Context.getReferences(target);
      references = new Set([...references, ...targetReferences.keys()]);
      iterationsWithoutChange = 0;

      cloned = Reflect.get(reduceDeep<{ root: T }, any>({ root: cloned }, (rParent, rValue, rKey) => {

        if (Context.getReference(rValue) === targetDestinationReference && Array.isArray(rValue)) {
          rParent[rKey] = merge(rValue, [target]);
          // console.log(rKey, { merged: rParent[rKey] })

        } else if (Context.getReference(rValue) === targetRef) {
          rParent[rKey] = merge(rValue, target);
          // console.log(rValue, rKey, Context.getReference(rValue), target, targetRef, rParent[rKey])
        }
        else if (isObjectLike(rParent)) {
          rParent[rKey] = rValue;
        }

        // console.log({
        //   rKey,
        //   targetDestinationReference,
        //   id: Context.getReference(rValue),
        //   asArray: Context.getReference(rValue) === targetDestinationReference && Array.isArray(rValue),
        //   isObject: Context.getReference(rValue) === targetRef,
        //   rValue,
        //   rParent,
        // })

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