// ./test/distSafety.js
//
// Checks the built dist/, not src/: what consumers actually install.
// 1. No dist file names a free `process` identifier (bundlers would polyfill
//    or auto-install it).
// 2. DEV follows the documented rules in a fresh Node process per case:
//    NODE_ENV unset -> true, NODE_ENV=production -> false,
//    globalThis.__DEV__ = true -> true even in production.
// 3. The null-check family (isNull, isNil, isNullish, isDefined, their
//    asserts and namespace forms) matches plain JS on the built files
//    (test/nullChecks.js, also run against src/ by smokeTest.js).
// 4. Tree-shake: a consumer importing one named guard or assert does not
//    bundle the `is` / `assertType` namespace builders (the 0.2.1 / 0.2.2
//    regressions).
// Run after `npm run build`.
import { build } from 'esbuild';
import { readdirSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
let failures = 0;
const fail = message => { failures++; console.error('FAIL ' + message); };

console.log('\n== nanotypes dist safety ==');

// A `process` that is not a property access (`.process`, `?.process`) or part
// of a longer identifier.
const FREE_PROCESS = /(?<![.\w$])process(?![\w$])/;
const files = readdirSync(dist).filter(name => name.endsWith('.js'));
if (!files.length) fail('dist/ has no .js files; run `npm run build` first');
for (const name of files) {
  const source = readFileSync(join(dist, name), 'utf8');
  if (FREE_PROCESS.test(source)) fail(`dist/${name} references a free \`process\` identifier`);
}
console.log(` scanned ${files.length} dist files for a free \`process\``);

const envUrl = pathToFileURL(join(dist, 'env.js')).href;
const cases = [
  { name: 'NODE_ENV unset', env: {}, pre: '', expected: true },
  { name: 'NODE_ENV=development', env: { NODE_ENV: 'development' }, pre: '', expected: true },
  { name: 'NODE_ENV=production', env: { NODE_ENV: 'production' }, pre: '', expected: false },
  { name: '__DEV__ in production', env: { NODE_ENV: 'production' }, pre: 'globalThis.__DEV__ = true;', expected: true },
  { name: 'no process (browser-like)', env: {}, pre: 'delete globalThis.process;', expected: false },
];
for (const c of cases) {
  const env = { ...process.env };
  delete env.NODE_ENV;
  Object.assign(env, c.env);
  const script = `${c.pre} const { DEV } = await import(${JSON.stringify(envUrl)}); console.log(String(DEV));`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], { env, encoding: 'utf8' });
  const got = run.stdout.trim();
  if (run.status !== 0) fail(`${c.name}: child exited ${run.status}: ${run.stderr.trim()}`);
  else if (got !== String(c.expected)) fail(`${c.name}: DEV=${got}, expected ${c.expected}`);
  else console.log(` DEV ${c.name}: ${got}`);
}

const { runNullChecks } = await import('./nullChecks.js');
const [distIndex, distAuto] = await Promise.all([
  import(pathToFileURL(join(dist, 'index.js')).href),
  import(pathToFileURL(join(dist, 'auto.js')).href),
]);
failures += runNullChecks('dist', distIndex, distAuto);

// The namespace builders derive keys with charAt(2) (is.js) and charAt(6)
// (assertType.js); neither appears in guards, asserts, or describe. The
// `is` consumer is the positive control that the marker still matches.
const NAMESPACE_BUILDER = /\.charAt\([26]\)/;
const consumers = [
  ['isNull', false], ['isNil', false], ['assertNull', false], ['isString', false], ['is', true],
];
for (const [name, expectNamespace] of consumers) {
  const entry = join(dist, 'index.js');
  const result = await build({
    stdin: { contents: `import { ${name} } from ${JSON.stringify(entry)}; globalThis.out = ${name};`, resolveDir: root, loader: 'js' },
    bundle: true, minify: true, format: 'esm', platform: 'neutral', write: false, logLevel: 'silent',
  });
  const code = result.outputFiles[0].text;
  const hasNamespace = NAMESPACE_BUILDER.test(code);
  if (hasNamespace !== expectNamespace) fail(`import { ${name} } bundles the namespace builders: ${hasNamespace}, expected ${expectNamespace}`);
  else console.log(` tree-shake import { ${name} }: ${code.length} B min, namespace builders: ${hasNamespace}`);
}

if (failures) {
  console.error(`\n${failures} dist safety check(s) failed`);
  process.exit(1);
}
console.log(' dist safety: ok');
