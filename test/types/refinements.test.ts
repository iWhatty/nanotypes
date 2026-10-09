// ./test/types/refinements.test.ts
//
// Refinement guards (0.4.0, docs/DESIGN.md P4): a guard that checks more
// than the type (`isPositiveNumber` is "a number, and > 0") narrows to a
// branded type, so its else branch keeps the input type instead of `never`
// (`-1` lands in the else branch of `isPositiveNumber(n)`). Checked against
// the built dist/index.d.ts, strict and loose, by `npm run test:types`:
// - else branches keep `number`, unions, literal unions, `unknown`, `any`;
// - true branches stay usable as `number` / `string` / `HTMLElement`
//   (assignment, arithmetic, Math, template literals, computed keys, calls);
// - the exported brand types relate as the checks do (an Integer is a
//   FiniteNumber, which is a NumberSafe);
// - asserts keep the plain type (no else branch, so no brand needed).
import {
  assertFiniteNumber,
  assertInteger,
  assertNonEmptyString,
  assertPositiveNumber,
  assertTruthy,
  assertType,
  is,
  isContentEditable,
  isFinite,
  isFiniteNumber,
  isInteger,
  isNegativeNumber,
  isNonEmptyString,
  isNumberSafe,
  isPositiveNumber,
  isTruthy,
  type ContentEditableElement,
  type FiniteNumber,
  type Integer,
  type NegativeNumber,
  type NonEmptyString,
  type NumberSafe,
  type PositiveNumber,
  brand,
  type ArrayPart,
  type Brand,
  type Falsy,
  type Truthy,
} from '../../dist/index.js';

type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false;
const expectType = <T extends true>() => {};
type StrictNulls = null extends string ? false : true;
type IfStrict<S, L> = StrictNulls extends true ? S : L;

const takesNumber = (n: number): number => n;
const takesString = (s: string): string => s;

// --- else branch of an input typed `number` keeps `number` (was `never`) ---
declare const n1: number;
if (isNumberSafe(n1)) takesNumber(n1); else expectType<Equal<typeof n1, number>>();
declare const n2: number;
if (isPositiveNumber(n2)) takesNumber(n2); else expectType<Equal<typeof n2, number>>();
declare const n3: number;
if (isNegativeNumber(n3)) takesNumber(n3); else expectType<Equal<typeof n3, number>>();
declare const n4: number;
if (isInteger(n4)) takesNumber(n4); else expectType<Equal<typeof n4, number>>();
declare const n5: number;
if (isFiniteNumber(n5)) takesNumber(n5); else expectType<Equal<typeof n5, number>>();
declare const n6: number;
if (isFinite(n6)) takesNumber(n6); else expectType<Equal<typeof n6, number>>();
declare const n7: number;
if (isTruthy(n7)) takesNumber(n7); else expectType<Equal<typeof n7, number>>();
declare const s1: string;
if (isNonEmptyString(s1)) takesString(s1); else expectType<Equal<typeof s1, string>>();
declare const s2: string;
if (isTruthy(s2)) takesString(s2); else expectType<Equal<typeof s2, string>>();
declare const el: HTMLElement;
if (isContentEditable(el)) el.focus(); else expectType<Equal<typeof el, HTMLElement>>();

// The negated form, the dice3D-js codemod case: the rest of the block keeps
// the input type.
function clamp(value: number): number {
  if (!isFiniteNumber(value)) {
    expectType<Equal<typeof value, number>>();
    return 0;
  }
  return Math.min(Math.max(value, 0), 1);
}
void clamp;

