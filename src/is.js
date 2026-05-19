// ./src/is.js
//
// Default `is` namespace, built from the curated static instanceof map.
// For auto-discovery of additional globals at module load, import from
// `nanotypes/auto` instead.

import { buildIs } from './buildIs.js';
import { instanceofMap } from './instanceof-static.js';
import { DEV } from './env.js';

const is = buildIs(instanceofMap);

if (!DEV) Object.freeze(is);

export { is };
