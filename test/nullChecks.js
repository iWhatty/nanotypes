// ./test/nullChecks.js
//
// Shared battery for the null-check family, run against src/ by
// smokeTest.js and against the built dist/ by distSafety.js:
//
//   isNull / isNil      strictly null           (x === null)
//   isNullish           null or undefined       (x == null; lodash's isNil)
//   isDefined           neither                 (x != null)
//   isNonNullish        neither; same function as isDefined (0.4.0, remeda's name)
//
// Every surface (named export, `is.*`, and the /auto `is.*`) must agree with
// the plain JS comparison on every corpus value, and every assert must throw
// a TypeError exactly when its guard is false.

const corpus = [
  ['null', null],
  ['undefined', undefined],
  ['0', 0],
  ['-0', -0],
  ["''", ''],
  ["'null'", 'null'],
  ['false', false],
  ['NaN', NaN],
  ['0n', 0n],
  ['{}', {}],
  ['[]', []],
  ['Object.create(null)', Object.create(null)],
  ['() => null', () => null],
];

const family = [
  { guard: 'isNull', assert: 'assertNull', key: 'null', message: 'Expected null', expect: (x) => x === null },
  { guard: 'isNil', assert: 'assertNil', key: 'nil', message: 'Expected nil', expect: (x) => x === null },
  { guard: 'isNullish', assert: 'assertNullish', key: 'nullish', message: 'Expected nullish', expect: (x) => x == null },
  { guard: 'isDefined', assert: 'assertDefined', key: 'defined', message: 'Expected defined', expect: (x) => x != null },
  // An alias keeps its canonical assert's message.
  { guard: 'isNonNullish', assert: 'assertNonNullish', key: 'nonNullish', message: 'Expected defined', expect: (x) => x != null },
];

function throwsTypeError(fn, x) {
  try {
    fn(x);
    return null;
  } catch (e) {
    return e instanceof TypeError ? e : 'non-TypeError';
  }
}

/**
 * @param {string} label
 * @param {Record<string, any>} mod   default entry (named exports + is + assertType)
 * @param {Record<string, any>} auto  /auto entry
 * @returns {number} failure count
 */
export function runNullChecks(label, mod, auto) {
  let failures = 0;
  const fail = (message) => { failures++; console.error(`FAIL [${label}] ${message}`); };

  for (const { guard, assert, key, message, expect } of family) {
    const guards = {
      [guard]: mod[guard],
      [`is.${key}`]: mod.is?.[key],
      [`auto is.${key}`]: auto.is?.[key],
      [`auto ${guard}`]: auto[guard],
    };
    const asserts = {
      [assert]: mod[assert],
      [`assertType.${key}`]: mod.assertType?.[key],
      [`auto assertType.${key}`]: auto.assertType?.[key],
    };
    const missing = [...Object.entries(guards), ...Object.entries(asserts)]
      .filter(([, fn]) => typeof fn !== 'function');
    for (const [name] of missing) fail(`${name}: not a function`);
    if (missing.length) continue;

    for (const [valueLabel, x] of corpus) {
      const want = expect(x);
      for (const [name, fn] of Object.entries(guards)) {
        const got = fn(x);
        if (got !== want) fail(`${name}(${valueLabel}) returned ${String(got)}, expected ${want}`);
      }
      for (const [name, fn] of Object.entries(asserts)) {
        const err = throwsTypeError(fn, x);
        if (want && err) fail(`${name}(${valueLabel}) threw: ${err.message ?? err}`);
        if (!want && !err) fail(`${name}(${valueLabel}) did not throw`);
        if (err === 'non-TypeError') fail(`${name}(${valueLabel}) threw a non-TypeError`);
        else if (err && !err.message.startsWith(`${message}, got `)) fail(`${name}(${valueLabel}) message: ${err.message}`);
      }
    }
  }

  // isNil stays an exact alias of isNull (strictly null, not lodash's isNil).
  if (mod.isNil !== mod.isNull) fail('isNil is not the same function as isNull');
  if (mod.isNil(undefined) !== false) fail('isNil(undefined) must stay false');
  // isNonNullish is isDefined under remeda's name; isDefined keeps `!= null`
  // (null is rejected), unlike remeda's and ts-extras' isDefined.
  if (mod.isNonNullish !== mod.isDefined) fail('isNonNullish is not the same function as isDefined');
  if (mod.assertNonNullish !== mod.assertDefined) fail('assertNonNullish is not the same function as assertDefined');
  if (mod.isDefined(null) !== false) fail('isDefined(null) must stay false');

  console.log(` null checks (${label}): ${family.length} guards x ${corpus.length} values ${failures ? 'FAILED' : 'ok'}`);
  return failures;
}
