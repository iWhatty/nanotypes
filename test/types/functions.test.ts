// ./test/types/functions.test.ts
//
// isFunc / isFunction (0.4.0, docs/DESIGN.md P6), checked against the built
// dist/index.d.ts in strict and loose mode:
// - isFunction is the same declaration as isFunc, on every surface.
// - Class constructors are functions (`isFunc(class {})` is true), so a
//   union member `typeof SomeClass` is kept in the true branch, not turned
//   into a callable intersection, and leaves the else branch.
// - `unknown` and `any` narrow to `(...args: any[]) => any`, as before
//   (TypeScript's own `typeof x === 'function'` gives `Function`, which is
//   not assignable to a specific signature; that would break callers that
//   pass the narrowed value on). The else branch of `any` stays `any`.
import {
  assertFunc,
  assertFunction,
  assertType,
  is,
  isFunc,
  isFunction,
} from '../../dist/index.js';

type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false;
const expectType = <T extends true>() => {};

// --- the alias ---
expectType<Equal<typeof isFunction, typeof isFunc>>();
expectType<Equal<typeof is.function, typeof is.func>>();
expectType<Equal<typeof assertFunction, typeof assertFunc>>();
expectType<Equal<typeof assertType.function, typeof assertType.func>>();

class Widget { size = 1; }
type AnyFn = (...args: any[]) => any;

// --- class constructors in a union ---
declare const ctorOrName: typeof Widget | string;
if (isFunc(ctorOrName)) {
  expectType<Equal<typeof ctorOrName, typeof Widget>>();
  const w = new ctorOrName();
  void w.size;
} else expectType<Equal<typeof ctorOrName, string>>();

declare const viaAlias: typeof Widget | number;
if (isFunction(viaAlias)) expectType<Equal<typeof viaAlias, typeof Widget>>();
else expectType<Equal<typeof viaAlias, number>>();

declare const viaNamespace: typeof Widget | null;
if (is.function(viaNamespace)) expectType<Equal<typeof viaNamespace, typeof Widget>>();
declare const viaFunc: typeof Widget | boolean;
if (is.func(viaFunc)) expectType<Equal<typeof viaFunc, typeof Widget>>();

// --- function members keep their signatures ---
declare const callbackOrCount: ((x: number) => string) | number;
if (isFunc(callbackOrCount)) expectType<Equal<typeof callbackOrCount, (x: number) => string>>();
else expectType<Equal<typeof callbackOrCount, number>>();

declare const handlers: ((e: Event) => void) | { handleEvent(e: Event): void };
if (isFunction(handlers)) expectType<Equal<typeof handlers, (e: Event) => void>>();
else expectType<Equal<typeof handlers, { handleEvent(e: Event): void }>>();

// --- unknown and any: callable, and assignable to a specific signature ---
declare const u: unknown;
if (isFunc(u)) {
  expectType<Equal<typeof u, AnyFn>>();
  u(1, 2);
  const listener: (e: Event) => void = u;
  void listener;
}
declare const a: any;
if (isFunction(a)) expectType<Equal<typeof a, AnyFn>>();
else expectType<Equal<typeof a, any>>();

// --- `object` input: still callable in the true branch ---
declare const someObject: object;
if (isFunc(someObject)) someObject();

// --- type parameters: a bounded one narrows through its constraint ---
type Callback = (n: number) => void;
function boundedFn<T extends Callback | string>(x: T): Callback | null {
  return isFunc(x) ? x : null;
}
function freeFn<T>(x: T): void {
  if (isFunction(x)) x();
}
void boundedFn; void freeFn;

// --- asserts ---
declare const assertedCtor: typeof Widget | string;
assertFunction(assertedCtor);
expectType<Equal<typeof assertedCtor, typeof Widget>>();
declare const assertedUnknown: unknown;
assertFunc(assertedUnknown);
expectType<Equal<typeof assertedUnknown, AnyFn>>();
declare const assertedNamespace: ((x: string) => void) | string[];
assertType.function(assertedNamespace);
expectType<Equal<typeof assertedNamespace, (x: string) => void>>();
