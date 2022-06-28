import * as utils from '../src/utils';
import { TS_LENGTH, UID_LENGTH } from '../src/utils';

describe('isObject(value: any)', () => {
  it('should return true for objects', () => {
    expect(utils.isObject({})).toBeTruthy();
    expect(utils.isObject([])).toBeTruthy();
  });

  it('should return false for null', () => {
    expect(utils.isObject(null)).toBeFalsy();
  });

  it('should return false for undefined', () => {
    expect(utils.isObject(undefined)).toBeFalsy();
  });

  it('should return false for booleans', () => {
    expect(utils.isObject(true)).toBeFalsy();
    expect(utils.isObject(false)).toBeFalsy();
  });

  it('should return false for primitives', () => {
    expect(utils.isObject(42)).toBeFalsy();
    expect(utils.isObject('should fo')).toBeFalsy();
  });

  it('should return false for functions', () => {
    expect(utils.isObject(function () { })).toBeFalsy();
  });
});

describe('makeId()', () => {
  const id1 = utils.makeId();
  const id2 = utils.makeId();
  const id3 = utils.makeId();

  it('should return a new id of right length', () => {
    expect(id1.length).toBe(UID_LENGTH + TS_LENGTH);
  });

  it('should return a different id everytime (100 000 generations)', () => {
    const length = 100000;
    expect(new Set(Array.apply(null, Array(length)).map(() => utils.makeId())).size).toBe(length);
  });
});

describe('readId(id: string)', () => {
  it('should return an timestamp (ts) that should be a valid Date', () => {
    expect(utils.readId(utils.makeId()).ts).toBeInstanceOf(Date);
    expect(utils.readId(utils.makeId()).ts.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });

  it('should return an uid (uid) that should be a string of fixed length', () => {
    expect(utils.readId(utils.makeId()).uid.length).toBe(UID_LENGTH);
  });
});


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
    expect(utils.get({ "1": true }, 1)).toBe(true);
  });

  it('should read a symbol key prop in an array', () => {
    const symbol = Symbol('id');
    let arr: any = [];
    Reflect.set(arr, symbol, true);
    expect(utils.get(arr, symbol)).toBe(true);
  });

  it('should read a number-like key prop in an array', () => {
    expect(utils.get([true], 0)).toBe(true);
  });
});


describe('set(target, key, value, receiver)', () => {
  it('should set a string key prop in an object', () => {
    let obj: any = {};
    utils.set(obj, 'name', true)
    expect(obj.name).toBe(true);
  });

  it('should set a symbol key prop in an object', () => {
    let obj: any = {};
    const symbol = Symbol('id');
    utils.set(obj, symbol, true)
    expect(Reflect.get(obj, symbol)).toBe(true);
  });

  it('should set a number-like key prop in an object', () => {
    let obj: any = {};
    utils.set(obj, 1, true)
    expect(obj[1]).toBe(true);
  });

  it('should set a symbol key prop in an array', () => {
    const symbol = Symbol('id');
    let arr: any = [];
    Reflect.set(arr, symbol, true);
    expect(Reflect.get(arr, symbol)).toBe(true);
  });

  it('should set a number-like key prop in an array', () => {
    let arr: any = [];
    Reflect.set(arr, 0, true);
    expect(arr[0]).toBe(true);
  });
});
