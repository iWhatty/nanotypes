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
   property and its own `name` data property, read by descriptor; a getter
   is not called.
7. **The `is(value, Type)` namespace call (and `/auto`'s, and every
   scanner-added `/auto` guard) reads `value.constructor.name` for its DEV
   warning** on a mismatch: a getter on the value runs, in DEV only. This is
   why `test/guardSafety.js` exempted `/auto`'s scanner guards from the
   no-read rule. **Fixed in 0.3.1:** the warning says `typeof value` (or
   `null`) and passes the value itself to `console.warn`, as before. Using
   `describe.value` there would have pulled `describe` into the `is`
   namespace bundle (+380 B minified) for a DEV-only message.
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

All three are bug fixes under section 2 and change no answer for an
ordinary value. Tests first: `test/guardSafety.js` was extended in its own
commit and failed on 0.3.0 (28 failures on `src/` with DEV off, 82 on
`dist/` with DEV on), then passed after the fix.

1. **`isObject` on a revoked proxy is `false`** (audit 1, dice3D-js T-034).
   `isObject` does its own `Array.isArray` inside `try`/`catch` instead of
   `!isArray(x)`. Same for `isObj`, `is.object`, `is.obj`, the `/auto`
   forms, and therefore `assertObject`, `assertObj`, `assertType.object`,
   `assertType.obj`, which now throw on a revoked proxy. `isObjectLoose`
   stays `true` (rule 2.1: `typeof` still answers). Single-guard bundle
   118 -> 114 B minified.
   - Failing on 0.3.0, for example:
     `FAIL [src] isObject(revoked array proxy) is true, expected false`,
     `FAIL [src] assertType.obj(revoked proxy) should throw a TypeError`,
     `FAIL [src] isObject(revoked proxy, [] target) is true, expected false (decision table)`.
2. **`describe.value` runs no code on the value** (audit 6). Every assert
   message goes through it. The name now comes from the prototype's own
   `constructor` data property and that constructor's own `name` data
   property, read by descriptor. Same output for ordinary values, class
   instances, `Object.create(Map.prototype)`, and other realms' objects.
   Differences: only the nearest prototype is consulted, and never through
   a getter (`{ get constructor() {...} }` describes as `Object` without
   running the getter; `Object.create(Object.create(Map.prototype))`
   describes as `Object`, not `Map`). Cost: about +90 B minified (+35 to
   +45 B gz) per assert-using bundle (`assertObject` 658 -> 745 B min,
   387 -> 421 B gz), under the 900 B budget. A version that walked the
   prototype chain to keep the old `Map` answer cost +180 B and was dropped.
   - Failing on 0.3.0: `FAIL [src] describe.value ran a constructor getter on the value`.
3. **The DEV mismatch warning of `is(x, C)` reads no property of the
   value** (audit 7). Default and `/auto` namespaces, and every
   scanner-added `/auto` guard, which forwards to it. The message says
   `got <typeof>` (or `null`) and still passes the value to `console.warn`.
   The `is` namespace bundle: 4,840 -> 4,885 B min (1,873 -> 1,876 B gz).
   - Failing on 0.3.0 `dist/` (DEV on): `FAIL [dist] is(x, Map) read
     constructor from the value`, and the same for 51 `/auto` scanner
     guards (these were exempted from the no-read check before).

The test changes that pin this (all in `test/guardSafety.js`, run on `src/`
by `smokeTest.js` and on `dist/` by `distSafety.js`):

- Exact values, not only "no throw": all 276 guard forms x 10 hostile
  values (revoked proxies with object, array and function targets, proxies
  with throwing traps, throwing getters and conversions, a null-prototype
  object) = 2,760 exact answers, from a table of which guards can verify
  their claim on which value.
- Every assert form (328: named, `assertType.*`, `/auto`) throws a
  `TypeError` exactly when its guard is `false` on each hostile value.
- The section 3 decision table, 28 rows x 5 guards, plus identity checks
  that every alias and namespace form is the same function.
- The no-read rule covers `/auto`'s scanner guards and the generic
  `is(x, C)` of both namespaces, with DEV warnings on (the `dist/` run
  reports whether DEV was exercised).

Also in 0.3.1, documentation only: JSDoc on the object family and the
divergent names in `index.d.ts` (rule 2.7), the README "Which guard do I
want?" guide, and this document.

Sizes measured with esbuild, bundle + minify, ESM, platform neutral; gz is
gzip level 9.

## 6. Proposals

