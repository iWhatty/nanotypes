// ./test/types/declarationEmit.mjs
//
// A library that re-exports values narrowed by nanotypes must be able to
// emit its own declarations (`declaration: true`). Since 0.4.0 the narrowed
// types can contain the refinement brand and the helper types
// (FunctionPart, ObjectPart, ...), so the emitter has to be able to name
// them from 'nanotypes'; a helper that is not exported fails with TS2742 /
// TS4023 ("cannot be named"). Compiles a consumer file against the built
// dist/index.d.ts, emits declarations in memory, and fails on any
// diagnostic. Part of `npm run test:types`.
//
// Optional argument: a path to another `typescript` package.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ts = require(process.argv[2] ?? 'typescript');

const root = join(here, '..', '..').split('\\').join('/');
const fileName = `${root}/__declarationEmit__.ts`;
const source = `
import {
  isFiniteNumber, isInteger, isPositiveNumber, isNonEmptyString, isTruthy,
  isContentEditable, isFunc, isArray, isObject, isObjectLoose, isNumberSafe,
} from './dist/index.js';
class Widget { size = 1; }
export const finite = (x: unknown) => (isFiniteNumber(x) ? x : 0);
export const positiveInteger = (x: unknown) => (isPositiveNumber(x) && isInteger(x) ? x : 1);
export const safe = (x: unknown) => (isNumberSafe(x) ? x : 0);
// Input already typed with the base type: the narrowed value carries the brand.
export const typedFinite = (x: number) => (isFiniteNumber(x) ? x : 0);
export const typedLabel = (x: string | number) => (isNonEmptyString(x) ? x : 'none');
export const typedEditable = (x: HTMLElement | null) => (isContentEditable(x) ? x : null);
export const typedBoth = (x: number) => (isPositiveNumber(x) && isInteger(x) ? x : 1);
export const label = (x: unknown) => (isNonEmptyString(x) ? x : 'none');
export const truthyText = (x: string | null) => (isTruthy(x) ? x : '');
export const truthyCount = (x: number | undefined) => (isTruthy(x) ? x : 1);
export const editable = (x: unknown) => (isContentEditable(x) ? x : null);
export const ctor = (x: typeof Widget | string) => (isFunc(x) ? x : null);
export const callable = (x: object) => (isFunc(x) ? x : null);
export const list = (x: unknown) => (isArray(x) ? x : []);
export const record = (x: { a: 1 } | string[]) => (isObject(x) ? x : null);
export const loose = (x: unknown) => (isObjectLoose(x) ? x : null);
`;
const options = {
  strict: true, declaration: true, emitDeclarationOnly: true, target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler ?? 100,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'], outDir: `${root}/__emit__`,
};
const host = ts.createCompilerHost(options);
const getSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (f, ...rest) => (f === fileName ? ts.createSourceFile(f, source, ts.ScriptTarget.ES2022, true) : getSourceFile(f, ...rest));
const fileExists = host.fileExists.bind(host);
host.fileExists = (f) => f === fileName || fileExists(f);
let emitted = '';
host.writeFile = (name, text) => { if (name.endsWith('__declarationEmit__.d.ts')) emitted = text; };

const program = ts.createProgram([fileName], options, host);
const result = program.emit();
const diagnostics = [...ts.getPreEmitDiagnostics(program), ...result.diagnostics];
let failures = 0;
for (const d of diagnostics) {
  failures++;
  console.error(`FAIL TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
}
if (!emitted) { failures++; console.error('FAIL no declaration file was emitted'); }
if (process.env.SHOW_EMIT) console.log(emitted);
console.log(` declaration emit (TypeScript ${ts.version}): ${failures ? 'FAILED' : 'ok'}`);
if (failures) process.exit(1);
