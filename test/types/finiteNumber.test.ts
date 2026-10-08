// ./test/types/finiteNumber.test.ts
//
// isFiniteNumber (0.2.6) and its deprecated alias isFinite narrow to number
// on every surface, checked against the built dist/index.d.ts.
import {
  assertFinite,
  assertFiniteNumber,
  assertType,
  is,
  isFinite,
  isFiniteNumber,
} from '../../dist/index.js';

declare const u: unknown;

if (isFiniteNumber(u)) { const n: number = u; void n; }
if (isFinite(u)) { const n: number = u; void n; }
if (is.finiteNumber(u)) { const n: number = u; void n; }
if (is.finite(u)) { const n: number = u; void n; }

function a(x: unknown) { assertFiniteNumber(x); const n: number = x; void n; }
function b(x: unknown) { assertFinite(x); const n: number = x; void n; }
function c(x: unknown) { assertType.finiteNumber(x); const n: number = x; void n; }
void a; void b; void c;
