// ./src/instanceof-static.js
//
// Hand-curated map of well-known global constructors that map to
// is.<name> guards. Each entry is feature-detected at module load — guards
// for constructors that aren't present in the current runtime are simply
// not added to the map.
//
// This is the default surface. For auto-discovery of additional globals
// (browser-only types not listed here, exotic platform APIs, custom
// globals), import from `nanotypes/auto` instead.

const G = globalThis;

const entries = [
  // === Universal collections ===
  ['map', G.Map],
  ['set', G.Set],
  ['weakMap', G.WeakMap],
  ['weakSet', G.WeakSet],

  // === Universal core ===
  ['date', G.Date],
  ['regExp', G.RegExp],
  ['error', G.Error],
  ['typeError', G.TypeError],
  ['rangeError', G.RangeError],
  ['syntaxError', G.SyntaxError],
  ['referenceError', G.ReferenceError],
  ['uriError', G.URIError],
  ['promise', G.Promise],

  // === Buffers / typed arrays ===
  ['arrayBuffer', G.ArrayBuffer],
  ['dataView', G.DataView],
  ['int8Array', G.Int8Array],
  ['uint8Array', G.Uint8Array],
  ['uint8ClampedArray', G.Uint8ClampedArray],
  ['int16Array', G.Int16Array],
  ['uint16Array', G.Uint16Array],
  ['int32Array', G.Int32Array],
  ['uint32Array', G.Uint32Array],
  ['float32Array', G.Float32Array],
  ['float64Array', G.Float64Array],
  ['bigInt64Array', G.BigInt64Array],
  ['bigUint64Array', G.BigUint64Array],

  // === URL / search (browser, worker, Node 19+) ===
  ['url', G.URL],
  ['urlSearchParams', G.URLSearchParams],

  // === Fetch (browser, worker, Node 18+) ===
  ['headers', G.Headers],
  ['request', G.Request],
  ['response', G.Response],
  ['formData', G.FormData],
  ['blob', G.Blob],
  ['file', G.File],

  // === DOM (browser; jsdom/happy-dom too) ===
  ['element', G.Element],
  ['htmlElement', G.HTMLElement],
  ['node', G.Node],
  ['document', G.Document],
  ['window', G.Window],
  ['textNode', G.Text],
  ['comment', G.Comment],
  ['canvas', G.HTMLCanvasElement],
  ['video', G.HTMLVideoElement],
  ['audio', G.HTMLAudioElement],
  ['image', G.HTMLImageElement],
  ['fileList', G.FileList],

  // === DOM events ===
  ['inputEvent', G.InputEvent],
  ['keyboardEvent', G.KeyboardEvent],
  ['mouseEvent', G.MouseEvent],
  ['focusEvent', G.FocusEvent],

  // === Worker family ===
  ['worker', G.Worker],
  ['sharedWorker', G.SharedWorker],
  ['broadcastChannel', G.BroadcastChannel],
];

const instanceofMap = {};
for (const [name, ctor] of entries) {
  if (typeof ctor === 'function') instanceofMap[name] = ctor;
}

// Intl is nested; check each format separately
if (typeof Intl === 'object' && Intl) {
  if (typeof Intl.DateTimeFormat === 'function') instanceofMap.intlDateTimeFormat = Intl.DateTimeFormat;
  if (typeof Intl.NumberFormat === 'function')   instanceofMap.intlNumberFormat   = Intl.NumberFormat;
  if (typeof Intl.Collator === 'function')       instanceofMap.intlCollator       = Intl.Collator;
}

export { instanceofMap };
