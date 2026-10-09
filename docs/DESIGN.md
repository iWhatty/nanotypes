# nanotypes design notes

Status: working document, started 2026-10-08 for 0.3.1 (dice3D-js T-034:
`isObject` on a revoked proxy). Sections are filled in as the review goes.

Contents:

1. Ecosystem: how other libraries define the object family, null checks and
   finite numbers, and where nanotypes' names differ.
2. Principles: the rules every guard follows, and why.
3. Decision table: the object family over awkward values, measured.
4. Audit: every guard and assert against the principles.
5. Fixes in 0.3.1.
6. Proposals: breaking or debatable changes, for the product owner.

## 1. Ecosystem

(in progress)

## 2. Principles

Each rule comes with the reason for it. When a rule and a convenience
conflict, the rule wins; when two rules conflict, the conflict is written
down here and in the guard's JSDoc, never left to be discovered.

### 2.1 A guard's `true` is a verified claim

A guard returns `true` only when it has verified every part of what its
documented definition claims. If any part cannot be verified, it returns
`false`.

- **Why.** A guard sits in front of code that relies on its answer:
  `if (isObject(x)) read(x)`. A `true` that was guessed sends a value into
  code that was promised something else. A `false` that was "not sure" only
  sends the value down the rejecting path, which every caller already
  handles. So an unverifiable part has to resolve to `false`.
- **"Verified" means: the language answered without throwing.** A proxy is
  allowed to answer for itself through its traps (its `getPrototypeOf` trap
  *is* its prototype, per the spec), and nanotypes sees through a proxy
  only where the language does (`Array.isArray` sees the target). When the
  language's own answer is an exception, as `Array.isArray` on a revoked
  proxy is, that part is unverifiable.
- **The claim is the documented definition, not the English word.** `isMap`
  claims "instance of this realm's `Map`" (a prototype-chain check), not
  "has a `[[MapData]]` slot". That is why rule 2.7 (names) matters: a
  definition that drifts from what the name suggests must be documented at
  the point of use.
- **Refinement of the coordinator's draft: `false` means "not verified", not
  "verified not".** Guards are one-sided. The object family is therefore
  not a partition: `isArray(x) || isObject(x)` implies `isObjectLoose(x)`,
  but a revoked proxy is `isObjectLoose` and neither of the other two. Code
  must not read `!isObject(x)` as "x is an array or a primitive".
- **Composite guards are conjunctions of verified parts.**
  `isObject` = "non-null `typeof` object" (verifiable for every value) AND
  "not an array" (unverifiable for a revoked proxy). So `isObject(revoked)`
  is `false`, while `isObjectLoose(revoked)` is `true`: a revoked proxy is
  verifiably a non-null object, and nothing else about it is knowable.
- **Argument against the draft as written.** It folds "verified" and "runs
  no value code" into one rule. They conflict for `isObjectStrict`, whose
  definition is a value the object computes (`Symbol.toStringTag`): it
  cannot be verified without running the value's getter. The two are kept
  as separate rules (2.1 and 2.3) so the conflict is visible, and the
  resolution is a proposal (P2), not a silent exception.

### 2.2 Guards never throw; asserts throw only their own `TypeError`

