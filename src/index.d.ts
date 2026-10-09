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

// Refinement brands (0.4.0, docs/DESIGN.md P4). A guard that checks more
// than the type (`isPositiveNumber`: a number, and > 0) narrows to a branded
// type. A type predicate works both ways: `false` removes the predicate
// type from the input. With a plain `x is number`, `if (!isPositiveNumber(n))`
// typed `n: number` as `never`, though -1 lands there. A branded number is
// not a supertype of `number`, so the else branch keeps `number`, unions and
// literal unions, while the true branch is still a `number` (assign it,
// do arithmetic, pass it on). The brand is phantom: no runtime property, and
// `brand` is exported as a type only.
// - The brand is applied only where the else branch needs it (`Refined`
//   below): to input members that already are the base type (`number`,
//   a number literal, `string`, an `HTMLElement`). `unknown`, `any` and
//   other members (`{}`, `Element`) narrow to the plain base type, since
//   their else branch keeps them anyway. So `let i = x; i += 1` keeps
//   working after `isInteger(x)` on untyped input (dice3D-js dogfooding: a
//   brand there made `i += columnCount` an error).
// - The brand must be required: an optional one still sends literal unions
//   (`1 | -1`) to `never`.
// - Brands combine by key, so a value that passed several checks has all of
//   them (`PositiveNumber & Integer`), and a stronger check implies the
//   weaker ones: an Integer is a FiniteNumber, which is a NumberSafe.
declare const brand: unique symbol;
/** A phantom brand recording which nanotypes checks a value passed. No runtime value. */
type Brand<B extends string> = { readonly [brand]: { readonly [K in B]: true } };
// What a refinement guard narrows to, per union member of the input T:
// - a member that is already `Base` (`number`, `1 | -1`, a branded number):
//   `T & Brand<B>`, so it is not removed from the else branch;
// - `any`: `Base` (the else branch stays `any`); `unknown` and any other
//   member that may hold a `Base` (`{}`, `Element` for `HTMLElement`):
//   `Base`; members that cannot (`string` for `number`): dropped.
// Distributive, so a bounded type parameter narrows through its constraint;
// `Extract<Base, T>` keeps every branch assignable to T, as a type predicate
// requires.
type Refined<T, Base, B extends string> = T extends Base
  ? (0 extends 1 & T ? Extract<Base, T> : T & Brand<B>)
  : Extract<Base, T>;
/** A number that is not `NaN` (Infinity allowed): what `isNumberSafe` verified. */
export type NumberSafe = number & Brand<'numberSafe'>;
/** A number that is not `NaN` or +/-`Infinity`: what `isFiniteNumber` verified. */
export type FiniteNumber = number & Brand<'numberSafe' | 'finite'>;
/** An integer (so finite, not `NaN`): what `isInteger` verified. */
export type Integer = number & Brand<'numberSafe' | 'finite' | 'integer'>;
/** A number greater than 0 (Infinity allowed, `NaN` not): what `isPositiveNumber` verified. */
export type PositiveNumber = number & Brand<'numberSafe' | 'positive'>;
/** A number less than 0 (-Infinity allowed, `NaN` not): what `isNegativeNumber` verified. */
export type NegativeNumber = number & Brand<'numberSafe' | 'negative'>;
/** A string with at least one character: what `isNonEmptyString` verified. */
export type NonEmptyString = string & Brand<'nonEmpty'>;
/** An `HTMLElement` the platform reports as editable: what `isContentEditable` verified. */
export type ContentEditableElement = HTMLElement & Brand<'contentEditable'>;

