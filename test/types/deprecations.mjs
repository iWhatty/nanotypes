// ./test/types/deprecations.mjs
//
// Checks what an editor shows (strikethrough, "'x' is deprecated"): runs the
// TypeScript language service over a file that uses every deprecated name
// and a set of names that must not be deprecated, against the built
// dist/index.d.ts, and compares the suggestion diagnostics (code 6385 /
// 6387) with the lists below. Part of `npm run test:types`.
//
// Optional argument: a path to another `typescript` package (to run this on
// an older compiler).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ts = require(process.argv[2] ?? 'typescript');

// Deprecated: kept as aliases, JSDoc @deprecated points at the replacement.
const DEPRECATED = [
  // 0.3.0: shadows the global isFinite.
  'isFinite', 'assertFinite',
  // 0.4.0 (docs/DESIGN.md P8): strictly null here, null-or-undefined in lodash.
  'isNil', 'assertNil', 'is.nil', 'assertType.nil',
  // 0.4.0 (docs/DESIGN.md P2): runs the value's Symbol.toStringTag getter;
  // isPlainObject is the replacement.
  'isObjectStrict', 'assertObjectStrict', 'is.objectStrict', 'assertType.objectStrict',
];
// Must not be deprecated (the replacements, and neighbours of the above).
const CURRENT = [
  'isNull', 'assertNull', 'is.null', 'assertType.null',
  'isNullish', 'is.nullish', 'isDefined', 'isNonNullish',
  'isPlainObject', 'assertPlainObject', 'is.plainObject', 'assertType.plainObject', 'isPojo',
  'isObject', 'isObjectLoose', 'isObjectLike',
  'isFiniteNumber', 'assertFiniteNumber', 'is.finiteNumber', 'is.finite',
];

const all = [...DEPRECATED, ...CURRENT];
const named = [...new Set(all.filter((n) => !n.includes('.')))];
const lines = [
  `import { is, assertType, ${named.join(', ')} } from './dist/index.js';`,
  'declare const x: unknown;',
  ...all.map((n) => `void ${n};`),
];
// The compiler keys files by forward-slash paths, on Windows too.
const root = join(here, '..', '..').split('\\').join('/');
const fileName = `${root}/__deprecations__.ts`;
const source = lines.join('\n');
const options = {
  strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler ?? 100, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
};
const host = {
  getScriptFileNames: () => [fileName],
  getScriptVersion: () => '1',
  getScriptSnapshot: (f) => {
    const text = f === fileName ? source : (() => { try { return readFileSync(f, 'utf8'); } catch { return undefined; } })();
    return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
  },
  getCurrentDirectory: () => root,
  getCompilationSettings: () => options,
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: (f) => f === fileName || ts.sys.fileExists(f),
  readFile: (f) => (f === fileName ? source : ts.sys.readFile(f)),
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};
const service = ts.createLanguageService(host, ts.createDocumentRegistry());

let failures = 0;
const fail = (m) => { failures++; console.error('FAIL ' + m); };
const errors = service.getSemanticDiagnostics(fileName);
for (const d of errors) fail(`compile error: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);

// Which `void name;` lines got a deprecation suggestion.
const deprecatedLines = new Set();
for (const d of service.getSuggestionDiagnostics(fileName)) {
  if (d.code !== 6385 && d.code !== 6387) continue;
  deprecatedLines.add(ts.getLineAndCharacterOfPosition(service.getProgram().getSourceFile(fileName), d.start).line);
}
all.forEach((name, i) => {
  const line = i + 2;
  const want = DEPRECATED.includes(name);
  const got = deprecatedLines.has(line);
  if (got !== want) fail(`${name}: ${got ? 'marked' : 'not marked'} @deprecated, expected ${want ? 'deprecated' : 'current'}`);
});

console.log(` deprecations (TypeScript ${ts.version}): ${DEPRECATED.length} deprecated, ${CURRENT.length} current: ${failures ? 'FAILED' : 'ok'}`);
if (failures) process.exit(1);
