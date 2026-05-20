// esbuild.config.js
//
// Per-file ESM build. Mirrors src/ into dist/ without bundling so
// consumers' bundlers can tree-shake at the file boundary.
//
// Why per-file (not bundled): the legacy namespace surfaces in is.js /
// assertType.js / auto.js contain module-level `for (const k of
// Object.keys(...))` loops that statically reach every guard. When
// bundled into one dist/index.js, those loops become top-level code
// the consumer's bundler can't drop — even when only `isObject` is
// imported. Per-file shipping keeps is.js out of the consumer's import
// graph entirely when the namespace isn't used.
//
// Consumers using `import { is }` still pay the namespace cost; that's
// expected. Consumers using `import { isObject, isStr }` get only the
// guard definitions they ask for.

import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

mkdirSync('dist', { recursive: true });

// Every src/*.js file becomes a corresponding dist/*.js. `bundle: false`
// preserves relative imports (`./guards.js`) so the consumer's bundler
// sees per-file ESM boundaries.
await build({
  entryPoints: [
    './src/index.js',
    './src/auto.js',
    './src/guards.js',
    './src/asserts.js',
    './src/is.js',
    './src/assertType.js',
    './src/describe.js',
    './src/env.js',
    './src/scan.js',
  ],
  outdir: 'dist',
  bundle: false,
  minify: true,
  sourcemap: false,
  target: 'es2022',
  format: 'esm',
});

// Copy type declarations
cpSync(`${__dirname}/src/index.d.ts`, `${__dirname}/dist/index.d.ts`);
cpSync(`${__dirname}/src/auto.d.ts`,  `${__dirname}/dist/auto.d.ts`);
