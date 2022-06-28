import { getId, getParentId, getSource } from '../src/accessors';
import { clone, wrap, rawMerge } from '../src/core';

describe('clone - core', () => {
  it('should clone am empty object', () => {
    const obj = {};
    const objCloned = clone(obj);
    expect(objCloned).toStrictEqual(obj);
  });

  it('should clone am empty array', () => {
    const obj: any[] = [];
    const objCloned = clone(obj);
    expect(objCloned).toStrictEqual(obj);
  });

  it('should clone anything else', () => {
    expect(clone(false)).toStrictEqual(false);
    expect(clone(1)).toStrictEqual(1);
    expect(clone('name')).toStrictEqual('name');
  });

  it('should clone symbols', () => {
    const original = wrap({});
    const cloned = clone(original);
    expect(getId(cloned)).toBe(getId(original));
  });

});

describe('c - core', () => {
  it('should c am empty object', () => {
    const obj = {};
    const wObj = wrap(obj);
    expect(getId(wObj)).toBeTruthy();
    expect(getParentId(wObj)).toBeFalsy();
    expect(getSource(wObj)).toStrictEqual(obj);
  });

  it('should c a new object from an exsting made empty object', () => {
    const obj = {};
    const wObj = wrap(obj);
    const wwObj = wrap(wObj);

    expect(getId(wwObj)).toBe(getId(wObj));
    expect(getSource(wwObj)).toStrictEqual(wObj);
    expect(getSource(wwObj)).toStrictEqual(obj);
  });

});

describe('rawMerge - core', () => {
  it('should merge two arrays', () => {
    const arr1: any[] = [1];
    const arr2: any[] = [2];
    expect(rawMerge(arr1, arr2)).toStrictEqual([...arr1, ...arr2]);
  });

  it('should merge two objects', () => {
    const obj1: any = { one: 1 };
    const obj2: any = { two: 2 };
    expect(rawMerge(obj1, obj2)).toStrictEqual({ ...obj1, ...obj2 });
  });


  it('should merge two complex objects', () => {
    const obj1: any = { one: 1, list: [1] };
    const obj2: any = { two: 2, list: [2] };
    expect(rawMerge(obj1, obj2)).toStrictEqual({ one: 1, two: 2, list: [1, 2] });
  });
});