// --- namespace forms ---
declare const ns1: number;
if (is.numberSafe(ns1)) takesNumber(ns1); else expectType<Equal<typeof ns1, number>>();
declare const ns2: number;
if (is.positiveNumber(ns2)) takesNumber(ns2); else expectType<Equal<typeof ns2, number>>();
declare const ns3: number;
if (is.negativeNumber(ns3)) takesNumber(ns3); else expectType<Equal<typeof ns3, number>>();
declare const ns4: number;
if (is.integer(ns4)) takesNumber(ns4); else expectType<Equal<typeof ns4, number>>();
declare const ns5: number;
if (is.finiteNumber(ns5)) takesNumber(ns5); else expectType<Equal<typeof ns5, number>>();
declare const ns6: number;
if (is.finite(ns6)) takesNumber(ns6); else expectType<Equal<typeof ns6, number>>();
declare const ns7: string;
if (is.nonEmptyString(ns7)) takesString(ns7); else expectType<Equal<typeof ns7, string>>();
declare const ns8: number;
if (is.truthy(ns8)) takesNumber(ns8); else expectType<Equal<typeof ns8, number>>();
declare const ns9: HTMLElement;
if (is.contentEditable(ns9)) ns9.focus(); else expectType<Equal<typeof ns9, HTMLElement>>();

// --- unions and literal unions keep every member in the else branch ---
declare const u1: number | string;
if (isFiniteNumber(u1)) takesNumber(u1); else expectType<Equal<typeof u1, number | string>>();
declare const u2: 1 | -1;
if (isPositiveNumber(u2)) { const one: 1 | -1 = u2; void one; } else expectType<Equal<typeof u2, 1 | -1>>();
declare const u3: 0 | 1 | 2.5;
if (isInteger(u3)) { const k: 0 | 1 | 2.5 = u3; void k; } else expectType<Equal<typeof u3, 0 | 1 | 2.5>>();
declare const u4: 'a' | 'b';
if (isNonEmptyString(u4)) { const k: 'a' | 'b' = u4; void k; } else expectType<Equal<typeof u4, 'a' | 'b'>>();
declare const u5: HTMLElement | null;
if (isContentEditable(u5)) u5.focus(); else expectType<Equal<typeof u5, HTMLElement | null>>();
declare const u6: string | number;
if (isNonEmptyString(u6)) takesString(u6); else expectType<Equal<typeof u6, string | number>>();

// --- unknown: the true branch is usable as the plain type ---
declare const k1: unknown;
if (isFiniteNumber(k1)) {
  expectType<Equal<typeof k1, FiniteNumber>>();
  const plain: number = k1;
  const sum = k1 + 1;
  const max = Math.max(k1, 2);
  const text = `${k1}px`;
  const list: number[] = [k1, 1];
  const fixed = k1.toFixed(2);
  void plain; void sum; void max; void text; void list; void fixed;
}
declare const k2: unknown;
if (isNonEmptyString(k2)) {
  expectType<Equal<typeof k2, NonEmptyString>>();
  const plain: string = k2;
  const keyed = { [k2]: 1 };
  const upper = k2.toUpperCase();
  const record: Record<string, number> = {};
  record[k2] = 1;
  void plain; void keyed; void upper;
}
declare const k3: unknown;
if (isContentEditable(k3)) {
  expectType<Equal<typeof k3, ContentEditableElement>>();
  const plain: HTMLElement = k3;
  k3.focus();
  void plain;
}
declare const k4: unknown;
if (isNumberSafe(k4)) expectType<Equal<typeof k4, NumberSafe>>();
declare const k5: unknown;
if (isPositiveNumber(k5)) expectType<Equal<typeof k5, PositiveNumber>>();
declare const k6: unknown;
if (isNegativeNumber(k6)) expectType<Equal<typeof k6, NegativeNumber>>();
declare const k7: unknown;
if (isInteger(k7)) expectType<Equal<typeof k7, Integer>>();
// isTruthy on unknown narrows nothing, as before.
declare const k8: unknown;
if (isTruthy(k8)) expectType<Equal<typeof k8, unknown>>();

// --- any (untyped JS): the true branch is the brand, the else stays any ---
declare const a1: any;
if (isFiniteNumber(a1)) takesNumber(a1); else expectType<Equal<typeof a1, any>>();
declare const a2: any;
if (isNonEmptyString(a2)) takesString(a2); else expectType<Equal<typeof a2, any>>();
declare const a3: any;
if (isPositiveNumber(a3)) takesNumber(a3); else expectType<Equal<typeof a3, any>>();
// isTruthy keeps `any` in its true branch, as before.
declare const a4: any;
if (isTruthy(a4)) expectType<Equal<typeof a4, any>>();

