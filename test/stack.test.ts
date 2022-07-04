import Stack from '../src/stack';
import { make } from '../src/core';

describe('Stack - stack', () => {

    it('should stack a list of objects', () => {
        const stack = new Stack();
        const list = make([]);

        const obj1 = make({ obj: 1 }, list);
        const obj2 = make({ obj: 2 }, list);
        stack.push(list, obj1, obj2);

        const stitched = stack.stitch();
        expect(stitched).toStrictEqual([{ obj: 1 }, { obj: 2 }]);
    });


    it('should stack a list of objects', () => {
        const stack = new Stack();
        const list = make([]);

        const obj1 = make({ obj: 1 }, list);
        const obj2 = make({ obj: 2 }, list);
        stack.push(list, obj1, obj2);

        const written = stack.write();
        const stackImported = stack.read(written);

        expect(stack).toStrictEqual(stackImported);
    });

});
