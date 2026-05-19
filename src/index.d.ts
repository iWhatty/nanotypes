// ./src/index.d.ts
//
// Two parallel surfaces:
//   - Per-guard named exports (tree-shakeable): isString, isObject, ...
//     and assertString, assertObject, ... — long form plus shorthand
//     parity (isStr, isNum, ...) for the typeof-table primitives and
//     for the two most-reached-for structural guards (isObj, isArr).
//   - Legacy namespace surfaces (ergonomic): is.string(x), assertType.string(x)
//
// Both shapes are kept in lockstep; importing one or the other is a
// pure DX/size trade.

type Falsy = false | 0 | 0n | '' | null | undefined;
type Truthy<T> = Exclude<T, Falsy>;

// =============================================================================
// Generic instanceof + assertType (callable signatures)
// =============================================================================
export function is<T>(x: unknown, constructor: new (...args: any[]) => T): x is T;
export function assertType<T>(x: unknown, constructor: new (...args: any[]) => T): asserts x is T;

// =============================================================================
// Per-guard named exports (tree-shakeable)
// =============================================================================

// --- typeof guards ---
export function isString(x: unknown): x is string;
export function isStr(x: unknown): x is string;
export function isNumber(x: unknown): x is number;
export function isNum(x: unknown): x is number;
export function isNumberSafe(x: unknown): x is number;
export function isBoolean(x: unknown): x is boolean;
export function isBool(x: unknown): x is boolean;
export function isBigint(x: unknown): x is bigint;
export function isBigi(x: unknown): x is bigint;
export function isSymbol(x: unknown): x is symbol;
export function isSym(x: unknown): x is symbol;
export function isUndefined(x: unknown): x is undefined;
export function isUndef(x: unknown): x is undefined;
export function isFunc(x: unknown): x is (...args: any[]) => any;

// --- manual / structural guards ---
export function isArray(x: unknown): x is unknown[];
export function isArr(x: unknown): x is unknown[];
export function isDefined<T>(x: T | null | undefined): x is T;
export function isNullish(x: unknown): x is null | undefined;
export function isNil(x: unknown): x is null;
export function isObject(x: unknown): x is object;
export function isObj(x: unknown): x is object;
export function isObjectStrict(x: unknown): x is Record<string, unknown>;
export function isPlainObject(x: unknown): x is Record<string, unknown>;
export function isPojo(x: unknown): x is Record<string, unknown>;
export function isObjectLoose(x: unknown): x is object;
export function isContentEditable(x: unknown): x is HTMLElement;

// --- derived ---
export function isTruthy<T>(x: T): x is Truthy<T>;
export function isFalsy(x: unknown): x is Falsy;
export function isEmptyString(x: unknown): x is '';
export function isNonEmptyString(x: unknown): x is string;
export function isPositiveNumber(x: unknown): x is number;
export function isNegativeNumber(x: unknown): x is number;
export function isInteger(x: unknown): x is number;
export function isFinite(x: unknown): x is number;

