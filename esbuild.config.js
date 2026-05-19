// esbuild.config.js
import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const shared = {
  bundle: true,
  minify: true,
  sourcemap: false,
  target: 'es2022',
  format: 'esm',
};

mkdirSync('dist', { recursive: true });

// Default entry: curated static surface
await build({
  ...shared,
  entryPoints: ['./src/index.js'],
  outfile: 'dist/index.js',
});

// /auto entry: static + scanner-augmented surface
await build({
  ...shared,
  entryPoints: ['./src/auto.js'],
  outfile: 'dist/auto.js',
});

// Copy type declarations
cpSync(`${__dirname}/src/index.d.ts`, `${__dirname}/dist/index.d.ts`);
cpSync(`${__dirname}/src/auto.d.ts`,  `${__dirname}/dist/auto.d.ts`);
