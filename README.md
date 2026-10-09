# nanotypes

[![npm](https://img.shields.io/npm/v/nanotypes)](https://www.npmjs.com/package/nanotypes)
[![downloads](https://img.shields.io/npm/dm/nanotypes)](https://www.npmjs.com/package/nanotypes)
[![bundle size](https://img.shields.io/bundlephobia/minzip/nanotypes)](https://bundlephobia.com/package/nanotypes)
[![license](https://img.shields.io/npm/l/nanotypes)](https://github.com/iWhatty/nanotypes/blob/main/LICENSE)
[![stars](https://img.shields.io/github/stars/iWhatty/nanotypes?style=social)](https://github.com/iWhatty/nanotypes)
[![types](https://img.shields.io/npm/types/nanotypes)](https://www.npmjs.com/package/nanotypes)

Minimal, runtime-safe type guards for modern JavaScript. Two surfaces, same package: an ergonomic `is` namespace, plus per-guard named exports where a single guard bundles to about 50-200 bytes minified. Zero dependencies.

## Features

- Runtime-safe `typeof` and `instanceof` matching
- Dynamic support for global constructors (`Map`, `URL`, etc.)
- Safe in Node, browsers, workers, and edge runtimes
- Non-throwing `instanceof` checks (runtime hardened)
- All guards return strict booleans (`true | false`)
- Production-hardened: exported APIs are frozen in production
- Shared DEV detection at run time: `globalThis.__DEV__ === true`, or in Node `process.env.NODE_ENV !== "production"` (read through `globalThis`, so bundlers never polyfill `process`)
- Auto-generated `assertType.*` versions
- Primitive shorthands: `is.str`, `is.num`, `is.bool`, `is.bigi`, `is.sym`, `is.undef`
- Structural-guard shorthands: `is.obj` → `is.object`, `is.arr` → `is.array` (added in 0.0.17)
- Built-in TypeScript type predicates
- No dependencies

---

## Install

```sh
pnpm add nanotypes
```

---

## Quick start

Two import styles, same package, choose by bundle-size sensitivity.

**Per-guard named exports** (recommended for size-sensitive bundles; `import { isObject }` bundles to about 120 bytes minified, an assert to about 650 bytes):

```js
import { isString, isObject, assertString } from 'nanotypes';

if (isString("hello")) {
  console.log("It's a string!");
}

assertString(maybeText); // throws TypeError if not a string
```

**Legacy `is` / `assertType` namespaces** (ergonomic, pulls the full ~1.9 KB gzipped surface):

```js
import { is, assertType, describe } from 'nanotypes';

if (is.string("hello")) console.log("It's a string!");
if (is.str("hello")) console.log("Short and sweet.");
if (is(someValue, HTMLElement)) someValue.focus();

assertType.promise(Promise.resolve()); // throws TypeError if invalid

console.log(describe.value(new Map())); // "Map"
```

Both shapes are kept in lockstep. Every guard `isFoo` named export has a matching `is.foo` on the namespace; every assert `assertFoo` has a matching `assertType.foo`.

---

## Which guard do I want?

### Objects

| You want to accept | Use | `true` for | `false` for |
| --- | --- | --- | --- |
| any non-null object, arrays included (lodash's `isObjectLike`) | `isObjectLike` / `isObjectLoose` | `{}`, `[]`, class instances, `Map`, `Date`, boxed primitives | functions, `null`, primitives |
| a non-null object that is not an array | `isObject` / `isObj` | `{}`, class instances, `Map`, `Date`, `Math`, boxed primitives | arrays, functions, `null`, primitives, revoked proxies |
| a plain object: a literal, `Object.create(null)`, parsed JSON | `isPlainObject` / `isPojo` | `{}`, `Object.create(null)`, `Math`, `JSON` | class instances, `Map`, `Date`, arrays, another realm's `{}` |
| an object whose `toString` tag is `Object`, from any realm | `isObjectStrict` | `{}`, class instances, another realm's `{}` | `Map`, `Date`, `Math`, arrays, anything with a `Symbol.toStringTag` (it reads the tag, so a tag getter runs) |
| an array, from any realm | `isArray` / `isArr` | arrays, proxies of arrays | revoked proxies |
| a function or class | `isFunc` | functions, classes | everything else |

`isObject` is **not** lodash's `isObject`: lodash's is also true for functions and arrays. For that, write `isObjectLike(x) || isFunc(x)`. The full table over 28 awkward values (proxies, other realms, boxed primitives) is in [docs/DESIGN.md](https://github.com/iWhatty/nanotypes/blob/main/docs/DESIGN.md#3-decision-table).

### Null and undefined

| You want | Use | Same as |
| --- | --- | --- |
| strictly `null` | `isNull` (or plain `x === null`) | `x === null` |
| `null` or `undefined` (lodash's `isNil`) | `isNullish` | `x == null` |
| neither `null` nor `undefined` | `isDefined` | `x != null` |
| strictly `undefined` | `isUndefined` | `x === undefined` |

`isNil` is strictly `null` here, **not** lodash's `isNil`. Prefer `isNull` or `isNullish`, which can't be misread. `isDefined` rejects `null` too; in remeda and ts-extras `isDefined` means only `!== undefined`.

### Coming from lodash

| lodash | nanotypes |
| --- | --- |
| `_.isObject` | `isObjectLike(x) \|\| isFunc(x)` |
| `_.isObjectLike` | `isObjectLike` (alias of `isObjectLoose`, 0.4.0) |
| `_.isPlainObject` | `isPlainObject` (prototype only: false for another realm's `{}`, true for `Math`; reads no property) |
| `_.isNil` | `isNullish` |
| `_.isNull` | `isNull` |
| `_.isFunction` | `isFunc` |
| `_.isArray` | `isArray` |
| `_.isFinite` | `isFiniteNumber` |

### What `false` means

A guard returns `true` only when it can verify every part of its definition, without throwing and without running the value's code. A part it cannot verify makes it `false`, so `false` means "not verified", not "verified the opposite". Example: a revoked proxy is `isObjectLoose` (`typeof` still works on it), but not `isObject` (`Array.isArray` throws on it, so "not an array" can't be verified) and not `isArray`. The rules and the reasons are in [docs/DESIGN.md](https://github.com/iWhatty/nanotypes/blob/main/docs/DESIGN.md).

---

## API

### Generic matcher

```ts
is(value, Class)
```

- Uses `instanceof` internally
- Logs warnings in development (`globalThis.__DEV__ = true`, or in Node when `NODE_ENV !== "production"`; in browsers set `globalThis.__DEV__`)
- Never throws, safely returns `false` on invalid constructor input

### Type-specific guards

Guards are generated dynamically from available runtime constructors. Some guards may only exist when the constructor exists in that environment (e.g., DOM-related guards in browsers but not in Node).

| Guard                             | Description                              |
| --------------------------------- | ---------------------------------------- |
| `is.string(x)` / `is.str(x)`      | `typeof x === "string"`                  |
| `is.number(x)` / `is.num(x)`      | `typeof x === "number"` (includes `NaN`) |
| `is.numberSafe(x)`                | Number and not `NaN`                     |
| `is.boolean(x)` / `is.bool(x)`    | Boolean primitive                        |
| `is.bigint(x)` / `is.bigi(x)`     | BigInt primitive                         |
| `is.symbol(x)` / `is.sym(x)`      | Symbol primitive                         |
| `is.undefined(x)` / `is.undef(x)` | Strictly `undefined`                     |
| `is.defined(x)`                   | Not `null` or `undefined`                |
| `is.nullish(x)`                   | `null` or `undefined`                    |
| `is.null(x)`                      | Strictly `null`                          |
| `is.nil(x)`                       | Strictly `null` (not lodash's `isNil`)   |
| `is.array(x)` / `is.arr(x)`       | `Array.isArray` (any realm); `false` for a revoked proxy |
| `is.object(x)` / `is.obj(x)`      | Non-null object, not array, not function (not lodash's `isObject`) |
| `is.objectStrict(x)`              | `Object.prototype.toString` gives `[object Object]` (object literals, null-prototype objects, class instances; not if `Symbol.toStringTag` is set) |
| `is.plainObject(x)`               | Prototype is `Object.prototype` or `null` (see below) |
| `is.objectLoose(x)` / `is.objectLike(x)` | Non-null object, arrays included (lodash's `isObjectLike`) |
| `is.func(x)`                      | `typeof x === "function"` (classes included) |
| `is.map(x)`                       | Instance of `Map`                        |
| `is.date(x)`                      | Instance of `Date`                       |
| `is.error(x)`                     | Instance of `Error`                      |
| `is.textNode(x)`                  | DOM Text node (browser only)             |
| `is.htmlElement(x)`               | `HTMLElement` node (browser only)        |
| `is.contentEditable(x)`           | Editable DOM node                        |
| `is.positiveNumber(x)`            | Greater than 0                           |
| `is.negativeNumber(x)`            | Less than 0                              |
| `is.integer(x)`                   | Whole number                             |
| `is.finiteNumber(x)`              | Number, not `NaN` or ±`Infinity`; no coercion (`Number.isFinite`) |
| `is.finite(x)`                    | Same as `is.finiteNumber`                |
| `is.truthy(x)`                    | Narrowed to non-falsy value              |
| `is.falsy(x)`                     | Falsy value                              |

> **Note:** `is.number(x)` follows standard JavaScript semantics and returns `true` for `NaN`. Use `is.numberSafe(x)` if you require a numeric value that is not `NaN`.

> **`isFiniteNumber`, not `isFinite`.** The named export `isFinite` is deprecated: importing it shadows the global `isFinite`, which coerces (`isFinite("1") === true`), while nanotypes' never does (`isFiniteNumber("1") === false`). `isFinite` and `assertFinite` stay as aliases of `isFiniteNumber` and `assertFiniteNumber`.

> **`isPlainObject` / `isPojo`** decides by `Object.getPrototypeOf(x)` alone: true when `x` is a non-null, non-function object whose prototype is this realm's `Object.prototype`, or `null`. It reads no property of `x`, so `Symbol.toStringTag` is ignored (`{ [Symbol.toStringTag]: "X" }` is plain) and no getter runs. Arrays, class instances, `Object.create(proto)`, and objects from another realm (iframe, `vm`) are not plain. A proxy is judged by its `getPrototypeOf` trap; a revoked proxy or a throwing trap gives `false`. Use `isObjectStrict` when you want the `toString`-tag check instead.

### Null checks

| Named export | Namespace       | True for                     | Same as      |
| ------------ | --------------- | ---------------------------- | ------------ |
| `isNull`     | `is.null`       | `null` only                  | `x === null` |
| `isNil`      | `is.nil`        | `null` only (alias of `isNull`; differs from lodash) | `x === null` |
| `isNullish`  | `is.nullish`    | `null` or `undefined`        | `x == null`  |
| `isDefined`  | `is.defined`    | neither `null` nor `undefined` | `x != null` |

Each has an assert: `assertNull` / `assertType.null`, `assertNil` / `assertType.nil`, `assertNullish` / `assertType.nullish`, `assertDefined` / `assertType.defined`.

> **Coming from lodash or Ramda?** Their `isNil(x)` is true for `null` **or** `undefined`. In nanotypes that is `isNullish(x)`. nanotypes' `isNil(undefined)` is `false`. Prefer `isNull` when you mean strictly `null`, so readers don't have to remember the difference.

### Assertive guards

All `is.*` functions have an `assertType.*` equivalent:

```ts
assertType.url(x) // throws TypeError if not a URL
```

Use guards for conditional logic. Use asserts when invalid input should immediately fail.

---

## Notes

### Why nanotypes?

JavaScript type checks are deceptively inconsistent:

- `typeof null === "object"`
- `Array.isArray(x)` is required for arrays
- `instanceof` can throw in exotic or cross-realm scenarios
- Browser globals like `HTMLElement` don't exist in Node
- Guards scattered across codebases lead to inconsistency

nanotypes centralizes and hardens these checks into a small, predictable surface.

### TypeScript vs runtime checks

TypeScript is **compile-time**. nanotypes is **runtime**. They solve different problems.

**What TypeScript does well:**

- Prevents incorrect usage during development
- Provides IDE autocomplete and static analysis
- Catches type mismatches before build

**What TypeScript cannot guarantee:**

At runtime, TypeScript types disappear. Values coming from API responses, `JSON.parse`, user input, `localStorage`, environment variables, or third-party libraries may not match their declared types. nanotypes validates those values at runtime.

**They work together.** nanotypes guards are typed as proper type predicates:

```ts
if (is.string(x)) {
  // x is now narrowed to string
}

assertType.numberSafe(x);
// x is guaranteed to be a non-NaN number here
```

This means IDEs narrow types correctly, fewer `as` casts, fewer `@ts-ignore` comments, safer boundary validation.

> TypeScript tells you what *should* be true.
> nanotypes checks what *is* true.

### Runtime safety

nanotypes is hardened for modern environments:

- Safe access of `globalThis` constructors
- No crashes from missing browser globals (e.g., `HTMLElement` in Node)
- Defensive `instanceof` handling
- Works consistently across Node, browsers, workers, and edge runtimes
- Guards never throw, they return `false` (revoked proxies and throwing proxy traps included)
- A guard's `true` is a verified claim: if it cannot verify part of its definition, it returns `false` (see [What `false` means](#what-false-means))
- Guards don't run the value's code: no getters, `Symbol.toPrimitive`, or `toString` (exceptions: `isObjectStrict` reads `Symbol.toStringTag`, and `isContentEditable` reads `isContentEditable` on an `HTMLElement`)
- Assertions throw clean `TypeError` messages with readable descriptions

### Runtime-adaptive behavior

The default entry ships a curated static set of well-known constructors. Every guard always exists; an instanceof guard looks its constructor up on `globalThis` when it runs, so `isHtmlElement(x)` is `false` in Node rather than throwing, and a global installed after import (jsdom, a polyfill) is picked up.

```js
if (is.htmlElement(node)) {
  // browser-only logic; false in Node
}
```

### Auto-discovery via `nanotypes/auto`

If you need guards for globals beyond the curated set (`urlPattern`, `broadcastChannel`, `compressionStream`, custom platform APIs, user-defined globals), import the `/auto` subpath:

```js
import { is, assertType } from 'nanotypes/auto';
```

`/auto` walks `globalThis` at module load and adds every constructor-shaped global to the `is` namespace, on top of the curated static set. Trade-off: a larger surface that TypeScript can't narrow against (the `.d.ts` for `/auto` is the same as the default; the extra guards are reachable but un-narrowed). About ~370 bytes larger gzipped than the default. Useful for diagnostic or introspective code; not recommended as a default import in size-sensitive bundles.

### Migration from 0.0.x / 0.1.0

- **0.0.x → 0.1.0:** the default entry no longer runs the global scanner at import; the scanner is opt-in via `/auto`. If you were relying on a guard for an exotic global like `is.urlPattern`, switch the import line to `'nanotypes/auto'`.
- **0.1.0 → 0.2.0:** purely additive. New per-guard named exports (`isString`, `assertString`, etc.) join the existing `is` / `assertType` namespaces; both shapes work side by side. Recommended pattern for size-sensitive bundles is to migrate `import { is } from 'nanotypes'; is.string(x)` to `import { isString } from 'nanotypes'; isString(x)`, which saves ~1 KB gzipped per import when only a few guards are used.

### Design principles

The full rules, with the reasoning, an audit of every guard, and proposals under discussion: [docs/DESIGN.md](https://github.com/iWhatty/nanotypes/blob/main/docs/DESIGN.md).

- A guard's `true` is a **verified claim**; `false` means "not verified"
- Guards **never throw**
- Guards **never run the value's code** (documented exceptions: `isObjectStrict`, `isContentEditable`)
- Type predicates match the runtime check
- Names follow the ecosystem's meaning, or the docs say loudly where they don't (`isNil`, `isObject`)
- Asserts **throw intentionally** (`TypeError`)
- No runtime assumptions
- Safe reflection on `globalThis`
- Runtime-adaptive constructor support
- Tree-shakable ESM surface
- Zero dependencies
- Immutable public API in production

### When not to use nanotypes

nanotypes may not be necessary if:

- You use strict TypeScript and never validate unknown runtime input.
- You only need one or two inline type checks.
- You are already using a schema validation library (e.g., Zod, Valibot, Yup).

nanotypes is designed as a lightweight guard layer, not a schema system.

### Philosophy

**Make JavaScript safer without making it heavier.** nanotypes avoids boilerplate and unnecessary runtime bloat. Just clean, modern type guards ready for anything from browser UIs to CLI tools.

---

## License

Licensed under AGPL-3.0 with WATT3D Additional Terms. See [LICENSE](./LICENSE) and [ADDITIONAL_TERMS.md](./ADDITIONAL_TERMS.md). Commercial AI/model-training use requires compliance with those terms or a separate WATT3D license. © WATT3D.
