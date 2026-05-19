// ./test/smokeTest.js
//
// Runs the same guard battery against both the default entry (curated
// static surface) and the /auto entry (scanner-augmented surface). The
// default exit code is non-zero if any assertion fails.

console.log('\n== Type Check Smoke Test ==');

// Disable DEV warnings for this smoke run.
// env.js reads NODE_ENV during module evaluation, so set it before importing.
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

function runBattery(label, { is }) {
  console.log(`\n--- ${label} ---`);

  for (const [name, val] of tests) {
    if (val === null) {
      console.log(`is.${name} not supported in this environment`);
      continue;
    }

    const fn = is[name];
    if (typeof fn !== 'function') {
      console.log(`is.${name}: no guard`);
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

runBattery('default (curated static)', defaultMod);
runBattery('/auto (static + scanner)', autoMod);

// Null-proto behavior check
const nullProto = Object.create(null);
console.log('\n describe.value(Object.create(null)):', describeMod.describe.value(nullProto));

// Surface comparison: /auto should always have >= default surface
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
