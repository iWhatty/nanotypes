// ./test/guardSafety.js
//
// Shared battery for the "guards never throw, never run the value's code"
// contract, run against src/ by smokeTest.js and against the built dist/ by
// distSafety.js:
//
// 1. Every exported guard (named, `is.*`, /auto `is.*`) returns a strict
//    boolean and never throws on hostile values: revoked proxies, proxies
//    whose traps throw, throwing getters, Symbol.toPrimitive / toString /
//    valueOf traps.
// 1b. Exact values on those hostile values: a guard is true only when it can
//    verify its whole claim (docs/DESIGN.md, rule 2.1), so a revoked proxy
//    is isObjectLoose (typeof says so) and nothing else; every assert throws
//    exactly when its guard is false.
// 1c. The object family (isObject, isObjectLoose, isObjectStrict,
//    isPlainObject, isArray) against the docs/DESIGN.md decision table, and
//    every alias / namespace form is the same function.
// 2. No guard reads a property of the value (a recording `get` trap stays
//    silent), except the documented isObjectStrict (Symbol.toStringTag).
//    This includes /auto's scanner-added guards and the generic `is(x, C)`,
//    whose DEV mismatch warning used to read `x.constructor.name`.
// 3. isPlainObject is decided by Object.getPrototypeOf alone.
// 4. isFiniteNumber is Number.isFinite; isFinite is the same function.
// 5. Instanceof guards look the constructor up at call time.
// 6. Asserts throw their own TypeError on hostile values (describe.value
//    never throws, and never runs a `constructor` getter).

import { runInNewContext } from 'node:vm';

const boom = () => { throw new Error('user code ran'); };
const allTrapsThrow = () => ({
  get: boom, has: boom, ownKeys: boom, getOwnPropertyDescriptor: boom,
  getPrototypeOf: boom, set: boom, defineProperty: boom, deleteProperty: boom,
  apply: boom, construct: boom, isExtensible: boom, preventExtensions: boom,
});

function hostileCorpus() {
  const revocable = Proxy.revocable({}, {});
  revocable.revoke();
  const revokedArray = Proxy.revocable([], {});
  revokedArray.revoke();
  const revokedFunction = Proxy.revocable(function () {}, {});
  revokedFunction.revoke();
  const allTraps = allTrapsThrow();
  return [
    ['revoked proxy', revocable.proxy],
    ['revoked array proxy', revokedArray.proxy],
    ['revoked function proxy', revokedFunction.proxy],
    ['proxy, every trap throws', new Proxy({}, allTraps)],
    ['function proxy, every trap throws', new Proxy(function () {}, allTraps)],
    ['proxy, get throws', new Proxy({}, { get: boom })],
    ['proxy, getPrototypeOf throws', new Proxy({}, { getPrototypeOf: boom })],
    ['throwing getters', Object.defineProperties({}, {
      [Symbol.toStringTag]: { get: boom },
      [Symbol.toPrimitive]: { get: boom },
      constructor: { get: boom },
      toString: { get: boom },
      valueOf: { get: boom },
      isContentEditable: { get: boom },
    })],
    ['throwing conversions', { [Symbol.toPrimitive]: boom, toString: boom, valueOf: boom }],
    ['null prototype', Object.create(null)],
  ];
}

// For each hostile corpus value, the guards that can verify their whole
// claim and so return true. Every other guard must return false on it.
const OBJECTS = [
  'proxy, every trap throws', 'proxy, get throws', 'proxy, getPrototypeOf throws',
  'throwing getters', 'throwing conversions', 'null prototype',
];
const REVOKED = ['revoked proxy', 'revoked array proxy'];
const FUNCTIONS = ['function proxy, every trap throws', 'revoked function proxy'];
const TRUE_FOR = {
  // typeof is the only question a revoked proxy still answers.
  isObjectLoose: [...OBJECTS, ...REVOKED],
  // "Not an array" is unverifiable on a revoked proxy (Array.isArray throws).
  isObject: OBJECTS,
  // Reads Symbol.toStringTag: false when that read throws.
  isObjectStrict: ['proxy, getPrototypeOf throws', 'throwing conversions', 'null prototype'],
  // Object.getPrototypeOf only: false when it throws.
  isPlainObject: ['proxy, get throws', 'throwing getters', 'throwing conversions', 'null prototype'],
  isFunc: FUNCTIONS,
  // ToBoolean of any object is true and runs no code; `!== null` and
  // `!== undefined` likewise.
  isTruthy: [...OBJECTS, ...REVOKED, ...FUNCTIONS],
  isDefined: [...OBJECTS, ...REVOKED, ...FUNCTIONS],
};

