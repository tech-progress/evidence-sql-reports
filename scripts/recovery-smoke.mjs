import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifactRoot = resolve(root, 'artifacts/recovery-20261005');
export const defaultPostgresImage = 'postgres:16.15-bookworm@sha256:efedf3595f1d6f415c08568ba171029bf54052e754cc9f030e3f2412b21f3d67';
export const ownershipLabel = 'railway.template.recovery.run';

export function parseArguments(argumentsList) {
  const options = { postgresImage: defaultPostgresImage };
  const seen = new Set();
  const flags = { '--reports-image': 'reportsImage', '--warehouse-image': 'warehouseImage', '--postgres-image': 'postgresImage' };
  for (let index = 0; index < argumentsList.length; index += 2) {
    const key = flags[argumentsList[index]];
    const value = argumentsList[index + 1];
    assert.ok(key && value && !value.startsWith('-') && !/\s/.test(value), 'Expected an image flag and a single cached image reference');
    assert.ok(!seen.has(key), 'Duplicate image flag');
    seen.add(key);
    options[key] = value;
  }
  assert.ok(options.reportsImage && options.warehouseImage, '--reports-image and --warehouse-image are required');
  return options;
}

export function immutableImageId(value) {
  assert.match(value, /^sha256:[a-f0-9]{64}$/, 'Cached image must resolve to a full immutable image ID');
  return value;
}

export function ownedName(runId, suffix) {
  assert.match(runId, /^[a-f0-9]{24}$/);
  assert.match(suffix, /^[a-z][a-z0-9-]*$/);
  return `rt-evidence-recovery-${runId}-${suffix}`;
}

export function prepareRoleDump(source) {
  assert.ok(!source.includes('\u0000'), 'Invalid role dump');
  const created = [...source.matchAll(/^CREATE ROLE ([a-z_]+);$/gm)].map((match) => match[1]).sort();
  assert.deepEqual(created, ['evidence_reader', 'postgres'], 'Role dump must contain exactly the fixture roles');
  for (const line of source.split('\n')) {
    if (/^\s*\\/.test(line)) assert.match(line, /^\\(?:un)?restrict [A-Za-z0-9]+$/, 'Unsafe role dump meta-command');
    if (/^(?:CREATE|ALTER|DROP|GRANT|REVOKE)\b/.test(line)) {
      assert.match(line, /^(?:CREATE ROLE|ALTER ROLE) (?:evidence_reader|postgres)(?:;| )/, 'Unexpected role dump command');
    }
  }
  return source.replace(/^CREATE ROLE postgres;(?:\r?\n|$)/m, '');
}

export function assertEquivalent(before, after) {
  assert.deepEqual(after, before, 'Restored logical data, schema, indexes, grants or private role metadata differ');
}

export function containerArguments({ name, runId, network, imageId, environmentFile, volume, alias }) {
  const argumentsList = ['run', '--detach', '--pull=never', '--name', name, '--label', `${ownershipLabel}=${runId}`,
    '--network', network, '--env-file', environmentFile, '--log-driver', 'none'];
  if (alias) argumentsList.push('--network-alias', alias);
  if (volume) argumentsList.push('--mount', `type=volume,source=${volume},target=/var/lib/postgresql/data`);
  argumentsList.push(immutableImageId(imageId));
  return argumentsList;
}

