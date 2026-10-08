# CHANGELOG — `nanotypes`

> Initial cut seeded from `git log` by the host repo's `tools/seed-changelogs.mjs` script. Version groupings infer release boundaries from tags and commit subjects; rough cuts are expected — review and tighten as part of normal maintenance.

## 0.3.0 — unreleased

- **Breaking: `isPlainObject` / `isPojo` is prototype-only.** It is true when `Object.getPrototypeOf(x)` is `Object.prototype` or `null`, whatever `Symbol.toStringTag` says. Objects that carry a tag but have a plain prototype, such as `Math`, `JSON`, and `arguments` objects, now return `true` (0.2.x returned `false`). For the 0.2.x result, use `isObjectStrict(x) && isPlainObject(x)`.
- **fix(guards): a single-guard import bundles only that guard.** `guards.js` had about 60 module-level `const HAS_X = typeof globalThis.X ...` feature checks. They are top-level property reads, which a bundler must keep, so `import { isObject }` bundled all of them: 2,137 B minified (600 B gz) with esbuild. Feature detection now happens inside each guard (`(x) => inst(x, globalThis.X)`), and the module has no top-level side effects.
  - Single-guard imports, esbuild bundle + minify, ESM: `isObject` 2,137 → 118 B (600 → 124 B gz), `isString` 2,111 → 46 B, `isMap` 2,106 → 130 B, `isPlainObject` 2,242 → 159 B, `assertObject` 2,613 → 658 B (846 → 387 B gz). The full `is` namespace: 7,160 → 4,828 B (2,345 → 1,868 B gz).
  - Instanceof guards look the constructor up when they run, not at import. A global installed after import (jsdom, a polyfill) is now seen; before, the guard stayed `false`.
  - The `src/index.js` comment claiming "~50-150 bytes per guard" was wrong for 0.2.5 (about 2.1 KB); it now matches the measured sizes.
- **fix(isPlainObject): prototype only, never throws.** `isPlainObject` / `isPojo` went through `Object.prototype.toString`, which reads `Symbol.toStringTag`: a proxy with a throwing `get` trap made it throw, a tag getter ran user code, and `{ [Symbol.toStringTag]: 'X' }` was not plain. It is now true exactly when `x` is a non-null, non-function object and `Object.getPrototypeOf(x)` is this realm's `Object.prototype` or `null`; no property of `x` is read, and a throwing `getPrototypeOf` trap or a revoked proxy gives `false`.
  - Behaviour change: objects with a `Symbol.toStringTag` whose prototype is `Object.prototype` or `null` are now plain. That includes `Math`, `JSON`, `Reflect`, `arguments` objects, and module namespace objects. Cross-realm objects stay not plain, as before.
