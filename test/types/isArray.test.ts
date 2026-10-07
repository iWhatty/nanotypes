// ./test/types/isArray.test.ts
//
// Type-level tests for the array guards, checked against the built
// dist/index.d.ts (what consumers install). Compiled with `tsc --noEmit`, in
// strict and loose mode, by `npm run test:types`; a wrong narrowing is a
// compile error.
import { assertArr, assertArray, assertType, is, isArr, isArray } from '../../dist/index.js';

type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false;
const expectType = <T extends true>() => {};

type Entry = { key: string };

// unknown narrows to unknown[] (no `any` leaks in).
declare const unknownValue: unknown;
if (isArray(unknownValue)) expectType<Equal<typeof unknownValue, unknown[]>>();

// A union with a ReadonlyArray keeps its element type (the 0.2.3 bug: the
// element became `unknown`), and the else branch keeps the other members.
declare const mapOrList: Map<string, Entry> | ReadonlyArray<Entry>;
if (isArray(mapOrList)) {
  const hit = mapOrList.find(entry => entry.key === 'a');
  expectType<Equal<typeof hit, Entry | undefined>>();
} else {
  expectType<Equal<typeof mapOrList, Map<string, Entry>>>();
}

// Mutable arrays, tuples, and several array members.
declare const listOrNumber: string[] | number;
if (isArray(listOrNumber)) expectType<Equal<typeof listOrNumber, string[]>>();
else expectType<Equal<typeof listOrNumber, number>>();

declare const pairOrNull: [1, 2] | null;
if (isArray(pairOrNull)) expectType<Equal<typeof pairOrNull, [1, 2]>>();

declare const mixed: string[] | ReadonlyArray<number> | Set<number>;
if (isArray(mixed)) expectType<Equal<typeof mixed, string[] | ReadonlyArray<number>>>();
else expectType<Equal<typeof mixed, Set<number>>>();

// object narrows to an array; any stays usable.
declare const someObject: object;
if (isArray(someObject)) someObject.length;
// any (untyped JS parameters) narrows to unknown[] like 0.2.3, and the else
// branch must stay any, not never.
declare const anything: any;
if (isArray(anything)) expectType<Equal<typeof anything, unknown[]>>();
else expectType<Equal<typeof anything, any>>();
declare const untypedPreset: any;
if (!untypedPreset || isArray(untypedPreset)) throw new Error('not a record');
untypedPreset.id;

// Shorthand and namespace forms narrow the same way.
declare const viaArr: Map<string, Entry> | ReadonlyArray<Entry>;
if (isArr(viaArr)) expectType<Equal<typeof viaArr, ReadonlyArray<Entry>>>();
declare const viaNamespace: Map<string, Entry> | ReadonlyArray<Entry>;
if (is.array(viaNamespace)) expectType<Equal<typeof viaNamespace, ReadonlyArray<Entry>>>();
declare const viaNamespaceArr: Map<string, Entry> | Entry[];
if (is.arr(viaNamespaceArr)) expectType<Equal<typeof viaNamespaceArr, Entry[]>>();

// Assertion forms.
declare const assertedUnknown: unknown;
assertArray(assertedUnknown);
expectType<Equal<typeof assertedUnknown, unknown[]>>();

declare const assertedUnion: Map<string, Entry> | Entry[];
assertArray(assertedUnion);
expectType<Equal<typeof assertedUnion, Entry[]>>();

declare const assertedShort: Set<number> | ReadonlyArray<number>;
assertArr(assertedShort);
expectType<Equal<typeof assertedShort, ReadonlyArray<number>>>();

declare const assertedNamespace: Map<string, Entry> | ReadonlyArray<Entry>;
assertType.array(assertedNamespace);
expectType<Equal<typeof assertedNamespace, ReadonlyArray<Entry>>>();