Not implemented: each is breaking or debatable. Each has a recommendation;
the product owner decides. "Breaking" means a consumer can see a
different runtime answer or a new type error.

### P1. `isObject` means something else in the ecosystem

Section 1: lodash, underscore, es-toolkit and `@sindresorhus/is` call
"non-null object or function" `isObject`; nanotypes' `isObject` excludes
functions and arrays. The ecosystem calls nanotypes' `isObjectLoose`
`isObjectLike`.

- (a) Keep the names, document the difference everywhere it is read
  (done in 0.3.1: JSDoc, README guide, this file).
- (b) Add `isObjectLike` (and `assertObjectLike`, `is.objectLike`) as an
  alias of `isObjectLoose`, documented as the preferred name. Non-breaking;
  costs nothing when tree-shaken; makes lodash vocabulary work.
- (c) Give `isObject` the lodash meaning. Breaking in the worst way (rule
  2.7): `isObject(fn)` and `isObject([])` flip from `false` to `true` with
  no error, the `isNil` trap again.
- (d) Deprecate `isObject` in favour of an unambiguous name such as
  `isNonArrayObject`. Non-breaking, but every caller gets a strikethrough
  for a name that is not wrong, only different.

**Recommendation: (a) now, (b) in 0.4.0; never (c).** Keep `isObjectLoose`
as a permanent alias. (d) is not worth the churn: unlike `isNil`,
nanotypes' `isObject` gives the *narrower* answer, so a lodash reader's
mistake fails closed (rejects a function or array they expected to pass)
rather than letting an unexpected value through.

### P2. `isObjectStrict` cannot verify its claim without running the value's code

Its definition is `Object.prototype.toString` tag `"Object"`, which reads
`Symbol.toStringTag` (a getter, or a proxy `get` trap, runs). Rules 2.1
and 2.3 cannot both hold for it.

- (a) Keep as the documented exception (status quo).
- (b) Redefine without running code: walk the prototype chain with
  `Object.getOwnPropertyDescriptor(o, Symbol.toStringTag)`; a data property
  decides, an accessor returns `false` (unverifiable), none found falls
  back to the built-in tag. Changes answers only for objects with a tag
  getter (they become `false`; most already are), but costs bytes and runs
  `getOwnPropertyDescriptor` traps on proxies.
- (c) Deprecate in favour of `isPlainObject` (JSDoc `@deprecated`, keeps
  working). Its two real uses are "plain object" (better served by
  `isPlainObject`, which never runs code) and "plain object from another
  realm" (no guard serves that today).

**Recommendation: (c) in 0.4.0**, plus, if a cross-realm plain check is
wanted, a new guard defined by prototype shape (the prototype's prototype
is `null` and the prototype's own `constructor` data property is named
`Object`), which needs no getter.

### P3. `isContentEditable` reads a getter on the value

It reads `x.isContentEditable`, so an own property, a subclass getter, or
a proxy `get` trap answers.

- Proposed: call the platform getter directly,
  `Object.getOwnPropertyDescriptor(HTMLElement.prototype,
  'isContentEditable').get.call(x)`, inside the existing try/catch. The
  platform getter brand-checks `x` (a proxy or a fake element throws
  "Illegal invocation", so `false`), and nothing the value defines runs.
- Breaking for: objects that shadow `isContentEditable`, and test fakes
  (`class HTMLElement {}` with an own `isContentEditable = true`, which the
  current `test/guardSafety.js` uses) now get `false` unless the fake
  defines the getter on its prototype. (UNVERIFIED here, no browser run:
  whether jsdom implements `isContentEditable`; if it does not, jsdom users
  get `false` either way.)

**Recommendation: do it in 0.4.0** with a CHANGELOG note for test fakes.

### P4. Refinement guards make the else branch `never` (types)

`isNumberSafe`, `isPositiveNumber`, `isNegativeNumber`, `isInteger`,
`isFiniteNumber`/`isFinite` (`x is number`), `isNonEmptyString`
(`x is string`), `isContentEditable` (`x is HTMLElement`), `isTruthy`
(`x is Truthy<T>`), and every namespace form. Reproduction (TypeScript
6.0.3 and 5.0.4):

```ts
declare const n: number;
if (isPositiveNumber(n)) { /* number */ } else { n; /* never, though -1 lands here */ }
```

Options, all probed with tsc 6.0.3 and 5.0.4:

