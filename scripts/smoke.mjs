import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readConfig } from '../runtime/config.mjs';

const config = readConfig();
const base = process.env.BASE_URL || 'http://127.0.0.1:18309';
const phase = process.argv[2] || 'baseline';
const project = process.env.REPORT_PROJECT_DIR || resolve('project');
const authorization = config.authorization;
const request = (path, options = {}) => fetch(`${base}${path}`, { ...options, redirect: 'manual', signal: AbortSignal.timeout(15000) });
const deadline = Date.now() + 60000;
let ready = false;
while (Date.now() < deadline && !ready) {
  try { ready = (await request('/readyz')).status === 200; } catch {}
  if (!ready) await new Promise((resolve) => setTimeout(resolve, 500));
}
assert.ok(ready, 'Fresh application/database readiness timed out');
for (const path of ['/', '/freshness', '/reconciliation', '/report-pack.txt', '/api/query', '/connection.yaml']) {
  assert.equal((await request(path)).status, 401, `Anonymous access accepted: ${path}`);
  assert.equal((await request(path, { headers: { authorization: 'Basic aW52YWxpZDppbnZhbGlk' } })).status, 401, `Invalid credentials accepted: ${path}`);
}
assert.equal((await request('/api/query', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"sql":"select 1"}' })).status, 401);
for (const path of ['/', '/freshness', '/reconciliation']) {
  const response = await request(path, { headers: { authorization } });
  assert.equal(response.status, 200, `Authenticated report HTML unavailable: ${path}`);
  const html = await response.text();
  assert.match(html, /freshness|reconciliation/i);
  assert.match(response.headers.get('cache-control'), /no-store/);
  if (path === '/') {
    const assets = [...html.matchAll(/(?:src|href)=["']([^"']*\/_app\/immutable\/[^"']+)["']/g)]
      .map((match) => match[1].startsWith('/') ? match[1] : `/${match[1].replace(/^\.\//, '')}`);
    assert.ok(assets.length > 0, 'Rendered page must reference embedded Evidence assets');
    for (const asset of [...new Set(assets)].slice(0, 4)) {
      assert.equal((await request(asset)).status, 401, `Embedded asset unprotected: ${asset}`);
      assert.equal((await request(asset, { headers: { authorization: 'Basic aW52YWxpZDppbnZhbGlk' } })).status, 401);
      assert.equal((await request(asset, { headers: { authorization } })).status, 200);
    }
  }
}
assert.equal((await request('/connection.yaml', { headers: { authorization } })).status, 404);
assert.equal((await request('/login', { headers: { authorization } })).status, 404);
assert.equal((await request('/api/auth/status', { headers: { authorization } })).status, 404);
const staticResponse = await request('/report-pack.txt', { headers: { authorization } });
assert.equal(staticResponse.status, 200);
const releaseVersion = (await readFile(new URL('../VERSION', import.meta.url), 'utf8')).trim();
assert.ok((await staticResponse.text()).includes(`report pack v${releaseVersion}.`));

async function query(sql, expectSuccess = true) {
  const response = await request('/api/query', { method: 'POST', headers: { authorization, 'content-type': 'application/json' }, body: JSON.stringify({ sql }) });
  const result = await response.json();
  if (expectSuccess) { assert.equal(response.status, 200, 'Fixture query failed'); assert.equal(result.error, undefined); }
  else { assert.ok(!response.ok || result.error, 'Restricted database role accepted a write'); }
  return result.rows;
}
for (const statement of ["update reporting.orders set amount = 0 where order_id = 1001", 'create table reporting.forbidden(id integer)',
  'set default_transaction_read_only = off; delete from reporting.orders where order_id = 1001']) {
  await query(statement, false);
}
const sqlFrom = async (filename, queryName) => {
  const markdown = await readFile(resolve(project, 'pages', filename), 'utf8');
  return markdown.match(new RegExp('```sql ' + queryName + '\\n([\\s\\S]*?)```'))[1];
};
const freshness = await query(await sqlFrom('freshness.md', 'freshness'));
assert.equal(freshness.find((row) => row.pipeline === 'orders').freshness_status, 'FRESH');
assert.equal(freshness.find((row) => row.pipeline === 'customers').freshness_status, 'NEVER');
assert.equal(freshness.find((row) => row.pipeline === 'payments').freshness_status, phase === 'baseline' ? 'STALE' : 'FRESH');
const reconciliation = await query(await sqlFrom('reconciliation.md', 'reconciliation'));
const expected = { 1001: 'MATCH', 1002: phase === 'baseline' ? 'MISMATCH' : 'MATCH', 1003: 'MISSING', 1004: 'CURRENCY', 1005: 'DUPLICATE', 9999: 'ORPHAN' };
for (const [orderId, status] of Object.entries(expected)) {
  assert.equal(reconciliation.find((row) => Number(row.order_id) === Number(orderId)).reconciliation_status, status);
}
assert.equal(Number(reconciliation.find((row) => Number(row.order_id) === 1002).difference), phase === 'baseline' ? -5 : 0);
console.log(`PASS ${phase}: authenticated reports/assets, anonymous and wrong-password rejection, read-only SQL, freshness and reconciliation`);
