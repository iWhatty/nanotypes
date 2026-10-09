// ./test/types/objects.test.ts
//
// isObject / isObjectLoose / isObjectLike narrowing (0.4.0, docs/DESIGN.md
// P5), checked against the built dist/index.d.ts, strict and loose. The
// predicates were `x is object`, which includes functions (both guards
// return false for them) and arrays (isObject returns false). Now
// `ObjectPart<T>` / `ObjectLoosePart<T>` keep exactly the union members the
// check can accept:
// - `string[] | string`: an array lands in the else branch of isObject;
// - `(() => void) | Map<K, V>`: the function lands in the else branch;
// - `unknown` narrows to `object`; `any` to `object`, with `any` in the
//   else branch (the ArrayPart lesson: never `never`);
// - a bounded type parameter narrows through its constraint.
// Remaining imprecision (documented): an input typed plain `object` has a
// `never` else branch, since TypeScript cannot subtract arrays or functions
// from `object`.
import {
  assertObj,
  assertObject,
  assertObjectLike,
  assertObjectLoose,
  assertType,
  is,
  isObj,
  isObject,
  isObjectLike,
  isObjectLoose,
  type NonEmptyString,
} from '../../dist/index.js';

type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false;
const expectType = <T extends true>() => {};
type StrictNulls = null extends string ? false : true;
type IfStrict<S, L> = StrictNulls extends true ? S : L;

class Widget { size = 1; }
type Entry = { key: string };

// --- arrays leave isObject's true branch and stay in its else branch ---
declare const listOrText: string[] | string;
if (isObject(listOrText)) expectType<Equal<typeof listOrText, never>>();
else expectType<Equal<typeof listOrText, string[] | string>>();

declare const recordOrList: Record<string, unknown> | string[];
if (isObject(recordOrList)) expectType<Equal<typeof recordOrList, Record<string, unknown>>>();
else expectType<Equal<typeof recordOrList, string[]>>();
// isObjectLoose accepts arrays.
if (isObjectLoose(recordOrList)) expectType<Equal<typeof recordOrList, Record<string, unknown> | string[]>>();

declare const readonlyOrSet: readonly Entry[] | Set<Entry>;
if (isObject(readonlyOrSet)) expectType<Equal<typeof readonlyOrSet, Set<Entry>>>();
else expectType<Equal<typeof readonlyOrSet, readonly Entry[]>>();

declare const tupleOrEntry: [1, 2] | Entry;
if (isObj(tupleOrEntry)) expectType<Equal<typeof tupleOrEntry, Entry>>();
else expectType<Equal<typeof tupleOrEntry, [1, 2]>>();

// --- functions and classes leave both true branches ---
declare const fnOrMap: (() => void) | Map<string, number>;
if (isObject(fnOrMap)) expectType<Equal<typeof fnOrMap, Map<string, number>>>();
else expectType<Equal<typeof fnOrMap, () => void>>();
declare const fnOrMap2: (() => void) | Map<string, number>;
if (isObjectLoose(fnOrMap2)) expectType<Equal<typeof fnOrMap2, Map<string, number>>>();
else expectType<Equal<typeof fnOrMap2, () => void>>();
declare const ctorOrMap: typeof Widget | Map<string, number>;
if (isObjectLike(ctorOrMap)) expectType<Equal<typeof ctorOrMap, Map<string, number>>>();
else expectType<Equal<typeof ctorOrMap, typeof Widget>>();

// --- primitives, null, and branded primitives leave the true branch ---
declare const entryOrText: Entry | string | null;
if (isObject(entryOrText)) expectType<Equal<typeof entryOrText, Entry>>();
else expectType<Equal<typeof entryOrText, IfStrict<string | null, string>>>();
declare const labelOrEntry: NonEmptyString | Entry;
if (isObject(labelOrEntry)) expectType<Equal<typeof labelOrEntry, Entry>>();
else expectType<Equal<typeof labelOrEntry, NonEmptyString>>();

// --- unknown and any ---
declare const u1: unknown;
if (isObject(u1)) expectType<Equal<typeof u1, object>>();
declare const u2: unknown;
if (isObjectLoose(u2)) expectType<Equal<typeof u2, object>>();
declare const a1: any;
if (isObject(a1)) expectType<Equal<typeof a1, object>>();
else expectType<Equal<typeof a1, any>>();
declare const a2: any;
if (isObjectLoose(a2)) expectType<Equal<typeof a2, object>>();
else expectType<Equal<typeof a2, any>>();
// Untyped JS: an early return keeps the rest usable.
declare const preset: any;
if (!isObject(preset)) throw new Error('not a record');
const presetObject: object = preset;
void presetObject;

// --- `object` and `{}` inputs ---
declare const o1: object;
if (isObject(o1)) expectType<Equal<typeof o1, object>>();
declare const e1: {};
if (isObject(e1)) { const o: object = e1; void o; } else { const k: {} = e1; void k; }

// --- type parameters ---
function bounded<T extends Entry | string>(x: T): Entry | null {
  if (isObject(x)) { const t: T = x; void t; return x; }
  return null;
}
function boundedLoose<T extends Entry | (() => void)>(x: T): Entry | null {
  return isObjectLoose(x) ? x : null;
}
function free<T>(x: T): object | null {
  if (isObject(x)) { const t: T = x; void t; return x; }
  return null;
}
function inUnion<T extends Entry>(x: T | string): T | null {
  return isObject(x) ? x : null;
}
void bounded; void boundedLoose; void free; void inUnion;

// --- every surface narrows the same way ---
declare const n1: Entry | string[];
if (is.object(n1)) expectType<Equal<typeof n1, Entry>>();
declare const n2: Entry | string[];
if (is.obj(n2)) expectType<Equal<typeof n2, Entry>>();
declare const n3: Entry | (() => void);
if (is.objectLoose(n3)) expectType<Equal<typeof n3, Entry>>();
declare const n4: Entry | (() => void);
if (is.objectLike(n4)) expectType<Equal<typeof n4, Entry>>();
expectType<Equal<typeof isObj, typeof isObject>>();
expectType<Equal<typeof isObjectLike, typeof isObjectLoose>>();

declare const s1: Entry | string[];
assertObject(s1);
expectType<Equal<typeof s1, Entry>>();
declare const s2: Entry | string[];
assertObj(s2);
expectType<Equal<typeof s2, Entry>>();
declare const s3: Entry | (() => void);
assertObjectLoose(s3);
expectType<Equal<typeof s3, Entry>>();
declare const s4: Entry | (() => void);
assertObjectLike(s4);
expectType<Equal<typeof s4, Entry>>();
declare const s5: unknown;
assertType.object(s5);
expectType<Equal<typeof s5, object>>();
declare const s6: Entry | string[];
assertType.obj(s6);
expectType<Equal<typeof s6, Entry>>();
declare const s7: Entry | (() => void);
assertType.objectLoose(s7);
expectType<Equal<typeof s7, Entry>>();
declare const s8: Entry | (() => void);
assertType.objectLike(s8);
expectType<Equal<typeof s8, Entry>>();
