import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(process.argv[2]);
const recipe = resolve(process.argv[3]);
const pins = {
  'cli/vite.config.ts': '1b9205773ae75a194aacfefd9208ebbc5059a1512388f60de3129414284f3a73',
  'core/scripts/build-sandbox-runtimes.js': '462736b3a780e9593777c36a589bacee0bd5691cb26a8ce99ed1492b4ecacc16',
  'cli/adapter/index.js': '5dddfdbb44e41bda980f41617dbd3152a89a5122786455e8b95dd22b26d5dbc7',
  'cli/cli/connection/index.ts': '36eabf3c3be8e2eedfdbfc0cbc65f48702b068fb470a7d15f8d36a60ceb4951b',
};
const originals = new Map();
for (const [path, expected] of Object.entries(pins)) {
  const bytes = await readFile(join(root, path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, path);
  originals.set(path, bytes.toString('utf8'));
}
const exclusion = spawnSync(process.execPath, [join(recipe, 'artifact-review/fonts-native/exclude-source-serif.mjs'), '--apply', root], { encoding: 'utf8' });
assert.equal(exclusion.status, 0, exclusion.stderr);
await mkdir(join(root, 'artifact-build'), { recursive: true });
await writeFile(join(root, 'artifact-build/font-exclusion.json'), exclusion.stdout);
const replaceOnce = (content, before, after) => {
  assert.equal(content.split(before).length, 2, 'Expected exactly one preparation anchor');
  return content.replace(before, after);
};
let connection = originals.get('cli/cli/connection/index.ts');
for (const [executor, moduleName] of [['executeSnowflakeQuery', 'snowflake'], ['executeBigQueryQuery', 'bigquery'],
  ['executeClickHouseQuery', 'clickhouse'], ['executeFabricQuery', 'fabric'], ['executeDatabricksQuery', 'databricks'],
  ['executeMotherduckQuery', 'motherduck']]) {
  connection = replaceOnce(connection, `import { ${executor} } from './${moduleName}';\n`, '');
}
const queryStart = 'export async function executeQuery(sql: string, config: ConnectionConfig): Promise<QueryResult> {';
const queryEnd = '\n}\n\n/**\n * Warehouse-specific catalog SQL.';
assert.equal(connection.split(queryStart).length, 2);
assert.equal(connection.split(queryEnd).length, 2);
const start = connection.indexOf(queryStart);
const end = connection.indexOf(queryEnd, start);
assert.ok(end > start);
connection = connection.slice(0, start) + queryStart + "\n\tif (config.type !== 'postgres') {\n\t\tthrow new Error('This report recipe supports PostgreSQL connections only');\n\t}\n\treturn executePostgresQuery(sql, config);"
  + connection.slice(end);
await writeFile(join(root, 'cli/cli/connection/index.ts'), connection);
await writeFile(join(root, 'artifact-build/connector-selection.json'), JSON.stringify({
  upstreamSha256: pins['cli/cli/connection/index.ts'], selected: ['postgres'],
  excluded: ['snowflake', 'bigquery', 'clickhouse', 'fabric', 'databricks', 'motherduck', 'cube'],
  scope: 'Native PostgreSQL executor retained; foreign driver imports removed before compilation, unsupported connections rejected explicitly',
}, null, 2) + '\n');
const unzipperPath = 'node_modules/.pnpm/unzipper@0.12.5/node_modules/unzipper/lib/Open/index.js';
const unzipperOriginal = await readFile(join(root, unzipperPath));
const unzipperBefore = createHash('sha256').update(unzipperOriginal).digest('hex');
assert.equal(unzipperBefore, '96efb25d42199c632d31901560b003d32c49d2c209bb39ba4073a381ef6b5c38');
const unzipper = unzipperOriginal.toString('utf8');
const s3Start = '  s3_v3: function (client, params, options) {';
const s3End = '  custom: function(source, options) {';
assert.equal(unzipper.split(s3Start).length, 2);
assert.equal(unzipper.split(s3End).length, 2);
const s3Offset = unzipper.indexOf(s3Start);
const customOffset = unzipper.indexOf(s3End, s3Offset);
assert.ok(customOffset > s3Offset);
const localUnzipper = unzipper.slice(0, s3Offset)
  + "  s3_v3: function () {\n    throw new Error('S3 ZIP loading is not supported by this PostgreSQL report recipe');\n  },\n"
  + unzipper.slice(customOffset);
await writeFile(join(root, unzipperPath), localUnzipper);
await writeFile(join(root, 'artifact-build/optional-s3-selection.json'), JSON.stringify({
  package: 'unzipper', version: '0.12.5', path: unzipperPath,
  beforeSha256: unzipperBefore, afterSha256: createHash('sha256').update(localUnzipper).digest('hex'),
  modification: 'Remove optional S3 v3 ZIP download implementation before compilation; preserve buffer/file/url/custom ZIP readers and native report/XLSX processing',
  scope: 'Unneeded optional downloader removed, not externalized; original upstream license remains retained',
}, null, 2) + '\n');
await copyFile(join(recipe, 'scripts/build-notice-audit.mjs'), join(root, 'build-notice-audit.mjs'));
await writeFile(join(root, 'cli/vite.config.ts'), "import { noticeAudit } from '../build-notice-audit.mjs';\n" + replaceOnce(
  originals.get('cli/vite.config.ts'), 'plugins: [tailwindcss(), sveltekit()]', "plugins: [tailwindcss(), sveltekit(), noticeAudit('reports')]"));
const sandbox = replaceOnce(originals.get('core/scripts/build-sandbox-runtimes.js'),
  '#!/usr/bin/env node\n', "#!/usr/bin/env node\nimport { noticeAudit } from '../../build-notice-audit.mjs';\n");
await writeFile(join(root, 'core/scripts/build-sandbox-runtimes.js'), replaceOnce(
  sandbox, 'configFile: false,', "configFile: false,\n\t\tplugins: [noticeAudit('sandbox-' + runtime.fileName)],"));
await writeFile(join(root, 'cli/adapter/index.js'), replaceOnce(originals.get('cli/adapter/index.js'),
  "'--minify',", "'--minify',\n\t\t\t\t'--metafile=/src/artifact-build/bun-metafile.json',"));
const fontNotices = join(root, 'cli/static/licenses/fonts');
await mkdir(fontNotices, { recursive: true });
for (const name of ['geist', 'geist-mono', 'noto-color-emoji']) {
  await copyFile(join(root, 'cli/static/fonts', name, 'LICENSE.txt'), join(fontNotices, name + '-LICENSE.txt'));
}
await copyFile(join(recipe, 'artifact-review/fonts-native/notices/fira-mono-5.2.7-LICENSE.txt'), join(fontNotices, 'fira-mono-LICENSE.txt'));
await cp(join(recipe, 'artifact-review'), join(root, 'cli/static/licenses/artifact-review'), { recursive: true });
for (const filename of ['LICENSE', 'LICENSE_REVIEW.md', 'ARTIFACT_REVIEW.md', 'THIRD_PARTY_NOTICES.md']) {
  await copyFile(join(recipe, filename), join(root, 'cli/static/licenses', filename));
}
await mkdir(join(root, 'cli/static/licenses/scripts'), { recursive: true });
await copyFile(join(recipe, 'scripts/prepare-upstream.mjs'), join(root, 'cli/static/licenses/scripts/prepare-upstream.mjs'));
console.log('Prepared exact-hash-guarded PostgreSQL-only executor, optional downloader/font exclusion, notices and build input identities');
