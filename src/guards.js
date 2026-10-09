// ./src/guards.js
//
// All static named guard exports. Each `export const isX` is statically
// analyzable so bundlers can drop the unused ones when consumers
// `import { isString }` instead of `import { is }`.
//
// Naming:
// - Long form mirrors the runtime type: isString, isNumber, isHtmlElement
// - Shorthand aliases mirror the namespace shorthands: isStr, isNum, isBool
// - Instanceof guards look the constructor up on `globalThis` at call
//   time, so they return `false` instead of throwing in environments where
//   the constructor is missing (e.g. isHtmlElement in Node).
//
// Guarantees, for every guard in this file (docs/DESIGN.md, section 2):
// - `true` is a verified claim: a guard returns `true` only when it has
//   verified every part of its definition. A part it cannot verify (such as
//   "not an array" for a revoked proxy) makes it return `false`. So `false`
//   means "not verified", not "verified the opposite".
// - Never throws. Revoked proxies and throwing proxy traps return `false`
//   unless the guard's whole claim is verifiable without them (a revoked
//   proxy is still `typeof` "object", so `isObjectLoose` is `true`).
// - Returns a strict boolean.
// - Never reads a property of the value, so no getter, `Symbol.toStringTag`,
//   `Symbol.toPrimitive`, or `toString` on the value runs. Only the
//   documented exceptions do: `isObjectStrict` (reads `Symbol.toStringTag`,
//   that is its definition) and `isContentEditable` (reads
//   `isContentEditable` once the value is an `HTMLElement`). A proxy's own
//   traps (`getPrototypeOf` for `instanceof` and `isPlainObject`) can still
//   run; their throws are caught.
//
// Tree-shake: this module has no top-level side effects. Every export is an
// arrow function or an alias, and feature detection happens inside the
// guards, so `import { isObject }` bundles only `isObject`.

const G = globalThis;

// `x instanceof C`, false when C is missing or the check throws (a revoked
// proxy, or a proxy whose getPrototypeOf trap throws).
const inst = (x, C) => {
    try {
        return typeof C === 'function' && x instanceof C;
    } catch {
        return false;
    }
};

// =============================================================================
// Generic instanceof (for ad-hoc checks against user-supplied constructors)
// =============================================================================

/**
 * @param {unknown} value
 * @param {new (...args: any[]) => any} Type
 * @returns {boolean}
 */
export function is(value, Type) {
    if (typeof Type !== 'function') return false;
    try {
        return value instanceof Type;
    } catch {
        return false;
    }
}

// =============================================================================
// typeof guards
// =============================================================================

export const isString = (x) => typeof x === 'string';
export const isStr = isString;

export const isNumber = (x) => typeof x === 'number';
export const isNum = isNumber;

export const isBoolean = (x) => typeof x === 'boolean';
export const isBool = isBoolean;

export const isBigint = (x) => typeof x === 'bigint';
export const isBigi = isBigint;

export const isSymbol = (x) => typeof x === 'symbol';
export const isSym = isSymbol;

export const isUndefined = (x) => typeof x === 'undefined';
export const isUndef = isUndefined;

export const isFunc = (x) => typeof x === 'function';

// =============================================================================
// Manual / structural guards
// =============================================================================

export const isNumberSafe = (x) => typeof x === 'number' && !Number.isNaN(x);

// Array.isArray throws on a revoked proxy.
export const isArray = (x) => {
    try {
        return Array.isArray(x);
    } catch {
        return false;
    }
};
export const isArr = isArray;

// Null checks. isNull and isNil are strictly `null`. lodash/Ramda's isNil
// (null OR undefined) is isNullish here.

/** Neither `null` nor `undefined` (`x != null`). */
export const isDefined = (x) => x !== undefined && x !== null;

/** `null` or `undefined` (`x == null`). This is lodash's `isNil`. */
export const isNullish = (x) => x === undefined || x === null;

/** Strictly `null` (`x === null`); `undefined` is false. */
export const isNull = (x) => x === null;

