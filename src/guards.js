// ./src/guards.js
//
// All static named guard exports. Each `export const isX` is statically
// analyzable so bundlers can drop the unused ones when consumers
// `import { isString }` instead of `import { is }`.
//
// Naming:
// - Long form mirrors the runtime type: isString, isNumber, isHtmlElement
// - Shorthand aliases mirror the namespace shorthands: isStr, isNum, isBool
// - Instanceof guards are gated by `typeof Constructor !== 'undefined'`
//   so they return `false` instead of throwing in environments where the
//   constructor is missing (e.g. is.htmlElement in Node).

const G = globalThis;

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

export const isArray = (x) => Array.isArray(x);
export const isArr = isArray;

export const isDefined = (x) => x !== undefined && x !== null;

export const isNullish = (x) => x === undefined || x === null;

export const isNil = (x) => x === null;

// Basic object check: excludes null and arrays. Matches most non-null
// object-like values (including class instances, DOM nodes, etc.)
export const isObject = (x) => !!(x && typeof x === 'object' && !Array.isArray(x));
export const isObj = isObject;

// Stricter check: only matches values whose [[Class]] is "Object".
// Excludes Date, Map, DOM elements, etc.
export const isObjectStrict = (x) => Object.prototype.toString.call(x) === '[object Object]';

// POJO check: plain object with prototype of Object or null.
export const isPlainObject = (x) => {
    if (!isObjectStrict(x)) return false;
    const proto = Object.getPrototypeOf(x);
    return proto === Object.prototype || proto === null;
};
export const isPojo = isPlainObject;

// Loose object check: includes arrays, objects, and non-null values.
export const isObjectLoose = (x) => typeof x === 'object' && x !== null;

// Browser-only: HTMLElement that has contentEditable=true.
const HAS_HTML_ELEMENT = typeof G.HTMLElement !== 'undefined';
export const isContentEditable = (x) =>
    !!(HAS_HTML_ELEMENT && x instanceof G.HTMLElement && x.isContentEditable === true);

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
export const isFinite = (x) => Number.isFinite(x);

// =============================================================================
// Instanceof guards (gated by runtime feature-detection)
//
// Each pair is:
//   const HAS_X = typeof G.X === 'function';
//   export const isX = (v) => HAS_X && v instanceof G.X;
//
// In environments where the constructor is missing, the guard returns
// `false` cleanly instead of throwing.
// =============================================================================

// --- Universal collections ---
const HAS_MAP = typeof G.Map === 'function';
export const isMap = (x) => HAS_MAP && x instanceof G.Map;

const HAS_SET = typeof G.Set === 'function';
export const isSet = (x) => HAS_SET && x instanceof G.Set;

const HAS_WEAK_MAP = typeof G.WeakMap === 'function';
export const isWeakMap = (x) => HAS_WEAK_MAP && x instanceof G.WeakMap;

const HAS_WEAK_SET = typeof G.WeakSet === 'function';
export const isWeakSet = (x) => HAS_WEAK_SET && x instanceof G.WeakSet;

// --- Core / errors ---
const HAS_DATE = typeof G.Date === 'function';
export const isDate = (x) => HAS_DATE && x instanceof G.Date;

const HAS_REGEXP = typeof G.RegExp === 'function';
export const isRegExp = (x) => HAS_REGEXP && x instanceof G.RegExp;

const HAS_ERROR = typeof G.Error === 'function';
export const isError = (x) => HAS_ERROR && x instanceof G.Error;

const HAS_TYPE_ERROR = typeof G.TypeError === 'function';
export const isTypeError = (x) => HAS_TYPE_ERROR && x instanceof G.TypeError;

const HAS_RANGE_ERROR = typeof G.RangeError === 'function';
export const isRangeError = (x) => HAS_RANGE_ERROR && x instanceof G.RangeError;

const HAS_SYNTAX_ERROR = typeof G.SyntaxError === 'function';
export const isSyntaxError = (x) => HAS_SYNTAX_ERROR && x instanceof G.SyntaxError;