- **feat: `isFiniteNumber` / `assertFiniteNumber`, plus `is.finiteNumber` / `assertType.finiteNumber`.** `Number.isFinite`, no coercion. The named export `isFinite` shadowed the global `isFinite`, which coerces (`isFinite('1')` is true; nanotypes' is false). `isFinite` (now the same function) and `assertFinite` (message unchanged) are kept as deprecated aliases. `is.finite` / `assertType.finite` are unchanged.
- **fix: guards never throw.** Besides `isPlainObject`, these threw on a revoked proxy: `isArray`, `isObject`, `isObjectStrict`, and every instanceof guard; the instanceof guards also threw on a proxy whose `getPrototypeOf` trap throws, and `isContentEditable` on a throwing `isContentEditable` getter. All return `false` now. `isObjectStrict` keeps its `toString` semantics and still reads `Symbol.toStringTag`, which is documented.
- **fix(describe): `describe.value` never throws**, so an assert on a hostile value throws its own `TypeError` instead of the proxy's error. A revoked proxy or a throwing `constructor` getter describes as `"object"`.
- **fix(is, /auto): the generic `is(value, Type)` never throws in DEV.** Its DEV warning read `Type.name` inside the `catch`, which could throw again for a hostile constructor proxy.
- docs: README rows for `objectStrict`, `plainObject`, `finiteNumber`; notes on `isFiniteNumber` vs the global `isFinite` and on `isPlainObject`; the "runtime-adaptive" section no longer says guards are missing outside browsers (they exist and return `false`); size claims updated.
- test:
  - `test/guardSafety.js`, run on `src/` (smokeTest) and `dist/` (distSafety): every guard on every surface (named, `is.*`, curated `/auto is.*`) against revoked proxies, proxies with throwing traps, throwing getters and conversions, and null-prototype objects: no throws, strict booleans, and no property reads on the value (a recording proxy), except `isObjectStrict`. It also covers `isPlainObject` (tag objects, class instances, `vm` cross-realm objects, proxies), `isFiniteNumber` and the aliases, call-time constructor lookup, and asserts / `describe.value` on hostile values. Run against the 0.2.5 sources, it reports failures across the instanceof, array, object and plain-object guards and then crashes on the `isPlainObject` trap case.
  - `distSafety.js` bundles 13 single-import consumers and fails over a minified budget: 250 B for a guard, 900 B for an assert.
  - `test/types/finiteNumber.test.ts`: narrowing for `isFiniteNumber`, `isFinite`, the namespaces, and the asserts.

## 0.2.5 — 2026-10-08

- **feat: `isNull` and `assertNull`, plus `is.null` and `assertType.null`.** These are strictly `null` (`x === null`), the plain name for what `isNil` already does.
  - In lodash and Ramda, `isNil` means `null` **or** `undefined`. In nanotypes, that is `isNullish`, and `isNil(undefined)` is `false`. So a reader coming from lodash can misread an `isNil` call; `isNull` can't be misread.
  - `isNil` is unchanged: it is now the same function as `isNull`. `assertNil` keeps its "Expected nil" message, and `assertNull` says "Expected null".
  - The README has a null-checks table (`isNull`, `isNil`, `isNullish`, `isDefined`) and a "coming from lodash?" note. JSDoc on each declaration states the exact check.
- **types: the `is` and `assertType` namespaces are declared as interfaces, `IsNamespace` and `AssertTypeNamespace`.** A TypeScript `namespace` cannot declare a member named `null`. The call signatures (`is(x, Ctor)`, `assertType(x, Ctor)`) and every other member are unchanged, and both type names are now exported.
- `isNull` is an arrow `const` in `guards.js` and `assertNull` a function declaration in `asserts.js`, like the other guards and asserts. A consumer that imports only `isNull` bundles to 590 B gz with esbuild, the same as `isNil` in 0.2.4, and does not pull in the namespace builders.
- test:
  - `test/nullChecks.js` checks `isNull`, `isNil`, `isNullish`, and `isDefined` against `===` / `==` on 13 values (`null`, `undefined`, `0`, `-0`, `''`, `'null'`, `false`, `NaN`, `0n`, `{}`, `[]`, a null-prototype object, and a function). It covers the named exports, the `is.*` and `/auto` namespaces, and every assert (throws a `TypeError` with the right message exactly when the guard is false). `smokeTest.js` runs it on `src/`, and `distSafety.js` on `dist/`.
  - `distSafety.js` also bundles single-import consumers (`isNull`, `isNil`, `assertNull`, `isString`) from `dist/` with esbuild and fails if the namespace builders are included; `import { is }` is the positive control.
  - `test/types/nullChecks.test.ts` checks the narrowing of every null-check form, else branches included, in strict and loose mode. It fails on the 0.2.4 declarations (19 errors strict, 14 loose).

- **types(isArray): keep element types when narrowing a union with a readonly array.** `isArray`, `isArr`, `assertArray`, `assertArr`, `is.array`, `is.arr`, `assertType.array`, and `assertType.arr` were declared `x is unknown[]`.
  - A `ReadonlyArray<E>` is not an `unknown[]`, so on `Map<K, V> | ReadonlyArray<E>` TypeScript intersected instead of filtering, and the element type became `unknown`.
  - They are now generic (`<T>(x: T): x is ArrayPart<T>`). Array members of a union are kept with their element types (`Map<K, V> | ReadonlyArray<E>` narrows to `ReadonlyArray<E>`, with `Map` in the else branch), and tuples are kept too.
  - `unknown` and `any` still narrow to `unknown[]`, as in 0.2.3, and the else branch of `any` stays `any`. An intermediate version narrowed `any` to `any`, which turned the else branch into `never`; dogfooding in dice3D-js caught it before release.
  - Types only: the runtime is unchanged.
- test: `test/types/isArray.test.ts` checks the narrowing against the built `dist/index.d.ts`, in strict and loose mode (`npm run test:types`, part of `npm test` and so of `prepublishOnly`). It fails on the 0.2.3 declarations (9 errors).
  - Also checked by hand on TypeScript 5.0.4, 5.4.5, and 6.0.3.
  - Adds a `typescript` devDependency (6.0.3, released 2026-04-16, no install scripts).

## 0.2.3 — 2026-10-07

- **fix(env): DEV detection without a free `process` identifier.** The published `dist/env.js` (0.2.2 and earlier) shipped `typeof process<"u"&&!1`. esbuild's browser-platform minify inlined `process.env.NODE_ENV` as `"production"` at nanotypes' own build, so:
  - Node's `NODE_ENV` DEV detection never worked from dist; only `globalThis.__DEV__` did.
  - The leftover free `process` made browser bundlers polyfill it. Parcel auto-installed the `process` package into a consumer's project, and with a stray `package-lock.json` it ran npm inside a pnpm tree.
- `src/env.js` now reads `globalThis.process` at run time: Node uses `NODE_ENV`, other runtimes use `globalThis.__DEV__`.
  - Browser behaviour is unchanged from the 0.2.2 dist, and Node gets the documented behaviour back.
  - Only the `is`, `assertType`, `describe`, and `auto` namespaces read DEV (warnings, freezing); the named guards are unaffected.
- build: `platform: "neutral"` in `esbuild.config.js`, so no environment is inlined into the library. With the new `env.js`, every dist file is byte-identical with or without it.
- test: `test/distSafety.js` checks the built dist for any free `process`, and checks DEV in fresh Node processes. `npm test` builds and runs it, and `prepublishOnly` runs `npm test`.

## 0.2.2 — 2026-05-23

- **fix(asserts): tree-shake regression — rewrite `wrap()` factory to direct function declarations.** Pre-0.2.2 the asserts module used `export const assertString = wrap('string', isString)` for all ~90 asserts. Bundlers cannot statically prove that the module-level `wrap(...)` initializers are side-effect-free, so even a minimal `import { assertStr, assertObject }` consumer pulled in all 91 asserts plus every guard they reference — measured at **2,230 B gz** during the 0.2.0→0.2.1 wave. The 0.2.1 fix landed for `guards.js` but `asserts.js` carried the same pattern and was deferred as "next coordinated republish" territory (host carry-forward #2). Same fix applied: every `export const assertX = wrap(...)` becomes `export function assertX(x) { if (!isX(x)) throw new TypeError(\`Expected name, got ${describe.value(x)}\`); }`. Shorthand aliases (`assertStr = assertString`, etc.) stay as identifier-reference `const`s — those are tree-shake-safe. Verified: minimal `assertStr + assertObject` consumer now bundles to **850 B gz** (down 62%). Guards-only baseline is 648 B gz; the 202 B gap is the error-template + `describe.value` overhead inherent to asserts.

## 0.2.1 — 2026-05-19

- chore(license): finalize AGPL-3.0 + WATT3D Additional Terms metadata  `f257e5a`

## 0.2.0 — 2026-05-19

_(no commits in this range)_

## 0.1.0 — 2026-05-19

- docs(README): apply @whatty README template  `18a56d4`

## 0.0.17 — 2026-05-19

- set side effects to false again  `ea20ecb`
- chore: normalize README shields row  `3d21617`
- chore: normalize repository.url case to lowercase  `3d53591`
- chore: rebrand author to WATT3D, interim license  `835820f`
- feat: relicense to AGPL-3.0 + WATT3D AI Training Rider  `4a9bd89`
- chore: deploy WATT3D AI-bot robots.txt policy  `92d71ae`
- chore: revise AI Training Rider (v2 — pre-counsel drafting fixes)  `e73453b`
- chore: rider v3 — remove gameable 0.1% safe harbor  `e650353`
- chore: rider v4 — Commercial Use restricted to Fully Open Source  `67f1d6c`

## 0.0.15 — 2026-03-19

_(no commits in this range)_

## 0.0.14 — 2026-03-19

- updated description  `d35d131`
- bumped to 0.012  `e04d894`
- testing "sideEffects": true, for bundler stabilty.  `59e3b36`

## 0.0.11 — 2026-02-22

_(no commits in this range)_

## 0.0.10 — 2026-02-21

- fix: avoid BigInt constructor guard and improve smoke testing  `0114028`
- chore: fix package metadata for npm publish  `a8da99a`
- Fixed repo ur, and added package-lock.json to repo. updated readme for v0.0.9 npm publish  `e0b0b2d`

## 0.0.9 — 2026-02-21

- refactor(core): harden guards, centralize DEV detection, and add primitive shorthands  `ce740e6`

## 0.0.8 — 2026-02-16

- Cleaned up whitespace in assertType  `70cd871`
- feat(build,core): optimize import performance and harden runtime safety  `1a219c8`

## 0.0.7 — 2025-05-24

- feat(core): add dynamic instanceof map and assertType auto-generation  `590a1f2`

## 0.0.6 — 2025-05-23

- Added sizes to readME  `7b39671`

## 0.0.5 — 2025-05-23

_(no commits in this range)_

## 0.0.4 — 2025-05-23

- Fixed typos in ReadMe  `aab9c2d`

## 0.0.2 — 2025-05-23

- Initial commit  `f64762f`
- Initial v0.0.1 commit. We export is, describe and assert  `330b035`
- Added .ignore files for git and npm.  `cf96938`
- Created string to type maps for the common instance of checks and type of checks.  `65c07d1`
- assertTypes is now dynamically built from is.js  `13d0de1`
- Updated readme to match new API surface with, is, assertType and describe  `2d394fa`
- Repo rename to NanoTypes  `5823a1d`
