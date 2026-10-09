// ./src/describe.js

import { DEV } from './env.js';


/**
 * Provides human-readable descriptions of JS values.
 */
export const describe = {
  /**
   * Returns a string description of a value's type: `"null"`, a `typeof`
   * name, `"Array"`, `"Object(null prototype)"`, or the name of the
   * constructor on the value's prototype (`"Map"`, `"Foo"`), else
   * `"Object"`.
   *
   * Never throws and never runs the value's code, so an assert always
   * throws its own TypeError: the name comes from the prototype's own
   * `constructor` data property and that constructor's own `name` data
   * property, read by descriptor (a getter is not called; it gives
   * "Object"). Before 0.3.1 it read `x.constructor.name`, which ran a
   * `constructor` getter on the value.
   * A revoked proxy, or a proxy whose traps throw, describes as "object".
   * @param {*} x
   * @returns {string}
   */
  value(x) {
    if (x === null) return 'null';
    if (typeof x !== "object") return typeof x;
    try {
      if (Array.isArray(x)) return 'Array';
      const proto = Object.getPrototypeOf(x);
      if (proto === null) return "Object(null prototype)";
      const own = Object.getOwnPropertyDescriptor;
      const ctor = own(proto, 'constructor')?.value;
      const name = typeof ctor === 'function' && own(ctor, 'name')?.value;
      return typeof name === "string" && name ? name : "Object";
    } catch {
      return "object";
    }
  }
};


if (!DEV) Object.freeze(describe);
