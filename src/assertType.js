// ./src/assertType.js
//
// Default `assertType` namespace, mirroring the keys of the default `is`.

import { buildAssertType } from './buildIs.js';
import { is } from './is.js';
import { describe } from './describe.js';
import { DEV } from './env.js';

const assertType = buildAssertType(is, describe);

if (!DEV) Object.freeze(assertType);

export { assertType };
