import { flatten } from 'flatten-anything';
import { compress, decompress } from 'lzutf8';
import * as utils from './utils';
import * as Context from './context';
import { clone, make } from './main';
import * as SYMBOLS from './symbols';
import { ObjectLike } from './types';
import { isObjectLike } from './utils';

const ROOT_KEY = SYMBOLS.toString(SYMBOLS.Root);
const DATA_KEY = SYMBOLS.toString(SYMBOLS.Data);
const CONTEXTS_KEY = SYMBOLS.toString(SYMBOLS.Contexts);

const customGet = (target: any, path: string) => path === ROOT_KEY ? target : utils.get(target, path)

export const write = <T extends ObjectLike>(source: T, options: { compress: boolean } = { compress: false }): T | string => {
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

  const flat = {
    [DATA_KEY]: clone(source),
    [CONTEXTS_KEY]: contexts
  };

  // console.log({ sourceFlat, contexts, flat });
  if (options.compress) {
    return compress(JSON.stringify(flat), { outputEncoding: 'Base64' });
  }

  return flat as T;
}


export const read = <T extends ObjectLike | string>(written: T, options: { isCompressed: boolean } = { isCompressed: false }): T => {
  let input = written;

  if (options.isCompressed) {
    input = JSON.parse(decompress(written as string, { inputEncoding: 'Base64' }));
  }

  if (!isObjectLike(input) || !Reflect.has(input as ObjectLike, CONTEXTS_KEY)) {
    throw new Error('Written object must be valid. (created via write() method).');
  }

  const data = Reflect.get(input as ObjectLike, DATA_KEY);
  const contexts = Reflect.get(input as ObjectLike, CONTEXTS_KEY);

  const target = clone(data);

  // console.log({ contexts, input, ref: Context.getReference(input) })
  for (const path of Object.keys(contexts)) {
    let value = customGet(target, path);
    const context = Reflect.get(contexts, path);
    Context.set(value, context, { asSymbolKey: true });
    // console.log({ value, context, ref: Context.getReference(value) })
  }

  // console.log({ target, id: Context.getReference(target), ref: Context.getReference(input) });
  // console.log('read id', Context.getReference(target))

  return target;
}