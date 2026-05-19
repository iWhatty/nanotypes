// ./src/scan.js
//
// Runtime scanner that walks `globalThis` and produces an instanceof map
// from every well-formed constructor it finds. Used by the optional
// `nanotypes/auto` subpath to augment the default (curated) surface with
// runtime-discovered globals (browser-only types not in the curated list,
// exotic platform APIs, user-installed globals).
//
// Importing this module does not run the scan; call
// `generateInstanceofMap()` explicitly when you want the result.


// Keys to exclude when checking isValidInstanceofType
const denylist = new Set([
  'Function',
  'Object',
  'Symbol',
  'Math',
  'JSON',
  'Reflect',
  'Crypto',
  'BigInt', // avoid confusion with primitive `bigint`
]);

function isValidInstanceofType([key, val]) {
  return (
    typeof val === 'function' &&
    typeof val.prototype === 'object' &&
    val.prototype !== null &&
    /^[A-Z]/.test(key) && // likely a constructor
    !denylist.has(key)
  );
}

export const aliasMap = {
  HTMLCanvasElement: 'canvas',
  HTMLVideoElement: 'video',
  HTMLAudioElement: 'audio',
  URL: 'url',
  URLSearchParams: 'urlSearchParams',
  URIError: 'uriError',
  DOMException: 'domException',
  // Crypto: 'cryptoConstructor', // only if you choose to expose this safely
};

function formatKey(name) {
  if (aliasMap[name]) return aliasMap[name];

  // Handle initialisms like URLPattern -> urlPattern, XMLHttpRequest -> xmlHttpRequest
  const m = name.match(/^[A-Z]+(?=[A-Z][a-z])/);
  if (m) {
    const head = m[0].toLowerCase();
    return head + name.slice(m[0].length);
  }

  return name[0].toLowerCase() + name.slice(1);
}

function safeGet(obj, key) {
  try { return obj[key]; } catch { return undefined; }
}

export function generateInstanceofMap() {

  const entries = Reflect.ownKeys(globalThis)
    .filter((k) => typeof k === "string")
    .map((k) => [k, safeGet(globalThis, k)])
    .filter(isValidInstanceofType)
    .map(([name, ctor]) => [formatKey(name), ctor]);

  // include nested Intl types
  if (typeof Intl === 'object' && Intl) {
    if (typeof Intl.DateTimeFormat === 'function') entries.push(['intlDateTimeFormat', Intl.DateTimeFormat]);
    if (typeof Intl.NumberFormat === 'function') entries.push(['intlNumberFormat', Intl.NumberFormat]);
    if (typeof Intl.Collator === 'function') entries.push(['intlCollator', Intl.Collator]);
  }

  return Object.fromEntries(entries);
}