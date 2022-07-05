import Patches from '../src/patches';
import { make } from '../src/core';

describe('Patches - patches', () => {

    it('should patches a list of objects', () => {
        const patches = new Patches();
        const list = make([]);

        const obj1 = make({ obj: 1 }, list);
        const obj2 = make({ obj: 2 }, list);
        patches.push(list, obj1, obj2);

        const stitched = patches.stitch();
        expect(stitched).toStrictEqual([{ obj: 1 }, { obj: 2 }]);
    });


    it('should patches a list of objects', () => {
        const patches = new Patches();
        const list = make([]);

        const obj1 = make({ obj: 1 }, list);
        const obj2 = make({ obj: 2 }, list);
        patches.push(list, obj1, obj2);

        const written = patches.write();
        const patchesImported = patches.read(written);

        expect(patches).toStrictEqual(patchesImported);
    });

});
