import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { access, readFile } from 'node:fs/promises';

const sourceCheckout = existsSync(new URL('../package.json', import.meta.url));
const sourceOnly = { skip: !sourceCheckout };
const documentNames = ['README.md', 'PUBLISHING.md', 'UPGRADE.md', 'SUPPORT.md', 'MARKETPLACE.md', 'CHANGELOG.md'];
const readText = (filename) => readFile(new URL(`../${filename}`, import.meta.url), 'utf8');
const readJson = async (filename) => JSON.parse(await readText(filename));
const documents = sourceCheckout
  ? Object.fromEntries(await Promise.all(documentNames.map(async (filename) => [filename, await readText(filename)])))
  : {};
const normalize = (content) => content.replace(/\s+/g, ' ');
const releaseVersion = '1.0.1';
const releaseTag = `v${releaseVersion}`;
const sourceRepository = 'tech-progress/evidence-sql-reports';
const evidenceCommit = '474ef4564f00e84991a055a3196fb32fd9d8d63a';

test('source release docs and metadata agree on recipe 1.0.1', sourceOnly, async () => {
  const version = (await readText('VERSION')).trim();
  const manifest = await readJson('package.json');
  const packageLock = await readJson('package-lock.json');
  assert.equal(version, releaseVersion);
  assert.equal(manifest.version, version);
  assert.equal(packageLock.version, version);
  assert.equal(packageLock.packages[''].version, version);
  assert.ok((await readText('project/static/report-pack.txt')).includes(`report pack v${version}.`));
  assert.ok(documents['CHANGELOG.md'].includes(`## [${version}] - `));
  assert.ok(documents['CHANGELOG.md'].includes(`## [${releaseVersion}] - 2026-10-05`));
  for (const [filename, content] of Object.entries(documents)) {
    assert.ok(content.includes(releaseVersion), `${filename} must identify the intended recipe release`);
    assert.ok(content.includes(releaseTag), `${filename} must identify the immutable standalone tag`);
    assert.ok(content.includes(sourceRepository), `${filename} must identify the intended standalone source`);
  }
});

test('source docs preserve exact Evidence origin and commit without attesting the vendor image', sourceOnly, async () => {
  const upstream = await readJson('upstream.lock.json');
  assert.equal(upstream.evidence.version, '0.10.1');
  assert.equal(upstream.evidence.source, 'https://github.com/evidence-dev/evidence');
  assert.equal(upstream.evidence.commit, evidenceCommit);
  for (const filename of ['README.md', 'PUBLISHING.md', 'UPGRADE.md', 'MARKETPLACE.md', 'CHANGELOG.md']) {
    assert.ok(documents[filename].includes(evidenceCommit), `${filename} must preserve the upstream commit`);
  }
  for (const filename of ['README.md', 'PUBLISHING.md', 'MARKETPLACE.md']) {
    const content = normalize(documents[filename]);
    assert.match(content, /source-built|builds current Evidence from source/);
    assert.match(content, /(?:attestation|provenance) remains unresolved/);
  }
});

test('README and marketplace docs link every declared main upstream origin', sourceOnly, async () => {
  const metadata = await readJson('marketplace-metadata.json');
  assert.ok(metadata.description.length >= 45 && metadata.description.length <= 75);
  assert.ok(!('id' in metadata) && !('code' in metadata));
  assert.deepEqual(metadata.origins.map((origin) => origin.name).sort(), ['Evidence', 'Node.js', 'PostgreSQL']);
  for (const filename of ['README.md', 'MARKETPLACE.md']) {
    for (const origin of metadata.origins) {
      assert.ok(documents[filename].includes(`](${origin.url})`), `${filename} lacks the ${origin.name} link`);
    }
  }
});

test('README documents every service default and all required credential/connector variables', sourceOnly, async () => {
  const defaults = await readJson('template-defaults.json');
  const variableRows = new Map([...documents['README.md'].matchAll(/^\| `([A-Z_]+)` \| ([^\n]+)$/gm)]
    .map((match) => [match[1], match[2]]));
  for (const serviceDefaults of Object.values(defaults)) {
    for (const variable of Object.keys(serviceDefaults)) {
      assert.ok(variableRows.has(variable), `Missing documented variable: ${variable}`);
    }
  }
  for (const variable of ['EVIDENCE_BASIC_USER', 'EVIDENCE_BASIC_PASSWORD', 'REPORT_DB_HOST',
    'REPORT_DB_NAME', 'REPORT_DB_USER', 'REPORT_DB_PASSWORD', 'REPORT_DB_SSLMODE', 'POSTGRES_PASSWORD']) {
    assert.match(variableRows.get(variable), /Required/);
  }
  assert.match(variableRows.get('REPORT_DB_SSLMODE'), /disable.*private.*verify-full/);
  assert.match(variableRows.get('REPORT_DB_USER'), /evidence_reader.*never the administrator/);
  assert.match(normalize(documents['README.md']), /EVIDENCE_AUTH_DISABLED.*rejected even if set to `false`/);
});

test('source docs explain the private topology and trusted-viewer native SQL contract', sourceOnly, async () => {
  const networking = await readJson('template-networking.json');
  const volumes = await readJson('template-volumes.json');
  assert.equal(networking['Evidence Reports'].publicPort, 3000);
  assert.equal(networking.Warehouse.publicPort, null);
  assert.equal(networking.Warehouse.tcpProxy, false);
  assert.deepEqual(volumes, { Warehouse: { mountPath: '/var/lib/postgresql/data', sizeMB: 5000 } });
  const readme = normalize(documents['README.md']);
  assert.match(readme, /two services.*5000 MB/);
  assert.ok(readme.includes('`127.0.0.1:3001`'));
  assert.ok(readme.includes('`POST /api/query`'));
  assert.ok(readme.includes('`{"sql":"select ..."}`'));
  assert.match(readme, /raw SQL.*trusted viewers/);
  assert.match(readme, /No public domain or TCP proxy/);
  assert.match(readme, /Reports has no volume/);
  assert.match(readme, /readyz.*anonymous.*ready.*unavailable/);
});

