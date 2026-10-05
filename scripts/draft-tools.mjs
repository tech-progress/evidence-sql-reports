import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = async (filename) => JSON.parse(await readFile(resolve(root, filename), 'utf8'));
const serviceNames = ['Evidence Reports', 'Warehouse'];

export async function desiredConfiguration() {
  const repo = process.env.TEMPLATE_SOURCE_REPO || 'tech-progress/evidence-sql-reports';
  const branch = process.env.TEMPLATE_SOURCE_BRANCH || 'release-v1';
  const rootDirectory = process.env.TEMPLATE_SOURCE_ROOT_DIR || '/';
  assert.match(repo || '', /^[\w.-]+\/[\w.-]+$/, 'Set TEMPLATE_SOURCE_REPO explicitly');
  assert.match(branch, /^[\w.-]+$/, 'Source branch must not contain slashes');
  assert.ok(rootDirectory.startsWith('/') && !rootDirectory.includes('..'), 'Invalid source rootDirectory');
  return { source: { repo, branch, rootDirectory },
    defaults: await readJson('template-defaults.json'), descriptions: await readJson('template-descriptions.json'),
    networking: await readJson('template-networking.json'), volumes: await readJson('template-volumes.json') };
}

function serializedConfig(document) {
  return document.data?.template?.serializedConfig ?? document.serializedConfig ?? document;
}

function checkServiceSet(config) {
  assert.equal(Object.keys(config.buckets || {}).length, 0, 'Unexpected template buckets');
  const entries = serviceEntries(config);
  assert.deepEqual(entries.map(([, service]) => service.name).sort(), serviceNames, 'Wrong service set');
  const identifiers = entries.map(([identifier]) => identifier);
  assert.ok(identifiers.every((identifier) => typeof identifier === 'string' && identifier), 'Existing Composer IDs required');
  assert.equal(new Set(identifiers).size, identifiers.length, 'Composer service IDs must be unique');
}

function serviceEntries(config) {
  assert.ok(config.services && typeof config.services === 'object', 'Expected Composer services');
  if (Array.isArray(config.services)) {
    return config.services.map((service) => [service.id || service.uuid, service]);
  }
  return Object.entries(config.services);
}

function warehouseAttachments(service) {
  const key = service.volumeAttachments ? 'volumeAttachments' : 'volumeMounts';
  const attachments = service[key];
  assert.ok(attachments && !Array.isArray(attachments) && Object.keys(attachments).length === 1,
    'Retain exactly one existing warehouse volume attachment; this tool cannot invent volume IDs');
  return { key, attachments };
}

export function restoreDraft(document, desired) {
  const result = structuredClone(document);
  const config = serializedConfig(result);
  checkServiceSet(config);
  for (const [, service] of serviceEntries(config)) {
    service.source = { ...desired.source };
    service.build = { builder: 'DOCKERFILE', dockerfilePath: service.name === 'Warehouse' ? 'Dockerfile.postgres' : 'Dockerfile' };
    service.deploy = { startCommand: null, healthcheckPath: null, healthcheckTimeout: null };
    if (service.name === 'Evidence Reports') {
      Object.assign(service.deploy, { healthcheckPath: '/readyz', healthcheckTimeout: 180 });
    }
    const existingVariables = service.variables || {};
    service.variables = Object.fromEntries(Object.entries(desired.defaults[service.name]).map(([key, value]) =>
      [key, { ...(existingVariables[key]?.id ? { id: existingVariables[key].id } : {}), defaultValue: value,
        description: desired.descriptions[service.name][key], isOptional: false }]));
    const existingDomains = service.networking?.serviceDomains || {};
    service.networking = { serviceDomains: {}, customDomains: {}, tcpProxies: {} };
    if (service.name === 'Evidence Reports') {
      const keys = Object.keys(existingDomains);
      const domainKey = keys[0] || '<hasDomain>';
      service.networking.serviceDomains[domainKey] = { ...(existingDomains[domainKey] || {}), port: 3000 };
      delete service.volumeAttachments;
      service.volumeMounts = {};
    } else {
      const { attachments } = warehouseAttachments(service);
      Object.assign(Object.values(attachments)[0], desired.volumes.Warehouse);
    }
  }
  return result;
}

