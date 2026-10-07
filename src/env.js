// ./src/env.js
//
// DEV is read at run time through globalThis, never through a free `process`
// identifier:
// - A free `process` makes browser bundlers polyfill it (Parcel even
//   auto-installs the `process` package into the consumer's project).
// - esbuild with platform "browser" and minify replaces
//   `process.env.NODE_ENV` with "production" at build time, which folded the
//   old check to `false` in the published dist (0.2.2 and earlier).
//
// Node: DEV unless NODE_ENV is "production". Browsers and other runtimes
// without `process`: DEV only when globalThis.__DEV__ === true.
const g = typeof globalThis !== "undefined" ? globalThis : undefined;
const proc = g === undefined ? undefined : g.process;

export const DEV =
  (g !== undefined && g.__DEV__ === true) ||
  (proc != null && typeof proc === "object" && proc.env?.NODE_ENV !== "production");
