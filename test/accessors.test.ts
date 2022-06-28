import { getId, getParentId, getSource } from '../src/accessors';
import { InstanceId, InstanceSource, ParentInstanceId } from '../src/symbols';
import * as utils from '../src/utils';

describe('getId - accessors', () => {
  it('should return instance id from object', () => {
    const id = utils.makeId();
    let obj: any = {};
    Reflect.set(obj, InstanceId, id)
    expect(getId(obj)).toBe(id);
  });
});

describe('getParentId - accessors', () => {
  it('should return parent instance id from object', () => {
    const id = utils.makeId();
    let obj: any = {};
    Reflect.set(obj, ParentInstanceId, id)
    expect(getParentId(obj)).toBe(id);
  });
});

describe('getSource - accessors', () => {
  it('should return object source from a proxied object', () => {
    let obj: any = {};
    const proxied = new Proxy(obj, {
      get(target, key) {
        if (key === InstanceSource) return target;
      }
    });

    expect(getSource(proxied)).toBe(obj);
  });

  it('should return array source from a proxied array', () => {
    let arr: any = [];
    const proxied = new Proxy(arr, {
      get(target, key) {
        if (key === InstanceSource) return target;
      }
    });

    expect(getSource(proxied)).toBe(arr);
  });
});