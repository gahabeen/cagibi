![Cagibi Illustration](media/header.jpg)

    Data stitching for async nested operations

# Concept 💡

    TLDR: Merging back together deeply nested data that has been updated in parallel is hard.
    Cagibi does the heavy lifting by holding hidden references to automatically stitch all your data back together.

Adding or updating data into a deeply nested data structure can be *manageable* when you do it in the same context. Now imagine fetching bits of data in parallel (so completely async), and wanting to merge these all together once everything is fetched. This is now more work, isn't it? 🤯

The idea behind **cagibi** is to **make any object referenceable** 🔍 without any work required.

Cagibi adds some unique references to any object properties to serve as unique keys when we want to stitch everything back together. This context is held into hidden keys which won't pollute your data nor degrade your freedom to make your data structure the way you like it.

# Get started 🏃‍♂️

```js
import { make, stitch } from 'cagibi';

// Example with an object

const profile = make({
    name: 'Joe',
    details: {},
});

const { details } = profile;

details.age = 23;

const stitched = stitch(profile, details);
// => { name: 'Joe', details: { age: 23 } }

// Example with an array

// 1. Make a copy of any object
const list = make([]);
// 2. Make another object with a destination object as second paremeter (only for arrays)
const item = make({ name: 'John' }, list);

const stitched = stitch(state, item);
// => [{ name: 'John'}]
```

# More examples
### Async operations (with the in-memory state)
```js
import { make, stitch, write, read } from 'cagibi';

// 1. Run this separately
const list = make([]);

// 2. Run this somewhere else
const item1 = make({ name: 'John' }, list);
item1.age = 23;

// 3. Run this somewhere else
const item2 = make({ name: 'Jane' }, list);
item2.age = 22;

// Finally
const result = stitch(list, item1, item2);
// => [{ name: 'John', age: 23 }, { name: 'Jane', age: 22 }]
```

### Async operations (with the saved state)
```js
import { make, stitch, write, read } from 'cagibi';

const store = new Map();

// 1. Run this separately
const list = make([]);
store.set('list', write(list)); // (Save the state in a storage)

// 2. Run this somewhere else
const list = read(store.get('list')) // (Load the state from the storage)
const item1 = make({ name: 'John' }, list);
item1.age = 23;
store.set('item1', write(item1));

// 3. Run this somewhere else
const list = read(store.get('list')) // (Load the state from the storage)
const item2 = make({ name: 'Jane' }, list);
item2.age = 22;
store.set('item2', write(item2));

// Finally
const list = read(store.get('list'));
const item1 = read(store.get('item1'));
const item2 = read(store.get('item2'));
const result = stitch(list, item1, item2);
// => [{ name: 'John', age: 23 }, { name: 'Jane', age: 22 }]
```

<!-- # API

## make()
## stitch()
## write()
## read() -->
