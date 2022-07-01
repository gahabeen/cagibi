# cagibi

Minimal state management for scattered data structures


```js
import { make, merge } from 'cagibi';

const state = make({ list: [] });
const item = { name: null };

const item1 = make(item, state.list);
item1.name = 'John';

const item2 = make(item, state.list);
item2.name = 'Jane';

const resolved = merge(state, item1, item2); // { list: [{ name: 'John'}, { name: 'Jane'}]}
```