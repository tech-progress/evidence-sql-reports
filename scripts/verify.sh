#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root}"
for file in .dockerignore .env.example .gitignore .railway/railway.ts package.json package-lock.json upstream.lock.json Dockerfile Dockerfile.postgres compose.yaml VERSION CHANGELOG.md README.md MARKETPLACE.md PUBLISHING.md SUPPORT.md UPGRADE.md LICENSE LICENSE_REVIEW.md FINDINGS.md marketplace-metadata.json template-defaults.json template-descriptions.json template-networking.json template-volumes.json scripts/build.sh scripts/start.sh scripts/smoke.sh scripts/smoke.mjs scripts/export-template.sh scripts/restore-template-draft.sh scripts/audit-template.sh; do
  if [[ "${PUBLIC_DISTRIBUTION:-0}" == 1 && "$file" == FINDINGS.md ]]; then continue; fi
  test -f "${file}" || { echo "Missing: ${file}" >&2; exit 1; }
done
version="$(<VERSION)"
[[ "${version}" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]
grep -Fq "## [${version}] - " CHANGELOG.md
for file in scripts/*.sh warehouse/*.sh; do bash -n "${file}"; done
for file in runtime/*.mjs scripts/*.mjs; do node --check "${file}"; done
npm test
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const load = async (path) => JSON.parse(await readFile(path, 'utf8'));
const metadata = await load('marketplace-metadata.json');
assert.ok(metadata.description.length >= 45 && metadata.description.length <= 75);
assert.ok(!('id' in metadata) && !('code' in metadata));
const defaults = await load('template-defaults.json');
const descriptions = await load('template-descriptions.json');
for (const name of Object.keys(defaults)) assert.deepEqual(Object.keys(defaults[name]).sort(), Object.keys(descriptions[name]).sort());
const readme = await readFile('README.md', 'utf8');
for (const origin of metadata.origins) assert.ok(readme.includes(origin.url));
const lock = await load('package-lock.json');
assert.equal(lock.packages['node_modules/railway'].version, '3.6.0');
assert.equal(lock.packages[''].devDependencies.railway, '3.6.0');
for (const [key, value] of Object.entries(defaults['Evidence Reports'])) assert.ok(readme.includes(key));
for (const key of Object.keys(defaults.Warehouse)) assert.ok(readme.includes(key));
JS
env POSTGRES_PASSWORD=validation-only-not-runtime REPORT_DB_PASSWORD=validation-only-not-runtime EVIDENCE_BASIC_USER=validation-only EVIDENCE_BASIC_PASSWORD=validation-only-not-runtime docker compose config --quiet
if [[ -n "${TEMPLATE_SOURCE_REPO:-}" ]]; then
  temp="$(mktemp -t rt-evidence-export.XXXXXX)"
  trap 'rm -f "${temp}"' EXIT
  scripts/export-template.sh > "${temp}"
  jq -e '.graph.resources | ([.[]|select(.type=="service")|.name]|sort)==["Evidence Reports","Warehouse"] and ([.[]|select(.type=="volume")]|length)==1 and ([.[]|select(.name=="Warehouse")][0].volumeAttachments|length)==1' "${temp}" >/dev/null
else
  echo 'Source graph export skipped: set a real TEMPLATE_SOURCE_REPO to verify IaC.'
fi
if find . -path ./node_modules -prune -o -type f \( -name .env -o -name '*.local' \) -print | grep -q .; then
  echo 'Local secret files exist; do not distribute them.' >&2; exit 1
fi
echo 'PASS structural, syntax, locks, unit, metadata and offline checks; use smoke.sh for runtime proof'
