// ./src/assertType.js
//
// Builds the legacy `assertType` namespace by aggregating the named
// assert exports. Mirror of is.js. Per-assert tree-shake users should
// import named exports directly from 'nanotypes':
//
//   import { assertString, assertObject } from 'nanotypes';

import * as asserts from './asserts.js';
import { is } from './is.js';
import { describe } from './describe.js';
import { DEV } from './env.js';

// Generic instanceof assertion (the namespace's call signature). Throws
// TypeError if the value is not an instance of the constructor.
function assertTypeNamespace(value, Type) {
    if (!is(value, Type)) {
        throw new TypeError(`Expected ${Type?.name ?? 'instance'}, got ${describe.value(value)}`);
    }
}

// Attach every named assert onto the namespace under its short key.
// Algorithmic transformation: every export `assertFoo` becomes
// `assertType.foo`. Skips the bare `assertType` re-export from
// asserts.js (length 10).
for (const exportName of Object.keys(asserts)) {
    if (!exportName.startsWith('assert') || exportName.length <= 6) continue;
    if (exportName === 'assertType') continue;
    const fn = asserts[exportName];
    if (typeof fn !== 'function') continue;
    const key = exportName.charAt(6).toLowerCase() + exportName.slice(7);
    assertTypeNamespace[key] = fn;
}

if (!DEV) Object.freeze(assertTypeNamespace);

export { assertTypeNamespace as assertType };