- **Why.** Guards run on untrusted input, often in error handlers, logging,
  and validation of values that are already suspicious. A guard that throws
  turns "reject this value" into "crash here", with a foreign error type
  (a proxy's `TypeError: Cannot perform 'IsArray' on a proxy that has been
  revoked`) that the caller never expected. Asserts throw by design, but
  always `TypeError("Expected ..., got ...")`, so `catch` code can rely on
  the shape.

### 2.3 Guards never run the value's code

No getter, `Symbol.toStringTag`, `Symbol.toPrimitive`, `valueOf`,
`toString`, or `constructor` read on the value. The only code a guard may
cause to run is a proxy's `getPrototypeOf` trap, which `instanceof` and a
prototype check cannot avoid; its throw is caught.

- **Why.** A guard is a question, not an interaction.
  - Getters can have side effects (lazy loading, counters, logging), be slow,
    or throw.
  - A getter can answer differently on each read: the guard sees one value
    and the caller the next (time-of-check to time-of-use).
  - Hostile objects (prototype pollution, values from an untrusted realm or
    plugin) are exactly what guards are asked about.
  - Determinism: an AI agent or a reader can predict a guard's answer from
    the definition alone, without knowing what the value's code does.
- `typeof`, `===`, `Array.isArray` (no traps), `Number.isFinite` /
  `Number.isInteger` (no coercion), and `Object.getPrototypeOf` (only the
  `getPrototypeOf` trap) are the building blocks that satisfy this.
- Current documented exceptions: `isObjectStrict` (reads `Symbol.toStringTag`,
  see P2) and `isContentEditable` (reads `isContentEditable`, see P3).

### 2.4 Type predicates are exactly as wide as what `true` verifies

TypeScript reads `x is T` in both directions: `true` narrows to `T`, and
`false` *removes* `T` from `x`'s type. So a predicate must be neither wider
nor narrower than the runtime check.

- **Wider than the check** (`isObject(x): x is object`, while arrays and
  functions are `false`): the else branch removes types the value can still
  have. `x: string[] | string` with `!isObject(x)` is typed `string`, but an
  array lands there.
- **Narrower than the check, or a refinement of a type** (`isPositiveNumber(x):
  x is number`): for `x: number`, the else branch is `never`, though `-1`
  lands there. TypeScript 5.5 refuses to *infer* a predicate for exactly
  this shape (`x => typeof x === 'number' && x > 0`) for this reason (see
  section 1).
- **Asserts are exempt from the else-branch problem** (`asserts x is T` has
  no false branch), so `assertPositiveNumber(x): asserts x is number` is
  sound while the guard is not.
- When TypeScript cannot express the check exactly ("object, but not an
  array", for input typed `object`), choose the shape that keeps the union
  cases exact (filter union members, like `ArrayPart<T>` does for
  `isArray`) and document the remaining imprecision. See P4 and P5.

### 2.5 Tree-shakeable per-guard exports

Every guard is a top-level `export const isX = (x) => ...` (aliases are
identifier references); every assert is a top-level `export function`;
`guards.js` has no top-level side effects.

- **Why.** Size per guard is the product: `import { isObject }` should cost
  about 120 bytes, not the library. Three regressions came from breaking
  this: 0.2.1 (guards built by a factory), 0.2.2 (`wrap()` asserts, 2,230 B
  gz for two asserts), 0.3.0 (module-level `HAS_X` feature constants, about
  2.1 KB per single guard). `test/distSafety.js` bundles single-import
  consumers and enforces byte budgets.

### 2.6 Globals are looked up when the guard runs

Instanceof guards are `(x) => inst(x, globalThis.X)`.

- **Why.** The same build runs in Node, browsers, workers, and edge
  runtimes: a missing constructor gives `false`, not a `ReferenceError`. A
  global installed after import (jsdom, a polyfill) is seen. And there is
  no module-level feature-detection constant to defeat tree-shaking (2.5).

### 2.7 Names follow the ecosystem's meaning, or say loudly that they don't

- **Why.** Readers and AI agents pattern-match names from lodash,
  `@sindresorhus/is`, es-toolkit and remeda. When a name means something
  else here, the code still runs, and every call silently takes the other
  branch for the values where the meanings differ. `isNil` (null only here,
  null or undefined everywhere else) was the lesson: dice3D-js had 176 call
  sites written with the lodash reading in mind (dice3D-js T-028).
- **Corollaries.**
  - Never change the answer of an existing name. A different meaning gets a
    new name; the old one is deprecated and kept as an alias.
  - Document a divergence where it is read: JSDoc on the declaration in
    `index.d.ts` (editor hovers, agents reading types), then the README.
  - Prefer one obvious name per meaning; aliases exist for compatibility and
    for ecosystem names, not for variety.

### 2.8 Strict booleans, no coercion

Guards return `true` or `false`, never a truthy value. Numeric guards never
coerce (`isFiniteNumber('1')` is `false`, unlike the global `isFinite`).

- **Why.** A guard result is stored, compared, and serialized; `0` or `''`
  passed through as a "boolean" breaks `=== true` checks. Coercion runs the
  value's code (`valueOf`, rule 2.3) and answers a different question.

## 3. Decision table

Generated on 0.3.0 `src/` by a script that calls each guard on each value
(Node 24, the same script used by `test/guardSafety.js` style corpora).
`isObj` / `is.obj` / `is.object` are the same function as `isObject`;
`isPojo` / `is.pojo` / `is.plainObject` the same as `isPlainObject`.
"(runs getter)" means the guard ran the value's code. **Bold** cells change
under the principles; the column says how.

| value | `isObject` | `isObjectLoose` | `isObjectStrict` | `isPlainObject` | `isArray` |
|---|---|---|---|---|---|
| `{}` | true | true | true | true | false |
| `Object.create(null)` | true | true | true | true | false |
| `Object.create({})` | true | true | true | false | false |
| `[]` | false | true | false | false | true |
| `() => {}` | false | false | false | false | false |
| `class Foo {}` (the class) | false | false | false | false | false |
| `new Foo()` | true | true | true | false | false |
| `Math` | true | true | false | true | false |
| `JSON` | true | true | false | true | false |
| `arguments` | true | true | false | true | false |
| `new String('')` | true | true | false | false | false |
| `new Number(0)` | true | true | false | false | false |
| `Object(1n)` | true | true | false | false | false |
| `new Date()` | true | true | false | false | false |
| `new Map()` | true | true | false | false | false |
| DOM-like (`HTMLDivElement` tag on prototype) | true | true | false | false | false |
| vm `{}` (another realm) | true | true | true | false | false |
| vm `[]` (another realm) | false | true | false | false | true |
| `new Proxy({}, {})` | true | true | true | true | false |
| `new Proxy([], {})` | false | true | false | false | true |
| proxy of `{}`, every trap throws | true | true | false | false | false |
| proxy of `[]`, every trap throws | false | true | false | false | true |
| revoked proxy, `{}` target | **true -> false** (0.3.1) | true | false | false | false |
| revoked proxy, `[]` target | **true -> false** (0.3.1) | true | false | false | false |
| revoked proxy, function target | false | false | false | false | false |
| `{ get [Symbol.toStringTag]() }` (getter) | true | true | false **(runs getter; P2)** | true | false |
| `null` | false | false | false | false | false |
| `undefined` | false | false | false | false | false |
| `'str'` | false | false | false | false | false |

Notes on the table:

- **Revoked proxies.** `typeof` still works on a revoked proxy, so
  `isObjectLoose` (and `isFunc` for a function target) can verify their
  claim: `true`. Everything else about it is unknowable: `Array.isArray`
  throws, `Object.getPrototypeOf` throws, every property access throws. So
  every guard with a second part is `false`. Before 0.3.1, `isObject` was
  `true`, because it computed "not an array" as `!isArray(x)` and
  `isArray`'s unverifiable `false` turned into a claimed "not an array".
- **Proxy of `{}` whose traps all throw.** `isObject` is `true`:
  `Array.isArray` runs no trap and answers "not an array" for a live
  proxy. `isPlainObject` is `false`: its only question goes to the throwing
  `getPrototypeOf` trap.
- **`Math`, `JSON`, `arguments`** are plain by prototype (0.3.0's breaking
  change) but not `isObjectStrict` (their tag is not `Object`).
- **Cross-realm.** `isPlainObject` is false for another realm's `{}` (its
  prototype is that realm's `Object.prototype`); `isObjectStrict` is true.
  `isArray` sees across realms.

## 4. Audit

Every exported guard (93 named exports including aliases, the `is.*`
namespace, `/auto`'s `is.*`) and assert (93 named, `assertType.*`) against
section 2. Severity: **High** = a wrong runtime answer or a broken
guarantee the docs promise; **Medium** = a type that is wrong in one branch,
or a documented exception to a rule; **Low** = cosmetic, naming, or DEV-only.

### High

1. **`isObject` / `isObj` / `is.object` / `is.obj` (and `assertObject`,
   `assertObj`, `assertType.object`, `assertType.obj`) return `true` for a
   revoked proxy** (rule 2.1), with either target. The 0.3.0 CHANGELOG
   says they return `false`. Cause: `!isArray(x)`, where `isArray`'s
   `false` means "could not tell". The asserts accept a revoked proxy for
   the same reason. `test/guardSafety.js` checked "no throw, strict
   boolean" only, so it could not see a wrong value. **Fixed in 0.3.1.**

### Medium

2. **Refinement guards make the else branch `never`** (rule 2.4).
   `isNumberSafe`, `isPositiveNumber`, `isNegativeNumber`, `isInteger`,
   `isFiniteNumber` (and `isFinite`) are `x is number`; `isNonEmptyString`
   is `x is string`; `isContentEditable` is `x is HTMLElement`; `isTruthy<T>`
   is `x is Truthy<T>`, which is `number` for `T = number`. For an input
   already typed `number` (`string`, `HTMLElement`), `if (!isPositiveNumber(n))`
   types `n` as `never`, though `-1` lands there. Same for every namespace
   form. Verified with tsc 6.0.3 (scratch probe; reproduced in P4). dice3D-js
   documented the `isFiniteNumber` case in its `docs/nanotypes-codemod.md`.
   Types only. Proposal P4.
3. **`isObject` and `isObjectLoose` predicates are wider than the check**
   (rule 2.4). Both are `x is object`, but `object` includes functions (both
   guards return `false`) and arrays (`isObject` returns `false`). For
   `x: string[] | string`, the else branch of `isObject` is typed `string`;
   for `x: (() => void) | Map<K, V>`, the else branch of `isObjectLoose` is
   `never`. Types only. Proposal P5.
4. **`isObjectStrict` runs the value's code** (rule 2.3): it reads
   `Symbol.toStringTag` through `Object.prototype.toString`, so a tag getter
   runs and a proxy's `get` trap runs. Documented since 0.3.0; a throw is
   caught (rule 2.2 holds). It also cannot be "verified" in the sense of
   rule 2.1: its answer is whatever the getter returns this time.
   Proposal P2.
5. **`isContentEditable` runs the value's code** (rule 2.3): once `x` is an
   `instanceof HTMLElement`, it reads `x.isContentEditable`, which can be an
   own property, a subclass getter, or a proxy `get` trap. Documented; a
   throw is caught. Proposal P3.

### Low

6. **`describe.value` (used by every assert's message) reads
   `x.constructor`**, so a `constructor` getter runs while an assert builds
   its error. It never throws (0.3.0). Not a guard, so rule 2.3 does not
   strictly apply, but an assert is where hostile values end up. **Fixed in
   0.3.1:** the name comes from the prototype's own `constructor` data
   property; accessors are not called.
7. **The `is(value, Type)` namespace call (and `/auto`'s, and every
   scanner-added `/auto` guard) reads `value.constructor.name` for its DEV
   warning** on a mismatch: a getter on the value runs, in DEV only. This is
   why `test/guardSafety.js` exempted `/auto`'s scanner guards from the
   no-read rule. **Fixed in 0.3.1:** the warning uses `describe.value`.
8. **`isFalsy(x): x is Falsy` is narrower than the check**: `NaN` and
   `document.all` are falsy, but `Falsy` has no `NaN` type, so `isFalsy(n)`
   with `n: number` types `n` as `0`. Types only; no exact type exists.
   Mentioned in P4.
9. **`isFunc(x): x is (...args: any[]) => any`** does not narrow to a class
   (`typeof Foo` has no call signature), though `isFunc(Foo)` is `true`; the
   true branch becomes an intersection. TypeScript's own `typeof x ===
   'function'` narrows to `Function`. Types only. Mentioned in P6.
10. **Instanceof guards claim prototype-chain membership, not the internal
    slot.** `isMap(Object.create(Map.prototype))` is `true` though every
    `Map` method throws on it, and another realm's `Map` is `false`. This is
    the documented definition ("instance of `Map`"), so it is not a
    rule 2.1 violation, but the name suggests more. Node's `util.types.isMap`
    checks the slot (section 1). Proposal P7.
11. **Naming divergences** (rule 2.7): `isObject` excludes functions and
    arrays (lodash, `@sindresorhus/is`, es-toolkit, underscore include
    both); `isNil` is null-only (T-028; deprecation still pending);
    `isObjectLoose` is what the ecosystem calls `isObjectLike`; `isFunc`
    where everyone else says `isFunction`; `isNumberSafe` can be misread as
    `Number.isSafeInteger`. Proposals P1, P6, P8.

### Conforming (checked, no finding)

- `typeof` guards (`isString` ... `isUndefined`, `isFunc`), `isNull`,
  `isNil`, `isNullish`, `isDefined`, `isEmptyString`, `isNonEmptyString`,
  `isNumberSafe`, `isPositiveNumber`, `isNegativeNumber`, `isInteger`,
  `isFiniteNumber`: runtime conforms to 2.1-2.3 and 2.8 (no property reads,
  no coercion, `x.length` only on a primitive string). Type findings above.
- `isArray`: `false` on a revoked proxy (unverifiable), sees through live
  proxies like the language does; `ArrayPart<T>` predicate is exact for
  unions (0.2.4).
- `isPlainObject` / `isPojo`: one `getPrototypeOf`; `false` when it throws.
- Instanceof guards: call-time lookup, `false` on a missing constructor, a
  revoked proxy, or a throwing `getPrototypeOf` trap; only that trap runs.
- Generic `is(value, Type)` (named export): never throws, no DEV read.
- Asserts: each throws `TypeError("Expected <name>, got <describe>")`
  exactly when its guard is `false` (tested for the null family in
  `test/nullChecks.js` and for hostile values in `test/guardSafety.js`).

## 5. Fixes in 0.3.1

(in progress)

## 6. Proposals

(in progress)
