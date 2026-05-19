// ./test/smokeTest.js
//
// Runs the same guard battery against:
//   1. the default entry's legacy `is` namespace (curated static)
//   2. the /auto entry's namespace (static + scanner-augmented)
//   3. the new per-guard named exports (tree-shakeable surface)
//
// Exits non-zero if any assertion fails or if /auto's surface is not a
// superset of default.

console.log('\n== nanotypes smoke test ==');

// Disable DEV warnings for this smoke run.
process.env.NODE_ENV = 'production';

const [defaultMod, autoMod, describeMod] = await Promise.all([
  import('../src/index.js'),
  import('../src/auto.js'),
  import('../src/describe.js'),
]);

const tests = [
  ['map', new Map()],
  ['set', new Set()],
  ['promise', Promise.resolve()],
  ['date', new Date()],
  ['error', new Error('Oops')],
  ['blob', typeof Blob !== 'undefined' ? new Blob() : null],
  ['canvas', typeof HTMLCanvasElement !== 'undefined' ? document.createElement('canvas') : null],
  ['worker', typeof Worker !== 'undefined' ? new Worker(URL.createObjectURL(new Blob(['']))) : null],
  ['intlDateTimeFormat', new Intl.DateTimeFormat()],
  ['url', new URL('https://example.com')],
  ['objectStrict', {}],
  ['plainObject', {}],
  ['array', []],
  ['numberSafe', 42],
  ['number', NaN],
];

const negatives = {
  map: {}, set: {}, promise: {}, date: {}, error: {}, blob: {},
  canvas: {}, worker: {}, intlDateTimeFormat: {}, url: {},
  objectStrict: new Map(),
  plainObject: new Map(),
  array: {},
  numberSafe: NaN,
  number: 'not-a-number',
};

const defaultNegative = '___nanotypes_negative___';

function runNamespaceBattery(label, { is }) {
  console.log(`\n--- ${label} (namespace) ---`);

  for (const [name, val] of tests) {
    if (val === null) {
      console.log(`is.${name} not supported in this environment`);
      continue;
    }

    const fn = is[name];
    if (typeof fn !== 'function') {
      console.error(`is.${name}: NO GUARD`);
      process.exitCode = 1;
      continue;
    }

    try {
      const ok = Boolean(fn(val));
      const negVal = Object.prototype.hasOwnProperty.call(negatives, name) ? negatives[name] : defaultNegative;
      const bad = Boolean(fn(negVal));

      console.log(`is.${name}:`, ok, '| negative:', bad);

      if (ok !== true || bad !== false) process.exitCode = 1;
    } catch (e) {
      console.error(`is.${name} threw error:`, e);
      process.exitCode = 1;
    }
  }
}

runNamespaceBattery('default', defaultMod);
runNamespaceBattery('/auto', autoMod);

// --- Per-guard named exports (the wave-3 win) ---
console.log('\n--- per-guard named exports (tree-shakeable surface) ---');

const namedSamples = [
  ['isString', defaultMod.isString, 'hello', 42],
  ['isStr', defaultMod.isStr, 'hello', 42],
  ['isNumber', defaultMod.isNumber, 42, 'x'],
  ['isNum', defaultMod.isNum, 42, 'x'],
  ['isBool', defaultMod.isBool, true, 'x'],
  ['isObject', defaultMod.isObject, {}, []],
  ['isObj', defaultMod.isObj, {}, []],
  ['isArray', defaultMod.isArray, [], {}],
  ['isArr', defaultMod.isArr, [], {}],
  ['isDefined', defaultMod.isDefined, 42, null],
  ['isMap', defaultMod.isMap, new Map(), {}],
  ['isDate', defaultMod.isDate, new Date(), {}],
  ['isUrl', defaultMod.isUrl, new URL('https://example.com'), {}],
];

for (const [name, fn, pos, neg] of namedSamples) {
  if (typeof fn !== 'function') {
    console.error(`${name}: NOT EXPORTED`);
    process.exitCode = 1;
    continue;
  }
  const ok = Boolean(fn(pos));
  const bad = Boolean(fn(neg));
  console.log(`${name}: ${ok} | negative: ${bad}`);
  if (ok !== true || bad !== false) process.exitCode = 1;
}

// --- Per-assert named exports throw correctly ---
console.log('\n--- per-assert named exports (throwing behavior) ---');

const assertSamples = [
  ['assertString', defaultMod.assertString, 'hello', 42],
  ['assertObject', defaultMod.assertObject, {}, []],
  ['assertNumberSafe', defaultMod.assertNumberSafe, 42, NaN],
];

for (const [name, fn, pos, neg] of assertSamples) {
  if (typeof fn !== 'function') {
    console.error(`${name}: NOT EXPORTED`);
    process.exitCode = 1;
    continue;
  }
  let posOk = false;
  try { fn(pos); posOk = true; } catch (e) { posOk = false; }
  let negThrew = false;
  try { fn(neg); } catch (e) { negThrew = true; }
  console.log(`${name}: positive-no-throw=${posOk} | negative-throws=${negThrew}`);
  if (!posOk || !negThrew) process.exitCode = 1;
}

// --- Null-proto describe check ---
console.log('\n describe.value(Object.create(null)):', describeMod.describe.value(Object.create(null)));

// --- /auto must be a superset of default ---
const defaultKeys = new Set(Object.keys(defaultMod.is));
const autoKeys = new Set(Object.keys(autoMod.is));

console.log('\n default surface size:', defaultKeys.size);
console.log(' /auto   surface size:', autoKeys.size);
console.log(' /auto-only keys:', [...autoKeys].filter((k) => !defaultKeys.has(k)).sort().join(', '));

for (const k of defaultKeys) {
  if (!autoKeys.has(k)) {
    console.error(`/auto is missing default guard: is.${k}`);
    process.exitCode = 1;
  }
}
