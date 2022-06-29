import { getId, getParentId } from '../src/accessors';
import { clone, merge, unwrap, wrap } from '../src/core';
import { InstanceSource } from '../src/symbols';

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
    expect(getId(objCloned)).toBe(getId(obj));
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

  it('should clone am empty wrapped array', () => {
    const obj: any[] = wrap([]);
    const objCloned = clone(obj);
    expect(objCloned).toStrictEqual(obj);
    expect(getId(objCloned)).toBe(getId(obj));
  });

  it('should clone am empty wrapped object', () => {
    const obj: any = wrap({});
    const objCloned = clone(obj);
    expect(objCloned).toStrictEqual(obj);
    expect(getId(objCloned)).toBe(getId(obj));
  });
});


describe('unwrap - core', () => {
  it('should unwrap am empty object', () => {
    const obj: { test?: string } = {};
    const wObj = new Proxy(obj, {
      get(gTarget, gKey) {
        if (gKey === InstanceSource) return gTarget;
        if (gKey === 'test') return 'test';
      }
    });

    expect(wObj.test).toBe('test');
    expect(unwrap(wObj).test).not.toBe('test');
    expect(unwrap(wObj)).toStrictEqual(obj);
  });

  it('should unwrap a wrapped empty object', () => {
    const obj = {};
    const wObj = wrap(obj);

    expect(getId(unwrap(wObj))).toBeFalsy();
    expect(unwrap(wObj)).toStrictEqual(obj);
  });


});

describe('wrap - core', () => {
  it('should wrap am empty object', () => {
    const obj = {};
    const wObj = wrap(obj);

    expect(getId(wObj)).toBeTruthy();
    expect(getParentId(wObj)).toBeFalsy();
    expect(unwrap(wObj)).toStrictEqual(obj);
  });

  it('should wrap a new object from an exsting made empty object', () => {
    const obj = {};
    const wObj = wrap(obj);
    const wwObj = wrap(wObj);

    expect(getId(wwObj)).toBe(getId(wObj));
    expect(unwrap(wwObj)).toStrictEqual(wObj);
    expect(unwrap(wwObj)).toStrictEqual(obj);
  });

});

describe('merge - core', () => {
  it('should merge two arrays', () => {
    const arr1: any[] = [1];
    const arr2: any[] = [2];
    const merged = merge(arr1, arr2);
    expect(merged).toStrictEqual([...arr1, ...arr2]);
  });

  it('should merge two objects', () => {
    const obj1: any = { one: 1 };
    const obj2: any = { two: 2 };
    expect(merge(obj1, obj2)).toStrictEqual({ ...obj1, ...obj2 });
  });


  it('should merge two complex objects', () => {
    const obj1: any = { one: 1, list: [1] };
    const obj2: any = { two: 2, list: [2] };
    const merged = merge(obj1, obj2);
    expect(merged).toStrictEqual({ one: 1, two: 2, list: [1, 2] });
  });
});

// describe('flatten - core', () => {
//   it('should flatten a wrapped empty object', () => {
//     const obj = wrap({});
//     const flattened = flatten(obj);
//     expect(flattened).toHaveProperty(InstanceId.toString());
//     expect(flattened).toHaveProperty(ParentInstanceId.toString());
//   });

//   it('should flatten a wrapped nested object', () => {
//     const obj = wrap({ one: { step: { at: { a: { time: 123 } } } } });
//     const flattened = flatten(obj);
//     expect(flattened).toHaveProperty(InstanceId.toString());
//     expect(flattened).toHaveProperty(ParentInstanceId.toString());
//     expect(flattened.one).toHaveProperty(InstanceId.toString());
//     expect(flattened.one).toHaveProperty(ParentInstanceId.toString());
//     // expect(flattened.one.step).toHaveProperty(InstanceId.toString());
//     // expect(flattened.one.step).toHaveProperty(ParentInstanceId.toString());
//   });

// });