// What isTruthy narrows to: `Exclude<T, Falsy>`, except that a member which
// can still be falsy at run time is branded instead of kept as is, so it
// stays in the else branch (`isTruthy(s)` with `s: string | null` used to
// leave only `null` there, though '' lands there too).
// - Falsy literals (false, 0, 0n, '', null, undefined) are dropped.
// - `string` narrows to `string & Brand<'nonEmpty'>` (a NonEmptyString);
//   `number` to `number & Brand<'numberSafe' | 'truthy'>` (not 0, not
//   `NaN`); `bigint` to `bigint & Brand<'truthy'>`. Branded numbers that may
//   be 0 (FiniteNumber, Integer, NumberSafe) are branded 'truthy' too;
//   PositiveNumber, NegativeNumber and NonEmptyString are always truthy and
//   are kept.
// - Truthy literals ('a', 5, true) and object types are kept.
// - `unknown` and `any` are unchanged from 0.3.x (`unknown`, `any`).
type AlwaysTruthy = Brand<'positive'> | Brand<'negative'> | Brand<'nonEmpty'> | Brand<'truthy'>;
type TruthyPart<T> = unknown extends T
  ? Exclude<T, Falsy>
  : T extends Falsy
    ? never
    : T extends string
      ? string extends T ? T & Brand<'nonEmpty'>
        : T extends AlwaysTruthy ? T
        : T extends Brand<string> ? T & Brand<'nonEmpty'>
        : T
      : T extends number
        ? number extends T ? T & Brand<'numberSafe' | 'truthy'>
          : T extends AlwaysTruthy ? T
          : T extends Brand<string> ? T & Brand<'numberSafe' | 'truthy'>
          : T
        : T extends bigint
          ? bigint extends T ? T & Brand<'truthy'> : T
          : T;

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

// What isFunc / isFunction / assertFunc narrow to (0.4.0, docs/DESIGN.md P6),
// shaped like ArrayPart. `typeof x === 'function'` is true for classes too:
// - Function members of a union (anything with a call or construct
//   signature) are kept as they are, class constructors included:
//   `typeof Widget | string` narrows to `typeof Widget`, with `string` in
//   the else branch. Before 0.4.0 a class member became a callable
//   intersection and stayed in the else branch.
// - Input with no function member (`object`, `{}`) narrows to
//   `T & ((...args: any[]) => any)`, as before.
// - `unknown` and `any` narrow to `(...args: any[]) => any`, as before: the
//   compiler's own `typeof` narrowing gives `Function`, which is not
//   assignable to a specific signature such as `(e: Event) => void`. The
//   else branch of `any` stays `any`.
type FunctionPart<T> = unknown extends T
  ? Extract<(...args: any[]) => any, T>
  : [Extract<T, Function>] extends [never]
    ? T & ((...args: any[]) => any)
    : Extract<T, Function>;

// What isObject / isObj and isObjectLoose / isObjectLike narrow to (0.4.0,
// docs/DESIGN.md P5). Both were `x is object`, but `object` includes
// functions (both guards return false) and arrays (isObject returns false),
// so the else branch lost members the value can still be:
// `string[] | string` had `string` there, though an array lands there.
// - Per union member: arrays (isObject only) and functions, class
//   constructors included, are dropped; so are primitives (branded ones
//   too); object types are kept as they are.
// - Members that may or may not be objects (`{}`, `unknown`) narrow to
//   `T & object`, so `unknown` narrows to `object`.
// - `any` narrows to `object` and keeps `any` in the else branch (the
//   ArrayPart lesson: a predicate type of `any` makes the else branch
//   `never`). It is caught inside each branch, because the type is
//   distributive at the top: that lets a bounded type parameter
//   (`<T extends Entry | string>`) resolve through its constraint, where a
//   top-level `unknown extends T` check would leave it unresolved.
// - Remaining imprecision: an input typed plain `object` narrows to `object`
//   with a `never` else branch, as before (arrays and functions cannot be
//   subtracted from `object`).
type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type ObjectPart<T> = T extends Function | readonly unknown[]
  ? never
  : ObjectLoosePart<T>;
type ObjectLoosePart<T> = T extends Function
  ? never
  : T extends Primitive
    ? never
    : T extends object
      ? (0 extends 1 & T ? Extract<object, T> : T)
      : 0 extends 1 & T
        ? Extract<object, T>
        : T & object;

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
/**
 * A number that is not `NaN` (Infinity is allowed). Not about safe integers:
 * use `Number.isSafeInteger` for that, or `isFiniteNumber` to exclude Infinity.
 * An input typed `number` narrows to the branded `NumberSafe` (still a
 * `number`), so the else branch keeps `number`: `NaN` lands there.
 * `unknown` / `any` narrow to plain `number`.
 */
