import { compress, decompress } from 'minie';
import { stitch } from './core';
import { write } from './io';

export class Stack extends Array {
    override push(...items: any[]): number {
        const elements = items.map((item) => write(item));
        return super.push(...elements);
    }

    add(...items: any[]): string[] {
        const elements = items.map((item) => write(item));
        super.push(...elements);
        return elements;
    }

    read(stackWritten: string) {
        const elements = JSON.parse(decompress(stackWritten));
        const stack = new Stack();
        stack.push(...elements);
        return stack;
    }

    write() {
        return compress(JSON.stringify(this));
    }

    stitch() {
        return stitch(...this);
    }
}

export default Stack;