const HAS_REFERENCE_ERROR = typeof G.ReferenceError === 'function';
export const isReferenceError = (x) => HAS_REFERENCE_ERROR && x instanceof G.ReferenceError;

const HAS_URI_ERROR = typeof G.URIError === 'function';
export const isUriError = (x) => HAS_URI_ERROR && x instanceof G.URIError;

const HAS_PROMISE = typeof G.Promise === 'function';
export const isPromise = (x) => HAS_PROMISE && x instanceof G.Promise;

// --- Buffers / typed arrays ---
const HAS_ARRAY_BUFFER = typeof G.ArrayBuffer === 'function';
export const isArrayBuffer = (x) => HAS_ARRAY_BUFFER && x instanceof G.ArrayBuffer;

const HAS_DATA_VIEW = typeof G.DataView === 'function';
export const isDataView = (x) => HAS_DATA_VIEW && x instanceof G.DataView;

const HAS_INT8 = typeof G.Int8Array === 'function';
export const isInt8Array = (x) => HAS_INT8 && x instanceof G.Int8Array;

const HAS_UINT8 = typeof G.Uint8Array === 'function';
export const isUint8Array = (x) => HAS_UINT8 && x instanceof G.Uint8Array;

const HAS_UINT8C = typeof G.Uint8ClampedArray === 'function';
export const isUint8ClampedArray = (x) => HAS_UINT8C && x instanceof G.Uint8ClampedArray;

const HAS_INT16 = typeof G.Int16Array === 'function';
export const isInt16Array = (x) => HAS_INT16 && x instanceof G.Int16Array;

const HAS_UINT16 = typeof G.Uint16Array === 'function';
export const isUint16Array = (x) => HAS_UINT16 && x instanceof G.Uint16Array;

const HAS_INT32 = typeof G.Int32Array === 'function';
export const isInt32Array = (x) => HAS_INT32 && x instanceof G.Int32Array;

const HAS_UINT32 = typeof G.Uint32Array === 'function';
export const isUint32Array = (x) => HAS_UINT32 && x instanceof G.Uint32Array;

const HAS_FLOAT32 = typeof G.Float32Array === 'function';
export const isFloat32Array = (x) => HAS_FLOAT32 && x instanceof G.Float32Array;

const HAS_FLOAT64 = typeof G.Float64Array === 'function';
export const isFloat64Array = (x) => HAS_FLOAT64 && x instanceof G.Float64Array;

const HAS_BIGINT64 = typeof G.BigInt64Array === 'function';
export const isBigInt64Array = (x) => HAS_BIGINT64 && x instanceof G.BigInt64Array;

const HAS_BIGUINT64 = typeof G.BigUint64Array === 'function';
export const isBigUint64Array = (x) => HAS_BIGUINT64 && x instanceof G.BigUint64Array;

// --- URL / search ---
const HAS_URL = typeof G.URL === 'function';
export const isUrl = (x) => HAS_URL && x instanceof G.URL;

const HAS_URL_SEARCH_PARAMS = typeof G.URLSearchParams === 'function';
export const isUrlSearchParams = (x) => HAS_URL_SEARCH_PARAMS && x instanceof G.URLSearchParams;

// --- Fetch ---
const HAS_HEADERS = typeof G.Headers === 'function';
export const isHeaders = (x) => HAS_HEADERS && x instanceof G.Headers;

const HAS_REQUEST = typeof G.Request === 'function';
export const isRequest = (x) => HAS_REQUEST && x instanceof G.Request;

const HAS_RESPONSE = typeof G.Response === 'function';
export const isResponse = (x) => HAS_RESPONSE && x instanceof G.Response;

const HAS_FORM_DATA = typeof G.FormData === 'function';
export const isFormData = (x) => HAS_FORM_DATA && x instanceof G.FormData;

const HAS_BLOB = typeof G.Blob === 'function';
export const isBlob = (x) => HAS_BLOB && x instanceof G.Blob;

const HAS_FILE = typeof G.File === 'function';
export const isFile = (x) => HAS_FILE && x instanceof G.File;

// --- DOM ---
const HAS_ELEMENT = typeof G.Element !== 'undefined';
export const isElement = (x) => HAS_ELEMENT && x instanceof G.Element;

