// ./src/index.d.ts
//
// Two parallel surfaces (0.2.5: the namespaces are typed as interfaces,
// IsNamespace and AssertTypeNamespace, so they can carry the `null` key):
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

// What isArray / assertArray narrow to. Every branch is assignable to T, as a
// type predicate requires.
// - `unknown` and `any` (untyped JS) narrow to `unknown[]`, as in 0.2.3; the
//   else branch of `any` stays `any`.
// - Array members of a union are kept with their element types, readonly
//   ones included: `Map<K, V> | ReadonlyArray<E>` narrows to
//   `ReadonlyArray<E>`. A plain `x is unknown[]` intersected instead,
//   because a readonly array is not an `unknown[]`, so element types were
//   lost.
// - Other input with no array member narrows to `T & unknown[]`.
type ArrayPart<T> = unknown extends T
  ? Extract<unknown[], T>
  : [Extract<T, readonly unknown[]>] extends [never]
    ? T & unknown[]
    : Extract<T, readonly unknown[]>;

// The generic instanceof forms `is(x, Ctor)` and `assertType(x, Ctor)` are
// the call signatures of `IsNamespace` and `AssertTypeNamespace` below.

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
export function isArray<T>(x: T): x is ArrayPart<T>;
export function isArr<T>(x: T): x is ArrayPart<T>;
// Null checks. `isNull` and `isNil` are strictly `null` (`x === null`).
// Coming from lodash/Ramda, where `isNil` means null OR undefined? Use
// `isNullish` for that.
/** True when `x` is neither `null` nor `undefined` (`x != null`). */
export function isDefined<T>(x: T | null | undefined): x is T;
/** True when `x` is `null` or `undefined` (`x == null`). This is lodash's `isNil`. */
export function isNullish(x: unknown): x is null | undefined;
/** True only when `x` is `null` (`x === null`); `undefined` is false. */
export function isNull(x: unknown): x is null;
/**
 * True only when `x` is `null` (`x === null`); `undefined` is false. Same as
 * `isNull`. Not lodash's `isNil` (null or undefined): use `isNullish` for that.
 */
export function isNil(x: unknown): x is null;
export function isObject(x: unknown): x is object;
export function isObj(x: unknown): x is object;
/**
 * `Object.prototype.toString.call(x) === '[object Object]'`: object literals,
 * null-prototype objects, and class instances without a `Symbol.toStringTag`.
 * Reads `Symbol.toStringTag` (a getter runs); never throws.
 */
export function isObjectStrict(x: unknown): x is Record<string, unknown>;
/**
 * A non-null, non-function object whose prototype is this realm's
 * `Object.prototype` or `null`, decided by `Object.getPrototypeOf` only (no
 * property reads; `Symbol.toStringTag` is ignored). Cross-realm objects and
 * class instances are false. Never throws: a revoked proxy or a throwing
 * getPrototypeOf trap is false.
 */
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
/** A number that is not `NaN` or +/-`Infinity` (`Number.isFinite`; no coercion). */
export function isFiniteNumber(x: unknown): x is number;
/**
 * @deprecated Use `isFiniteNumber`. Same function: `Number.isFinite`, no
 * coercion. As a named import it shadows the global `isFinite`, which
 * coerces (`isFinite('1')` is true; this returns false).
 */
export function isFinite(x: unknown): x is number;

// --- instanceof guards (constructor looked up at call time; false when missing; never throw) ---
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

