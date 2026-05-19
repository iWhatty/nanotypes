// ./src/index.js
//
// Default entry: re-exports two parallel surfaces.
//
//   import { isString, isObject } from 'nanotypes';
//     → per-guard named exports, tree-shake to ~50-150 bytes per guard
//
//   import { is, assertType, describe } from 'nanotypes';
//     → legacy namespace surface, ergonomic chained syntax,
//       brings the full namespace (~1.6 KB gzipped)
//
// Use whichever fits the bundle-size sensitivity of the consumer.

// Per-guard named exports (tree-shakeable)
export * from './guards.js';
export * from './asserts.js';

// Legacy namespace surfaces (ergonomic, pulls everything)
export { is } from './is.js';
export { assertType } from './assertType.js';
export { describe } from './describe.js';
