import * as utils from '../src/utils';

describe('isObjectLike(value: any)', () => {
    it('should return true for objects', () => {
        expect(utils.isObjectLike({})).toBeTruthy();
        expect(utils.isObjectLike([])).toBeTruthy();
    });

    it('should return false for null', () => {
        expect(utils.isObjectLike(null)).toBeFalsy();
    });

    it('should return false for undefined', () => {
        expect(utils.isObjectLike(undefined)).toBeFalsy();
    });

    it('should return false for booleans', () => {
        expect(utils.isObjectLike(true)).toBeFalsy();
        expect(utils.isObjectLike(false)).toBeFalsy();
    });

    it('should return false for primitives', () => {
        expect(utils.isObjectLike(42)).toBeFalsy();
        expect(utils.isObjectLike('should fo')).toBeFalsy();
    });

    it('should return false for functions', () => {
        expect(utils.isObjectLike(() => null)).toBeFalsy();
    });
});

describe('newReference()', () => {
    const id1 = utils.newReference();

    it('should return a new id of right length', () => {
        expect(id1.length).toBe(utils.UID_LENGTH + utils.TS_LENGTH);
    });

    it('should return a different id everytime (100 000 generations)', () => {
        const length = 100000;
        // eslint-disable-next-line prefer-spread
        expect(new Set(Array.apply(null, Array(length)).map(() => utils.newReference())).size).toBe(length);
    });
});

// describe('readId(id: string)', () => {
//   it('should return an timestamp (ts) that should be a valid Date', () => {
//     expect(utils.readId(utils.newReference()).ts).toBeInstanceOf(Date);
//     expect(utils.readId(utils.newReference()).ts.getTime()).toBeLessThanOrEqual(new Date().getTime());
//   });

//   it('should return an uid (uid) that should be a string of fixed length', () => {
//     expect(utils.readId(utils.newReference()).uid.length).toBe(utils.UID_LENGTH);
//   });
// });

describe('parseKey(id: string | number | symbol)', () => {
    it('should return a string key for an object', () => {
        expect(utils.parseKey({}, 'name')).toBe('name');
    });

    it('should return a symbol key for an object', () => {
        const symbol = Symbol('id');
        expect(utils.parseKey({}, symbol)).toBe(symbol);
    });

    it('should return a string key for an array', () => {
        expect(utils.parseKey([], 'name')).toBe('name');
    });

    it('should return a symbol key for an array', () => {
        const symbol = Symbol('id');
        expect(utils.parseKey([], symbol)).toBe(symbol);
    });

    it('should return a number key as a string for an object', () => {
        expect(utils.parseKey({}, '1')).toBe('1');
        expect(utils.parseKey({}, 1)).toBe('1');
    });

    it('should return a number key as a number for an array', () => {
        expect(utils.parseKey([], '1')).toBe(1);
        expect(utils.parseKey([], 1)).toBe(1);
    });
});

describe('get(target, key)', () => {
    it('should read a string key prop in an object', () => {
        expect(utils.get({ name: true }, 'name')).toBe(true);
    });

    it('should read a symbol key prop in an object', () => {
        const symbol = Symbol('id');
        expect(utils.get({ [symbol]: true }, symbol)).toBe(true);
    });

    it('should read a number-like key prop in an object', () => {
        expect(utils.get({ 1: true }, 1)).toBe(true);
    });

    it('should read a symbol key prop in an array', () => {
        const symbol = Symbol('id');
        const arr: any = [];
        Reflect.set(arr, symbol, true);
        expect(utils.get(arr, symbol)).toBe(true);
    });

    it('should read a number-like key prop in an array', () => {
        expect(utils.get([true], 0)).toBe(true);
    });
});

describe('set(target, key, value, receiver)', () => {
    it('should set a string key prop in an object', () => {
        const obj: any = {};
        utils.set(obj, 'name', true);
        expect(obj.name).toBe(true);
    });

    it('should set a symbol key prop in an object', () => {
        const obj: any = {};
        const symbol = Symbol('id');
        utils.set(obj, symbol, true);
        expect(Reflect.get(obj, symbol)).toBe(true);
    });

    it('should set a number-like key prop in an object', () => {
        const obj: any = {};
        utils.set(obj, 1, true);
        expect(obj[1]).toBe(true);
    });

    it('should set a symbol key prop in an array', () => {
        const symbol = Symbol('id');
        const arr: any = [];
        Reflect.set(arr, symbol, true);
        expect(Reflect.get(arr, symbol)).toBe(true);
    });

    it('should set a number-like key prop in an array', () => {
        const arr: any = [];
        Reflect.set(arr, 0, true);
        expect(arr[0]).toBe(true);
    });
});
