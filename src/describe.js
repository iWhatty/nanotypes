// ./src/describe.js

import { DEV } from './env.js';


/**
 * Provides human-readable descriptions of JS values.
 */
export const describe = {
  /**
   * Returns a string description of a value's type.
   * @param {*} x
   * @returns {string}
   */
  value(x) {
    if (x === null) return 'null';
    if (typeof x !== "object") return typeof x;
    // Never throws, so an assert always throws its own TypeError: a revoked
    // proxy or a throwing trap or `constructor` getter falls back to
    // "object". A `constructor` getter on the value does run.
    try {
      if (Array.isArray(x)) return 'Array';
      if (Object.getPrototypeOf(x) === null) return "Object(null prototype)";
      const name = x.constructor?.name;
      return typeof name === "string" && name ? name : "Object";
    } catch {
      return "object";
    }
  }
};


if (!DEV) Object.freeze(describe);