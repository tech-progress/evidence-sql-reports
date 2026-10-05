import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfig, roleIsSafe } from '../runtime/config.mjs';

const environment = {
  EVIDENCE_BASIC_USER: 'reader', EVIDENCE_BASIC_PASSWORD: 'a'.repeat(32),
  REPORT_DB_HOST: 'postgres', REPORT_DB_NAME: 'reports', REPORT_DB_USER: 'evidence_reader',
  REPORT_DB_PASSWORD: 'b'.repeat(32), REPORT_DB_SSLMODE: 'disable',
};
test('runtime accepts explicit generated credentials and Railway PORT', () => {
  assert.equal(readConfig({ ...environment, PORT: '8080' }).port, 8080);
});
test('every missing credential is rejected without printing secret values', () => {
  for (const key of Object.keys(environment)) {
    assert.throws(() => readConfig({ ...environment, [key]: '' }), /Required variable missing/);
  }
});
test('auth bypass, weak passwords, invalid ports and weak TLS modes fail closed', () => {
  for (const invalid of [{ EVIDENCE_AUTH_DISABLED: 'true' }, { EVIDENCE_BASIC_PASSWORD: 'password' },
    { REPORT_DB_PASSWORD: 'password' }, { PORT: '3001' }, { PORT: 'invalid' },
    { REPORT_DB_SSLMODE: 'require' }, { EVIDENCE_BASIC_USER: 'bad:name' }]) {
    assert.throws(() => readConfig({ ...environment, ...invalid }));
  }
});
test('readiness requires every least-privilege condition', () => {
  const safe = { read_only: true, restricted_role: true, no_schema_write: true, select_only: true, warehouse_available: true };
  assert.equal(roleIsSafe(safe), true);
  for (const key of Object.keys(safe)) assert.equal(roleIsSafe({ ...safe, [key]: false }), false);
  assert.equal(roleIsSafe({}), false);
});