test('all source-document Markdown links resolve locally or use explicit HTTPS origins', sourceOnly, async () => {
  for (const [filename, content] of Object.entries(documents)) {
    for (const match of content.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) {
      const target = match[1];
      if (target.startsWith('https://')) {
        assert.equal(new URL(target).protocol, 'https:');
      } else {
        assert.ok(!target.startsWith('/') && !target.includes('..') && !target.includes(':'), `${filename}: invalid local link`);
        await access(new URL(`../${target}`, import.meta.url));
        assert.notEqual(target, 'FINDINGS.md', `${filename} must not link private findings`);
      }
    }
  }
  for (const target of ['LICENSE', 'LICENSE_REVIEW.md', 'PUBLISHING.md']) {
    assert.ok(documents['README.md'].includes(`](${target})`), `Missing exported document link: ${target}`);
  }
});

test('planned source coordinates require remote checks and publication claims stay conditional', sourceOnly, () => {
  const readme = normalize(documents['README.md']);
  const publishing = normalize(documents['PUBLISHING.md']);
  assert.ok(readme.includes(`TEMPLATE_SOURCE_REPO=${sourceRepository}`));
  assert.ok(readme.includes('TEMPLATE_SOURCE_BRANCH=release-v1'));
  assert.ok(readme.includes('TEMPLATE_SOURCE_ROOT_DIR=/ '));
  assert.match(readme, /Offline export does not verify visibility, branch\/tag existence or Railway GitHub App access/);
  assert.match(publishing, /read back its commit\/tree and do not move a published tag/);
  assert.match(publishing, /Verify public source visibility and Railway GitHub App access independently/);
  assert.match(publishing, /before and after publication/);
  assert.match(publishing, /Read back listing availability and published graph/);
  for (const [filename, content] of Object.entries(documents)) {
    assert.doesNotMatch(content, /evidence-sql-reports-v\d|unpublished candidate|No project, deployment/i, filename);
    assert.doesNotMatch(content, /https:\/\/railway\.(?:com|app)\/(?:deploy|template)\//i, filename);
    assert.doesNotMatch(normalize(content), /(?:source access|all gates|all tests|all checks) (?:is verified|are verified|have passed)|approved Railway marketplace listing/i, filename);
  }
});

test('source-only review and cleanup docs preserve exported notices and finite retention limits', sourceOnly, () => {
  const publishing = normalize(documents['PUBLISHING.md']);
  const support = normalize(documents['SUPPORT.md']);
  assert.match(publishing, /sanitized standalone source and build instructions, without a public combined binary image/);
  assert.match(publishing, /Include.*LICENSE_REVIEW\.md.*PUBLISHING\.md/);
  assert.match(publishing, /Only `FINDINGS\.md` and local operational records are private/);
  assert.match(publishing, /exact release inputs/);
  assert.match(publishing, /grants, notices/);
  assert.match(publishing, /Review default exposure/);
  assert.match(publishing, /at most one owned active Railway verification project/);
  assert.match(publishing, /scripts\/sync-template-marketplace\.sh/);
  assert.match(publishing, /scripts\/audit-template-marketplace\.sh/);
  assert.match(support, /zero-compute deletion.*readbacks/);
  assert.match(support, /retention.*billing records/);
  assert.match(support, /does not establish physical erasure or a zero bill/);
});

test('recovery docs distinguish same-volume smoke from quiesced full SQL import with original credentials', sourceOnly, () => {
  const upgrade = normalize(documents['UPGRADE.md']);
  assert.match(upgrade, /same volume.*does.*not.*prove empty-volume recovery/);
  assert.match(upgrade, /Quiesce ingestion and every other writer/);
  assert.ok(upgrade.includes('`pg_dumpall`'));
  assert.match(upgrade, /password hashes, databases, data, ownership and grants/);
  assert.match(upgrade, /distinct empty volume.*different identity.*verify emptiness/);
  assert.match(upgrade, /Never attach, copy PGDATA from or reuse the old volume/);
  assert.match(upgrade, /suppress that seeding for recovery/);
  assert.ok(upgrade.includes('`ON_ERROR_STOP=1`'));
  assert.match(upgrade, /before starting Reports/);
  assert.match(upgrade, /original.*administrator and reader credentials/);
  assert.match(upgrade, /original viewer credentials/);
  assert.match(upgrade, /does not automate it/);
});

test('runtime input docs match actual pins without claiming qualification', sourceOnly, async () => {
  const readme = normalize(documents['README.md']);
  const nodePin = 'node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e';
  const postgresPin = 'postgres:16.15-bookworm@sha256:efedf3595f1d6f415c08568ba171029bf54052e754cc9f030e3f2412b21f3d67';
  assert.ok(readme.includes(nodePin));
  assert.ok(readme.includes(postgresPin));
  assert.ok((await readText('Dockerfile')).includes(nodePin));
  assert.ok((await readText('Dockerfile.postgres')).includes(postgresPin));
  assert.match(readme, /release targets,.*not qualification claims/);
  assert.match(readme, /Bun compiles Evidence and embeds its runtime/);
  assert.doesNotMatch(readme, /digest must be verified before pinning|No digest is asserted|carrying `VERSION` 1\.0\.0/);
});
