<br>

![Cagibi Illustration](media/header.jpg)

<br>

`npm i cagibi` or with `yarn add cagibi`

[![Version](https://img.shields.io/npm/v/cagibi?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/cagibi)
[![Downloads](https://img.shields.io/npm/dt/cagibi.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/cagibi)

Cagibi is coming from the french word used to call a small storeroom. Pronounced `/kä'jēbē/`.

<!-- You can try live demos in the following:
[Demo 1](https://codesandbox.io/s/) |
[Demo 2](https://codesandbox.io/s/). -->

#### What is `cagibi`?
- **Two main methods** to use it: `make` and `stitch`.
- **Two more methods** to use it with persisted state or through remote channels: `write` and `read`.
- No store.
- No complex API.
#### When would `cagibi` come in handy?
Merging nested data structure through async channels (API, parallel threads or job queues) without willing to maintain a key-value store with primary keys linking records.


    Tiny asynchronous state management based on static data stitching

### Create a stitchable copy of your object

```js
import { make } from 'cagibi';

const profile = make({ name: 'Joe', posts: [] });
// => { name: 'Joe', posts: [] }
```

### Use your object as a reference to stitch a sub-object

```js
const post = make({ title: 'A new post' }, profile.posts);
```
### Stitch them all to get the final object

```js
import { stitch } from 'cagibi';

const stitched = stitch(profile, post);
```

```json
// Returns stitched state:
{
    "name": "Joe",
    "posts": [{ "title": "A new post" }]
}
```
### Need to re-use it asynchronously or later?

```js
import { write } from 'cagibi';

const stack = [];

const profile = make({ name: 'Joe', posts: [] });
const post = make({ title: 'A new post' }, profile.posts);

stack.push(write(profile));
stack.push(write(post));

// And only later on or in another environment
const profile = read(profileWritten);
const post = read(postWritten);
const stitched = stitch(profile, post);
```

```json
// Returns stitched state:
{
    "name": "Joe",
    "posts": [{ "title": "A new post" }]
}
```
