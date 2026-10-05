import test from 'node:test';
import assert from 'node:assert/strict';
import { assertEquivalent, containerArguments, defaultPostgresImage, immutableImageId, ownedName, ownershipLabel, parseArguments, prepareRoleDump } from '../scripts/recovery-smoke.mjs';

test('recovery requires explicit cached reports and warehouse inputs', () => {
  assert.deepEqual(parseArguments(['--reports-image', 'reports:cached', '--warehouse-image', 'warehouse:cached']), {
    reportsImage: 'reports:cached', warehouseImage: 'warehouse:cached', postgresImage: defaultPostgresImage,
  });
  for (const argumentsList of [[], ['--reports-image', 'reports'], ['--build', 'true'], ['--reports-image'],
    ['--reports-image', 'reports', '--warehouse-image', 'warehouse', '--reports-image', 'other'],
    ['--reports-image', 'reports', '--warehouse-image', 'warehouse', '--postgres-image', defaultPostgresImage, '--postgres-image', defaultPostgresImage]]) assert.throws(() => parseArguments(argumentsList));
  assert.equal(parseArguments(['--reports-image', 'reports', '--warehouse-image', 'warehouse', '--postgres-image', 'postgres@sha256:cached']).postgresImage, 'postgres@sha256:cached');
});

test('container launch accepts immutable IDs, pulls never, and exposes no host ports or bind mounts', () => {
  const runId = 'abcdef012345abcdef012345';
  const imageId = `sha256:${'a'.repeat(64)}`;
  const argumentsList = containerArguments({ name: ownedName(runId, 'reports'), runId, network: ownedName(runId, 'network'), imageId, environmentFile: '/private/reports.env' });
  assert.ok(argumentsList.includes('--pull=never'));
  assert.ok(argumentsList.includes(`${ownershipLabel}=${runId}`));
  assert.equal(argumentsList.at(-1), imageId);
  assert.ok(!argumentsList.some((value) => ['--publish', '-p', '--publish-all', '-P', '--privileged', '--volume'].includes(value)));
  assert.throws(() => immutableImageId('reports:latest'));
  assert.throws(() => ownedName('../shared', 'reports'));
  const warehouseArguments = containerArguments({ name: ownedName(runId, 'warehouse'), runId, network: ownedName(runId, 'network'), imageId, environmentFile: '/private/warehouse.env', volume: ownedName(runId, 'data'), alias: 'postgres' });
  assert.ok(warehouseArguments.includes(`type=volume,source=${ownedName(runId, 'data')},target=/var/lib/postgresql/data`));
});

test('native role restoration preserves private hashes and settings while avoiding the existing admin CREATE', () => {
  const dump = "-- roles\n\\restrict abc123\nCREATE ROLE evidence_reader;\nALTER ROLE evidence_reader WITH NOSUPERUSER LOGIN PASSWORD 'SCRAM-SHA-256$private';\nCREATE ROLE postgres;\nALTER ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'SCRAM-SHA-256$admin';\nALTER ROLE evidence_reader SET default_transaction_read_only TO 'on';\n\\unrestrict abc123\n";
  const prepared = prepareRoleDump(dump);
  assert.ok(!prepared.includes('CREATE ROLE postgres;'));
  assert.ok(prepared.includes("PASSWORD 'SCRAM-SHA-256$admin'"));
  assert.ok(prepared.includes("default_transaction_read_only TO 'on'"));
  for (const invalid of [dump + '\\! env\n', dump + 'CREATE ROLE intruder;\n', dump.replace('CREATE ROLE evidence_reader;\n', ''), dump + 'DROP DATABASE reports;\n']) assert.throws(() => prepareRoleDump(invalid));
});

test('restore comparison rejects data, index, grant, watermark and private role hash drift', () => {
  const original = { data: [{ sequence: 1, marker: 'saved' }], indexes: ['saved_index'], grants: ['reader=SELECT'], roles: [{ privatePasswordHash: 'private-original', config: ['default_transaction_read_only=on'] }] };
  assertEquivalent(original, structuredClone(original));
  for (const changed of [{ ...original, data: [] }, { ...original, indexes: [] }, { ...original, grants: [] }, { ...original, roles: [{ privatePasswordHash: 'changed' }] }]) assert.throws(() => assertEquivalent(original, changed));
});
