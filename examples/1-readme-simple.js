const { make, stitch } = require('apify');

const profile = make({ name: 'Joe', posts: [] });
// => { name: 'Joe', posts: [] }

const post = make({ title: 'A new post' }, profile.posts);

const stitched = stitch(profile, post);

console.dir({ stitched }, { depth: null });