export function auditDraft(document, desired) {
  const config = serializedConfig(document);
  checkServiceSet(config);
  for (const [, service] of serviceEntries(config)) {
    assert.deepEqual(service.source, desired.source, `Source mismatch: ${service.name}`);
    assert.equal(service.build?.builder, 'DOCKERFILE', `Builder mismatch: ${service.name}`);
    assert.equal(service.build?.dockerfilePath, service.name === 'Warehouse' ? 'Dockerfile.postgres' : 'Dockerfile', 'Dockerfile mismatch');
    assert.ok(!service.deploy?.startCommand, 'Unexpected start override');
    assert.deepEqual(service.deploy, { startCommand: null,
      healthcheckPath: service.name === 'Evidence Reports' ? '/readyz' : null,
      healthcheckTimeout: service.name === 'Evidence Reports' ? 180 : null }, 'Unexpected retained deployment settings');
    assert.deepEqual(Object.keys(service.variables || {}).sort(), Object.keys(desired.defaults[service.name]).sort(), 'Variable set mismatch');
    for (const [key, value] of Object.entries(desired.defaults[service.name])) {
      const actual = service.variables[key];
      assert.ok(actual.defaultValue === value, `Default mismatch: ${service.name}.${key}`);
      assert.ok(actual.description === desired.descriptions[service.name][key], `Description mismatch: ${service.name}.${key}`);
      assert.equal(actual.isOptional, false, `Required variable became optional: ${key}`);
      for (const field of ['value', 'encryptedValue', 'generator']) {
        assert.ok(!actual[field], `Resolved credential or stale generator in ${service.name}.${key}`);
      }
    }
    assert.equal(Object.keys(service.networking?.tcpProxies || {}).length, 0, 'TCP proxies must be absent');
    assert.equal(Object.keys(service.networking?.customDomains || {}).length, 0, 'Custom domains must be absent');
    const domains = Object.values(service.networking?.serviceDomains || {});
    if (service.name === 'Evidence Reports') {
      assert.equal(service.deploy?.healthcheckPath, '/readyz', 'Readiness path mismatch');
      assert.equal(service.deploy?.healthcheckTimeout, 180, 'Readiness timeout mismatch');
      assert.equal(domains.length, 1, 'Exactly one public reports domain required');
      assert.equal(domains[0].port, 3000, 'Public reports port mismatch');
      assert.equal(Object.keys(service.volumeAttachments || service.volumeMounts || {}).length, 0, 'Reports must be stateless');
    } else {
      assert.equal(domains.length, 0, 'Warehouse must be private');
      const { attachments } = warehouseAttachments(service);
      const attachment = Object.values(attachments)[0];
      assert.equal(attachment.mountPath, desired.volumes.Warehouse.mountPath, 'Volume path mismatch');
      assert.equal(attachment.sizeMB, desired.volumes.Warehouse.sizeMB, 'Volume size mismatch');
    }
  }
}

async function main() {
  const [mode, input, output] = process.argv.slice(2);
  const desired = await desiredConfiguration();
  if (mode === 'export') {
    const command = spawnSync(resolve(root, 'node_modules/.bin/railway-iac-ts'), ['.railway/railway.ts'],
      { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
    if (command.status !== 0) throw new Error('Offline IaC graph export failed; check source settings and npm ci');
    const graph = JSON.parse(command.stdout);
    for (const resource of graph.graph.resources.filter((resource) => resource.type === 'service')) {
      resource.variables = Object.fromEntries(Object.entries(desired.defaults[resource.name]).map(([key, value]) => [key, { type: 'literal', value }]));
    }
    process.stdout.write(JSON.stringify(graph, null, 2) + '\n');
    return;
  }
  assert.ok(input, 'Usage: draft-tools.mjs restore INPUT OUTPUT | audit INPUT | export');
  const document = JSON.parse(await readFile(input, 'utf8'));
  if (mode === 'restore') {
    assert.ok(output && resolve(input) !== resolve(output), 'Provide a different output filename');
    const restored = restoreDraft(document, desired);
    auditDraft(restored, desired);
    await writeFile(output, JSON.stringify(restored, null, 2) + '\n', { mode: 0o600 });
    console.log('Restored local Composer JSON; retained service, variable and volume IDs. No cloud calls.');
  } else {
    assert.equal(mode, 'audit', 'Unknown mode');
    auditDraft(document, desired);
    console.log('PASS offline source/defaults/descriptions/health/networking/volume audit; no secrets printed');
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