export function isNumberSafe<T>(x: T): x is Refined<T, number, 'numberSafe'>;
export function isBoolean(x: unknown): x is boolean;
export function isBool(x: unknown): x is boolean;
export function isBigint(x: unknown): x is bigint;
export function isBigi(x: unknown): x is bigint;
export function isSymbol(x: unknown): x is symbol;
export function isSym(x: unknown): x is symbol;
export function isUndefined(x: unknown): x is undefined;
export function isUndef(x: unknown): x is undefined;
/**
 * `typeof x === 'function'`, classes included. Other libraries call this
 * `isFunction` (also exported). Union members that are classes or functions
 * are kept as they are; `unknown` narrows to `(...args: any[]) => any`.
 */
export function isFunc<T>(x: T): x is FunctionPart<T>;
/** Same function as `isFunc`, under the name lodash and every other surveyed library use. */
export function isFunction<T>(x: T): x is FunctionPart<T>;

// --- manual / structural guards ---
/**
 * `Array.isArray`, other realms included. False for a revoked proxy (its
 * array-ness cannot be verified) instead of throwing.
 */
export function isArray<T>(x: T): x is ArrayPart<T>;
export function isArr<T>(x: T): x is ArrayPart<T>;
// Null checks. `isNull` and `isNil` are strictly `null` (`x === null`).
// Coming from lodash/Ramda, where `isNil` means null OR undefined? Use
// `isNullish` for that.
/**
 * True when `x` is neither `null` nor `undefined` (`x != null`). Not
 * remeda's or ts-extras' `isDefined` (`x !== undefined`, so `null` passes there).
 */
export function isDefined<T>(x: T | null | undefined): x is T;
/**
 * Same function as `isDefined`: neither `null` nor `undefined` (`x != null`),
 * under remeda's name (es-toolkit: `isNotNil`; ts-extras: `isPresent`). The
 * name that can't be misread: remeda's and ts-extras' `isDefined` is
 * `x !== undefined`, so `null` passes there.
 */
export function isNonNullish<T>(x: T | null | undefined): x is T;
/** True when `x` is `null` or `undefined` (`x == null`). This is lodash's `isNil`. */
export function isNullish(x: unknown): x is null | undefined;
/** True only when `x` is `null` (`x === null`); `undefined` is false. */
export function isNull(x: unknown): x is null;
/**
 * @deprecated Use `isNull` (same function), or `isNullish` if you meant
 * lodash's `isNil` (null or undefined). True only when `x` is `null`
 * (`x === null`); `undefined` is false, unlike lodash, Ramda and es-toolkit.
 * Kept as an alias; the name will never take the lodash meaning.
 */
export function isNil(x: unknown): x is null;
/**
 * A non-null `typeof "object"` value that is verifiably not an array: object
 * literals, class instances, null-prototype objects, boxed primitives, Date,
 * Map, DOM nodes. Functions and arrays are false. Not lodash's `isObject`
 * (which includes both): for any non-null object including arrays use
 * `isObjectLike` / `isObjectLoose`. A revoked proxy is false, since
 * "not an array" cannot be verified (0.3.1). Never throws, reads no property.
 * Narrows union members (0.4.0): arrays and functions stay in the else
 * branch (`string[] | string` keeps both there); `unknown` narrows to `object`.
 */
export function isObject<T>(x: T): x is ObjectPart<T>;
/** Same function as `isObject` (not lodash's `isObject`). */
export function isObj<T>(x: T): x is ObjectPart<T>;
/**
 * @deprecated Use `isPlainObject`, which decides by prototype and runs none
 * of the value's code. This one reads `Symbol.toStringTag` (a getter or a
 * proxy `get` trap runs), so its answer is whatever that code returns.
 * Migrating changes answers for: class instances and another realm's `{}`
 * (true here, false for `isPlainObject`); `Math`, `JSON`, `arguments` and
 * other tagged objects with a plain prototype (false here, true there).
 * Kept, unchanged: `Object.prototype.toString.call(x) === '[object Object]'`;
 * never throws.
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
/**
 * Any non-null `typeof "object"` value, arrays included, functions excluded:
 * lodash's `isObjectLike` (also exported under that name). A revoked proxy
 * is true (`typeof` still answers). Narrows union members (0.4.0): functions
 * and classes stay in the else branch; `unknown` narrows to `object`.
 */
