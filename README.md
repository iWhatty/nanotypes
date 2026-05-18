# NanoTypes

[![npm](https://img.shields.io/npm/v/nanotypes)](https://www.npmjs.com/package/nanotypes)
[![downloads](https://img.shields.io/npm/dm/nanotypes)](https://www.npmjs.com/package/nanotypes)
[![bundle size](https://img.shields.io/bundlephobia/minzip/nanotypes)](https://bundlephobia.com/package/nanotypes)
[![license](https://img.shields.io/npm/l/nanotypes)](https://github.com/iWhatty/nanotypes/blob/main/LICENSE)
[![stars](https://img.shields.io/github/stars/iWhatty/nanotypes?style=social)](https://github.com/iWhatty/nanotypes)

**Minimal, runtime-safe type guards for modern JavaScript.**

Tree-shakable ESM bundle, zero-config, developer-friendly guards for `typeof`, `instanceof`, and structural checks.

* **Minified:** ~3.14 KB
* **Gzipped:** ~1.48 KB

---

## Features

* Runtime-safe `typeof` and `instanceof` matching
* Dynamic support for global constructors (`Map`, `URL`, etc.)
* Safe in Node, browsers, workers, and edge runtimes
* Non-throwing `instanceof` checks (runtime hardened)
* All guards return strict booleans (`true | false`)
* Production-hardened: exported APIs are frozen in production
* Shared DEV detection via `globalThis.__DEV__` or `NODE_ENV !== "production"`
* Auto-generated `assertType.*` versions
* Primitive shorthands: `is.str`, `is.num`, `is.bool`, `is.bigi`, `is.sym`, `is.undef`
* Built-in TypeScript type predicates
* No dependencies

---

## Why NanoTypes?

JavaScript type checks are deceptively inconsistent:

* `typeof null === "object"`
* `Array.isArray(x)` is required for arrays
* `instanceof` can throw in exotic or cross-realm scenarios
* Browser globals like `HTMLElement` don’t exist in Node
* Guards scattered across codebases lead to inconsistency

NanoTypes centralizes and hardens these checks into a small, predictable surface.

---

## TypeScript vs Runtime Checks

TypeScript is **compile-time**.
NanoTypes is **runtime**.

They solve different problems.

### What TypeScript Does Well

* Prevents incorrect usage during development
* Provides IDE autocomplete and static analysis
* Catches type mismatches before build

### What TypeScript Cannot Guarantee

At runtime, TypeScript types disappear. Values coming from:

* API responses
* `JSON.parse`
* User input
* `localStorage`
* Environment variables
* Third-party libraries

may not match their declared types.

NanoTypes validates those values **at runtime**.

### They Work Together

NanoTypes guards are typed as proper **type predicates**:

```ts
if (is.string(x)) {
  // x is now narrowed to string
}

assertType.numberSafe(x);
// x is guaranteed to be a non-NaN number here
```

This means:

* IDEs narrow types correctly
* Fewer `as` casts
* Fewer `@ts-ignore` comments
* Safer boundary validation

> TypeScript tells you what *should* be true.
> NanoTypes checks what *is* true.

---

## Runtime Safety

NanoTypes is hardened for modern environments:

* Safe access of `globalThis` constructors
* No crashes from missing browser globals (e.g., `HTMLElement` in Node)
* Defensive `instanceof` handling
* Works consistently across Node, browsers, workers, and edge runtimes
* Guards never throw — they return `false`
* Assertions throw clean `TypeError` messages with readable descriptions

---

## Design Principles

* Guards **never throw**
* Asserts **throw intentionally** (`TypeError`)
* No runtime assumptions
* Safe reflection on `globalThis`
* Runtime-adaptive constructor support
* Tree-shakable ESM surface
* Zero dependencies
* Immutable public API in production

---

## Install

```bash
npm install nanotypes
```

---

## Usage

```js
import { is, assertType, describe } from 'nanotypes';

if (is.string("hello")) {
  console.log("It's a string!");
}

// Shorthand aliases
if (is.str("hello")) {
  console.log("Short and sweet.");
}

if (is(someValue, HTMLElement)) {
  someValue.focus();
}

assertType.promise(Promise.resolve()); // throws TypeError if invalid

console.log(describe.value(new Map())); // "Map"
```

---

## API

### Generic Matcher

```ts
is(value, Class)
```

* Uses `instanceof` internally
* Logs warnings in development (`globalThis.__DEV__ = true` or when `process.env.NODE_ENV !== "production"`)
* Never throws — safely returns `false` on invalid constructor input

---

### Type-Specific Guards

Guards are generated dynamically from available runtime constructors.
Some guards may only exist when the constructor exists in that environment
(e.g., DOM-related guards in browsers but not in Node).

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
| `is.nil(x)`                       | Strictly `null`                          |
| `is.array(x)`                     | Array literal check                      |
| `is.object(x)`                    | Non-null object, not array               |
| `is.objectStrict(x)`              | Exactly a `{}` object                    |
| `is.plainObject(x)`               | Object with prototype `Object` or `null` |
| `is.func(x)`                      | Function check                           |
| `is.map(x)`                       | Instance of `Map`                        |
| `is.date(x)`                      | Instance of `Date`                       |
| `is.error(x)`                     | Instance of `Error`                      |
| `is.textNode(x)`                  | DOM Text node (browser only)             |
| `is.htmlElement(x)`               | `HTMLElement` node (browser only)        |
| `is.contentEditable(x)`           | Editable DOM node                        |
| `is.positiveNumber(x)`            | Greater than 0                           |
| `is.negativeNumber(x)`            | Less than 0                              |
| `is.integer(x)`                   | Whole number                             |
| `is.finite(x)`                    | Not `Infinity`, not `NaN`                |
| `is.truthy(x)`                    | Narrowed to non-falsy value              |
| `is.falsy(x)`                     | Falsy value                              |

> ⚠️ **Note**
> `is.number(x)` follows standard JavaScript semantics and returns `true` for `NaN`.
> Use `is.numberSafe(x)` if you require a numeric value that is not `NaN`.

---

### Assertive Guards

All `is.*` functions have an `assertType.*` equivalent:

```ts
assertType.url(x) // throws TypeError if not a URL
```

Use guards for conditional logic.
Use asserts when invalid input should immediately fail.

---

## Runtime-Adaptive Behavior

NanoTypes dynamically inspects `globalThis` to expose constructor-based guards.

This means:

* Browser-only constructors (like `HTMLElement`) will not exist in Node.
* New runtime constructors may automatically become available.

If writing universal libraries, you can safely check:

```js
if (typeof is.htmlElement === 'function' && is.htmlElement(node)) {
  // browser-only logic
}
```

---

## When NOT to Use NanoTypes

NanoTypes may not be necessary if:

* You use strict TypeScript and never validate unknown runtime input.
* You only need one or two inline type checks.
* You are already using a schema validation library (e.g., Zod, Valibot, Yup).

NanoTypes is designed as a lightweight guard layer — not a schema system.

---

## Philosophy

**Make JavaScript safer without making it heavier.**

NanoTypes avoids boilerplate and unnecessary runtime bloat. Just clean, modern type guards ready for anything from browser UIs to CLI tools.

---

## Latest Changes

* Centralized DEV detection via `env.js`
* Reused safe core for all generated `instanceof` guards
* Ensured all guards return strict booleans
* Production freezing of `is`, `assertType`, and `describe`
* Hardened `Intl` constructor detection
* Excluded `BigInt` constructor to prevent primitive naming confusion
* Added primitive shorthand guards (`str`, `num`, `bool`, `bigi`, `sym`, `undef`)
* Improved smoke testing with negative cases and CI-friendly exit codes

---

## License

**DR.WATT v3.0**