// --- instanceof guards (gated by runtime feature-detect) ---
export function isMap(x: unknown): x is Map<unknown, unknown>;
export function isSet(x: unknown): x is Set<unknown>;
export function isWeakMap(x: unknown): x is WeakMap<object, unknown>;
export function isWeakSet(x: unknown): x is WeakSet<object>;
export function isDate(x: unknown): x is Date;
export function isRegExp(x: unknown): x is RegExp;
export function isError(x: unknown): x is Error;
export function isTypeError(x: unknown): x is TypeError;
export function isRangeError(x: unknown): x is RangeError;
export function isSyntaxError(x: unknown): x is SyntaxError;
export function isReferenceError(x: unknown): x is ReferenceError;
export function isUriError(x: unknown): x is URIError;
export function isPromise(x: unknown): x is Promise<unknown>;
export function isArrayBuffer(x: unknown): x is ArrayBuffer;
export function isDataView(x: unknown): x is DataView;
export function isInt8Array(x: unknown): x is Int8Array;
export function isUint8Array(x: unknown): x is Uint8Array;
export function isUint8ClampedArray(x: unknown): x is Uint8ClampedArray;
export function isInt16Array(x: unknown): x is Int16Array;
export function isUint16Array(x: unknown): x is Uint16Array;
export function isInt32Array(x: unknown): x is Int32Array;
export function isUint32Array(x: unknown): x is Uint32Array;
export function isFloat32Array(x: unknown): x is Float32Array;
export function isFloat64Array(x: unknown): x is Float64Array;
export function isBigInt64Array(x: unknown): x is BigInt64Array;
export function isBigUint64Array(x: unknown): x is BigUint64Array;
export function isUrl(x: unknown): x is URL;
export function isUrlSearchParams(x: unknown): x is URLSearchParams;
export function isHeaders(x: unknown): x is Headers;
export function isRequest(x: unknown): x is Request;
export function isResponse(x: unknown): x is Response;
export function isFormData(x: unknown): x is FormData;
export function isBlob(x: unknown): x is Blob;
export function isFile(x: unknown): x is File;
export function isElement(x: unknown): x is Element;
export function isHtmlElement(x: unknown): x is HTMLElement;
export function isNode(x: unknown): x is Node;
export function isDocument(x: unknown): x is Document;
export function isWindow(x: unknown): x is Window;
export function isTextNode(x: unknown): x is Text;
export function isComment(x: unknown): x is Comment;
export function isCanvas(x: unknown): x is HTMLCanvasElement;
export function isVideo(x: unknown): x is HTMLVideoElement;
export function isAudio(x: unknown): x is HTMLAudioElement;
export function isImage(x: unknown): x is HTMLImageElement;
export function isFileList(x: unknown): x is FileList;
export function isInputEvent(x: unknown): x is InputEvent;
export function isKeyboardEvent(x: unknown): x is KeyboardEvent;
export function isMouseEvent(x: unknown): x is MouseEvent;
export function isFocusEvent(x: unknown): x is FocusEvent;
export function isWorker(x: unknown): x is Worker;
export function isSharedWorker(x: unknown): x is SharedWorker;
export function isBroadcastChannel(x: unknown): x is BroadcastChannel;
export function isIntlDateTimeFormat(x: unknown): x is Intl.DateTimeFormat;
export function isIntlNumberFormat(x: unknown): x is Intl.NumberFormat;
export function isIntlCollator(x: unknown): x is Intl.Collator;

// =============================================================================
// Per-assert named exports (mirror the guards)
// =============================================================================

export function assertString(x: unknown): asserts x is string;
export function assertStr(x: unknown): asserts x is string;
export function assertNumber(x: unknown): asserts x is number;
export function assertNum(x: unknown): asserts x is number;
export function assertNumberSafe(x: unknown): asserts x is number;
export function assertBoolean(x: unknown): asserts x is boolean;
export function assertBool(x: unknown): asserts x is boolean;
export function assertBigint(x: unknown): asserts x is bigint;
export function assertBigi(x: unknown): asserts x is bigint;
export function assertSymbol(x: unknown): asserts x is symbol;
export function assertSym(x: unknown): asserts x is symbol;
export function assertUndefined(x: unknown): asserts x is undefined;
export function assertUndef(x: unknown): asserts x is undefined;
export function assertFunc(x: unknown): asserts x is (...args: any[]) => any;

export function assertArray(x: unknown): asserts x is unknown[];
export function assertArr(x: unknown): asserts x is unknown[];
export function assertDefined<T>(x: T | null | undefined): asserts x is T;
export function assertNullish(x: unknown): asserts x is null | undefined;
export function assertNil(x: unknown): asserts x is null;
export function assertObject(x: unknown): asserts x is object;
export function assertObj(x: unknown): asserts x is object;
export function assertObjectStrict(x: unknown): asserts x is Record<string, unknown>;
export function assertPlainObject(x: unknown): asserts x is Record<string, unknown>;
export function assertPojo(x: unknown): asserts x is Record<string, unknown>;
export function assertObjectLoose(x: unknown): asserts x is object;
export function assertContentEditable(x: unknown): asserts x is HTMLElement;

