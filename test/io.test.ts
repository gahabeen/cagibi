import { getReference } from '../src/context';
import { write, read } from '../src/io';
import { make } from '../src/main';
import * as SYMBOLS from '../src/symbols';

describe('write - core', () => {
  it('should write a state empty object', () => {
    const obj = make({});
    const written = write(obj);
    expect(Object.keys(written)).toContain(SYMBOLS.toString(SYMBOLS.Contexts));
  });

  // it('should write a state nested object', () => {
  //   const obj = make({ one: { step: { at: { a: { time: 123 } } } } });
  //   const written = write(obj);
  //   expect(written).toHaveProperty(Reference.toString());
  // });

});


describe('read - core', () => {
  it('should read a state empty object', () => {
    const obj = make({ hey: true });
    const written = write(obj);
    const created = read(written);
    expect(getReference(created)).toBe(getReference(obj));
  });

  // it('should write a state nested object', () => {
  //   const obj = make({ one: { step: { at: { a: { time: 123 } } } } });
  //   const written = write(obj);
  //   expect(written).toHaveProperty(Reference.toString());
  // });

});