export function isObjectLoose<T>(x: T): x is ObjectLoosePart<T>;
/**
 * Same function as `isObjectLoose`, under the name lodash, es-toolkit and
 * ramda-adjunct use: any non-null `typeof "object"` value, arrays included,
 * functions excluded (`_.isObjectLike`). A revoked proxy is true.
 */
export function isObjectLike<T>(x: T): x is ObjectLoosePart<T>;
/**
 * An `HTMLElement` (this realm's) that the platform says is editable: calls
 * the `isContentEditable` getter of `HTMLElement.prototype` on `x` (0.4.0),
 * so nothing `x` defines answers (own property, subclass getter, proxy `get`
 * trap). False for a proxy, a fake element whose class lacks that getter
 * (jsdom does not implement it), and outside browsers. Never throws.
 */
export function isContentEditable<T>(x: T): x is Refined<T, HTMLElement, 'contentEditable'>;

// --- derived ---
// The refinement guards below (0.4.0, `Refined`): an input already typed
// with the base type (`number`, `string`, `HTMLElement`, or a union holding
// it) narrows to a branded type, so the else branch keeps that type instead
// of `never`; the true branch is still a `number` / `string` /
// `HTMLElement`. `unknown` and `any` narrow to the plain base type. Asserts
// keep the plain types.
/**
 * `!!x`. Drops falsy literal types; `string` narrows to `NonEmptyString` and
 * `number` to a branded non-zero number, so `''`, `0` and `NaN` keep their
 * type in the else branch. `unknown` narrows to `unknown`, `any` to `any`.
 */
export function isTruthy<T>(x: T): x is TruthyPart<T>;
/**
 * `!x`. The type is narrower than the check, and no exact type exists:
 * `NaN` and `document.all` are falsy but not in `Falsy`, so `isFalsy(n)` with
 * `n: number` types `n` as `0` though `NaN` lands there.
 */
export function isFalsy(x: unknown): x is Falsy;
export function isEmptyString(x: unknown): x is '';
/** A string with at least one character. A `string` input narrows to the branded `NonEmptyString`; `unknown` / `any` to `string`. */
export function isNonEmptyString<T>(x: T): x is Refined<T, string, 'nonEmpty'>;
/** A number > 0, not `NaN` (Infinity allowed). A `number` input narrows to the branded `PositiveNumber`; `unknown` / `any` to `number`. */
export function isPositiveNumber<T>(x: T): x is Refined<T, number, 'numberSafe' | 'positive'>;
/** A number < 0, not `NaN` (-Infinity allowed). A `number` input narrows to the branded `NegativeNumber`; `unknown` / `any` to `number`. */
export function isNegativeNumber<T>(x: T): x is Refined<T, number, 'numberSafe' | 'negative'>;
/** `Number.isInteger` (no coercion). A `number` input narrows to the branded `Integer` (also a `FiniteNumber`); `unknown` / `any` to `number`. */
export function isInteger<T>(x: T): x is Refined<T, number, 'numberSafe' | 'finite' | 'integer'>;
/**
 * A number that is not `NaN` or +/-`Infinity` (`Number.isFinite`; no
 * coercion). A `number` input narrows to the branded `FiniteNumber`, so
 * `if (!isFiniteNumber(n))` keeps `n: number` (it was `never` before 0.4.0);
 * `unknown` / `any` narrow to plain `number`.
 */
export function isFiniteNumber<T>(x: T): x is Refined<T, number, 'numberSafe' | 'finite'>;
/**
 * @deprecated Use `isFiniteNumber`. Same function: `Number.isFinite`, no
 * coercion. As a named import it shadows the global `isFinite`, which
 * coerces (`isFinite('1')` is true; this returns false).
 */
export function isFinite<T>(x: T): x is Refined<T, number, 'numberSafe' | 'finite'>;

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
export function assertFunc<T>(x: T): asserts x is FunctionPart<T>;
/** Same function as `assertFunc` (message "Expected function"). */
export function assertFunction<T>(x: T): asserts x is FunctionPart<T>;

