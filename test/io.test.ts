import { isCompressed } from 'minie';
import { getReference } from '../lib/context';
import { make } from '../src/core';
import { read, write } from '../src/io';
import * as SYMBOLS from '../src/symbols';

describe('write - core', () => {
    it('should write a state empty object as compressed (default)', () => {
        const obj = make({});
        const written = write(obj, { output: 'json' });
        expect(Object.keys(written)).toContain(SYMBOLS.toString(SYMBOLS.Contexts));
    });

    it('should write a state empty object as json', () => {
        const obj = make({});
        expect(isCompressed(write(obj))).toBeTruthy();
        expect(isCompressed(write(obj, { output: 'compressed' }))).toBeTruthy();
    });
});

describe('read - core', () => {
    it('should read a state empty object as compressed (default)', () => {
        const obj = make({ hey: true });
        const written = write(obj);
        const created = read(written);
        expect(getReference(created)).toBe(getReference(obj));
    });

    it('should read a state empty object as json', () => {
        const obj = make({ hey: true });
        const written = write(obj, { output: 'json' });
        const created = read(written);
        expect(getReference(created)).toBe(getReference(obj));
    });
});