// --- brands relate as the checks do ---
declare const both: unknown;
if (isPositiveNumber(both) && isInteger(both)) {
  const p: PositiveNumber = both;
  const i: Integer = both;
  const f: FiniteNumber = both;
  const s: NumberSafe = both;
  const plain: number = both;
  void p; void i; void f; void s; void plain;
}
declare const int: Integer;
const asFinite: FiniteNumber = int;
const asSafe: NumberSafe = int;
void asFinite; void asSafe;
// An Integer is always finite: nothing is left for the else branch.
if (isFiniteNumber(int)) expectType<Equal<typeof int, Integer>>(); else expectType<Equal<typeof int, never>>();
// A FiniteNumber may not be an integer: the else branch keeps it.
declare const fin: FiniteNumber;
if (isInteger(fin)) { const i: Integer = fin; void i; } else expectType<Equal<typeof fin, FiniteNumber>>();
// A plain number is not a brand: assigning one needs the guard.
// @ts-expect-error a number is not a PositiveNumber without the check
const unchecked: PositiveNumber = 5;
void unchecked;

// --- isTruthy keeps what can be falsy in the else branch ---
declare const t1: string | null;
if (isTruthy(t1)) { const s: string = t1; const ne: NonEmptyString = t1; void s; void ne; }
else expectType<Equal<typeof t1, IfStrict<string | null, string>>>();
declare const t2: 'a' | '' | 0 | 5;
if (isTruthy(t2)) expectType<Equal<typeof t2, 'a' | 5>>(); else expectType<Equal<typeof t2, '' | 0>>();
declare const t3: { id: number } | null;
if (isTruthy(t3)) expectType<Equal<typeof t3, { id: number }>>(); else expectType<Equal<typeof t3, IfStrict<null, never>>>();
declare const t4: number | boolean;
if (isTruthy(t4)) { const k: number | true = t4; void k; } else expectType<Equal<typeof t4, number | false>>();
declare const t5: PositiveNumber | 0;
if (isTruthy(t5)) expectType<Equal<typeof t5, PositiveNumber>>(); else expectType<Equal<typeof t5, 0>>();
declare const t6: FiniteNumber | 'x';
if (isTruthy(t6)) { const k: FiniteNumber | 'x' = t6; void k; } else expectType<Equal<typeof t6, FiniteNumber>>();
declare const t7: bigint;
if (isTruthy(t7)) { const k: bigint = t7; void k; } else expectType<Equal<typeof t7, bigint>>();

// --- the documented cost: a variable initialised from a narrowed value is
// branded, so reassigning a plain number needs an annotation ---
declare const w1: unknown;
if (isFiniteNumber(w1)) {
  let inferred = w1;
  // @ts-expect-error inferred is a FiniteNumber; 0 is a plain number
  inferred = 0;
  let annotated: number = w1;
  annotated = 0;
  const widened: number[] = [w1];
  widened.push(0);
  void inferred; void annotated;
}

// --- `brand` is a type only; the helper types stay exported ---
type BrandKey = typeof brand;
const brandKeyCheck: Equal<keyof NumberSafe extends infer K ? (BrandKey extends K ? true : false) : never, true> = true;
void brandKeyCheck;
// @ts-expect-error brand does not exist at run time
void brand;
type Helpers = [ArrayPart<string[] | number>, Brand<'positive'>, Falsy, Truthy<string | null>];
const helpersCheck: Helpers[0] = ['a'];
void helpersCheck;

// --- asserts keep the plain type ---
declare const as1: unknown;
assertPositiveNumber(as1);
expectType<Equal<typeof as1, number>>();
declare const as2: unknown;
assertFiniteNumber(as2);
expectType<Equal<typeof as2, number>>();
declare const as3: unknown;
assertInteger(as3);
expectType<Equal<typeof as3, number>>();
declare const as4: unknown;
assertNonEmptyString(as4);
expectType<Equal<typeof as4, string>>();
declare const as5: unknown;
assertType.positiveNumber(as5);
expectType<Equal<typeof as5, number>>();
declare const as6: string | null;
assertTruthy(as6);
expectType<Equal<typeof as6, string>>();
