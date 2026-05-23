// ./src/asserts.js
//
// All static named assert exports. Each `assertX` is a function declaration
// that throws TypeError when the corresponding guard returns false. Same
// naming convention as guards.js (long form + shorthand parity).
//
// IMPORTANT: every assert is a top-level `export function` rather than
// `export const assertX = wrap('X', isX)`. The wrap() factory pattern
// (pre-0.2.2) produced module-level function calls in the initializers,
// which defeat tree-shake — a consumer importing two asserts pulled in
// all 91 because bundlers can't statically prove the unused `wrap(...)`
// initializers are side-effect-free. Function declarations are first-class
// tree-shake citizens: an unused `function assertNumber` is dropped cleanly.
//
// Each assert imports only the guard it needs. Bundlers tree-shake by
// the same rules as guards — `import { assertString }` keeps
// `assertString` and `isString`, drops everything else. See the
// "tree-shake regression" note in 0.2.2's CHANGELOG entry for the
// before/after consumer bundle sizes that motivated the rewrite.

import { describe } from './describe.js';
import {
    is,
    isString,
    isNumber,
    isNumberSafe,
    isBoolean,
    isBigint,
    isSymbol,
    isUndefined,
    isFunc,
    isArray,
    isDefined,
    isNullish,
    isNil,
    isObject,
    isObjectStrict,
    isPlainObject,
    isObjectLoose,
    isContentEditable,
    isTruthy,
    isFalsy,
    isEmptyString,
    isNonEmptyString,
    isPositiveNumber,
    isNegativeNumber,
    isInteger,
    isFinite,
    isMap, isSet, isWeakMap, isWeakSet,
    isDate, isRegExp,
    isError, isTypeError, isRangeError, isSyntaxError, isReferenceError, isUriError,
    isPromise,
    isArrayBuffer, isDataView,
    isInt8Array, isUint8Array, isUint8ClampedArray,
    isInt16Array, isUint16Array,
    isInt32Array, isUint32Array,
    isFloat32Array, isFloat64Array,
    isBigInt64Array, isBigUint64Array,
    isUrl, isUrlSearchParams,
    isHeaders, isRequest, isResponse, isFormData, isBlob, isFile,
    isElement, isHtmlElement, isNode, isDocument, isWindow, isTextNode, isComment,
    isCanvas, isVideo, isAudio, isImage, isFileList,
    isInputEvent, isKeyboardEvent, isMouseEvent, isFocusEvent,
    isWorker, isSharedWorker, isBroadcastChannel,
    isIntlDateTimeFormat, isIntlNumberFormat, isIntlCollator,
} from './guards.js';

/**
 * Generic instanceof assertion. Throws TypeError if value is not an
 * instance of Type.
 *
 * @param {unknown} value
 * @param {new (...args: any[]) => any} Type
 */
export function assertType(value, Type) {
    if (!is(value, Type)) {
        throw new TypeError(`Expected ${Type?.name ?? 'instance'}, got ${describe.value(value)}`);
    }
}

// =============================================================================
// typeof asserts
// =============================================================================

/** @param {unknown} x */
export function assertString(x) {
    if (!isString(x)) throw new TypeError(`Expected string, got ${describe.value(x)}`);
}
export const assertStr = assertString;

/** @param {unknown} x */
export function assertNumber(x) {
    if (!isNumber(x)) throw new TypeError(`Expected number, got ${describe.value(x)}`);
}
export const assertNum = assertNumber;

/** @param {unknown} x */
export function assertBoolean(x) {
    if (!isBoolean(x)) throw new TypeError(`Expected boolean, got ${describe.value(x)}`);
}
export const assertBool = assertBoolean;

/** @param {unknown} x */
export function assertBigint(x) {
    if (!isBigint(x)) throw new TypeError(`Expected bigint, got ${describe.value(x)}`);
}
export const assertBigi = assertBigint;

/** @param {unknown} x */
export function assertSymbol(x) {
    if (!isSymbol(x)) throw new TypeError(`Expected symbol, got ${describe.value(x)}`);
}
export const assertSym = assertSymbol;

/** @param {unknown} x */
export function assertUndefined(x) {
    if (!isUndefined(x)) throw new TypeError(`Expected undefined, got ${describe.value(x)}`);
}
export const assertUndef = assertUndefined;

/** @param {unknown} x */
export function assertFunc(x) {
    if (!isFunc(x)) throw new TypeError(`Expected function, got ${describe.value(x)}`);
}