export function assertArray<T>(x: T): asserts x is ArrayPart<T>;
export function assertArr<T>(x: T): asserts x is ArrayPart<T>;
/** Throws `TypeError` when `x` is `null` or `undefined`. */
export function assertDefined<T>(x: T | null | undefined): asserts x is T;
/** Same function as `assertDefined` (remeda's `isNonNullish` name; message "Expected defined"). */
export function assertNonNullish<T>(x: T | null | undefined): asserts x is T;
/** Throws `TypeError` unless `x` is `null` or `undefined` (lodash's `isNil`). */
export function assertNullish(x: unknown): asserts x is null | undefined;
/** Throws `TypeError` unless `x` is `null`; `undefined` throws. */
export function assertNull(x: unknown): asserts x is null;
/**
 * @deprecated Use `assertNull` (same check), or `assertNullish` for lodash's
 * `isNil` meaning (null or undefined). Throws `TypeError` unless `x` is
 * `null`; `undefined` throws. Message "Expected nil".
 */
export function assertNil(x: unknown): asserts x is null;
export function assertObject<T>(x: T): asserts x is ObjectPart<T>;
export function assertObj<T>(x: T): asserts x is ObjectPart<T>;
/**
 * @deprecated Use `assertPlainObject` (see `isObjectStrict` for how the
 * answers differ). Kept, unchanged; message "Expected objectStrict".
 */