export function assertArray<T>(x: T): asserts x is ArrayPart<T>;
export function assertArr<T>(x: T): asserts x is ArrayPart<T>;
/** Throws `TypeError` when `x` is `null` or `undefined`. */
export function assertDefined<T>(x: T | null | undefined): asserts x is T;
/** Throws `TypeError` unless `x` is `null` or `undefined` (lodash's `isNil`). */
export function assertNullish(x: unknown): asserts x is null | undefined;
/** Throws `TypeError` unless `x` is `null`; `undefined` throws. */
export function assertNull(x: unknown): asserts x is null;
/**
 * Throws `TypeError` unless `x` is `null`; `undefined` throws. Same check as
 * `assertNull`. Not lodash's `isNil`: use `assertNullish` for null or undefined.
 */
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
export function assertFiniteNumber(x: unknown): asserts x is number;
/** @deprecated Use `assertFiniteNumber`. Same check; message "Expected finite". */
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
export interface IsNamespace {
  /** Generic `instanceof` check; never throws. Warns in DEV on a mismatch. */
  <T>(x: unknown, constructor: new (...args: any[]) => T): x is T;
  string(x: unknown): x is string;
  number(x: unknown): x is number;
  boolean(x: unknown): x is boolean;
  bigint(x: unknown): x is bigint;
  symbol(x: unknown): x is symbol;
  undefined(x: unknown): x is undefined;
  func(x: unknown): x is (...args: any[]) => any;
  str(x: unknown): x is string;
  num(x: unknown): x is number;
  bool(x: unknown): x is boolean;
  bigi(x: unknown): x is bigint;
  sym(x: unknown): x is symbol;
  undef(x: unknown): x is undefined;

  textNode(x: unknown): x is Text;
  element(x: unknown): x is Element;
  htmlElement(x: unknown): x is HTMLElement;
  inputEvent(x: unknown): x is InputEvent;
  keyboardEvent(x: unknown): x is KeyboardEvent;
  mouseEvent(x: unknown): x is MouseEvent;
  focusEvent(x: unknown): x is FocusEvent;
  formData(x: unknown): x is FormData;
  comment(x: unknown): x is Comment;
  document(x: unknown): x is Document;
  node(x: unknown): x is Node;
  window(x: unknown): x is Window;
  file(x: unknown): x is File;
  fileList(x: unknown): x is FileList;
  image(x: unknown): x is HTMLImageElement;
  blob(x: unknown): x is Blob;
  canvas(x: unknown): x is HTMLCanvasElement;
  video(x: unknown): x is HTMLVideoElement;
  audio(x: unknown): x is HTMLAudioElement;
  date(x: unknown): x is Date;
  regExp(x: unknown): x is RegExp;
  map(x: unknown): x is Map<any, any>;
  set(x: unknown): x is Set<any>;
  weakMap(x: unknown): x is WeakMap<any, any>;
  weakSet(x: unknown): x is WeakSet<any>;
  arrayBuffer(x: unknown): x is ArrayBuffer;
  dataView(x: unknown): x is DataView;
  promise(x: unknown): x is Promise<any>;
  error(x: unknown): x is Error;
  headers(x: unknown): x is Headers;
  request(x: unknown): x is Request;
  response(x: unknown): x is Response;
  url(x: unknown): x is URL;
  urlSearchParams(x: unknown): x is URLSearchParams;
  worker(x: unknown): x is Worker;
  sharedWorker(x: unknown): x is SharedWorker;
  broadcastChannel(x: unknown): x is BroadcastChannel;
  intlDateTimeFormat(x: unknown): x is Intl.DateTimeFormat;
  intlNumberFormat(x: unknown): x is Intl.NumberFormat;
  intlCollator(x: unknown): x is Intl.Collator;

  numberSafe(x: unknown): x is number;
  array<T>(x: T): x is ArrayPart<T>;
  /** Neither `null` nor `undefined` (`x != null`). */
  defined<T>(x: T | null | undefined): x is T;
  /** `null` or `undefined` (`x == null`). This is lodash's `isNil`. */
  nullish(x: unknown): x is null | undefined;
  /** Strictly `null` (`x === null`); `undefined` is false. */
  null(x: unknown): x is null;
  /** Strictly `null`, same as `is.null`. Not lodash's `isNil`: use `is.nullish`. */
  nil(x: unknown): x is null;
  contentEditable(x: unknown): x is HTMLElement;