const HAS_HTML_ELEMENT_INST = typeof G.HTMLElement !== 'undefined';
export const isHtmlElement = (x) => HAS_HTML_ELEMENT_INST && x instanceof G.HTMLElement;

const HAS_NODE = typeof G.Node !== 'undefined';
export const isNode = (x) => HAS_NODE && x instanceof G.Node;

const HAS_DOCUMENT = typeof G.Document !== 'undefined';
export const isDocument = (x) => HAS_DOCUMENT && x instanceof G.Document;

const HAS_WINDOW = typeof G.Window !== 'undefined';
export const isWindow = (x) => HAS_WINDOW && x instanceof G.Window;

const HAS_TEXT = typeof G.Text !== 'undefined';
export const isTextNode = (x) => HAS_TEXT && x instanceof G.Text;

const HAS_COMMENT = typeof G.Comment !== 'undefined';
export const isComment = (x) => HAS_COMMENT && x instanceof G.Comment;

const HAS_CANVAS = typeof G.HTMLCanvasElement !== 'undefined';
export const isCanvas = (x) => HAS_CANVAS && x instanceof G.HTMLCanvasElement;

const HAS_VIDEO = typeof G.HTMLVideoElement !== 'undefined';
export const isVideo = (x) => HAS_VIDEO && x instanceof G.HTMLVideoElement;

const HAS_AUDIO = typeof G.HTMLAudioElement !== 'undefined';
export const isAudio = (x) => HAS_AUDIO && x instanceof G.HTMLAudioElement;

const HAS_IMAGE = typeof G.HTMLImageElement !== 'undefined';
export const isImage = (x) => HAS_IMAGE && x instanceof G.HTMLImageElement;

const HAS_FILE_LIST = typeof G.FileList !== 'undefined';
export const isFileList = (x) => HAS_FILE_LIST && x instanceof G.FileList;

// --- DOM events ---
const HAS_INPUT_EVENT = typeof G.InputEvent !== 'undefined';
export const isInputEvent = (x) => HAS_INPUT_EVENT && x instanceof G.InputEvent;

const HAS_KEYBOARD_EVENT = typeof G.KeyboardEvent !== 'undefined';
export const isKeyboardEvent = (x) => HAS_KEYBOARD_EVENT && x instanceof G.KeyboardEvent;

const HAS_MOUSE_EVENT = typeof G.MouseEvent !== 'undefined';
export const isMouseEvent = (x) => HAS_MOUSE_EVENT && x instanceof G.MouseEvent;

const HAS_FOCUS_EVENT = typeof G.FocusEvent !== 'undefined';
export const isFocusEvent = (x) => HAS_FOCUS_EVENT && x instanceof G.FocusEvent;

// --- Worker family ---
const HAS_WORKER = typeof G.Worker !== 'undefined';
export const isWorker = (x) => HAS_WORKER && x instanceof G.Worker;

const HAS_SHARED_WORKER = typeof G.SharedWorker !== 'undefined';
export const isSharedWorker = (x) => HAS_SHARED_WORKER && x instanceof G.SharedWorker;

const HAS_BROADCAST_CHANNEL = typeof G.BroadcastChannel !== 'undefined';
export const isBroadcastChannel = (x) => HAS_BROADCAST_CHANNEL && x instanceof G.BroadcastChannel;

// --- Intl (nested) ---
const HAS_INTL = typeof G.Intl === 'object' && G.Intl !== null;

const HAS_INTL_DTF = HAS_INTL && typeof G.Intl.DateTimeFormat === 'function';
export const isIntlDateTimeFormat = (x) => HAS_INTL_DTF && x instanceof G.Intl.DateTimeFormat;

const HAS_INTL_NF = HAS_INTL && typeof G.Intl.NumberFormat === 'function';
export const isIntlNumberFormat = (x) => HAS_INTL_NF && x instanceof G.Intl.NumberFormat;

const HAS_INTL_COL = HAS_INTL && typeof G.Intl.Collator === 'function';
export const isIntlCollator = (x) => HAS_INTL_COL && x instanceof G.Intl.Collator;
