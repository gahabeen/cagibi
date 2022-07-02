![Cagibi Illustration](./media/header.jpg)

    State stitching for scattered data structure management


# Get started

### Basic
```js
import { make, stitch } from 'cagibi';

const list = make([]);
const item = make({ name: 'John' }, list);

const merged = stitch(state, item); // [{ name: 'John'}]
```
### Async operations (with in-memory state)
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

### Async operations (with saved state)
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
