import { getReference } from '../src/context';
import * as Context from '../src/context';
import { make } from '../src/core';
import * as SYMBOLS from '../src/symbols';
import * as utils from '../src/utils';

describe('getReference - accessors', () => {

    it('should return instance id from object', () => {
        const id = utils.newReference();
        let obj: any = {};
        Reflect.set(obj, SYMBOLS.Reference, id)
        expect(Context.getReference(obj)).toBe(id);
    });

});

describe('getDestinationReference - accessors', () => {

    it('should return parent instance id from object', () => {
        const id = utils.newReference();
        let obj: any = {};
        Reflect.set(obj, SYMBOLS.DestinationReference, id)
        expect(Context.getDestinationReference(obj)).toBe(id);
    });

});

describe('getSource - accessors', () => {

    it('should return object source from a proxied object', () => {
        let obj: any = {};
        const proxied = new Proxy(obj, {
            get(target, key) {
                if (key === SYMBOLS.Source) return target;
            }
        });

        expect(Context.getSource(proxied)).toBe(obj);
    });

    it('should return array source from a proxied array', () => {
        let arr: any = [];
        const proxied = new Proxy(arr, {
            get(target, key) {
                if (key === SYMBOLS.Source) return target;
            }
        });

        expect(Context.getSource(proxied)).toBe(arr);
    });

});

describe('sortByOldestUpdate - accessors', () => {

    it('should return a sorted list of objects by last updated datetime', async () => {
        const obj1: any = make({});
        await new Promise(resolve => setTimeout(resolve, 1000));
        const obj2: any = make({});
        const sorted = [obj2, obj1].sort(Context.sortByOldestUpdate);

        expect(sorted.map(getReference)).toStrictEqual([getReference(obj1), getReference(obj2)]);
    });

});
