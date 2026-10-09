// ./test/types/aliases.test.ts
//
// Ecosystem-name aliases (0.4.0) narrow exactly like the guard they alias,
// on every surface, checked against the built dist/index.d.ts:
//   isObjectLike   = isObjectLoose  (lodash's isObjectLike; docs/DESIGN.md P1)
import {
  assertObjectLike,
  assertObjectLoose,
  assertType,
  is,
  isObjectLike,
  isObjectLoose,
} from '../../dist/index.js';

type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false;
const expectType = <T extends true>() => {};

// --- isObjectLike: the same declaration as isObjectLoose ---
expectType<Equal<typeof isObjectLike, typeof isObjectLoose>>();
expectType<Equal<typeof is.objectLike, typeof is.objectLoose>>();
expectType<Equal<typeof assertObjectLike, typeof assertObjectLoose>>();
expectType<Equal<typeof assertType.objectLike, typeof assertType.objectLoose>>();

declare const u1: unknown;
if (isObjectLike(u1)) { const o: object = u1; void o; }
declare const u2: unknown;
if (is.objectLike(u2)) { const o: object = u2; void o; }
function a1(x: unknown) { assertObjectLike(x); const o: object = x; void o; }
function a2(x: unknown) { assertType.objectLike(x); const o: object = x; void o; }
void a1; void a2;
