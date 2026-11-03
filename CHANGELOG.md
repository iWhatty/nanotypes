# CHANGELOG — `nanotypes`

What changed for people using the package, per release. Entries before 0.2.2 were reconstructed from git history. `docs/DESIGN.md` in the repo explains the decisions behind 0.3 and 0.4.

## 0.4.0 — 2026-10-09

- New names that match other libraries, as the same functions: `isObjectLike` (lodash's name for `isObjectLoose`), `isNonNullish` (remeda's name for `isDefined`) and `isFunction` (for `isFunc`), each with its assert and `is.*` / `assertType.*` forms.
- Deprecated, behavior unchanged: `isNil` (use `isNull`, or `isNullish` for lodash's meaning) and `isObjectStrict` (use `isPlainObject`, which runs none of the value's code).
- `index.d.ts` exports its helper types explicitly, including the new brand types.

Breaking changes:
- `isContentEditable` calls `HTMLElement.prototype`'s getter instead of reading the value's property. Real elements answer as before; test fakes that set `isContentEditable` as an own property now get `false`, so define it as a getter on the fake's prototype.
- Types: refinement guards (`isInteger`, `isFiniteNumber`, `isPositiveNumber`, `isNonEmptyString`, `isTruthy` and others) narrow typed input to branded types such as `Integer`, so `if (!isPositiveNumber(n))` keeps `n: number` instead of `never`. `unknown` and `any` input still narrows to the plain type. A variable initialised from a branded value needs an annotation before you assign it a plain number.
- Types: `isFunc` / `isFunction` keep class constructor types in a union, and `isObject` / `isObjectLoose` keep the arrays and functions they reject in the else branch.

## 0.3.1 — 2026-10-09

- Fix: `isObject` returned `true` for a revoked proxy; it is `false` now, so `assertObject` throws on one.
- Fix: assert error messages and DEV warnings no longer run a `constructor` getter on the value.
- A guard's `true` is a verified claim, and `false` means "not verified".

## 0.3.0 — 2026-10-08

- Importing a single guard bundles only that guard (about 50–160 bytes minified), instead of every feature check in the module.
- Guards never throw, including on revoked proxies and proxies with throwing traps.
- Instanceof guards look up their constructor when called, so globals added after import (jsdom, polyfills) are seen.
- `isFiniteNumber` / `assertFiniteNumber`. The named `isFinite` export, which shadowed the coercing global, is deprecated.

Behavior change: `isPlainObject` / `isPojo` decides by prototype only and reads no property of the value. `Math`, `JSON`, `Reflect` and `arguments` objects now return `true`; for the old answer, use `isObjectStrict(x) && isPlainObject(x)`.

## 0.2.5 — 2026-10-08

- `isNull` / `assertNull` and the `is.null` / `assertType.null` forms: strictly `null`. `isNil` does the same, but lodash's `isNil` also accepts `undefined`.
- Types: the `is` and `assertType` namespaces are the exported interfaces `IsNamespace` and `AssertTypeNamespace`.

## 0.2.4 — 2026-10-07

- Types: `isArray` keeps element types when narrowing a union, so `Map<K, V> | ReadonlyArray<E>` narrows to `ReadonlyArray<E>`. Tuples are kept too.

## 0.2.3 — 2026-10-07

- Fix: DEV detection reads `NODE_ENV` in Node again, and the dist no longer contains a free `process` that made browser bundlers add a polyfill.

## 0.2.2 — 2026-05-26

- Fix: importing a few asserts no longer bundles all of them.

## 0.2.1 — 2026-05-20

- Fix: importing a few guards no longer bundles all of them.

## 0.2.0 — 2026-05-20

- Relicensed to AGPL-3.0 with WATT3D Additional Terms, and marked side-effect free again.

## 0.0.16 — 2026-03-19

- Package metadata and description updates.

## 0.0.10 — 2026-02-22

- Fix: no `BigInt` constructor guard.

## 0.0.9 — 2026-02-22

- Hardened guards, centralized DEV detection, and primitive shorthands.

## 0.0.8 — 2026-02-17

- Faster imports and safer runtime checks.

## 0.0.7 — 2025-05-24

- `assertType` generated from the guards, with a dynamic instanceof map.

## 0.0.1 — 2025-05-24

- First release: `is`, `assertType` and `describe`.
