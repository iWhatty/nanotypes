// ./src/buildIs.js
//
// Factory functions that construct `is` and `assertType` from a given
// instanceof map. Used by `is.js` (static map) and `auto.js` (static
// merged with the global scanner).

import { typeofMap } from './typeof-map.js';
import { DEV } from './env.js';

/**
 * Build the `is` namespace from a constructor map.
 * @param {Record<string, Function>} instanceofMap
 * @returns {Function & Record<string, (x: unknown) => boolean>}
 */
export function buildIs(instanceofMap) {
  function is(value, Type) {
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

  // === Core instanceof Guards ===
  for (const [name, Type] of Object.entries(instanceofMap)) {
    is[name] = (x) => is(x, Type);
  }

  // === Core typeof Guards ===
  for (const [name, typeString] of Object.entries(typeofMap)) {
    is[name] = (x) => typeof x === typeString;
  }

  // === Manual Guards ===
  is.numberSafe = (x) => typeof x === 'number' && !Number.isNaN(x);
  is.array = (x) => Array.isArray(x);
  is.defined = (x) => x !== undefined && x !== null;
  is.nullish = (x) => x === undefined || x === null;
  is.nil = (x) => x === null;

  const hasHTMLElement = typeof HTMLElement !== 'undefined';
  is.contentEditable = (x) => !!(hasHTMLElement && x instanceof HTMLElement && x.isContentEditable === true);

  // Basic object check: excludes null and arrays.
  is.object = (x) => !!(x && typeof x === 'object' && !Array.isArray(x));

  // Stricter check: only matches plain Object instances (`{}`).
  is.objectStrict = (x) => Object.prototype.toString.call(x) === '[object Object]';

  // POJO check: plain object with prototype of `Object` or `null`.
  is.plainObject = (x) => {
    if (!is.objectStrict(x)) return false;
    const proto = Object.getPrototypeOf(x);
    return proto === Object.prototype || proto === null;
  };

  // Loose object check: includes arrays, objects, and non-null values.
  is.objectLoose = (x) => typeof x === 'object' && x !== null;

  // Aliases
  is.pojo = is.plainObject;
  is.obj  = is.object;
  is.arr  = is.array;

  // === Derived Boolean Checks ===
  Object.assign(is, {
    truthy: (x) => !!x,
    falsy: (x) => !x,
    emptyString: (x) => x === '',
    nonEmptyString: (x) => typeof x === 'string' && x.length > 0,
    positiveNumber: (x) => is.numberSafe(x) && x > 0,
    negativeNumber: (x) => is.numberSafe(x) && x < 0,
    integer: (x) => Number.isInteger(x),
    finite: (x) => Number.isFinite(x),
  });

  return is;
}

/**
 * Build the `assertType` namespace from a built `is` and `describe`.
 * Every callable property of `is` gets a matching throwing assertion.
 * @param {Function & Record<string, (x: unknown) => boolean>} is
 * @param {{ value: (x: unknown) => string }} describe
 */
export function buildAssertType(is, describe) {
  function assertType(value, Type) {
    if (!is(value, Type)) {
      throw new TypeError(`Expected ${Type.name}, got ${describe.value(value)}`);
    }
  }

  const skipKeys = new Set(['length', 'name', 'prototype', 'default', '__proto__']);
  for (const key of Object.keys(is)) {
    if (skipKeys.has(key)) continue;
    const guard = is[key];
    if (typeof guard !== 'function') continue;
    assertType[key] = (x) => {
      if (!Boolean(guard(x))) {
        throw new TypeError(`Expected ${key}, got ${describe.value(x)}`);
      }
    };
  }

  return assertType;
}
