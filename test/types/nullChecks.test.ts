// ./test/types/nullChecks.test.ts
//
// Type-level tests for the null-check family, checked against the built
// dist/index.d.ts in strict and loose mode (`npm run test:types`):
//   isNull / isNil   strictly null       (else branch keeps undefined)
//   isNullish        null or undefined   (lodash's isNil)
//   isDefined        neither
// Also checks that the namespaces, typed as interfaces since 0.2.5 so they
// can carry the `null` key, still narrow through their call signatures.
import {
  assertNil,
  assertNull,
  assertNullish,
  assertType,
  type AssertTypeNamespace,
  is,
  isDefined,
  isNil,
  isNull,
  isNullish,
  type IsNamespace,
} from '../../dist/index.js';

type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false;
const expectType = <T extends true>() => {};

// Without strictNullChecks, `string | null` is just `string`, and `unknown`
// keeps no `{} | undefined` split; the expectations below pick per mode.
type StrictNulls = null extends string ? false : true;
type IfStrict<S, L> = StrictNulls extends true ? S : L;

// isNull: the null member, and the else branch keeps everything else,
// undefined included (the difference from lodash's isNil).
declare const maybeText: string | null | undefined;
if (isNull(maybeText)) expectType<Equal<typeof maybeText, null>>();
else expectType<Equal<typeof maybeText, IfStrict<string | undefined, string>>>();

declare const textOrNull: string | null;
if (isNull(textOrNull)) expectType<Equal<typeof textOrNull, null>>();
else expectType<Equal<typeof textOrNull, string>>();

declare const unknownValue: unknown;
if (isNull(unknownValue)) expectType<Equal<typeof unknownValue, null>>();

// A negated check narrows the rest of the block.
declare const entry: { id: number } | null;
if (isNull(entry)) throw new Error('missing');
expectType<Equal<typeof entry, { id: number }>>();

// isNil narrows exactly like isNull.
declare const viaNil: string | null | undefined;
if (isNil(viaNil)) expectType<Equal<typeof viaNil, null>>();
else expectType<Equal<typeof viaNil, IfStrict<string | undefined, string>>>();

// isNullish takes both null and undefined; isDefined is its complement.
declare const viaNullish: string | null | undefined;
if (isNullish(viaNullish)) expectType<Equal<typeof viaNullish, IfStrict<null | undefined, null>>>();
else expectType<Equal<typeof viaNullish, string>>();

declare const viaDefined: string | null | undefined;
if (isDefined(viaDefined)) expectType<Equal<typeof viaDefined, string>>();

// Namespace forms: is.null and is.nil.
declare const viaNamespace: number | null | undefined;
if (is.null(viaNamespace)) expectType<Equal<typeof viaNamespace, null>>();
else expectType<Equal<typeof viaNamespace, IfStrict<number | undefined, number>>>();

declare const viaNamespaceNil: number | null;
if (is.nil(viaNamespaceNil)) expectType<Equal<typeof viaNamespaceNil, null>>();
else expectType<Equal<typeof viaNamespaceNil, number>>();

declare const viaNamespaceUnknown: unknown;
if (is.null(viaNamespaceUnknown)) expectType<Equal<typeof viaNamespaceUnknown, null>>();
// The else branch of `unknown` is the compiler's own narrowing, not ours:
// TypeScript 6 gives `{} | undefined` in strict mode, 5.x keeps `unknown`.
// Only check that it stays usable.
else void viaNamespaceUnknown;

// Assertion forms.
declare const assertedNull: unknown;
assertNull(assertedNull);
expectType<Equal<typeof assertedNull, null>>();

declare const assertedNil: string | null;
assertNil(assertedNil);
expectType<Equal<typeof assertedNil, null>>();

declare const assertedNullish: string | null | undefined;
assertNullish(assertedNullish);
expectType<Equal<typeof assertedNullish, IfStrict<null | undefined, null>>>();

declare const assertedNamespace: unknown;
assertType.null(assertedNamespace);
expectType<Equal<typeof assertedNamespace, null>>();

declare const assertedNamespaceNil: number | null;
assertType.nil(assertedNamespaceNil);
expectType<Equal<typeof assertedNamespaceNil, null>>();

// The interface-typed namespaces keep the generic instanceof call
// signatures and the other members.
declare const maybeDate: unknown;
if (is(maybeDate, Date)) expectType<Equal<typeof maybeDate, Date>>();
declare const maybeString: unknown;
if (is.string(maybeString)) expectType<Equal<typeof maybeString, string>>();
declare const assertedDate: unknown;
assertType(assertedDate, Date);
expectType<Equal<typeof assertedDate, Date>>();
declare const assertedString: unknown;
assertType.string(assertedString);
expectType<Equal<typeof assertedString, string>>();

// The namespace types are exported for consumers that pass them around.
const isRef: IsNamespace = is;
const assertRef: AssertTypeNamespace = assertType;
void isRef;
void assertRef;