// docs/DESIGN.md section 3. Columns: isObject, isObjectLoose,
// isObjectStrict, isPlainObject, isArray (T = true, F = false).
const FAMILY = ['isObject', 'isObjectLoose', 'isObjectStrict', 'isPlainObject', 'isArray'];
function objectFamilyTable() {
  const revoked = (t) => { const r = Proxy.revocable(t, {}); r.revoke(); return r.proxy; };
  class Foo {}
  class FakeHTMLDivElement { get [Symbol.toStringTag]() { return 'HTMLDivElement'; } }
  return [
    ['{}', {}, 'TTTTF'],
    ['Object.create(null)', Object.create(null), 'TTTTF'],
    ['Object.create({})', Object.create({}), 'TTTFF'],
    ['[]', [], 'FTFFT'],
    ['() => {}', () => {}, 'FFFFF'],
    ['class Foo', Foo, 'FFFFF'],
    ['new Foo()', new Foo(), 'TTTFF'],
    ['Math', Math, 'TTFTF'],
    ['JSON', JSON, 'TTFTF'],
    ['arguments', (function () { return arguments; })(), 'TTFTF'],
    ["new String('')", new String(''), 'TTFFF'],
    ['new Number(0)', new Number(0), 'TTFFF'],
    ['Object(1n)', Object(1n), 'TTFFF'],
    ['new Date()', new Date(), 'TTFFF'],
    ['new Map()', new Map(), 'TTFFF'],
    ['DOM-like tag', new FakeHTMLDivElement(), 'TTFFF'],
    ['vm {}', runInNewContext('({})'), 'TTTFF'],
    ['vm []', runInNewContext('[]'), 'FTFFT'],
    ['new Proxy({}, {})', new Proxy({}, {}), 'TTTTF'],
    ['new Proxy([], {})', new Proxy([], {}), 'FTFFT'],
    ['proxy of {}, every trap throws', new Proxy({}, allTrapsThrow()), 'TTFFF'],
    ['proxy of [], every trap throws', new Proxy([], allTrapsThrow()), 'FTFFT'],
    ['revoked proxy, {} target', revoked({}), 'FTFFF'],
    ['revoked proxy, [] target', revoked([]), 'FTFFF'],
    ['revoked proxy, function target', revoked(function () {}), 'FFFFF'],
    ['null', null, 'FFFFF'],
    ['undefined', undefined, 'FFFFF'],
    ["'str'", 'str', 'FFFFF'],
  ];
}
// Every other form of each family guard must be the same function.
const FAMILY_FORMS = {
  isObject: ['isObj', 'is.object', 'is.obj'],
  isObjectLoose: ['is.objectLoose'],
  isObjectStrict: ['is.objectStrict'],
  isPlainObject: ['isPojo', 'is.plainObject', 'is.pojo'],
  isArray: ['isArr', 'is.array', 'is.arr'],
};

/**
 * @param {string} label
 * @param {Record<string, any>} mod   default entry
 * @param {Record<string, any>} auto  /auto entry
 * @returns {number} failure count
 */
