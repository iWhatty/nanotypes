// ./src/asserts.js
//
// All static named assert exports. Each `export const assertX` is a
// thin wrapper that throws TypeError when the corresponding guard
// returns false. Same naming convention as guards.js (long form +
// shorthand parity).
//
// Each assert imports only the guard it needs. Bundlers tree-shake by
// the same rules as guards — `import { assertString }` keeps
// `assertString` and `isString`, drops everything else.

import { describe } from './describe.js';
import {
    is,
    isString, isStr,
    isNumber, isNum,
    isNumberSafe,
    isBoolean, isBool,
    isBigint, isBigi,
    isSymbol, isSym,
    isUndefined, isUndef,
    isFunc,
    isArray, isArr,
    isDefined,
    isNullish,
    isNil,
    isObject, isObj,
    isObjectStrict,
    isPlainObject, isPojo,
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

/**
 * Internal helper: wrap a guard into a thrower with a consistent error
 * message. Tree-shakes only when at least one assert is imported.
 *
 * @param {string} name
 * @param {(x: unknown) => boolean} guard
 */
function wrap(name, guard) {
    return (x) => {
        if (!guard(x)) throw new TypeError(`Expected ${name}, got ${describe.value(x)}`);
    };
}

// =============================================================================
// typeof asserts
// =============================================================================

export const assertString = wrap('string', isString);
export const assertStr = assertString;

export const assertNumber = wrap('number', isNumber);
export const assertNum = assertNumber;

export const assertBoolean = wrap('boolean', isBoolean);
export const assertBool = assertBoolean;

export const assertBigint = wrap('bigint', isBigint);
export const assertBigi = assertBigint;

export const assertSymbol = wrap('symbol', isSymbol);
export const assertSym = assertSymbol;

export const assertUndefined = wrap('undefined', isUndefined);
export const assertUndef = assertUndefined;

export const assertFunc = wrap('function', isFunc);

// =============================================================================
// Manual / structural asserts
// =============================================================================

export const assertNumberSafe = wrap('numberSafe', isNumberSafe);

export const assertArray = wrap('array', isArray);
export const assertArr = assertArray;

export const assertDefined = wrap('defined', isDefined);
export const assertNullish = wrap('nullish', isNullish);
export const assertNil = wrap('nil', isNil);

export const assertObject = wrap('object', isObject);
export const assertObj = assertObject;

export const assertObjectStrict = wrap('objectStrict', isObjectStrict);

export const assertPlainObject = wrap('plainObject', isPlainObject);
export const assertPojo = assertPlainObject;

export const assertObjectLoose = wrap('objectLoose', isObjectLoose);

export const assertContentEditable = wrap('contentEditable', isContentEditable);

// =============================================================================
// Derived
// =============================================================================

export const assertTruthy = wrap('truthy', isTruthy);
export const assertFalsy = wrap('falsy', isFalsy);

export const assertEmptyString = wrap('emptyString', isEmptyString);
export const assertNonEmptyString = wrap('nonEmptyString', isNonEmptyString);

export const assertPositiveNumber = wrap('positiveNumber', isPositiveNumber);
export const assertNegativeNumber = wrap('negativeNumber', isNegativeNumber);
export const assertInteger = wrap('integer', isInteger);
export const assertFinite = wrap('finite', isFinite);

// =============================================================================
// Instanceof asserts
// =============================================================================

export const assertMap = wrap('Map', isMap);
export const assertSet = wrap('Set', isSet);
export const assertWeakMap = wrap('WeakMap', isWeakMap);
export const assertWeakSet = wrap('WeakSet', isWeakSet);

export const assertDate = wrap('Date', isDate);
export const assertRegExp = wrap('RegExp', isRegExp);

export const assertError = wrap('Error', isError);
export const assertTypeError = wrap('TypeError', isTypeError);
export const assertRangeError = wrap('RangeError', isRangeError);
export const assertSyntaxError = wrap('SyntaxError', isSyntaxError);
export const assertReferenceError = wrap('ReferenceError', isReferenceError);
export const assertUriError = wrap('URIError', isUriError);

export const assertPromise = wrap('Promise', isPromise);

export const assertArrayBuffer = wrap('ArrayBuffer', isArrayBuffer);
export const assertDataView = wrap('DataView', isDataView);
export const assertInt8Array = wrap('Int8Array', isInt8Array);
export const assertUint8Array = wrap('Uint8Array', isUint8Array);
export const assertUint8ClampedArray = wrap('Uint8ClampedArray', isUint8ClampedArray);
export const assertInt16Array = wrap('Int16Array', isInt16Array);
export const assertUint16Array = wrap('Uint16Array', isUint16Array);
export const assertInt32Array = wrap('Int32Array', isInt32Array);
export const assertUint32Array = wrap('Uint32Array', isUint32Array);
export const assertFloat32Array = wrap('Float32Array', isFloat32Array);
export const assertFloat64Array = wrap('Float64Array', isFloat64Array);
export const assertBigInt64Array = wrap('BigInt64Array', isBigInt64Array);
export const assertBigUint64Array = wrap('BigUint64Array', isBigUint64Array);

export const assertUrl = wrap('URL', isUrl);
export const assertUrlSearchParams = wrap('URLSearchParams', isUrlSearchParams);

export const assertHeaders = wrap('Headers', isHeaders);
export const assertRequest = wrap('Request', isRequest);
export const assertResponse = wrap('Response', isResponse);
export const assertFormData = wrap('FormData', isFormData);
export const assertBlob = wrap('Blob', isBlob);
export const assertFile = wrap('File', isFile);

export const assertElement = wrap('Element', isElement);
export const assertHtmlElement = wrap('HTMLElement', isHtmlElement);
export const assertNode = wrap('Node', isNode);
export const assertDocument = wrap('Document', isDocument);
export const assertWindow = wrap('Window', isWindow);
export const assertTextNode = wrap('Text', isTextNode);
export const assertComment = wrap('Comment', isComment);
export const assertCanvas = wrap('HTMLCanvasElement', isCanvas);
export const assertVideo = wrap('HTMLVideoElement', isVideo);
export const assertAudio = wrap('HTMLAudioElement', isAudio);
export const assertImage = wrap('HTMLImageElement', isImage);
export const assertFileList = wrap('FileList', isFileList);

export const assertInputEvent = wrap('InputEvent', isInputEvent);
export const assertKeyboardEvent = wrap('KeyboardEvent', isKeyboardEvent);
export const assertMouseEvent = wrap('MouseEvent', isMouseEvent);
export const assertFocusEvent = wrap('FocusEvent', isFocusEvent);

export const assertWorker = wrap('Worker', isWorker);
export const assertSharedWorker = wrap('SharedWorker', isSharedWorker);
export const assertBroadcastChannel = wrap('BroadcastChannel', isBroadcastChannel);

export const assertIntlDateTimeFormat = wrap('Intl.DateTimeFormat', isIntlDateTimeFormat);
export const assertIntlNumberFormat = wrap('Intl.NumberFormat', isIntlNumberFormat);
export const assertIntlCollator = wrap('Intl.Collator', isIntlCollator);