export function assertTruthy<T>(x: T): asserts x is Truthy<T>;
export function assertFalsy(x: unknown): asserts x is Falsy;
export function assertEmptyString(x: unknown): asserts x is '';
export function assertNonEmptyString(x: unknown): asserts x is string;
export function assertPositiveNumber(x: unknown): asserts x is number;
export function assertNegativeNumber(x: unknown): asserts x is number;
export function assertInteger(x: unknown): asserts x is number;
export function assertFinite(x: unknown): asserts x is number;

export function assertMap(x: unknown): asserts x is Map<unknown, unknown>;
export function assertSet(x: unknown): asserts x is Set<unknown>;
export function assertWeakMap(x: unknown): asserts x is WeakMap<object, unknown>;
export function assertWeakSet(x: unknown): asserts x is WeakSet<object>;
export function assertDate(x: unknown): asserts x is Date;
export function assertRegExp(x: unknown): asserts x is RegExp;
export function assertError(x: unknown): asserts x is Error;
export function assertPromise(x: unknown): asserts x is Promise<unknown>;
export function assertUrl(x: unknown): asserts x is URL;
export function assertHtmlElement(x: unknown): asserts x is HTMLElement;
export function assertBlob(x: unknown): asserts x is Blob;

// =============================================================================
// Legacy `is` namespace (ergonomic, pulls full surface)
// =============================================================================
export namespace is {
  function string(x: unknown): x is string;
  function number(x: unknown): x is number;
  function boolean(x: unknown): x is boolean;
  function bigint(x: unknown): x is bigint;
  function symbol(x: unknown): x is symbol;
  function undefined(x: unknown): x is undefined;
  function func(x: unknown): x is (...args: any[]) => any;
  function str(x: unknown): x is string;
  function num(x: unknown): x is number;
  function bool(x: unknown): x is boolean;
  function bigi(x: unknown): x is bigint;
  function sym(x: unknown): x is symbol;
  function undef(x: unknown): x is undefined;

  function textNode(x: unknown): x is Text;
  function element(x: unknown): x is Element;
  function htmlElement(x: unknown): x is HTMLElement;
  function inputEvent(x: unknown): x is InputEvent;
  function keyboardEvent(x: unknown): x is KeyboardEvent;
  function mouseEvent(x: unknown): x is MouseEvent;
  function focusEvent(x: unknown): x is FocusEvent;
  function formData(x: unknown): x is FormData;
  function comment(x: unknown): x is Comment;
  function document(x: unknown): x is Document;
  function node(x: unknown): x is Node;
  function window(x: unknown): x is Window;
  function file(x: unknown): x is File;
  function fileList(x: unknown): x is FileList;
  function image(x: unknown): x is HTMLImageElement;
  function blob(x: unknown): x is Blob;
  function canvas(x: unknown): x is HTMLCanvasElement;
  function video(x: unknown): x is HTMLVideoElement;
  function audio(x: unknown): x is HTMLAudioElement;
  function date(x: unknown): x is Date;
  function regExp(x: unknown): x is RegExp;
  function map(x: unknown): x is Map<any, any>;
  function set(x: unknown): x is Set<any>;
  function weakMap(x: unknown): x is WeakMap<any, any>;
  function weakSet(x: unknown): x is WeakSet<any>;
  function arrayBuffer(x: unknown): x is ArrayBuffer;
  function dataView(x: unknown): x is DataView;
  function promise(x: unknown): x is Promise<any>;
  function error(x: unknown): x is Error;
  function headers(x: unknown): x is Headers;
  function request(x: unknown): x is Request;
  function response(x: unknown): x is Response;
  function url(x: unknown): x is URL;
  function urlSearchParams(x: unknown): x is URLSearchParams;
  function worker(x: unknown): x is Worker;
  function sharedWorker(x: unknown): x is SharedWorker;
  function broadcastChannel(x: unknown): x is BroadcastChannel;
  function intlDateTimeFormat(x: unknown): x is Intl.DateTimeFormat;
  function intlNumberFormat(x: unknown): x is Intl.NumberFormat;
  function intlCollator(x: unknown): x is Intl.Collator;

