import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dockerfile = await readFile(new URL('../Dockerfile', import.meta.url), 'utf8');
const upstream = JSON.parse(await readFile(new URL('../upstream.lock.json', import.meta.url), 'utf8'));
const postgresDockerfile = await readFile(new URL('../Dockerfile.postgres', import.meta.url), 'utf8');
const expectedNode = 'node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e';

test('final runtime policy retains exact Node input and notices but no inherited tool layers', () => {
  assert.equal(upstream.node, '24.20.0');
  assert.equal(dockerfile.split(expectedNode).length - 1, 2);
  const finalStage = dockerfile.split('FROM scratch\n')[1];
  assert.ok(finalStage);
  assert.match(finalStage, /COPY --from=runtime \/ \/\nWORKDIR \/project\nUSER node/);
  assert.match(finalStage, /CMD \["node", "runtime\/server.mjs"\]/);
  assert.match(dockerfile, /rm -rf \/usr\/local\/lib\/node_modules \/opt\/yarn/);
  for (const executable of ['npm', 'npx', 'yarn', 'yarnpkg', 'corepack', 'pnpm', 'pnpx']) {
    assert.ok(dockerfile.includes('/usr/local/bin/' + executable));
  }
  for (const notice of ['node-runtime/LICENSE', 'npm-runtime/LICENSE', 'yarn-runtime/LICENSE', 'evidence-template/LICENSE']) {
    assert.ok(dockerfile.includes('/usr/share/doc/' + notice));
  }
});

test('source-built Evidence pin and retained lock are not replaced by unattested vendor image', () => {
  assert.equal(upstream.evidence.commit, '474ef4564f00e84991a055a3196fb32fd9d8d63a');
  assert.equal(upstream.evidence.version, '0.10.1');
  assert.match(dockerfile, /COPY --from=evidence \/src\/LICENSE/);
  assert.match(dockerfile, /COPY --from=evidence \/src\/pnpm-lock.yaml/);
  assert.match(dockerfile, /COPY --from=evidence \/dependency-notices/);
  assert.match(dockerfile, /COPY --from=evidence \/src\/patches\//);
  assert.match(dockerfile, /COPY artifact-review\/ \/usr\/share\/doc\/evidence\/artifact-review\//);
  for (const pattern of ['license*', 'licence*', 'notice*', 'copying*', 'ofl*', 'readme*']) {
    assert.ok(dockerfile.includes("-iname '" + pattern + "'"));
  }
  assert.doesNotMatch(dockerfile, /FROM\s+evidencedev\/serve/);
});

test('warehouse uses the verified current major-16 patch pin and retains authored fixture notice', () => {
  assert.equal(upstream.postgres, '16.15');
  assert.match(postgresDockerfile, /^FROM postgres:16\.15-bookworm@sha256:efedf3595f1d6f415c08568ba171029bf54052e754cc9f030e3f2412b21f3d67\n/);
  assert.match(postgresDockerfile, /COPY LICENSE \/usr\/share\/doc\/evidence-template\/LICENSE/);
});