export function assertObjectStrict(x: unknown): asserts x is Record<string, unknown>;
export function assertPlainObject(x: unknown): asserts x is Record<string, unknown>;
export function assertPojo(x: unknown): asserts x is Record<string, unknown>;
export function assertObjectLoose<T>(x: T): asserts x is ObjectLoosePart<T>;
/** Same function as `assertObjectLoose` (lodash's `isObjectLike` name; message "Expected objectLoose"). */
export function assertObjectLike<T>(x: T): asserts x is ObjectLoosePart<T>;
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
  /** `typeof x === 'function'`, classes included. */
  func<T>(x: T): x is FunctionPart<T>;
  /** Same function as `is.func`. */
  function<T>(x: T): x is FunctionPart<T>;
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

  /**
   * A number that is not `NaN` (Infinity is allowed). Not about safe integers:
   * use `Number.isSafeInteger` for that, or `isFiniteNumber` to exclude Infinity.
   */
  numberSafe<T>(x: T): x is Refined<T, number, 'numberSafe'>;
  array<T>(x: T): x is ArrayPart<T>;
  /** Neither `null` nor `undefined` (`x != null`). Not remeda's `isDefined` (`!== undefined`). */
  defined<T>(x: T | null | undefined): x is T;
  /** Same function as `is.defined` (`x != null`), under remeda's name. */
  nonNullish<T>(x: T | null | undefined): x is T;
  /** `null` or `undefined` (`x == null`). This is lodash's `isNil`. */
  nullish(x: unknown): x is null | undefined;
  /** Strictly `null` (`x === null`); `undefined` is false. */
  null(x: unknown): x is null;
  /**
   * @deprecated Use `is.null` (same function), or `is.nullish` for lodash's
   * `isNil` meaning. Strictly `null`; `undefined` is false.
   */
  nil(x: unknown): x is null;
  contentEditable<T>(x: T): x is Refined<T, HTMLElement, 'contentEditable'>;

  /**
   * A non-null `typeof "object"` value that is verifiably not an array: object
   * literals, class instances, null-prototype objects, boxed primitives, Date,
   * Map, DOM nodes. Functions and arrays are false. Not lodash's `isObject`
   * (which includes both): for any non-null object including arrays use
   * `isObjectLoose` (lodash's `isObjectLike`). A revoked proxy is false, since
   * "not an array" cannot be verified (0.3.1). Never throws, reads no property.
   */
  object<T>(x: T): x is ObjectPart<T>;
  /**
   * @deprecated Use `is.plainObject`, which runs none of the value's code (see
   * `isObjectStrict` for how the answers differ). Reads `Symbol.toStringTag`.
   */
  objectStrict(x: unknown): x is Record<string, unknown>;
  plainObject(x: unknown): x is Record<string, unknown>;
  pojo(x: unknown): x is Record<string, unknown>;
  /**
   * Any non-null `typeof "object"` value, arrays included, functions excluded:
   * lodash's `isObjectLike`. A revoked proxy is true (`typeof` still answers).
   */
  objectLoose<T>(x: T): x is ObjectLoosePart<T>;
  /** Same function as `is.objectLoose`: lodash's `isObjectLike` (arrays included, functions excluded). */
  objectLike<T>(x: T): x is ObjectLoosePart<T>;

  /** Same function as `is.object` (not lodash's `isObject`). */
  obj<T>(x: T): x is ObjectPart<T>;
  arr<T>(x: T): x is ArrayPart<T>;

  truthy<T>(x: T): x is TruthyPart<T>;
  falsy(x: unknown): x is Falsy;
  emptyString(x: unknown): x is '';
  nonEmptyString<T>(x: T): x is Refined<T, string, 'nonEmpty'>;
  positiveNumber<T>(x: T): x is Refined<T, number, 'numberSafe' | 'positive'>;
  negativeNumber<T>(x: T): x is Refined<T, number, 'numberSafe' | 'negative'>;
  integer<T>(x: T): x is Refined<T, number, 'numberSafe' | 'finite' | 'integer'>;
  finite<T>(x: T): x is Refined<T, number, 'numberSafe' | 'finite'>;
  finiteNumber<T>(x: T): x is Refined<T, number, 'numberSafe' | 'finite'>;
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
  func<T>(x: T): asserts x is FunctionPart<T>;
  /** Same function as `assertType.func`. */
  function<T>(x: T): asserts x is FunctionPart<T>;
  str(x: unknown): asserts x is string;
  num(x: unknown): asserts x is number;
  bool(x: unknown): asserts x is boolean;
  bigi(x: unknown): asserts x is bigint;
  sym(x: unknown): asserts x is symbol;
  undef(x: unknown): asserts x is undefined;

  array<T>(x: T): asserts x is ArrayPart<T>;
  arr<T>(x: T): asserts x is ArrayPart<T>;
  numberSafe(x: unknown): asserts x is number;
  object<T>(x: T): asserts x is ObjectPart<T>;
  obj<T>(x: T): asserts x is ObjectPart<T>;
  /** Throws unless `x` is neither `null` nor `undefined`. */
  defined<T>(x: T | null | undefined): asserts x is T;
  /** Same function as `assertType.defined` (remeda's `isNonNullish` name). */
  nonNullish<T>(x: T | null | undefined): asserts x is T;
  /** Throws unless `x` is `null` or `undefined` (lodash's `isNil`). */
  nullish(x: unknown): asserts x is null | undefined;
  /** Throws unless `x` is strictly `null`; `undefined` throws. */
  null(x: unknown): asserts x is null;
  /**
   * @deprecated Use `assertType.null` (same check), or `assertType.nullish`
   * for lodash's `isNil` meaning. Strictly `null`; `undefined` throws.
   */
  nil(x: unknown): asserts x is null;
  contentEditable(x: unknown): asserts x is HTMLElement;

  /** @deprecated Use `assertType.plainObject` (see `isObjectStrict`). */
  objectStrict(x: unknown): asserts x is Record<string, unknown>;
  plainObject(x: unknown): asserts x is Record<string, unknown>;
  pojo(x: unknown): asserts x is Record<string, unknown>;
  objectLoose<T>(x: T): asserts x is ObjectLoosePart<T>;
  /** Same function as `assertType.objectLoose` (lodash's `isObjectLike` name). */
  objectLike<T>(x: T): asserts x is ObjectLoosePart<T>;

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

// =============================================================================
// Helper types
// =============================================================================
// Listing exports here turns off the implicit export of every top-level
// declaration in a declaration file, so the `brand` symbol is exported as a
// type only (importing it as a value is a compile error, since it does not
// exist at run time). The helper types stay exported, as they were
// (implicitly) before 0.4.0, so declaration emit in consumers can name them.
export type { brand, Brand, Refined, Falsy, Truthy, TruthyPart, ArrayPart, FunctionPart, ObjectPart, ObjectLoosePart };
