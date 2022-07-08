import { compress, decompress } from 'minie';
import { stitch } from './core';
import { write } from './io';
import { ReallyAny } from './types';

export class Patches extends Array {
    override push(...items: ReallyAny[]): number {
        const elements = items.map((item) => write(item));
        return super.push(...elements);
    }

    add(...items: ReallyAny[]): string[] {
        const elements = items.map((item) => write(item));
        super.push(...elements);
        return elements;
    }

    read(patchesWritten: string) {
        const elements = JSON.parse(decompress(patchesWritten));
        const patches = new Patches();
        patches.push(...elements);
        return patches;
    }

    write() {
        return compress(JSON.stringify(this));
    }

    stitch() {
        return stitch(...this);
    }
}

export default Patches;
