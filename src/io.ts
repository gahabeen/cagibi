import { flatten } from 'flatten-anything';
import * as utils from './utils';
import * as Context from './context';
import { clone, make } from './main';
import * as SYMBOLS from './symbols';
import { ObjectLike } from './types';
import { isObjectLike } from './utils';

const ROOT_KEY = SYMBOLS.toString(SYMBOLS.Root);
const CONTEXTS_KEY = SYMBOLS.toString(SYMBOLS.Contexts);

const customGet = (target: any, path: string) => path === ROOT_KEY ? target : utils.get(target, path)

export const write = <T extends ObjectLike>(source: T): any => {
  if (!isObjectLike(source) || !Context.getReference(source)) {
    throw new Error('Source must be a valid ObjectLike created via make() method.');
  }

  const sourceFlat: Record<string, any> = {
    [ROOT_KEY]: source,
    ...flatten(source),
  };

  const contexts = Object.keys(sourceFlat).reduce<any>((acc, path) => {
    const value = customGet(source, path);
    if (!isObjectLike(value)) return acc;

    const context = Context.get(value, { asStringKey: true });
    // console.log({ value, context, isContext: Object.keys(context || {}).length, ref: Context.getReference(value) })
    if (Object.keys(context || {}).length) {
      acc[path] = context;
    }
    return acc;
  }, {});

  // console.log({ sourceFlat, contexts, source });

  let flat = clone(source);
  Reflect.set(flat, CONTEXTS_KEY, contexts);

  // console.log({ sourceFlat, contexts, flat });
  return flat;
}

export const read = <T extends ObjectLike>(written: T): any => {
  if (!isObjectLike(written) || !Reflect.has(written, CONTEXTS_KEY)) {
    throw new Error('Written object must be valid. (created via write() method).');
  }

  const contexts = Reflect.get(written, CONTEXTS_KEY);
  const target = clone(Object.fromEntries(Object.entries(written).filter(([key]) => key !== CONTEXTS_KEY)));

  // console.log({ contexts, written, ref: Context.getReference(written) })
  for (const path of Object.keys(contexts)) {
    let value = customGet(target, path);
    const context = Reflect.get(contexts, path);
    Context.set(value, context, { asSymbolKey: true });
    // console.log({ value, context, ref: Context.getReference(value) })
  }

  // console.log({ target, id: Context.getReference(target), ref: Context.getReference(written) });
  // console.log('read id', Context.getReference(target))

  return target;
}