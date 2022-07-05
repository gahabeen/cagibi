const { make, Patches } = require('cagibi');

const patches = new Patches();

const profile = make({ name: 'Joe', posts: [] });
const post = make({ title: 'A new post' }, profile.posts);

patches.push(profile, post);

const savedPatches = patches.write();

// ...
// And only later on or in another environment

const importedPatches = new Patches();
importedPatches.read(savedPatches);

const stitched = importedPatches.stitch();
console.log({ stitched })
