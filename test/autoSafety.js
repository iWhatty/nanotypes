// ./test/autoSafety.js
// Fresh processes keep hostile globals and import-time discovery isolated.
import { spawnSync } from 'node:child_process';

export function runAutoSafety(label, entry) {
  let failures = 0;
  for (const setup of [
    "const p = Proxy.revocable(function () {}, {}); p.revoke(); globalThis.AuditHostile = p.proxy;",
    "globalThis.AuditHostile = new Proxy(function () {}, { get() { throw new Error('prototype trap'); } });",
    "Object.defineProperty(globalThis, 'AuditHostile', { get() { throw new Error('global getter'); } });",
  ]) {
    const script = `
      import assert from 'node:assert/strict';
      process.env.NODE_ENV = 'production';
      ${setup}
      class AuditWidget {}
      Object.defineProperty(globalThis, 'AuditWidget', { value: AuditWidget });
      globalThis.XMLHttpAudit = class {};
      Object.defineProperty(globalThis, Symbol('AuditSymbol'), { get() { throw new Error('symbol getter'); } });
      globalThis.AuditArrow = () => {};
      globalThis.AuditNull = function () {};
      globalThis.AuditNull.prototype = null;
      const { is, assertType } = await import(${JSON.stringify(entry.href)});
      assert.equal('auditHostile' in is, false);
      assert.equal('auditArrow' in is, false);
      assert.equal('auditNull' in is, false);
      assert.equal(is.auditWidget(new AuditWidget()), true);
      assert.equal(is.auditWidget({}), false);
      assert.equal(assertType.auditWidget(new AuditWidget()), undefined);
      assert.throws(() => assertType.auditWidget({}), TypeError);
      assert.equal(is.xmlHttpAudit(new globalThis.XMLHttpAudit()), true);
      assert.equal(is.string('text'), true);
    `;
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });
    if (run.status !== 0) {
      failures++;
      console.error(`FAIL [${label}] auto discovery: ${run.stderr || run.error}`);
    }
  }
  console.log(` auto discovery (${label}): ${failures ? 'FAILED' : 'ok'}`);
  return failures;
}