/**
 * Strictly `null`, same as `isNull`. Not lodash's `isNil` (null or
 * undefined): use `isNullish` for that.
 */
export const isNil = isNull;

// A non-null `typeof "object"` value that is verifiably not an array:
// object literals, null-prototype objects, class instances, boxed
// primitives, Date, Map, DOM nodes. Not arrays, not functions (lodash's
// `isObject` includes both; see docs/DESIGN.md). A revoked proxy is `false`:
// `Array.isArray` throws on it, so "not an array" cannot be verified
// (0.3.0 returned `true`). Its own try/catch rather than `!isArray(x)`,
// because `isArray`'s `false` also means "could not tell".
export const isObject = (x) => {
    if (typeof x !== 'object' || x === null) return false;
    try {
        return !Array.isArray(x);
    } catch {
        return false;
    }
};
export const isObj = isObject;

// `Object.prototype.toString` gives "[object Object]": true for object
// literals, null-prototype objects, and class instances without a
// `Symbol.toStringTag`; false for arrays, Date, Map, DOM elements, and any
// object whose `Symbol.toStringTag` is set. It reads `Symbol.toStringTag`
// (a getter there runs); a throw returns false. Use isPlainObject for a
// prototype-only check.
export const isObjectStrict = (x) => {
    try {
        return Object.prototype.toString.call(x) === '[object Object]';
    } catch {
        return false;
    }
};

// Plain object: a non-null object (not a function) whose prototype is
// exactly this realm's `Object.prototype`, or `null`. Decided by
// `Object.getPrototypeOf` alone; no property of the value is read, so
// `Symbol.toStringTag` is ignored (`{ [Symbol.toStringTag]: 'X' }` is
// plain). Arrays, class instances, `Object.create(someObject)`, and objects
// from another realm (iframe, vm) are not plain. A proxy is judged by its
// getPrototypeOf trap; a throwing trap or a revoked proxy returns false.
export const isPlainObject = (x) => {
    if (typeof x !== 'object' || x === null) return false;
    try {
        const proto = Object.getPrototypeOf(x);
        return proto === Object.prototype || proto === null;
    } catch {
        return false;
    }
};
export const isPojo = isPlainObject;

// Loose object check: any non-null `typeof "object"` value, arrays
// included, functions excluded (lodash's `isObjectLike`). `typeof` works on
// a revoked proxy, so a revoked proxy is `true`.
export const isObjectLoose = (x) => typeof x === 'object' && x !== null;

// Browser-only: HTMLElement whose `isContentEditable` is true.
export const isContentEditable = (x) => {
    try {
        return inst(x, G.HTMLElement) && x.isContentEditable === true;
    } catch {
        return false;
    }
};

// =============================================================================
// Derived boolean / numeric helpers
// =============================================================================

export const isTruthy = (x) => !!x;
export const isFalsy = (x) => !x;

export const isEmptyString = (x) => x === '';
export const isNonEmptyString = (x) => typeof x === 'string' && x.length > 0;

export const isPositiveNumber = (x) => isNumberSafe(x) && x > 0;
export const isNegativeNumber = (x) => isNumberSafe(x) && x < 0;
export const isInteger = (x) => Number.isInteger(x);

/** A number that is not `NaN` or +/-`Infinity`, like `Number.isFinite`. No coercion: `isFiniteNumber('1')` is false. */
export const isFiniteNumber = (x) => Number.isFinite(x);

/**
 * @deprecated Use `isFiniteNumber`. Same function. As a named import it
 * shadows the global `isFinite`, which coerces (`isFinite('1')` is true);
 * this one does not.
 */
export const isFinite = isFiniteNumber;

// =============================================================================
// Instanceof guards (feature-detected at call time)
//
// Each guard is `(x) => inst(x, G.X)`: the constructor is looked up when
// the guard runs, so a missing constructor returns `false` and a global
// installed after import (jsdom, polyfills) is seen. No module-level
// feature-detection constants: those are top-level property reads that a
// bundler must keep, which pulled all of them into every single-guard
// import (about 2 KB) before 0.3.0.
// =============================================================================

