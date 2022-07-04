import { compress, decompress, isCompressed } from 'minie';
import { flatten } from 'flatten-anything';
import * as Context from './context';
import { clone } from './core';
import * as SYMBOLS from './symbols';
import { InputOuputType, ObjectLike } from './types';
import * as utils from './utils';
import { isObjectLike } from './utils';

const ROOT_KEY = SYMBOLS.toString(SYMBOLS.Root);
const DATA_KEY = SYMBOLS.toString(SYMBOLS.Data);
const CONTEXTS_KEY = SYMBOLS.toString(SYMBOLS.Contexts);

const customGet = (target: any, path: string) => path === ROOT_KEY ? target : utils.get(target, path)

export const write = <T extends ObjectLike>(source: T, options: { output: InputOuputType } = { output: 'compressed' }): T | string => {
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

        if (Object.keys(context || {}).length) {
            acc[path] = context;
        }
        return acc;
    }, {});

    const flat = {
        [DATA_KEY]: clone(source),
        [CONTEXTS_KEY]: contexts
    };

    if (options.output === 'compressed') {
        return compress(JSON.stringify(flat));
    }

    return flat as T;
}

export const isWritten = (value: any) => {
    return isCompressed(value) || (isObjectLike(value) && Reflect.has(value, CONTEXTS_KEY));
};

export const read = <T extends ObjectLike = any>(written: T | string): T => {
    let input = written;

    if (isCompressed(input)) {
        try {
            input = JSON.parse(decompress(input as string));
        } catch (error) {
            throw new Error('Invalid compressed data');
        }
    }

    if (!isObjectLike(input) || !Reflect.has(input as ObjectLike, CONTEXTS_KEY)) {
        throw new Error('Written object must be valid. (created via write() method).');
    }

    const data = Reflect.get(input as ObjectLike, DATA_KEY);
    const contexts = Reflect.get(input as ObjectLike, CONTEXTS_KEY);

    const target = clone(data);

    for (const path of Object.keys(contexts)) {
        let value = customGet(target, path);
        const context = Reflect.get(contexts, path);
        Context.set(value, context, { asSymbolKey: true });
    }

    return target;
}
