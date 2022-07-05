const { make, stitch, write, read } = require('cagibi');

const stack = [];

const profile = make({ name: 'Joe', posts: [] });
const post = make({ title: 'A new post' }, profile.posts);

stack.push(write(profile));
stack.push(write(post));

// ...
const profileCopy = read(profileWritten);
const postCopy = read(postWritten);
const stitched = stitch(profileCopy, postCopy);

console.log({ stitched })