// --- Universal collections ---
export const isMap = (x) => inst(x, G.Map);
export const isSet = (x) => inst(x, G.Set);
export const isWeakMap = (x) => inst(x, G.WeakMap);
export const isWeakSet = (x) => inst(x, G.WeakSet);

// --- Core / errors ---
export const isDate = (x) => inst(x, G.Date);
export const isRegExp = (x) => inst(x, G.RegExp);
export const isError = (x) => inst(x, G.Error);
export const isTypeError = (x) => inst(x, G.TypeError);
export const isRangeError = (x) => inst(x, G.RangeError);
export const isSyntaxError = (x) => inst(x, G.SyntaxError);
export const isReferenceError = (x) => inst(x, G.ReferenceError);
export const isUriError = (x) => inst(x, G.URIError);
export const isPromise = (x) => inst(x, G.Promise);

// --- Buffers / typed arrays ---
export const isArrayBuffer = (x) => inst(x, G.ArrayBuffer);
export const isDataView = (x) => inst(x, G.DataView);
export const isInt8Array = (x) => inst(x, G.Int8Array);
export const isUint8Array = (x) => inst(x, G.Uint8Array);
export const isUint8ClampedArray = (x) => inst(x, G.Uint8ClampedArray);
export const isInt16Array = (x) => inst(x, G.Int16Array);
export const isUint16Array = (x) => inst(x, G.Uint16Array);
export const isInt32Array = (x) => inst(x, G.Int32Array);
export const isUint32Array = (x) => inst(x, G.Uint32Array);
export const isFloat32Array = (x) => inst(x, G.Float32Array);
export const isFloat64Array = (x) => inst(x, G.Float64Array);
export const isBigInt64Array = (x) => inst(x, G.BigInt64Array);
export const isBigUint64Array = (x) => inst(x, G.BigUint64Array);

// --- URL / search ---
export const isUrl = (x) => inst(x, G.URL);
export const isUrlSearchParams = (x) => inst(x, G.URLSearchParams);

// --- Fetch ---
export const isHeaders = (x) => inst(x, G.Headers);
export const isRequest = (x) => inst(x, G.Request);
export const isResponse = (x) => inst(x, G.Response);
export const isFormData = (x) => inst(x, G.FormData);
export const isBlob = (x) => inst(x, G.Blob);
export const isFile = (x) => inst(x, G.File);

// --- DOM ---
export const isElement = (x) => inst(x, G.Element);
export const isHtmlElement = (x) => inst(x, G.HTMLElement);
export const isNode = (x) => inst(x, G.Node);
export const isDocument = (x) => inst(x, G.Document);
export const isWindow = (x) => inst(x, G.Window);
export const isTextNode = (x) => inst(x, G.Text);
export const isComment = (x) => inst(x, G.Comment);
export const isCanvas = (x) => inst(x, G.HTMLCanvasElement);
export const isVideo = (x) => inst(x, G.HTMLVideoElement);
export const isAudio = (x) => inst(x, G.HTMLAudioElement);
export const isImage = (x) => inst(x, G.HTMLImageElement);
export const isFileList = (x) => inst(x, G.FileList);

// --- DOM events ---
export const isInputEvent = (x) => inst(x, G.InputEvent);
export const isKeyboardEvent = (x) => inst(x, G.KeyboardEvent);
export const isMouseEvent = (x) => inst(x, G.MouseEvent);
export const isFocusEvent = (x) => inst(x, G.FocusEvent);

// --- Worker family ---
export const isWorker = (x) => inst(x, G.Worker);
export const isSharedWorker = (x) => inst(x, G.SharedWorker);
export const isBroadcastChannel = (x) => inst(x, G.BroadcastChannel);

// --- Intl (nested) ---
export const isIntlDateTimeFormat = (x) => inst(x, G.Intl?.DateTimeFormat);
export const isIntlNumberFormat = (x) => inst(x, G.Intl?.NumberFormat);
export const isIntlCollator = (x) => inst(x, G.Intl?.Collator);