// =============================================================================
// Manual / structural asserts
// =============================================================================

/** @param {unknown} x */
export function assertNumberSafe(x) {
    if (!isNumberSafe(x)) throw new TypeError(`Expected numberSafe, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertArray(x) {
    if (!isArray(x)) throw new TypeError(`Expected array, got ${describe.value(x)}`);
}
export const assertArr = assertArray;

/** @param {unknown} x */
export function assertDefined(x) {
    if (!isDefined(x)) throw new TypeError(`Expected defined, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertNullish(x) {
    if (!isNullish(x)) throw new TypeError(`Expected nullish, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertNil(x) {
    if (!isNil(x)) throw new TypeError(`Expected nil, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertObject(x) {
    if (!isObject(x)) throw new TypeError(`Expected object, got ${describe.value(x)}`);
}
export const assertObj = assertObject;

/** @param {unknown} x */
export function assertObjectStrict(x) {
    if (!isObjectStrict(x)) throw new TypeError(`Expected objectStrict, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertPlainObject(x) {
    if (!isPlainObject(x)) throw new TypeError(`Expected plainObject, got ${describe.value(x)}`);
}
export const assertPojo = assertPlainObject;

/** @param {unknown} x */
export function assertObjectLoose(x) {
    if (!isObjectLoose(x)) throw new TypeError(`Expected objectLoose, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertContentEditable(x) {
    if (!isContentEditable(x)) throw new TypeError(`Expected contentEditable, got ${describe.value(x)}`);
}

// =============================================================================
// Derived
// =============================================================================

/** @param {unknown} x */
export function assertTruthy(x) {
    if (!isTruthy(x)) throw new TypeError(`Expected truthy, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertFalsy(x) {
    if (!isFalsy(x)) throw new TypeError(`Expected falsy, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertEmptyString(x) {
    if (!isEmptyString(x)) throw new TypeError(`Expected emptyString, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertNonEmptyString(x) {
    if (!isNonEmptyString(x)) throw new TypeError(`Expected nonEmptyString, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertPositiveNumber(x) {
    if (!isPositiveNumber(x)) throw new TypeError(`Expected positiveNumber, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertNegativeNumber(x) {
    if (!isNegativeNumber(x)) throw new TypeError(`Expected negativeNumber, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertInteger(x) {
    if (!isInteger(x)) throw new TypeError(`Expected integer, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertFinite(x) {
    if (!isFinite(x)) throw new TypeError(`Expected finite, got ${describe.value(x)}`);
}

// =============================================================================
// Instanceof asserts
// =============================================================================

/** @param {unknown} x */
export function assertMap(x) {
    if (!isMap(x)) throw new TypeError(`Expected Map, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertSet(x) {
    if (!isSet(x)) throw new TypeError(`Expected Set, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertWeakMap(x) {
    if (!isWeakMap(x)) throw new TypeError(`Expected WeakMap, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertWeakSet(x) {
    if (!isWeakSet(x)) throw new TypeError(`Expected WeakSet, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertDate(x) {
    if (!isDate(x)) throw new TypeError(`Expected Date, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertRegExp(x) {
    if (!isRegExp(x)) throw new TypeError(`Expected RegExp, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertError(x) {
    if (!isError(x)) throw new TypeError(`Expected Error, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertTypeError(x) {
    if (!isTypeError(x)) throw new TypeError(`Expected TypeError, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertRangeError(x) {
    if (!isRangeError(x)) throw new TypeError(`Expected RangeError, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertSyntaxError(x) {
    if (!isSyntaxError(x)) throw new TypeError(`Expected SyntaxError, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertReferenceError(x) {
    if (!isReferenceError(x)) throw new TypeError(`Expected ReferenceError, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertUriError(x) {
    if (!isUriError(x)) throw new TypeError(`Expected URIError, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertPromise(x) {
    if (!isPromise(x)) throw new TypeError(`Expected Promise, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertArrayBuffer(x) {
    if (!isArrayBuffer(x)) throw new TypeError(`Expected ArrayBuffer, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertDataView(x) {
    if (!isDataView(x)) throw new TypeError(`Expected DataView, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertInt8Array(x) {
    if (!isInt8Array(x)) throw new TypeError(`Expected Int8Array, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertUint8Array(x) {
    if (!isUint8Array(x)) throw new TypeError(`Expected Uint8Array, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertUint8ClampedArray(x) {
    if (!isUint8ClampedArray(x)) throw new TypeError(`Expected Uint8ClampedArray, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertInt16Array(x) {
    if (!isInt16Array(x)) throw new TypeError(`Expected Int16Array, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertUint16Array(x) {
    if (!isUint16Array(x)) throw new TypeError(`Expected Uint16Array, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertInt32Array(x) {
    if (!isInt32Array(x)) throw new TypeError(`Expected Int32Array, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertUint32Array(x) {
    if (!isUint32Array(x)) throw new TypeError(`Expected Uint32Array, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertFloat32Array(x) {
    if (!isFloat32Array(x)) throw new TypeError(`Expected Float32Array, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertFloat64Array(x) {
    if (!isFloat64Array(x)) throw new TypeError(`Expected Float64Array, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertBigInt64Array(x) {
    if (!isBigInt64Array(x)) throw new TypeError(`Expected BigInt64Array, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertBigUint64Array(x) {
    if (!isBigUint64Array(x)) throw new TypeError(`Expected BigUint64Array, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertUrl(x) {
    if (!isUrl(x)) throw new TypeError(`Expected URL, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertUrlSearchParams(x) {
    if (!isUrlSearchParams(x)) throw new TypeError(`Expected URLSearchParams, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertHeaders(x) {
    if (!isHeaders(x)) throw new TypeError(`Expected Headers, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertRequest(x) {
    if (!isRequest(x)) throw new TypeError(`Expected Request, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertResponse(x) {
    if (!isResponse(x)) throw new TypeError(`Expected Response, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertFormData(x) {
    if (!isFormData(x)) throw new TypeError(`Expected FormData, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertBlob(x) {
    if (!isBlob(x)) throw new TypeError(`Expected Blob, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertFile(x) {
    if (!isFile(x)) throw new TypeError(`Expected File, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertElement(x) {
    if (!isElement(x)) throw new TypeError(`Expected Element, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertHtmlElement(x) {
    if (!isHtmlElement(x)) throw new TypeError(`Expected HTMLElement, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertNode(x) {
    if (!isNode(x)) throw new TypeError(`Expected Node, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertDocument(x) {
    if (!isDocument(x)) throw new TypeError(`Expected Document, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertWindow(x) {
    if (!isWindow(x)) throw new TypeError(`Expected Window, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertTextNode(x) {
    if (!isTextNode(x)) throw new TypeError(`Expected Text, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertComment(x) {
    if (!isComment(x)) throw new TypeError(`Expected Comment, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertCanvas(x) {
    if (!isCanvas(x)) throw new TypeError(`Expected HTMLCanvasElement, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertVideo(x) {
    if (!isVideo(x)) throw new TypeError(`Expected HTMLVideoElement, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertAudio(x) {
    if (!isAudio(x)) throw new TypeError(`Expected HTMLAudioElement, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertImage(x) {
    if (!isImage(x)) throw new TypeError(`Expected HTMLImageElement, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertFileList(x) {
    if (!isFileList(x)) throw new TypeError(`Expected FileList, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertInputEvent(x) {
    if (!isInputEvent(x)) throw new TypeError(`Expected InputEvent, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertKeyboardEvent(x) {
    if (!isKeyboardEvent(x)) throw new TypeError(`Expected KeyboardEvent, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertMouseEvent(x) {
    if (!isMouseEvent(x)) throw new TypeError(`Expected MouseEvent, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertFocusEvent(x) {
    if (!isFocusEvent(x)) throw new TypeError(`Expected FocusEvent, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertWorker(x) {
    if (!isWorker(x)) throw new TypeError(`Expected Worker, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertSharedWorker(x) {
    if (!isSharedWorker(x)) throw new TypeError(`Expected SharedWorker, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertBroadcastChannel(x) {
    if (!isBroadcastChannel(x)) throw new TypeError(`Expected BroadcastChannel, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertIntlDateTimeFormat(x) {
    if (!isIntlDateTimeFormat(x)) throw new TypeError(`Expected Intl.DateTimeFormat, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertIntlNumberFormat(x) {
    if (!isIntlNumberFormat(x)) throw new TypeError(`Expected Intl.NumberFormat, got ${describe.value(x)}`);
}

/** @param {unknown} x */
export function assertIntlCollator(x) {
    if (!isIntlCollator(x)) throw new TypeError(`Expected Intl.Collator, got ${describe.value(x)}`);
}