  object(x: unknown): x is object;
  objectStrict(x: unknown): x is Record<string, unknown>;
  plainObject(x: unknown): x is Record<string, unknown>;
  pojo(x: unknown): x is Record<string, unknown>;
  objectLoose(x: unknown): x is object;

  obj(x: unknown): x is object;
  arr<T>(x: T): x is ArrayPart<T>;

  truthy<T>(x: T): x is Truthy<T>;
  falsy(x: unknown): x is Falsy;
  emptyString(x: unknown): x is '';
  nonEmptyString(x: unknown): x is string;
  positiveNumber(x: unknown): x is number;
  negativeNumber(x: unknown): x is number;
  integer(x: unknown): x is number;
  finite(x: unknown): x is number;
  finiteNumber(x: unknown): x is number;
}
export declare const is: IsNamespace;

// =============================================================================
// Legacy `assertType` namespace
// =============================================================================
export interface AssertTypeNamespace {
  /** Generic `instanceof` assertion; throws `TypeError` on a mismatch. */
  <T>(x: unknown, constructor: new (...args: any[]) => T): asserts x is T;
  string(x: unknown): asserts x is string;
  number(x: unknown): asserts x is number;
  boolean(x: unknown): asserts x is boolean;
  bigint(x: unknown): asserts x is bigint;
  symbol(x: unknown): asserts x is symbol;
  undefined(x: unknown): asserts x is undefined;
  func(x: unknown): asserts x is (...args: any[]) => any;
  str(x: unknown): asserts x is string;
  num(x: unknown): asserts x is number;
  bool(x: unknown): asserts x is boolean;
  bigi(x: unknown): asserts x is bigint;
  sym(x: unknown): asserts x is symbol;
  undef(x: unknown): asserts x is undefined;

  array<T>(x: T): asserts x is ArrayPart<T>;
  arr<T>(x: T): asserts x is ArrayPart<T>;
  numberSafe(x: unknown): asserts x is number;
  object(x: unknown): asserts x is object;
  obj(x: unknown): asserts x is object;
  /** Throws unless `x` is neither `null` nor `undefined`. */
  defined<T>(x: T | null | undefined): asserts x is T;
  /** Throws unless `x` is `null` or `undefined` (lodash's `isNil`). */
  nullish(x: unknown): asserts x is null | undefined;
  /** Throws unless `x` is strictly `null`; `undefined` throws. */
  null(x: unknown): asserts x is null;
  /** Strictly `null`, same as `assertType.null`. Not lodash's `isNil`: use `assertType.nullish`. */
  nil(x: unknown): asserts x is null;
  contentEditable(x: unknown): asserts x is HTMLElement;

  objectStrict(x: unknown): asserts x is Record<string, unknown>;
  plainObject(x: unknown): asserts x is Record<string, unknown>;
  pojo(x: unknown): asserts x is Record<string, unknown>;
  objectLoose(x: unknown): asserts x is object;

  promise(x: unknown): asserts x is Promise<any>;
  date(x: unknown): asserts x is Date;
  error(x: unknown): asserts x is Error;
  url(x: unknown): asserts x is URL;
  blob(x: unknown): asserts x is Blob;
  htmlElement(x: unknown): asserts x is HTMLElement;

  truthy<T>(x: T): asserts x is Truthy<T>;
  falsy(x: unknown): asserts x is Falsy;
  emptyString(x: unknown): asserts x is '';
  nonEmptyString(x: unknown): asserts x is string;
  positiveNumber(x: unknown): asserts x is number;
  negativeNumber(x: unknown): asserts x is number;
  integer(x: unknown): asserts x is number;
  finite(x: unknown): asserts x is number;
  finiteNumber(x: unknown): asserts x is number;
}
export declare const assertType: AssertTypeNamespace;

// =============================================================================
// describe
// =============================================================================
export namespace describe {
  function value(x: unknown): string;
}
