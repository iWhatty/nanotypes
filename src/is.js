// ./src/is.js
//
// Builds the legacy `is` namespace by aggregating the named guard
// exports from guards.js. Consumers who want per-guard tree-shake
// should import named exports directly:
//
//   import { isString, isObject } from 'nanotypes';
//
// Consumers who prefer the ergonomic chained namespace:
//
//   import { is } from 'nanotypes';
//   is.string(x); is.obj(x); ...

import * as guards from './guards.js';
import { DEV } from './env.js';

// Generic instanceof check with DEV warnings (the namespace's call
// signature). Distinct from the bare `is` re-exported from guards.js
// because this version emits dev warnings; the named-export version
// stays minimal for size-sensitive consumers.
function isNamespace(value, Type) {
    if (typeof Type !== 'function') {
        if (DEV) console.warn(`Expected constructor function, got ${typeof Type}`, Type);
        return false;
    }
    try {
        const result = value instanceof Type;
        if (!result && DEV) {
            console.warn(`Expected ${Type.name}, got ${value?.constructor?.name || typeof value}`, value);
        }
        return result;
    } catch (err) {
        if (DEV) console.warn(`instanceof check failed for ${Type?.name ?? '<unknown>'}`, err);
        return false;
    }
}

// Attach every named guard onto the namespace under its short key.
// Algorithmic transformation: every export `isFoo` becomes `is.foo`.
// (E.g. isString -> is.string, isHtmlElement -> is.htmlElement.)
// Skips the bare generic `is` re-export from guards.js (length 2).
for (const exportName of Object.keys(guards)) {
    if (exportName.length <= 2 || !exportName.startsWith('is')) continue;
    const fn = guards[exportName];
    if (typeof fn !== 'function') continue;
    const key = exportName.charAt(2).toLowerCase() + exportName.slice(3);
    isNamespace[key] = fn;
}

if (!DEV) Object.freeze(isNamespace);

export { isNamespace as is };
