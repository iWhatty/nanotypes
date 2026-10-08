// ./src/index.js
//
// Default entry: re-exports two parallel surfaces.
//
//   import { isString, isObject } from 'nanotypes';
//     → per-guard named exports; a single guard bundles to roughly
//       60-200 bytes minified (test/distSafety.js enforces a budget)
//
//   import { is, assertType, describe } from 'nanotypes';
//     → legacy namespace surface, ergonomic chained syntax,
//       brings the full namespace (~1.9 KB gzipped)
//
// Use whichever fits the bundle-size sensitivity of the consumer.

// Per-guard named exports (tree-shakeable)
export * from './guards.js';
export * from './asserts.js';

// Legacy namespace surfaces (ergonomic, pulls everything)
export { is } from './is.js';
export { assertType } from './assertType.js';
export { describe } from './describe.js';