  function numberSafe(x: unknown): x is number;
  function array(x: unknown): x is unknown[];
  function defined<T>(x: T | null | undefined): x is T;
  function nullish(x: unknown): x is null | undefined;
  function nil(x: unknown): x is null;
  function contentEditable(x: unknown): x is HTMLElement;

  function object(x: unknown): x is object;
  function objectStrict(x: unknown): x is Record<string, unknown>;
  function plainObject(x: unknown): x is Record<string, unknown>;
  function pojo(x: unknown): x is Record<string, unknown>;
  function objectLoose(x: unknown): x is object;

  function obj(x: unknown): x is object;
  function arr(x: unknown): x is unknown[];

  function truthy<T>(x: T): x is Truthy<T>;
  function falsy(x: unknown): x is Falsy;
  function emptyString(x: unknown): x is '';
  function nonEmptyString(x: unknown): x is string;
  function positiveNumber(x: unknown): x is number;
  function negativeNumber(x: unknown): x is number;
  function integer(x: unknown): x is number;
  function finite(x: unknown): x is number;
}

// =============================================================================
// Legacy `assertType` namespace
// =============================================================================
export namespace assertType {
  function string(x: unknown): asserts x is string;
  function number(x: unknown): asserts x is number;
  function boolean(x: unknown): asserts x is boolean;
  function bigint(x: unknown): asserts x is bigint;
  function symbol(x: unknown): asserts x is symbol;
  function undefined(x: unknown): asserts x is undefined;
  function func(x: unknown): asserts x is (...args: any[]) => any;
  function str(x: unknown): asserts x is string;
  function num(x: unknown): asserts x is number;
  function bool(x: unknown): asserts x is boolean;
  function bigi(x: unknown): asserts x is bigint;
  function sym(x: unknown): asserts x is symbol;
  function undef(x: unknown): asserts x is undefined;

  function array(x: unknown): asserts x is unknown[];
  function arr(x: unknown): asserts x is unknown[];
  function numberSafe(x: unknown): asserts x is number;
  function object(x: unknown): asserts x is object;
  function obj(x: unknown): asserts x is object;
  function defined<T>(x: T | null | undefined): asserts x is T;
  function nullish(x: unknown): asserts x is null | undefined;
  function nil(x: unknown): asserts x is null;
  function contentEditable(x: unknown): asserts x is HTMLElement;

  function objectStrict(x: unknown): asserts x is Record<string, unknown>;
  function plainObject(x: unknown): asserts x is Record<string, unknown>;
  function pojo(x: unknown): asserts x is Record<string, unknown>;
  function objectLoose(x: unknown): asserts x is object;

  function promise(x: unknown): asserts x is Promise<any>;
  function date(x: unknown): asserts x is Date;
  function error(x: unknown): asserts x is Error;
  function url(x: unknown): asserts x is URL;
  function blob(x: unknown): asserts x is Blob;
  function htmlElement(x: unknown): asserts x is HTMLElement;

  function truthy<T>(x: T): asserts x is Truthy<T>;
  function falsy(x: unknown): asserts x is Falsy;
  function emptyString(x: unknown): asserts x is '';
  function nonEmptyString(x: unknown): asserts x is string;
  function positiveNumber(x: unknown): asserts x is number;
  function negativeNumber(x: unknown): asserts x is number;
  function integer(x: unknown): asserts x is number;
  function finite(x: unknown): asserts x is number;
}

// =============================================================================
// describe
// =============================================================================
export namespace describe {
  function value(x: unknown): string;
}
