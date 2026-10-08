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
// 2. No guard reads a property of the value (a recording `get` trap stays
//    silent), except the documented isObjectStrict (Symbol.toStringTag).
// 3. isPlainObject is decided by Object.getPrototypeOf alone.
// 4. isFiniteNumber is Number.isFinite; isFinite is the same function.
// 5. Instanceof guards look the constructor up at call time.
// 6. Asserts throw their own TypeError on hostile values (describe.value
//    never throws).

import { runInNewContext } from 'node:vm';

const boom = () => { throw new Error('user code ran'); };

function hostileCorpus() {
  const revocable = Proxy.revocable({}, {});
  revocable.revoke();
  const revokedArray = Proxy.revocable([], {});
  revokedArray.revoke();
  const allTraps = {
    get: boom, has: boom, ownKeys: boom, getOwnPropertyDescriptor: boom,
    getPrototypeOf: boom, set: boom, defineProperty: boom, deleteProperty: boom,
    apply: boom, construct: boom, isExtensible: boom, preventExtensions: boom,
  };
  return [
    ['revoked proxy', revocable.proxy],
    ['revoked array proxy', revokedArray.proxy],
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

  // 2. No property reads on the value. isObjectStrict reads
  // Symbol.toStringTag by definition (documented).
  const READS_TAG = new Set(['isObjectStrict', 'is.objectStrict', 'auto is.objectStrict']);
  for (const [name, fn] of guards) {
    if (READS_TAG.has(name)) continue;
    for (const target of [{}, [], () => {}]) {
      const reads = [];
      const spy = new Proxy(target, { get(t, k, r) { reads.push(String(k)); return Reflect.get(t, k, r); } });
      fn(spy);
      if (reads.length) fail(`${name} read ${reads.join(', ')} from the value`);
    }
  }

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

  console.log(` guard safety (${label}): ${guards.length} guards x ${corpus.length} hostile values ${failures ? 'FAILED' : 'ok'}`);
  return failures;
}
