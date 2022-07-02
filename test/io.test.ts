import { CAGIBI_SHORT_PREFIX, COMPRESSED_PREFIX_LENGTH } from '../src/consts';
import { getReference } from '../src/context';
import { write, read } from '../src/io';
import { make } from '../src/core';
import * as SYMBOLS from '../src/symbols';

describe('write - core', () => {

  it('should write a state empty object as compressed (default)', () => {
    const obj = make({});
    const written = write(obj, { output: 'json' });
    expect(Object.keys(written)).toContain(SYMBOLS.toString(SYMBOLS.Contexts));
  });

  it('should write a state empty object as json', () => {
    const obj = make({});
    expect(write(obj).slice(COMPRESSED_PREFIX_LENGTH).startsWith(CAGIBI_SHORT_PREFIX)).toBeTruthy();
    expect(write(obj, { output: 'compressed' }).slice(COMPRESSED_PREFIX_LENGTH).startsWith(CAGIBI_SHORT_PREFIX)).toBeTruthy();
  });

});


describe('read - core', () => {

  it('should read a state empty object as compressed (default)', () => {
    const obj = make({ hey: true });
    const written = write(obj);
    const created = read(written);
    expect(getReference(created)).toBe(getReference(obj));
  });

  it('should read a state empty object as json (default)', () => {
    const obj = make({ hey: true });
    const written = write(obj, { output: 'json' });
    const created = read(written);
    expect(getReference(created)).toBe(getReference(obj));
  });

});
