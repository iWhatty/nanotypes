// ./src/auto.js
//
// Opt-in entry that augments the default `is` / `assertType` namespaces
// with whatever constructor-shaped globals the scanner finds at module
// load. Trades surface predictability for auto-coverage of exotic
// platform APIs and custom globals.
//
// Usage:
//
//   import { is, assertType } from 'nanotypes/auto';
//
// Per-guard named exports are also available here and shape-identical
// to the default entry — TypeScript narrowing matches the default
// surface; the extra dynamic guards live only on the `is` namespace.

import { is as staticIs } from './is.js';
import { assertType as staticAssertType } from './assertType.js';
import { describe } from './describe.js';
import { generateInstanceofMap } from './scan.js';
import { DEV } from './env.js';

// Re-export every named guard and assert so consumers of /auto don't
// need to mix imports between '.' and '/auto' if they want both shapes.
export * from './guards.js';
export * from './asserts.js';
export { describe };

// Build augmented `is` namespace: clone the static surface, then attach
// scanner-discovered constructors.
function isAuto(value, Type) {
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

// Copy every method from the static namespace.
for (const key of Object.keys(staticIs)) {
    const v = staticIs[key];
    if (typeof v === 'function') isAuto[key] = v;
}

// Layer in the scanner-discovered constructors, skipping anything the
// static surface already provides (so we don't shadow curated semantics
// with auto-generated ones).
const scannedMap = generateInstanceofMap();
for (const [name, Type] of Object.entries(scannedMap)) {
    if (!(name in isAuto)) {
        isAuto[name] = (x) => isAuto(x, Type);
    }
}

// Build the matching assertType namespace from the augmented `is`.
function assertTypeAuto(value, Type) {
    if (!isAuto(value, Type)) {
        throw new TypeError(`Expected ${Type?.name ?? 'instance'}, got ${describe.value(value)}`);
    }
}

// Copy static assert methods.
for (const key of Object.keys(staticAssertType)) {
    const v = staticAssertType[key];
    if (typeof v === 'function') assertTypeAuto[key] = v;
}

// Mirror scanner-discovered guards as assertions.
const skipAssertKeys = new Set(['length', 'name', 'prototype', 'default', '__proto__']);
for (const key of Object.keys(isAuto)) {
    if (skipAssertKeys.has(key)) continue;
    if (key in assertTypeAuto) continue;
    const guard = isAuto[key];
    if (typeof guard !== 'function') continue;
    assertTypeAuto[key] = (x) => {
        if (!Boolean(guard(x))) {
            throw new TypeError(`Expected ${key}, got ${describe.value(x)}`);
        }
    };
}

if (!DEV) {
    Object.freeze(isAuto);
    Object.freeze(assertTypeAuto);
}

export { isAuto as is, assertTypeAuto as assertType };
