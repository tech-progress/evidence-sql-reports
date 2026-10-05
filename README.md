# Evidence SQL reports

Protected freshness and order/payment reconciliation reports using the current
self-hosted [Evidence](https://github.com/evidence-dev/evidence) CLI 0.10.1,
a private [PostgreSQL](https://www.postgresql.org) fixture warehouse and a
[Node.js](https://nodejs.org) readiness gateway.

These release instructions target recipe **1.0.1**, with immutable standalone
tag `v1.0.1`. Intended source: `tech-progress/evidence-sql-reports`, branch
`release-v1`, source root `/`. These coordinates require checks in
[PUBLISHING.md](PUBLISHING.md); naming them does not verify source access, tag
existence, qualification or publication availability. `VERSION`, Dockerfiles
and locks identify recipe 1.0.1; runtime acceptance is a separate check.

## What deploys

- **Evidence Reports:** committed SQL/Markdown pages and the native PostgreSQL
  direct connector in `connection.yaml`. Basic Auth protects pages, assets and
  `POST /api/query`, whose native request is `{"sql":"select ..."}` and whose
  response includes `rows` or an error. Evidence listens on `127.0.0.1:3001`;
  the public Node gateway listens on `PORT` (default 3000).
- **Warehouse:** synthetic fixtures, an independent administrator secret and
  `evidence_reader` with SELECT-only grants, a read-only session default and a
  10-second statement timeout. No public domain or TCP proxy.
- Exactly two services and one **5000 MB** warehouse volume mounted at
  `/var/lib/postgresql/data`, with `PGDATA` in its `pgdata` subdirectory.
  Reports has no volume or mutable report storage.

This uses the current live-query Evidence engine. Evidence Studio features
such as web editing, accounts, SSO, hosted warehouses and per-viewer RLS are
outside this recipe. The shared Basic Auth credential permits raw SQL within
reader grants, so give it only to trusted viewers. A read-only session default
does not replace least-privilege grants. Never grant access to unrelated
sensitive tables.

## Source and release inputs

The Dockerfile builds Evidence from upstream source commit
`474ef4564f00e84991a055a3196fb32fd9d8d63a`, verifies its archive checksum and
uses that commit's frozen `pnpm-lock.yaml`. [upstream.lock.json](upstream.lock.json)
records the inputs. Keep Evidence 0.10.1 at this commit unless primary upstream
evidence warrants a change.

The build applies hash-guarded recipe changes before compilation: exclude the
two Source Serif font files whose conversion/name provenance remains unresolved,
use system serif fonts, retain accessible original font notices, and record
compiler input/output identities. These changes do not modify report SQL or
authentication. The native PostgreSQL executor is retained, while foreign
warehouse driver imports are removed before compilation; non-PostgreSQL
connections are rejected explicitly. This recipe is not the general-purpose
multi-warehouse Evidence CLI distribution. Its unused S3 v3 ZIP downloader is
also excluded; local/buffer ZIP and XLSX processing are retained.
Original browser/font notices are delivered behind the same authentication at
`/licenses/THIRD_PARTY_NOTICES.md`, `/licenses/artifact-review/` and
`/licenses/fonts/`, in addition to retained runtime documentation.
[ARTIFACT_REVIEW.md](ARTIFACT_REVIEW.md) records the scope;
source provenance refers to that upstream commit plus the recipe changes,
not an unmodified upstream executable.

The vendor `evidencedev/serve` image's exact binary-to-source attestation remains
unresolved. A matching release checksum does not establish source provenance.
This source-built recipe does not use that vendor image or proprietary Studio
artifacts; substituting either requires a separate review.

| Input | Pinned 1.0.1 input and remaining check |
| --- | --- |
| Node.js | Official `node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e`; build and qualify the exact input. |
| PostgreSQL | Official `postgres:16.15-bookworm@sha256:efedf3595f1d6f415c08568ba171029bf54052e754cc9f030e3f2412b21f3d67`; registry index bytes match its digest; build and verify the running server separately. |
| Evidence | CLI 0.10.1, exact source commit above, verified archive and frozen dependency lock. |

Node 24.20.0 and PostgreSQL 16.15 are release targets, **not qualification claims**.
Read actual Dockerfiles and locks for the checkout's current pins. Bun compiles
Evidence and embeds its runtime in the executable; pnpm is build-only. Railway
SDK 3.6.0 is a development dependency. Compilation can
require substantially more resources than serving reports; local results do
not establish Railway build capacity.

## Local build and start

Requires Docker with Compose v2 and Node.js for verification tools; use the
intended Node 24.20.0 release target when qualifying 1.0.1. Building requires
pinned upstream source and package-registry access. Runtime needs the private
warehouse.

```bash
umask 077
report_env_file="$(mktemp -t evidence-sql-reports-env.XXXXXX)"
node scripts/generate-env.mjs > "$report_env_file"
./scripts/build.sh
./scripts/start.sh "$report_env_file"
```

Run from the template directory or standalone repository root. Retrieve viewer
credentials privately from the environment file and open `http://127.0.0.1:18309`.
Basic Auth requires HTTPS publicly. Compose uses `rt-evidence-sql-reports-18309`
and only port 18309 in the reserved 18309–18412 range; PostgreSQL and the inner
Evidence listener have no published ports.

With `docker compose --env-file "$report_env_file"`, `down` retains data and
`down -v` destroys the owned warehouse volume. Keep environment
files and dumps outside Git and build contexts; remove temporary secrets after
use. Do not remove shared images during cleanup.

## Environment variables

| Variable | Service | Required/default and meaning |
| --- | --- | --- |
| `PORT` | Reports | Optional, 3000; public gateway listener. 3001 is reserved internally. |
| `EVIDENCE_BASIC_USER` | Reports | Required, generated username; no colon. |
| `EVIDENCE_BASIC_PASSWORD` | Reports | Required, generated secret, at least 20 characters. |
| `EVIDENCE_TELEMETRY_DISABLED` | Reports | `true`; startup wrapper enforces child-server opt-out. |
| `REPORT_DB_HOST` | Reports | Required; `postgres` locally, `${{Warehouse.RAILWAY_PRIVATE_DOMAIN}}` on Railway. Bare hostname, not URL. |
| `REPORT_DB_NAME` | Reports | Required; `reports` / `${{Warehouse.POSTGRES_DB}}`. |
| `REPORT_DB_USER` | Reports | Required; `evidence_reader`, never the administrator. |
| `REPORT_DB_PASSWORD` | Both | Required, generated reader secret, at least 20 characters. Reports references `${{Warehouse.REPORT_DB_PASSWORD}}`. |
| `REPORT_DB_SSLMODE` | Reports | Required; `disable` only for the private fixture network; `verify-full` for an external TLS warehouse. Other modes are rejected. |
| `POSTGRES_DB` | Warehouse | `reports`; initialization expects this exact database name. |
| `POSTGRES_USER` | Warehouse | `postgres`; administrator used only by bootstrap/operator. |
| `POSTGRES_PASSWORD` | Warehouse | Required, generated independent administrator secret. Never given to Reports. |
| `PGDATA` | Warehouse | `/var/lib/postgresql/data/pgdata`, inside the single volume. |

`EVIDENCE_AUTH_DISABLED` is rejected even if set to `false`. There are no Studio
tokens or signup variables. Connector port is fixed at PostgreSQL 5432; edit
the committed connector for another port or `ssl_ca_path`. Supply only a public
CA certificate in a build context. See the
[PostgreSQL direct connector reference](https://docs.evidence.dev/direct-connectors/postgres.md).

Database role/password initialization happens only on an empty volume. Changing
a variable does not rotate an existing role's password. Follow
[UPGRADE.md](UPGRADE.md) for rotation and recovery.

## Reports and refresh

- `/freshness`: last successful ingestion, age, SLA, loaded rows, failed attempts
  and FRESH/STALE/NEVER state. A failed load does not reset a stale success.
- `/reconciliation`: exact numeric order/payment differences, unmatched payments,
  missing settled payments, currency mismatches and duplicate provider references.
  Failed/pending payments are excluded.
- `/`: connection role and read-only session status.

Queries execute live on page load/reload. There is no scheduler or stored report
snapshot. Fixtures are deliberately imperfect. To use real data, adapt the four
`reporting` tables or carefully granted views, replace connector variables and
rerun query and privilege checks before handling business data.

`/readyz` is anonymous and reveals only `ready`/`unavailable`. It queries through
Evidence and checks warehouse access, SELECT-only grants on four report tables,
restricted role flags and absence of schema-create privilege. Other requests
fail closed until readiness succeeds. This finite check does not establish
permissions for every database object or ingestion freshness.

## Railway source configuration

Both services must use the same verified source. The standalone release plan is:

```bash
npm ci --ignore-scripts
export TEMPLATE_SOURCE_REPO=tech-progress/evidence-sql-reports
export TEMPLATE_SOURCE_BRANCH=release-v1
export TEMPLATE_SOURCE_ROOT_DIR=/
./scripts/export-template.sh > /tmp/evidence-graph.json
./scripts/verify.sh
```

| Tooling variable | Meaning |
| --- | --- |
| `TEMPLATE_SOURCE_REPO` | Default `tech-progress/evidence-sql-reports`; verify actual `owner/repository` visibility and app access before deployment. |
| `TEMPLATE_SOURCE_BRANCH` | Slash-free branch; default `release-v1`. Verify its commit matches the intended release. |
| `TEMPLATE_SOURCE_ROOT_DIR` | Default `/` for verified standalone source; override only for a deliberately qualified alternate layout. |

Offline export does not verify visibility, branch/tag existence or Railway
GitHub App access. Preserve immutable `v1.0.1` in the standalone repository and
verify deployment commits separately from the movable branch.
[PUBLISHING.md](PUBLISHING.md) describes qualification, publication and readbacks.

## Validation and distribution

```bash
node --test tests/docs.test.mjs
./scripts/verify.sh
./scripts/smoke.sh
```

Smoke covers authentication, protected assets, prohibited SQL writes, report
queries, live refresh, outage/recovery and report replacement. Its schema restore
uses the **same volume** and does **not** prove recovery into a distinct empty
volume. Follow full PostgreSQL 16 SQL/roles/grants recovery in
[UPGRADE.md](UPGRADE.md) before claiming that evidence. Browser-hydrated rows
require the optional browser smoke tool; successful SQL or HTML table shells
alone do not demonstrate rendered report data.

For the existing browser checks, install Playwright separately and run
`BROWSER_SMOKE=1 PLAYWRIGHT_MODULE=/absolute/path/to/playwright ./scripts/smoke.sh`.
Playwright is a development tool, not a runtime dependency. These checks do not
extend the same-volume restore into empty-volume recovery proof.

The public distribution is **sanitized source and build instructions**. It does
not publish a combined binary image. Export [LICENSE](LICENSE),
[LICENSE_REVIEW.md](LICENSE_REVIEW.md), [PUBLISHING.md](PUBLISHING.md) and the
release/support docs with source; keep `FINDINGS.md` and local operational records
private. Newly authored recipe/wrapper/application code is MIT licensed; upstream
dependencies and trademarks retain their own terms. Preserve applicable notices
and corresponding-source obligations.

Review exact input grants, notices and default exposure as described in
PUBLISHING.md. This is a finite review, not universal legal or security clearance.
Built runtime notices under `/usr/share/doc/evidence/` do not alone establish
completeness. Publication availability and live readbacks are separate from
these build instructions. See [SUPPORT.md](SUPPORT.md) for limits and retention
after standard zero-compute deletion.