export function runGuardSafety(label, mod, auto) {
  let failures = 0;
  const fail = (message) => { failures++; console.error(`FAIL [${label}] ${message}`); };

  // Every guard on every surface. The bare generic `is(value, Type)` is
  // covered separately below.
  const guards = [];
  for (const [name, fn] of Object.entries(mod)) {
    if (/^is[A-Z]/.test(name) && typeof fn === 'function') guards.push([name, fn]);
  }
  for (const [key, fn] of Object.entries(mod.is)) guards.push([`is.${key}`, fn]);
  // /auto's scanner-added guards go through the generic matcher, which in
  // DEV logs `value.constructor.name` for a mismatch; only the curated keys
  // are held to the no-read rule.
  for (const [key, fn] of Object.entries(auto.is)) if (key in mod.is) guards.push([`auto is.${key}`, fn]);

  // 1. Never throws; strict boolean.
  const corpus = hostileCorpus();
  for (const [name, fn] of guards) {
    for (const [valueLabel, x] of corpus) {
      let got;
      try { got = fn(x); } catch (e) { fail(`${name}(${valueLabel}) threw: ${e?.message ?? e}`); continue; }
      if (typeof got !== 'boolean') fail(`${name}(${valueLabel}) returned ${typeof got}, not a boolean`);
    }
  }
  // The namespace's generic matcher logs mismatches in DEV; keep the run quiet.
  const warn = console.warn;
  console.warn = () => {};
  for (const [valueLabel, x] of corpus) {
    try {
      if (mod.is(x, Map) !== false) fail(`is(${valueLabel}, Map) is not false`);
      if (mod.is({}, x) !== false) fail(`is({}, ${valueLabel}) is not false`);
    } catch (e) { fail(`generic is threw on ${valueLabel}: ${e?.message ?? e}`); }
  }
  console.warn = warn;

  // 1b. Exact values on hostile values, every surface. Aliases and namespace
  // forms are the same function objects as the named export they mirror, so
  // a guard's expectations are found by identity.
  const trueFor = new Map();
  for (const [name, labels] of Object.entries(TRUE_FOR)) trueFor.set(mod[name], new Set(labels));
  let exactChecked = 0;
  for (const [name, fn] of guards) {
    const expected = trueFor.get(fn) ?? new Set();
    for (const [valueLabel, x] of corpus) {
      let got;
      try { got = fn(x); } catch { continue; } // reported by 1.
      exactChecked++;
      const want = expected.has(valueLabel);
      if (got !== want) fail(`${name}(${valueLabel}) is ${got}, expected ${want}`);
    }
  }
  // Asserts, named and namespace forms: throw a TypeError exactly when their
  // guard is false, on every hostile value.
  console.warn = () => {};
  const assertPairs = [];
  for (const [name, fn] of Object.entries(mod)) {
    if (!/^assert[A-Z]/.test(name) || name === 'assertType' || typeof fn !== 'function') continue;
    assertPairs.push([name, fn, mod['is' + name.slice(6)]]);
  }
  for (const [key, fn] of Object.entries(mod.assertType)) assertPairs.push([`assertType.${key}`, fn, mod.is[key]]);
  for (const [key, fn] of Object.entries(auto.assertType)) assertPairs.push([`auto assertType.${key}`, fn, auto.is[key]]);
  for (const [name, assert, guard] of assertPairs) {
    if (typeof guard !== 'function') { fail(`${name} has no matching guard`); continue; }
    for (const [valueLabel, x] of corpus) {
      let error = null;
      try { assert(x); } catch (e) { error = e; }
      const guardSays = guard(x);
      if (error && !(error instanceof TypeError && error.message.startsWith('Expected '))) {
        fail(`${name}(${valueLabel}) threw a foreign error: ${error?.message ?? error}`);
      } else if (Boolean(error) === guardSays) {
        fail(`${name}(${valueLabel}) ${error ? 'threw' : 'did not throw'}, but its guard is ${guardSays}`);
      }
    }
  }
  console.warn = warn;
  // The T-034 case spelled out: every object assert rejects a revoked proxy.
  for (const valueLabel of REVOKED) {
    const x = corpus.find(([l]) => l === valueLabel)[1];
    for (const [name, assert] of [
      ['assertObject', mod.assertObject], ['assertObj', mod.assertObj],
      ['assertType.object', mod.assertType.object], ['assertType.obj', mod.assertType.obj],
      ['auto assertType.object', auto.assertType.object], ['auto assertType.obj', auto.assertType.obj],
    ]) {
      let threw = false;
      try { assert(x); } catch (e) { threw = e instanceof TypeError; }
      if (!threw) fail(`${name}(${valueLabel}) should throw a TypeError`);
    }
  }

  // 1c. Object family decision table (docs/DESIGN.md section 3).
  for (const [name, forms] of Object.entries(FAMILY_FORMS)) {
    for (const form of forms) {
      const fn = form.startsWith('is.') ? mod.is[form.slice(3)] : mod[form];
      if (fn !== mod[name]) fail(`${form} is not the same function as ${name}`);
      const autoFn = form.startsWith('is.') ? auto.is[form.slice(3)] : auto[form];
      if (autoFn !== fn) fail(`/auto ${form} is not the same function as the default entry's`);
    }
  }
  const table = objectFamilyTable();
  for (const [valueLabel, x, row] of table) {
    FAMILY.forEach((name, i) => {
      const want = row[i] === 'T';
      let got;
      try { got = mod[name](x); } catch { fail(`${name}(${valueLabel}) threw`); return; }
      if (got !== want) fail(`${name}(${valueLabel}) is ${got}, expected ${want} (decision table)`);
    });
  }

  // 2. No property reads on the value. isObjectStrict reads
  // Symbol.toStringTag by definition (documented). Also every /auto
  // scanner-added guard, and the generic `is(x, C)` of both namespaces: in
  // DEV they warn on a mismatch, and the warning must not read the value.
  const READS_TAG = new Set(['isObjectStrict', 'is.objectStrict', 'auto is.objectStrict']);
  const noReadGuards = [...guards];
  for (const [key, fn] of Object.entries(auto.is)) if (!(key in mod.is)) noReadGuards.push([`auto is.${key}`, fn]);
  noReadGuards.push(['is(x, Map)', (x) => mod.is(x, Map)], ['auto is(x, Map)', (x) => auto.is(x, Map)]);
  let devWarned = false;
  console.warn = () => { devWarned = true; };
  for (const [name, fn] of noReadGuards) {
    if (READS_TAG.has(name)) continue;
    const reads = new Set();
    for (const target of [{}, [], () => {}]) {
      const spy = new Proxy(target, { get(t, k, r) { reads.add(String(k)); return Reflect.get(t, k, r); } });
      fn(spy);
    }
    if (reads.size) fail(`${name} read ${[...reads].join(', ')} from the value`);
  }
  console.warn = warn;

  // 3. isPlainObject: prototype only.
  const { isPlainObject, isPojo, isObjectStrict } = mod;
  const plain = [
    ['{}', {}],
    ['Object.create(null)', Object.create(null)],
    ['{ [Symbol.toStringTag]: "X" }', { [Symbol.toStringTag]: 'X' }],
    ['proxy of {}', new Proxy({}, {})],
  ];
  const notPlain = [
    ['[]', []],
    ['new Map()', new Map()],
    ['class instance', new (class Foo {})()],
    ['Object.create({})', Object.create({})],
    ['function', () => {}],
    ['null', null],
    ['"str"', 'str'],
    ['cross-realm {}', runInNewContext('({})')],
    ['proxy, getPrototypeOf throws', new Proxy({}, { getPrototypeOf: boom })],
    ['proxy claiming Map.prototype', new Proxy({}, { getPrototypeOf: () => Map.prototype })],
  ];
  for (const [l, x] of plain) if (isPlainObject(x) !== true) fail(`isPlainObject(${l}) should be true`);
  for (const [l, x] of notPlain) if (isPlainObject(x) !== false) fail(`isPlainObject(${l}) should be false`);
  if (isPojo !== isPlainObject) fail('isPojo is not the same function as isPlainObject');
  let tagGetterRan = false;
  isPlainObject({ get [Symbol.toStringTag]() { tagGetterRan = true; return 'Object'; } });
  if (tagGetterRan) fail('isPlainObject ran a Symbol.toStringTag getter');
  // isObjectStrict keeps its toString semantics.
  if (isObjectStrict({ [Symbol.toStringTag]: 'X' }) !== false) fail('isObjectStrict({ [Symbol.toStringTag]: "X" }) should stay false');
  if (isObjectStrict(new (class Foo {})()) !== true) fail('isObjectStrict(class instance) should stay true');
  if (isObjectStrict(runInNewContext('({})')) !== true) fail('isObjectStrict(cross-realm {}) should be true');

  // 4. isFiniteNumber / isFinite.
  const { isFiniteNumber, isFinite: isFiniteAlias } = mod;
  if (typeof isFiniteNumber !== 'function') fail('isFiniteNumber is not exported');
  else {
    if (isFiniteAlias !== isFiniteNumber) fail('isFinite is not the same function as isFiniteNumber');
    if (mod.is.finiteNumber !== isFiniteNumber || auto.is.finiteNumber !== isFiniteNumber) fail('is.finiteNumber missing');
    if (mod.is.finite !== isFiniteNumber) fail('is.finite changed');
    for (const x of [0, -1.5, Number.MAX_VALUE]) if (isFiniteNumber(x) !== true) fail(`isFiniteNumber(${x}) should be true`);
    for (const x of ['1', NaN, Infinity, -Infinity, null, true, 1n, new Number(1)]) {
      if (isFiniteNumber(x) !== false) fail(`isFiniteNumber(${String(x)}) should be false (no coercion)`);
    }
  }
  for (const [name, message] of [['assertFiniteNumber', 'Expected finiteNumber'], ['assertFinite', 'Expected finite']]) {
    const fn = mod[name];
    if (typeof fn !== 'function') { fail(`${name} is not exported`); continue; }
    try { fn(1); } catch { fail(`${name}(1) threw`); }
    try { fn('1'); fail(`${name}('1') did not throw`); } catch (e) {
      if (!(e instanceof TypeError) || !e.message.startsWith(`${message}, got `)) fail(`${name}('1') threw ${e?.message}`);
    }
  }
  if (typeof mod.assertType.finiteNumber !== 'function') fail('assertType.finiteNumber missing');

  // 5. Constructor looked up at call time: a global installed after import
  // (jsdom, polyfills) is seen, and removing it returns false again.
  const hadHtmlElement = Object.prototype.hasOwnProperty.call(globalThis, 'HTMLElement');
  if (!hadHtmlElement) {
    class HTMLElement {}
    const el = new HTMLElement();
    if (mod.isHtmlElement(el) !== false) fail('isHtmlElement before install should be false');
    globalThis.HTMLElement = HTMLElement;
    try {
      if (mod.isHtmlElement(el) !== true) fail('isHtmlElement does not see a global installed after import');
      el.isContentEditable = true;
      if (mod.isContentEditable(el) !== true) fail('isContentEditable(editable element) should be true');
      Object.defineProperty(el, 'isContentEditable', { get: boom });
      if (mod.isContentEditable(el) !== false) fail('isContentEditable with a throwing getter should be false');
    } finally {
      delete globalThis.HTMLElement;
    }
    if (mod.isHtmlElement(el) !== false) fail('isHtmlElement after removal should be false');
  }

  // 6. Asserts throw their own TypeError, whatever the value.
  for (const name of ['assertObject', 'assertString', 'assertPlainObject', 'assertMap', 'assertArray']) {
    for (const [valueLabel, x] of corpus) {
      try { mod[name](x); } catch (e) {
        if (!(e instanceof TypeError) || !e.message.startsWith('Expected ')) fail(`${name}(${valueLabel}) threw a foreign error: ${e?.message ?? e}`);
      }
    }
  }
  for (const [valueLabel, x] of corpus) {
    try {
      const d = mod.describe.value(x);
      if (typeof d !== 'string') fail(`describe.value(${valueLabel}) is not a string`);
    } catch (e) { fail(`describe.value(${valueLabel}) threw: ${e?.message ?? e}`); }
  }
  if (mod.describe.value(new Map()) !== 'Map') fail('describe.value(new Map()) changed');
  if (mod.describe.value([]) !== 'Array') fail('describe.value([]) changed');
  if (mod.describe.value(Object.create(null)) !== 'Object(null prototype)') fail('describe.value(null proto) changed');
  // describe.value names the value by its prototype chain's own
  // `constructor` data property; it never calls a getter on the value.
  let ctorGetterRan = false;
  const sneaky = { get constructor() { ctorGetterRan = true; return Map; } };
  const sneakyName = mod.describe.value(sneaky);
  if (ctorGetterRan) fail('describe.value ran a constructor getter on the value');
  if (sneakyName !== 'Object') fail(`describe.value(constructor getter) is ${sneakyName}, expected Object (from the prototype)`);
  class Foo {}
  for (const [l, x, want] of [
    ['new Foo()', new Foo(), 'Foo'],
    ['Object.create(Object.create(Map.prototype))', Object.create(Object.create(Map.prototype)), 'Map'],
    ['vm new Map()', runInNewContext('new Map()'), 'Map'],
    ['{}', {}, 'Object'],
    ['revoked proxy', corpus[0][1], 'object'],
    ['proxy, every trap throws', new Proxy({}, allTrapsThrow()), 'object'],
  ]) {
    const got = mod.describe.value(x);
    if (got !== want) fail(`describe.value(${l}) is ${got}, expected ${want}`);
  }

  console.log(` guard safety (${label}): ${guards.length} guards x ${corpus.length} hostile values (${exactChecked} exact values), ${assertPairs.length} asserts, object table ${table.length} rows, DEV warnings ${devWarned ? 'exercised' : 'off'}: ${failures ? 'FAILED' : 'ok'}`);
  return failures;
}
