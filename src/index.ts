import { make, stitch } from './core';
import { write, read } from './io';
import { Patches } from './patches';

export * from './core';
export * from './io';
export * from './patches';
export * as Context from './context';
export * as Symbols from './symbols';
export * as utils from './utils';

export default { make, stitch, write, read, Patches };