- (a) A required phantom brand: `x is number & { readonly [refined]: 'positive' }`
  (`refined` a `declare const ... : unique symbol`). Else branches keep
  `number`, `number | string`, literal unions (`1 | -1`) and `unknown`;
  the true branch is still usable as `number` / `string` everywhere
  (arithmetic, `Math.max`, template literals, computed keys). An
  *optional* brand (`[refined]?:`) is not enough: literal unions still go
  to `never`.
- (b) Overloads `(x: number): boolean; (x: unknown): x is number`. Fixes a
  `number` input, but `number | string` still loses `number` in the else
  branch.
- (c) Return plain `boolean`. Sound, but `unknown` input no longer narrows,
  which is the main reason to use the guard.
- (d) Leave and document.

Breaking analysis for (a): runtime unchanged. Code that relied on the
unsound else branch (`n` being `never`) gets new, correct errors; code that
assigns the true-branch value to a `number` keeps working; hovers show the
brand. Asserts keep `asserts x is number` (no else branch, already sound).

**Recommendation: (a) in 0.4.0**, with type tests for each guard's else
branch on TypeScript 5.0, 5.4 and current, and exported brand type names
(`PositiveNumber`, `NonEmptyString`, ...) so users can annotate. For
`isTruthy`, use the brand only when `Exclude<T, Falsy>` equals `T`.
`isFalsy` (narrower than the check: `NaN` is typed `0`) has no exact type;
document it.

### P5. `isObject` / `isObjectLoose` predicates are wider than the check (types)

Both are `x is object`, which includes functions and (for `isObject`)
arrays. Proposed, following `ArrayPart<T>` (0.2.4):

```ts
type ObjectPart<T> = unknown extends T
  ? object
  : Exclude<Extract<T, object>, readonly unknown[] | ((...args: any[]) => any)>;
export function isObject<T>(x: T): x is ObjectPart<T> & T;
```

Probed on 6.0.3: `string[] | string` keeps the array in the else branch;
`(() => void) | Map<K, V>` narrows to the `Map` and keeps the function in
the else branch; `unknown` narrows to `object`. Remaining imprecision: an
input typed plain `object` still gets `never` in the else branch
(TypeScript cannot subtract arrays from `object`), as today.
`isObjectLoose` gets the same shape without the array exclusion.

**Recommendation: 0.4.0**, together with P4, under one "types follow the
check" CHANGELOG heading, with type tests.

### P6. `isFunc`: the ecosystem says `isFunction`; the predicate misses classes

- Add `isFunction` / `assertFunction` / `is.function` as aliases. An agent
  writing lodash vocabulary gets an import error today: it fails loud, but
  costs a round trip.
- Predicate: `x is (...args: any[]) => any` does not match a class
  constructor, though `isFunc(class {})` is `true`. A generic
  `Extract<T, Function>`-style shape (with `Function` for `unknown`) would
  match what `typeof x === 'function'` narrows to.

**Recommendation: the alias in 0.4.0; the predicate change with P4/P5.**

### P7. Instanceof guards check the prototype chain, not the internal slot

`isMap(Object.create(Map.prototype))` is `true` (every `Map` method throws
on it); another realm's `Map` is `false`. Node's `util.types.isMap` checks
the slot and works across realms. A brand check
(`Object.getOwnPropertyDescriptor(Map.prototype, 'size').get.call(x)` in a
try/catch) would verify the slot, see across realms, and run no value
code.

Breaking: cross-realm values flip to `true`; prototype fakes flip to
`false`; each guard needs its own brand probe (bytes per guard).

**Recommendation: not now.** Document the definition ("same-realm
instance, by prototype chain"), done in the 0.3.1 README guide. Revisit
per guard if a user hits a cross-realm case.

### P8. Carry-overs

- **`isNil` deprecation** (dice3D-js T-028, proposal 1, recommendation
  (a)): still open; 0.3.0 did not add `@deprecated`. Recommendation
  unchanged: `@deprecated` JSDoc on `isNil`, `assertNil`, `is.nil`,
  `assertType.nil`, pointing at `isNull` (and `isNullish` for the lodash
  meaning), in 0.4.0. Never reuse the name with the lodash meaning.
- **`isNumberSafe`** reads like `Number.isSafeInteger`; it is "a number
  that is not `NaN`" (Infinity included). Its JSDoc says so since 0.3.1.
  An unambiguous alias is possible but not recommended unless users report
  confusion.
- **"`false` means not verified"** (rule 2.1) belongs in the README's
  design principles; done in 0.3.1.
