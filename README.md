# cagibi

Minimal state management for scattered data structures


```js
import { wrap, merge } from 'cagibi';

const state = wrap({ list: [] });
const item = { name: null };

const item1 = wrap(item, state.list);
item1.name = 'John';

const item2 = wrap(item, state.list);
item2.name = 'Jane';

const resolved = merge(state, item1, item2); // { list: [{ name: 'John'}, { name: 'Jane'}]}
```