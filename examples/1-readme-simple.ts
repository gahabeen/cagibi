import fs from 'node:fs';
import path from 'node:path'
import PQueue from 'p-queue';
import { clone, make, stitch, write } from 'cagibi';
import * as fake from './context/fake';

const NB_PRODUCTS = 1;
const NB_REVIEWS = 3;
const NB_RELATED_PRODUCTS = 2;

const queue = new PQueue({ concurrency: 1 });

(async () => {
    // Create an empty list of patches
    const patches: any = [];

    // Make our root object
    const results = make([]);

    // Simulate an async operation to retrieve a review
    const getReview = async (reviews: []) => {
        const review = make(fake.review(), reviews);

        // Save review state (also called patch)
        patches.push(review);
    };

    // Simulate an async operation to retrieve a product
    const getProduct = async (source: any, parent?: any) => {
        let product = make(clone(source), parent);
        Object.assign(product, fake.product());

        // Save product state (also called patch)
        patches.push(product);
    };

    // Add jobs to get products
    Array.from({ length: NB_PRODUCTS }).map(() => {
        const emptyProduct: any = make({ reviews: [], relatedProducts: [] }, results);

        // Save empty product state (also called patch)
        patches.push(emptyProduct);

        queue.add(() => getProduct(emptyProduct));

        // Add jobs to get reviews
        Array.from({ length: NB_REVIEWS }).map(() => {
            queue.add(() => getReview(emptyProduct.reviews));
        })

        // Add jobs to get related products (when root product only)
        Array.from({ length: NB_RELATED_PRODUCTS }).map(() => {
            queue.add(() => getProduct({}, emptyProduct.relatedProducts));
        })
    })

    // Wait for all jobs to be done
    await queue.onIdle();

    // Stitch patches back into results
    const stitched = stitch(results, ...patches);

    console.log(`File created (./1-readme-simple.json) ✅`)

    fs.writeFileSync(path.resolve(__dirname, '1-readme-simple.json'), JSON.stringify(stitched, null, 2));
    fs.writeFileSync(path.resolve(__dirname, '1-readme-simple.patches.json'), JSON.stringify(patches, null, 2));
    fs.writeFileSync(path.resolve(__dirname, '1-readme-simple.patches-verbose.json'), JSON.stringify(patches.map((p: any) => write(p, { output: 'object' })), null, 2));
})();
