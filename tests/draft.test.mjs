import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { restoreDraft, auditDraft } from '../scripts/draft-tools.mjs';

const json = async (filename) => JSON.parse(await readFile(new URL(`../${filename}`, import.meta.url)));
const desired = { source: { repo: 'skyeagle/railway-templates', branch: 'release-v1', rootDirectory: '/evidence-sql-reports' },
  defaults: await json('template-defaults.json'), descriptions: await json('template-descriptions.json'),
  volumes: await json('template-volumes.json') };
const draft = {
  data: { template: { serializedConfig: { services: [
    { id: 'existing-report-id', name: 'Evidence Reports', source: { image: 'seed' },
      variables: { PORT: { id: 'existing-port-id' } },
      networking: { serviceDomains: { 'existing-domain-id': { id: 'existing-domain-id', port: 80 } }, tcpProxies: { old: {} } } },
    { id: 'existing-warehouse-id', name: 'Warehouse', source: { image: 'seed' },
      volumeAttachments: { 'existing-volume-id': { id: 'existing-volume-id', volume: 'existing-volume-id', mountPath: '/wrong', sizeMB: 1 } },
      networking: { serviceDomains: { old: { port: 5432 } } } },
  ] } } },
};
test('offline restore retains Composer IDs and SDK volumeAttachments', () => {
  const restored = restoreDraft(draft, desired);
  auditDraft(restored, desired);
  const services = restored.data.template.serializedConfig.services;
  assert.equal(services[0].id, 'existing-report-id');
  assert.equal(services[0].variables.PORT.id, 'existing-port-id');
  assert.equal(services[0].networking.serviceDomains['existing-domain-id'].id, 'existing-domain-id');
  assert.equal(services[1].volumeAttachments['existing-volume-id'].id, 'existing-volume-id');
  assert.equal(services[1].volumeAttachments['existing-volume-id'].volume, 'existing-volume-id');
  assert.equal(services[1].volumeMounts, undefined);
  assert.equal(draft.data.template.serializedConfig.services[0].source.image, 'seed');
});
test('offline audit catches source, public database, credential and volume drift', () => {
  for (const mutate of [
    (services) => { services[0].source.image = 'seed'; },
    (services) => { services[1].networking.tcpProxies.exposed = { port: 5432 }; },
    (services) => { services[1].networking.serviceDomains.exposed = { port: 5432 }; },
    (services) => { services[0].variables.EVIDENCE_BASIC_PASSWORD.defaultValue = 'bad'; },
    (services) => { services[1].volumeAttachments['existing-volume-id'].mountPath = '/wrong'; },
    (services) => { services[0].deploy.healthcheckPath = '/'; },
  ]) {
    const restored = restoreDraft(draft, desired);
    mutate(restored.data.template.serializedConfig.services);
    assert.throws(() => auditDraft(restored, desired));
  }
});
test('restore refuses wrong graphs and missing volume IDs rather than inventing resources', () => {
  assert.throws(() => restoreDraft({ services: [] }, desired));
  const missing = structuredClone(draft);
  delete missing.data.template.serializedConfig.services[1].volumeAttachments;
  assert.throws(() => restoreDraft(missing, desired));
});

test('real ID-keyed Composer restoration retains service and mount IDs without seed secrets or cron', () => {
  const config = { services: Object.fromEntries(draft.data.template.serializedConfig.services.map((service) => {
    const { id, ...settings } = structuredClone(service);
    settings.deploy = { startCommand: 'sleep 1800', cronSchedule: '* * * * *' };
    settings.variables ||= {};
    settings.variables.PORT = { ...(settings.variables.PORT || {}), value: 'sensitive-canary', encryptedValue: 'opaque' };
    return [id, settings];
  })), buckets: {} };
  const before = structuredClone(config);
  const restored = restoreDraft(config, desired);
  auditDraft(restored, desired);
  assert.deepEqual(config, before);
  assert.deepEqual(Object.keys(restored.services), Object.keys(config.services));
  assert.deepEqual(restored.buckets, {});
  assert.equal(restored.services['existing-report-id'].variables.PORT.value, undefined);
  assert.equal(restored.services['existing-report-id'].deploy.cronSchedule, undefined);
  assert.equal(restored.services['existing-warehouse-id'].volumeAttachments['existing-volume-id'].id, 'existing-volume-id');
  restored.services['existing-report-id'].variables.EVIDENCE_BASIC_PASSWORD.encryptedValue = 'opaque';
  assert.throws(() => auditDraft(restored, desired));
});

test('audit rejects duplicate service IDs, retained deployment defaults and private database custom domains', () => {
  const duplicate = structuredClone(draft);
  duplicate.data.template.serializedConfig.services[1].id = 'existing-report-id';
  assert.throws(() => restoreDraft(duplicate, desired));
  for (const mutate of [
    (services) => { services[0].deploy.cronSchedule = '* * * * *'; },
    (services) => { services[1].networking.customDomains.exposed = { port: 5432 }; },
  ]) {
    const restored = restoreDraft(draft, desired);
    mutate(restored.data.template.serializedConfig.services);
    assert.throws(() => auditDraft(restored, desired));
  }
});
