import * as Context from './context';
import { ObjectLike, ReallyAny } from './types';
import { isObjectLike } from './utils';

export const clone = <T extends ReallyAny = ReallyAny>(source: T, options: { withContext: boolean } = { withContext: true }): T => {
    if (!isObjectLike(source)) return source;

    const cloned = Array.isArray(source) ? [] : {};

    if (options.withContext) {
        const properties = Context.get(source as ObjectLike);
        Context.set(cloned, properties);
    }

    for (const key of Object.keys(source as ObjectLike)) {
        Reflect.set(cloned, key, clone(Reflect.get(source as ReallyAny, key), options));
    }

    return cloned as T;
};

export default clone;
