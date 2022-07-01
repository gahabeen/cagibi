import * as Context from '../src/context';
import { clone, join, make, merge, proxy, unmake } from '../src/main';
import * as SYMBOLS from '../src/symbols';

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
    expect(Context.getReference(objCloned)).toBe(Context.getReference(obj));
  });

  it('should clone anything else', () => {
    expect(clone(false)).toStrictEqual(false);
    expect(clone(1)).toStrictEqual(1);
    expect(clone('name')).toStrictEqual('name');
  });

  it('should clone symbols', () => {
    const original = make({});
    const cloned = clone(original);
    expect(Context.getReference(cloned)).toBe(Context.getReference(original));
  });

  it('should clone am empty state array', () => {
    const obj: any[] = make([]);
    const objCloned = clone(obj);

    expect(objCloned).toStrictEqual(obj);
    expect(Context.getReference(objCloned)).toBe(Context.getReference(obj));
  });

  it('should clone am empty state object', () => {
    const obj: any = make({});
    const objCloned = clone(obj);
    expect(objCloned).toStrictEqual(obj);
    expect(Context.getReference(objCloned)).toBe(Context.getReference(obj));
  });
});

describe('proxy - core', () => {
  it('should proxy am empty object', () => {
    const obj: { test?: string } = {};
    const pObj = proxy(obj);

    expect(Reflect.get(pObj, SYMBOLS.IsProxied)).toBeTruthy();
  });

  it('should proxy am empty array', () => {
    const arr: any[] = [];
    const pArr = proxy(arr);

    expect(Reflect.get(pArr, SYMBOLS.IsProxied)).toBeTruthy();
  });
});

describe('unmake - core', () => {
  it('should unmake am empty object', () => {
    const obj: { test?: string } = {};
    const wObj = new Proxy(obj, {
      get(gTarget, gKey) {
        if (gKey === SYMBOLS.Source) return gTarget;
        if (gKey === 'test') return 'test';
      }
    });

    expect(wObj.test).toBe('test');
    expect(unmake(wObj).test).not.toBe('test');
    expect(unmake(wObj)).toStrictEqual(obj);
  });

  it('should unmake a state empty object', () => {
    const obj = {};
    const wObj = make(obj);

    expect(Context.getReference(unmake(wObj))).toBeFalsy();
    expect(unmake(wObj)).toStrictEqual(obj);
  });


});

describe('make - core', () => {
  it('should make am empty object', () => {
    const obj = {};
    const wObj = make(obj);

    expect(Context.getReference(wObj)).toBeTruthy();
    expect(Context.getDestinationReference(wObj)).toBeFalsy();
    expect(unmake(wObj)).toStrictEqual(obj);
  });

  it('should make a new object from an exsting made empty object', () => {
    const obj = {};
    const wObj = make(obj);
    const wwObj = make(wObj);

    expect(Context.getReference(wwObj)).toBe(Context.getReference(wObj));
    expect(unmake(wwObj)).toStrictEqual(wObj);
    expect(unmake(wwObj)).toStrictEqual(obj);
  });

  it('should make an object from a sub-property', () => {
    const obj1: any = make({ profile: {} });
    const obj2: any = make(obj1.profile);
    Object.assign(obj2, { name: 'Don' })

    expect(Context.getReference(obj1.profile)).toBe(Context.getReference(obj2));
    expect(Context.getReference(obj1)).not.toBe(Context.getReference(obj2));
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


describe('join - core', () => {
  it('should join two objects with same reference', () => {
    const obj1: any = make({ surname: 'Joe' });
    const obj2: any = make(obj1);
    obj2.name = 'Don';

    const merged = join(obj1, obj2);
    expect(merged).toStrictEqual({ name: 'Don', surname: 'Joe' });
  });

  it('should join a sub reference to a parent object', () => {
    const obj1: any = make({ profile: {} });
    const obj2: any = make(obj1.profile);
    Object.assign(obj2, { name: 'Don' })

    const merged = join(obj1, obj2);
    expect(merged).toStrictEqual({ profile: { name: 'Don' } });
  });
});