async function nativeProbe({ phase, sqlQueries }) {
  const assert = (await import('node:assert/strict')).default;
  const authorization = `Basic ${Buffer.from(`${process.env.EVIDENCE_BASIC_USER}:${process.env.EVIDENCE_BASIC_PASSWORD}`).toString('base64')}`;
  const wrongAuthorization = `Basic ${Buffer.from(`${process.env.EVIDENCE_BASIC_USER}:incorrect-recovery-password`).toString('base64')}`;
  const request = (path, options = {}) => fetch(`http://127.0.0.1:3000${path}`, {
    ...options, redirect: 'manual', signal: AbortSignal.timeout(10000),
  });
  const deadline = Date.now() + 60000;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    try { ready = (await request('/readyz')).status === 200; } catch {}
    if (!ready) await new Promise((complete) => setTimeout(complete, 500));
  }
  assert.ok(ready, 'Native readiness timed out');
  let authRejections = 0;
  const deny = async (path, method = 'GET') => {
    for (const headers of [{}, { authorization: wrongAuthorization }]) {
      const response = await request(path, { method, headers: { ...headers, 'content-type': 'application/json' },
        ...(method === 'POST' ? { body: JSON.stringify({ sql: 'select 1' }) } : {}) });
      assert.equal(response.status, 401, 'Anonymous or wrong-password request accepted');
      authRejections += 1;
    }
  };
  for (const path of ['/', '/freshness', '/reconciliation', '/report-pack.txt', '/api/query', '/connection.yaml']) await deny(path);
  await deny('/api/query', 'POST');
  let assetsChecked = 0;
  for (const path of ['/', '/freshness', '/reconciliation']) {
    const response = await request(path, { headers: { authorization } });
    assert.equal(response.status, 200, 'Protected report HTML unavailable');
    assert.match(response.headers.get('cache-control'), /no-store/);
    const html = await response.text();
    assert.match(html, /freshness|reconciliation/i);
    if (path === '/') {
      const assets = [...new Set([...html.matchAll(/(?:src|href)=["']([^"']*\/_app\/immutable\/[^"']+)["']/g)]
        .map((match) => match[1].startsWith('/') ? match[1] : `/${match[1].replace(/^\.\//, '')}`))].slice(0, 4);
      assert.ok(assets.length > 0, 'Report HTML has no embedded Evidence assets');
      for (const asset of assets) {
        assert.ok(asset.startsWith('/_app/immutable/') && !asset.includes('..'), 'Unexpected asset path');
        await deny(asset);
        assert.equal((await request(asset, { headers: { authorization } })).status, 200, 'Protected asset unavailable');
        assetsChecked += 1;
      }
    }
  }
  assert.equal((await request('/report-pack.txt', { headers: { authorization } })).status, 200);
  assert.equal((await request('/connection.yaml', { headers: { authorization } })).status, 404);
  const query = async (sql, success = true) => {
    const response = await request('/api/query', { method: 'POST', headers: { authorization, 'content-type': 'application/json' }, body: JSON.stringify({ sql }) });
    const result = await response.json();
    if (success) {
      assert.equal(response.status, 200, 'Authenticated live SQL failed');
      assert.equal(result.error, undefined, 'Authenticated live SQL returned an error');
    } else assert.ok(!response.ok || result.error, 'Reader accepted a SQL write');
    return result.rows;
  };
  const role = (await query(sqlQueries.readiness))[0];
  for (const key of ['read_only', 'restricted_role', 'no_schema_write', 'select_only', 'warehouse_available']) assert.equal(role[key], true);
  const identity = (await query("select current_user as role, current_setting('transaction_read_only') as read_only"))[0];
  assert.equal(identity.role, 'evidence_reader');
  assert.equal(identity.read_only, 'on');
  const writeStatements = ["update reporting.orders set amount = 0 where order_id = 1001", 'create table reporting.forbidden(id integer)',
    'set default_transaction_read_only = off; delete from reporting.orders where order_id = 1001'];
  for (const statement of writeStatements) await query(statement, false);
  const freshness = await query(sqlQueries.freshness);
  assert.equal(freshness.length, 3);
  for (const [pipeline, expected] of Object.entries({ orders: 'FRESH', payments: phase === 'baseline' ? 'STALE' : 'FRESH', customers: 'NEVER' })) {
    assert.equal(freshness.find((row) => row.pipeline === pipeline).freshness_status, expected);
  }
  assert.equal(Number(freshness.find((row) => row.pipeline === 'payments').failed_attempts), 1);
  const reconciliation = await query(sqlQueries.reconciliation);
  assert.equal(reconciliation.length, 6);
  for (const [orderId, expected] of Object.entries({ 1001: 'MATCH', 1002: phase === 'baseline' ? 'MISMATCH' : 'MATCH', 1003: 'MISSING', 1004: 'CURRENCY', 1005: 'DUPLICATE', 9999: 'ORPHAN' })) {
    assert.equal(reconciliation.find((row) => Number(row.order_id) === Number(orderId)).reconciliation_status, expected);
  }
  assert.equal(Number(reconciliation.find((row) => Number(row.order_id) === 1002).difference), phase === 'baseline' ? -5 : 0);
  assert.equal(Number((await query('select amount from reporting.orders where order_id = 1001'))[0].amount), 120);
  if (phase !== 'baseline') {
    const watermark = (await query('select count(*) as count, min(marker) as marker from reporting.recovery_watermark'))[0];
    assert.equal(Number(watermark.count), 100);
    assert.equal(watermark.marker, 'recovery-20261005');
    await query("set default_transaction_read_only = off; update reporting.recovery_watermark set marker = 'forbidden' where sequence = 1", false);
  }
  console.log(JSON.stringify({ phase, status: 'pass', authRejections, assetsChecked, coreFixture: 'pass', nativeLiveQueries: 'pass', selectOnly: 'pass', hydration: 'not_run' }));
}

const snapshotSql = `select json_build_object(
  'data', (select json_object_agg(table_name, contents) from (
    select 'pipelines' as table_name, (select json_agg(contents order by pipeline) from reporting.pipelines contents) as contents union all
    select 'ingestion_batches', (select json_agg(contents order by batch_id) from reporting.ingestion_batches contents) union all
    select 'orders', (select json_agg(contents order by order_id) from reporting.orders contents) union all
    select 'payments', (select json_agg(contents order by payment_id) from reporting.payments contents) union all
    select 'recovery_watermark', (select json_agg(contents order by sequence) from reporting.recovery_watermark contents)) tables),
  'relations', (select json_agg(json_build_object('name', relation.relname, 'kind', relation.relkind, 'owner', owner.rolname, 'acl', relation.relacl::text) order by relation.relname)
    from pg_class relation join pg_namespace namespace on namespace.oid = relation.relnamespace join pg_roles owner on owner.oid = relation.relowner where namespace.nspname = 'reporting'),
  'columns', (select json_agg(json_build_object('table', table_name, 'column', column_name, 'type', data_type, 'nullable', is_nullable, 'default', column_default) order by table_name, ordinal_position) from information_schema.columns where table_schema = 'reporting'),
  'constraints', (select json_agg(json_build_object('table', relation.relname, 'name', constraint_row.conname, 'definition', pg_get_constraintdef(constraint_row.oid)) order by relation.relname, constraint_row.conname)
    from pg_constraint constraint_row join pg_class relation on relation.oid = constraint_row.conrelid join pg_namespace namespace on namespace.oid = relation.relnamespace where namespace.nspname = 'reporting'),
  'indexes', (select json_agg(json_build_object('name', indexname, 'definition', indexdef) order by indexname) from pg_indexes where schemaname = 'reporting'),
  'schemas', (select json_agg(json_build_object('name', nspname, 'owner', pg_get_userbyid(nspowner), 'acl', nspacl::text) order by nspname) from pg_namespace where nspname in ('public', 'reporting')),
  'database', (select json_build_object('name', datname, 'owner', pg_get_userbyid(datdba), 'acl', datacl::text) from pg_database where datname = current_database()),
  'defaultAcl', (select json_agg(json_build_object('role', pg_get_userbyid(defaclrole), 'schema', namespace.nspname, 'type', defaclobjtype, 'acl', defaclacl::text) order by defaclobjtype) from pg_default_acl join pg_namespace namespace on namespace.oid = defaclnamespace),
  'roles', (select json_agg(json_build_object('name', rolname, 'superuser', rolsuper, 'inherit', rolinherit, 'createRole', rolcreaterole, 'createDb', rolcreatedb, 'login', rolcanlogin, 'replication', rolreplication, 'bypassRls', rolbypassrls, 'connections', rolconnlimit, 'validUntil', rolvaliduntil, 'config', (select settings.rolconfig from pg_roles settings where settings.oid = pg_authid.oid), 'privatePasswordHash', rolpassword) order by rolname) from pg_authid where rolname in ('postgres', 'evidence_reader')),
  'memberships', (select json_agg(json_build_object('role', pg_get_userbyid(roleid), 'member', pg_get_userbyid(member), 'grantor', pg_get_userbyid(grantor), 'admin', admin_option) order by roleid, member) from pg_auth_members)
);`;

export async function runRecovery(options) {
  const runId = randomBytes(12).toString('hex');
  const label = `${ownershipLabel}=${runId}`;
  const network = ownedName(runId, 'network');
  const sourceVolume = ownedName(runId, 'source-data');
  const restoreVolume = ownedName(runId, 'restore-data');
  const sourceWarehouse = ownedName(runId, 'source-warehouse');
  const restoreWarehouse = ownedName(runId, 'restore-warehouse');
  const resources = { containers: [], volumes: [], networks: [] };
  const receiptDirectory = resolve(artifactRoot, runId);
  const receipt = { runId, status: 'running', startedAt: new Date().toISOString(), scope: 'cached local Docker native HTTP/SQL recovery',
    images: {}, checks: {}, phases: [], future: { finalNode24Pg1615Images: 'not_run', railway: 'not_run', browserHydration: 'not_run', publication: 'not_run' },
    retention: 'Docker deletion removes owned logical containers, volumes and network; no physical erasure or billing-zero claim. Sanitized receipts remain; credentials, role hashes and dumps are removed.' };
  let privateDirectory;
  let interrupted = false;
  let stage = 'preflight';
  const interrupt = () => { interrupted = true; };
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  const runDeadline = Date.now() + 600000;

  const command = (argumentsList, { input, inputFile, outputFile, environment = {}, timeout = 30000, cleanup = false } = {}) => new Promise((complete, reject) => {
    if (!cleanup && (interrupted || Date.now() >= runDeadline)) { reject(new Error('Recovery interrupted or overall deadline exceeded')); return; }
    const child = spawn('docker', argumentsList, { env: { ...process.env, ...environment }, stdio: ['pipe', 'pipe', 'pipe'] });
    const outputChunks = [];
    let outputBytes = 0;
    let timedOut = false;
    let exceeded = false;
    let ioFailed = false;
    let sqlState;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, Math.min(timeout, cleanup ? timeout : Math.max(1, runDeadline - Date.now())));
    const outputStream = outputFile ? createWriteStream(outputFile, { mode: 0o600, flags: 'wx' }) : undefined;
    const inputStream = inputFile ? createReadStream(inputFile) : undefined;
    const streamError = () => { ioFailed = true; child.kill('SIGKILL'); };
    outputStream?.on('error', streamError);
    inputStream?.on('error', streamError);
    if (outputStream) child.stdout.pipe(outputStream);
    else child.stdout.on('data', (chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > 8 * 1024 * 1024) { exceeded = true; child.kill('SIGKILL'); }
      else outputChunks.push(chunk);
    });
    child.stderr.on('data', (chunk) => {
      sqlState = chunk.toString('utf8').match(/(?:ERROR|FATAL):\s+([0-9A-Z]{5})\b/)?.[1] || sqlState;
    });
    child.stdin.on('error', () => {});
    if (inputStream) inputStream.pipe(child.stdin);
    else child.stdin.end(input);
    child.on('error', () => { clearTimeout(timer); reject(new Error(`Docker ${argumentsList[0]} unavailable`)); });
    child.on('close', async (code) => {
      clearTimeout(timer);
      if (outputStream && !outputStream.writableFinished && !outputStream.destroyed) await new Promise((finished) => { outputStream.once('finish', finished); outputStream.once('error', finished); });
      if (code !== 0 || timedOut || exceeded || ioFailed) {
        const error = new Error(`Docker ${argumentsList[0]} failed; raw output suppressed`);
        error.safeDiagnostic = { operation: argumentsList[0], exitCode: code, timedOut, exceeded, ioFailed, ...(sqlState ? { sqlState } : {}) };
        reject(error);
      }
      else complete(Buffer.concat(outputChunks).toString('utf8').trim());
    });
  });
  const sql = async (container, statement, role = 'postgres', password, database = 'reports') => command([
    'exec', '--interactive', ...(password ? ['--env', 'PGPASSWORD'] : []), container, 'psql', '--no-psqlrc',
    '--host', '127.0.0.1', '--username', role, '--dbname', database, '--set', 'ON_ERROR_STOP=1', '--set', 'VERBOSITY=sqlstate', '--tuples-only', '--no-align', '--quiet',
  ], { input: statement, environment: password ? { PGPASSWORD: password } : {} });
  const inspect = async (kind, name, cleanup = false) => JSON.parse(await command([kind, 'inspect', name], { cleanup }))[0];
  const waitWarehouse = async (name, password) => {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      try { if (await sql(name, 'select 1;', 'postgres', password) === '1') return; } catch {}
      if (interrupted) throw new Error('Recovery interrupted');
      await new Promise((complete) => setTimeout(complete, 500));
    }
    throw new Error('Native PostgreSQL readiness timed out');
  };
  const createContainer = async (name, imageId, environmentFile, volume, alias) => {
    resources.containers.push(name);
    await command(containerArguments({ name, runId, imageId, network, environmentFile, volume, alias }), { timeout: 60000 });
    const details = await inspect('container', name);
    assert.equal(details.Config.Labels[ownershipLabel], runId);
    assert.equal(details.Image, imageId);
    assert.equal(Object.keys(details.HostConfig.PortBindings || {}).length, 0, 'Host ports must not be published');
    assert.ok(details.Mounts.every((mount) => mount.Type === 'volume' && resources.volumes.includes(mount.Name)), 'Only owned volumes may be mounted');
  };
  const cleanupOwned = async () => {
    const failures = [];
    for (const [kind, names] of [['container', resources.containers], ['volume', resources.volumes], ['network', resources.networks]]) {
      for (const name of names) {
        try {
          const listed = await command([kind === 'container' ? 'ps' : kind, ...(kind === 'container' ? ['--all', '--quiet'] : ['ls', '--quiet']), '--filter', `label=${label}`], { cleanup: true });
          if (!listed) continue;
          let details;
          try { details = await inspect(kind, name, true); } catch { continue; }
          assert.equal((kind === 'container' ? details.Config.Labels : details.Labels)[ownershipLabel], runId, 'Cleanup ownership mismatch');
          await command([kind, 'rm', ...(kind === 'container' ? ['--force', '--volumes'] : []), name], { cleanup: true, timeout: 30000 });
        } catch { failures.push(`${kind}:${name}`); }
      }
    }
    if (privateDirectory) {
      try { await rm(privateDirectory, { recursive: true, force: true }); } catch { failures.push('private-directory'); }
    }
    const remaining = {};
    for (const kind of ['container', 'volume', 'network']) {
      try {
        const output = await command([kind === 'container' ? 'ps' : kind, ...(kind === 'container' ? ['--all', '--quiet'] : ['ls', '--quiet']), '--filter', `label=${label}`], { cleanup: true });
        remaining[kind] = output ? output.split('\n') : [];
      } catch { remaining[kind] = ['readback-failed']; }
    }
    let privateFilesAbsent = !privateDirectory;
    if (privateDirectory) {
      try { await stat(privateDirectory); } catch (error) { privateFilesAbsent = error.code === 'ENOENT'; }
    }
    const sharedImagesPresent = {};
    for (const [kind, details] of Object.entries(receipt.images)) {
      try { sharedImagesPresent[kind] = (await inspect('image', details.id, true)).Id === details.id; } catch { sharedImagesPresent[kind] = false; }
    }
    const pass = failures.length === 0 && Object.values(remaining).every((values) => values.length === 0) && privateFilesAbsent && Object.values(sharedImagesPresent).every(Boolean);
    return { status: pass ? 'pass' : 'fail', failures, remaining, privateFilesAbsent, privateDirectory, sharedImagesPresent, readback: 'independent Docker label listing after removal' };
  };

  await mkdir(receiptDirectory, { recursive: true });
  try {
    for (const [kind, reference] of Object.entries(options)) {
      const details = await inspect('image', reference);
      receipt.images[kind] = { requested: reference, id: immutableImageId(details.Id), repoDigests: details.RepoDigests };
    }
    receipt.checks.immutableCachedImagesResolvedBeforeResources = 'pass';
    privateDirectory = await mkdtemp(resolve(receiptDirectory, 'private-'));
    await chmod(privateDirectory, 0o700);
    const credentials = { admin: randomBytes(24).toString('hex'), reader: randomBytes(24).toString('hex'), auth: randomBytes(24).toString('hex'), user: `reader-${randomBytes(6).toString('hex')}` };
    const warehouseEnvironment = resolve(privateDirectory, 'warehouse.env');
    const reportsEnvironment = resolve(privateDirectory, 'reports.env');
    await writeFile(warehouseEnvironment, `POSTGRES_DB=reports\nPOSTGRES_USER=postgres\nPOSTGRES_PASSWORD=${credentials.admin}\nPOSTGRES_HOST_AUTH_METHOD=scram-sha-256\nREPORT_DB_PASSWORD=${credentials.reader}\nPGDATA=/var/lib/postgresql/data/pgdata\n`, { mode: 0o600 });
    await writeFile(reportsEnvironment, `PORT=3000\nEVIDENCE_BASIC_USER=${credentials.user}\nEVIDENCE_BASIC_PASSWORD=${credentials.auth}\nEVIDENCE_TELEMETRY_DISABLED=true\nREPORT_DB_HOST=postgres\nREPORT_DB_NAME=reports\nREPORT_DB_USER=evidence_reader\nREPORT_DB_PASSWORD=${credentials.reader}\nREPORT_DB_SSLMODE=disable\n`, { mode: 0o600 });
    const sqlQueries = { readiness: (await import('../runtime/config.mjs')).readinessSql };
    for (const name of ['freshness', 'reconciliation']) {
      const markdown = await readFile(resolve(root, `project/pages/${name}.md`), 'utf8');
      sqlQueries[name] = markdown.match(new RegExp('```sql ' + name + '\\n([\\s\\S]*?)```'))?.[1];
      assert.ok(sqlQueries[name], 'Report SQL block missing');
    }
    resources.networks.push(network);
    await command(['network', 'create', '--internal', '--label', label, network]);
    assert.equal((await inspect('network', network)).Internal, true);
    for (const volume of [sourceVolume, restoreVolume]) {
      resources.volumes.push(volume);
      await command(['volume', 'create', '--label', label, volume]);
    }
    assert.notEqual((await inspect('volume', sourceVolume)).Mountpoint, (await inspect('volume', restoreVolume)).Mountpoint);
    await createContainer(sourceWarehouse, receipt.images.warehouseImage.id, warehouseEnvironment, sourceVolume, 'postgres');
    await waitWarehouse(sourceWarehouse, credentials.admin);
    receipt.checks.sourcePostgresVersion = await sql(sourceWarehouse, 'show server_version;', 'postgres', credentials.admin);
    const reports = async (suffix) => {
      const name = ownedName(runId, suffix);
      await createContainer(name, receipt.images.reportsImage.id, reportsEnvironment);
      return name;
    };
    const probe = async (name, phase) => {
      const output = await command(['exec', '--interactive', name, 'node', '--input-type=module'], {
        input: `await (${nativeProbe.toString()})(${JSON.stringify({ phase, sqlQueries })});`, timeout: 120000,
      });
      receipt.phases.push(JSON.parse(output));
    };
    const readerCheck = async (name) => {
      assert.equal(await sql(name, 'select current_user;', 'evidence_reader', credentials.reader), 'evidence_reader');
      let denied = false;
      try { await sql(name, "set default_transaction_read_only = off; update reporting.orders set amount = 0 where order_id = 1001;", 'evidence_reader', credentials.reader); }
      catch (error) { denied = error.safeDiagnostic?.sqlState === '42501'; }
      assert.ok(denied, 'Native reader write accepted with read-only default disabled');
      assert.equal(await sql(name, 'select amount from reporting.orders where order_id = 1001;', 'postgres', credentials.admin), '120.00');
    };
    let currentReports = await reports('reports-initial');
    receipt.checks.sourceNodeVersion = await command(['exec', currentReports, 'node', '--version']);
    await probe(currentReports, 'baseline');
    await readerCheck(sourceWarehouse);
    stage = 'native-admin-mutation';
    await sql(sourceWarehouse, `begin;
      update reporting.ingestion_batches set finished_at = current_timestamp where pipeline = 'payments' and status = 'success';
      update reporting.payments set amount = 75 where payment_id = 2;
      create table reporting.recovery_watermark (sequence integer primary key, marker text not null, recorded_at timestamptz not null);
      insert into reporting.recovery_watermark select sequence, 'recovery-20261005', current_timestamp from generate_series(1, 100) sequence;
      create index recovery_watermark_marker_idx on reporting.recovery_watermark(marker);
      commit;`, 'postgres', credentials.admin);
    await probe(currentReports, 'mutated');
    stage = 'source-metadata-snapshot';
    const before = JSON.parse(await sql(sourceWarehouse, snapshotSql, 'postgres', credentials.admin));
    stage = 'reports-replacement';
    await command(['stop', '--time', '15', currentReports]);
    assert.equal((await inspect('container', currentReports)).State.Running, false);
    await command(['container', 'rm', currentReports]);
    currentReports = await reports('reports-replaced');
    await probe(currentReports, 'reports-replaced');
    assertEquivalent(before, JSON.parse(await sql(sourceWarehouse, snapshotSql, 'postgres', credentials.admin)));
    receipt.checks.stopBeforeReportsReplacementOriginalCredentials = 'pass';
    stage = 'database-outage-and-source-restart';
    await command(['stop', '--time', '15', sourceWarehouse]);
    const outage = await command(['exec', '--interactive', currentReports, 'node', '--input-type=module'], {
      input: "const response = await fetch('http://127.0.0.1:3000/readyz', { signal: AbortSignal.timeout(10000) }); if (response.status !== 503) throw new Error('Outage readiness must fail'); console.log('503');",
    });
    assert.equal(outage, '503');
    receipt.checks.databaseOutageReadiness = 'pass';
    await command(['start', sourceWarehouse]);
    await waitWarehouse(sourceWarehouse, credentials.admin);
    await probe(currentReports, 'source-restarted');
    await command(['stop', '--time', '15', currentReports]);
    await command(['container', 'rm', currentReports]);
    assert.equal(await sql(sourceWarehouse, "select count(*) from pg_stat_activity where datname = 'reports' and pid <> pg_backend_pid();", 'postgres', credentials.admin), '0');
    receipt.checks.quiescedBeforeFullDump = 'pass';
    stage = 'quiesced-full-database-and-private-role-dumps';
    const databaseDump = resolve(privateDirectory, 'database.dump');
    const rolesDump = resolve(privateDirectory, 'roles.sql');
    const restoreRoles = resolve(privateDirectory, 'restore-roles.sql');
    await command(['exec', '--env', 'PGPASSWORD', sourceWarehouse, 'pg_dump', '--host', '127.0.0.1', '--username', 'postgres', '--dbname', 'reports', '--format=custom', '--create'], {
      outputFile: databaseDump, environment: { PGPASSWORD: credentials.admin }, timeout: 60000,
    });
    await command(['exec', '--env', 'PGPASSWORD', sourceWarehouse, 'pg_dumpall', '--host', '127.0.0.1', '--username', 'postgres', '--roles-only'], {
      outputFile: rolesDump, environment: { PGPASSWORD: credentials.admin }, timeout: 60000,
    });
    await writeFile(restoreRoles, prepareRoleDump(await readFile(rolesDump, 'utf8')), { mode: 0o600 });
    for (const filename of [databaseDump, rolesDump, restoreRoles, warehouseEnvironment, reportsEnvironment]) assert.equal((await stat(filename)).mode & 0o777, 0o600);
    await command(['stop', '--time', '15', sourceWarehouse]);
    await command(['network', 'disconnect', network, sourceWarehouse]);
    stage = 'independent-empty-restore-database';
    await createContainer(restoreWarehouse, receipt.images.postgresImage.id, warehouseEnvironment, restoreVolume, 'postgres');
    await waitWarehouse(restoreWarehouse, credentials.admin);
    receipt.checks.restorePostgresVersion = await sql(restoreWarehouse, 'show server_version;', 'postgres', credentials.admin);
    const empty = JSON.parse(await sql(restoreWarehouse, `select json_build_object('tables', (select count(*) from pg_class relation join pg_namespace namespace on namespace.oid = relation.relnamespace where namespace.nspname not in ('pg_catalog', 'information_schema') and namespace.nspname not like 'pg_toast%' and relation.relkind in ('r', 'p')), 'reportingSchemas', (select count(*) from pg_namespace where nspname = 'reporting'), 'readerRoles', (select count(*) from pg_roles where rolname = 'evidence_reader'));`, 'postgres', credentials.admin));
    assert.deepEqual(empty, { tables: 0, reportingSchemas: 0, readerRoles: 0 });
    assert.equal(await command(['exec', restoreWarehouse, 'sh', '-c', 'test ! -e "$PGDATA/reporting-initialized" && test -z "$(ls -A /docker-entrypoint-initdb.d)" && echo empty']), 'empty');
    receipt.checks.distinctEmptyRestoreVolumeBeforeBootstrap = { status: 'pass', sourceVolume, restoreVolume, emptyDatabase: empty, fixtureInitializerAbsent: true };
    stage = 'full-role-and-database-restore';
    await command(['exec', '--interactive', '--env', 'PGPASSWORD', restoreWarehouse, 'psql', '--no-psqlrc', '--host', '127.0.0.1', '--username', 'postgres', '--dbname', 'postgres', '--set', 'ON_ERROR_STOP=1', '--quiet'], {
      inputFile: restoreRoles, environment: { PGPASSWORD: credentials.admin }, timeout: 60000,
    });
    await sql(restoreWarehouse, 'drop database reports;', 'postgres', credentials.admin, 'postgres');
    await command(['exec', '--interactive', '--env', 'PGPASSWORD', restoreWarehouse, 'pg_restore', '--host', '127.0.0.1', '--username', 'postgres', '--dbname', 'postgres', '--create', '--exit-on-error'], {
      inputFile: databaseDump, environment: { PGPASSWORD: credentials.admin }, timeout: 60000,
    });
    const after = JSON.parse(await sql(restoreWarehouse, snapshotSql, 'postgres', credentials.admin));
    stage = 'restored-logical-and-private-role-equivalence';
    assertEquivalent(before, after);
    const publicSnapshot = { ...before, roles: before.roles.map(({ privatePasswordHash, ...metadata }) => metadata) };
    receipt.checks.fullRestoreEquivalence = { status: 'pass', logicalSnapshotSha256: createHash('sha256').update(JSON.stringify(publicSnapshot)).digest('hex'), watermarkRows: 100,
      dataWatermarksIndexesSchemaGrantsRoleSettings: 'pass', originalPrivateRolePasswordHashes: 'pass', originalAdminReaderAuthCredentials: 'pass', fixtureReseed: false };
    await readerCheck(restoreWarehouse);
    receipt.checks.nativeReaderWritePermissionDeniedSqlState42501 = 'pass';
    stage = 'restored-native-report-query-and-restart';
    currentReports = await reports('reports-restored');
    await probe(currentReports, 'restored');
    await command(['stop', '--time', '15', currentReports, restoreWarehouse]);
    await command(['start', restoreWarehouse]);
    await waitWarehouse(restoreWarehouse, credentials.admin);
    await command(['start', currentReports]);
    await probe(currentReports, 'restored-restarted');
    await readerCheck(restoreWarehouse);
    assertEquivalent(before, JSON.parse(await sql(restoreWarehouse, snapshotSql, 'postgres', credentials.admin)));
    receipt.checks.restoredRestartExactEquivalence = 'pass';
    receipt.checks.internalNetworkNoHostPortsNativeClientsOnly = 'pass';
    receipt.status = 'pass';
  } catch (error) {
    receipt.status = 'fail';
    receipt.failure = { stage, type: error instanceof assert.AssertionError ? 'contract assertion failed' : 'operation failed', ...(error.safeDiagnostic ? { diagnostic: error.safeDiagnostic } : {}),
      detail: 'Raw process output and private assertion values suppressed; inspect finite stage receipts.' };
  } finally {
    receipt.cleanup = await cleanupOwned();
    if (receipt.cleanup.status !== 'pass') receipt.status = 'fail';
    receipt.finishedAt = new Date().toISOString();
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
    await writeFile(resolve(receiptDirectory, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
    console.log(JSON.stringify({ status: receipt.status, receipt: resolve(receiptDirectory, 'receipt.json'), cleanup: receipt.cleanup.status, runId }));
  }
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const receipt = await runRecovery(parseArguments(process.argv.slice(2)));
    process.exitCode = receipt.status === 'pass' ? 0 : 1;
  } catch {
    console.error('Recovery invocation failed; provide required cached image flags. No raw credentials or process output emitted.');
    process.exitCode = 1;
  }
}
