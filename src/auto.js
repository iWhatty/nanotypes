// ./src/auto.js
//
// Opt-in entry that augments the curated static surface with whatever
// constructor-shaped globals the scanner finds at module load. Trades
// surface predictability for auto-coverage of exotic platform APIs and
// custom globals.
//
// Usage:
//
//   import { is, assertType, describe } from 'nanotypes/auto';
//
// If you don't need this, prefer the default entry — it ships a smaller,
// statically-known surface that TypeScript can narrow accurately.

import { buildIs, buildAssertType } from './buildIs.js';
import { instanceofMap as staticMap } from './instanceof-static.js';
import { generateInstanceofMap } from './scan.js';
import { describe } from './describe.js';
import { DEV } from './env.js';

const augmentedMap = { ...staticMap, ...generateInstanceofMap() };

const is = buildIs(augmentedMap);
const assertType = buildAssertType(is, describe);

if (!DEV) {
  Object.freeze(is);
  Object.freeze(assertType);
}

export { is, assertType, describe };
