import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const reviewRoot = new URL('../artifact-review/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('notice-manifest.json', reviewRoot), 'utf8'));

test('original notice mappings retain their complete bytes and safe public source identities', async () => {
  assert.ok(manifest.rows.length >= 983);
  for (const entry of manifest.rows) {
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    assert.ok(entry.notice.startsWith('notices/'));
    assert.ok(!entry.notice.includes('..'));
    const original = await readFile(new URL(entry.notice, reviewRoot));
    assert.equal(original.length, entry.bytes, entry.origin);
    assert.equal(createHash('sha256').update(original).digest('hex'), entry.sha256, entry.origin);
    assert.equal(new URL(entry.primary).protocol, 'https:');
  }
});

test('public artifact review distinguishes source publication from unapproved binary redistribution', async () => {
  const review = await readFile(new URL('../ARTIFACT_REVIEW.md', import.meta.url), 'utf8');
  assert.match(review, /source and build instructions/);
  assert.match(review, /not a claim that every installed package is embedded|not be described as the set of embedded dependencies/);
  assert.doesNotMatch(review, /all artifacts (?:are cleared|are safe)|zero vulnerabilities|legally certified/i);
});

test('supplemental grants retain their precise scopes and original delivered bytes', async () => {
  const supplemental = JSON.parse(await readFile(new URL('supplemental/dispositions.json', reviewRoot), 'utf8'));
  assert.equal(supplemental.rows.length, 24);
  assert.equal(supplemental.summary.packageTextGapsRecovered, 2);
  for (const input of supplemental.rows) {
    assert.equal(input.input.integrityVerified, true);
    for (const notice of input.retainedTexts) {
      assert.ok(notice.notice.startsWith('notices/') && !notice.notice.includes('..'));
      const bytes = await readFile(new URL('supplemental/' + notice.notice, reviewRoot));
      assert.equal(bytes.length, notice.bytes, input.name);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), notice.sha256, input.name);
    }
  }
});

test('font and native original notices remain byte-identical without assuming font permission', async () => {
  const provenance = JSON.parse(await readFile(new URL('fonts-native/notice-provenance.json', reviewRoot), 'utf8'));
  assert.equal(provenance.rows.length, 19);
  for (const notice of provenance.rows) {
    assert.ok(notice.file.startsWith('notices/') && !notice.file.includes('..'));
    const bytes = await readFile(new URL('fonts-native/' + notice.file, reviewRoot));
    assert.equal(bytes.length, notice.deliveredBytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), notice.deliveredSha256);
  }
  const dockerfile = await readFile(new URL('../Dockerfile', import.meta.url), 'utf8');
  assert.ok(dockerfile.indexOf('RUN node /recipe/scripts/prepare-upstream.mjs') < dockerfile.indexOf('RUN pnpm cli:build'));
  const preparation = await readFile(new URL('../scripts/prepare-upstream.mjs', import.meta.url), 'utf8');
  assert.match(preparation, /exclude-source-serif\.mjs.*'--apply'/);
  assert.match(preparation, /--metafile=\/src\/artifact-build\/bun-metafile\.json/);
  assert.match(preparation, /config\.type !== 'postgres'/);
  assert.match(preparation, /return executePostgresQuery\(sql, config\)/);
  assert.match(preparation, /s3_v3: function \(\)/);
  assert.match(preparation, /96efb25d42199c632d31901560b003d32c49d2c209bb39ba4073a381ef6b5c38/);
  assert.match(preparation, /cli\/static\/licenses\/artifact-review/);
  assert.match(preparation, /cli\/cli\/connection\/index\.ts': '36eabf3c3be8e2eedfdbfc0cbc65f48702b068fb470a7d15f8d36a60ceb4951b'/);
});
