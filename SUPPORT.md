# Support boundary

Recipe 1.0.1 instructions target standalone immutable tag `v1.0.1` in
`tech-progress/evidence-sql-reports`; verify coordinates and qualification using
[PUBLISHING.md](PUBLISHING.md). Publication availability/readbacks are separate.
Node 24.20.0 and PostgreSQL 16.15 are intended targets, not qualification claims.

This is a single-replica report-pack topology. Evidence Studio, HA, ingestion
orchestration and multi-tenant access control are outside its support boundary.

- Shared Basic Auth protects pages, assets and the native SQL query API. Trusted
  credential holders can issue raw SQL within reader grants. There is no browser
  logout, user database, signup, SSO, page ACL or per-viewer RLS.
- Database/viewer credentials are independent. Keep administrator credentials out
  of Reports and deny the reader CREATE/ALTER/INSERT/UPDATE/DELETE privileges.
  Read-only session defaults do not replace privilege checks.
- Anonymous `/readyz` returns only readiness status. Its finite checks cover
  access, role flags, schema-create denial and four report tables. They do not
  audit every inherited role, unrelated object, ingestion SLA or cloud setting.
  External roles need operator review; authenticated SQL can still be expensive.
- Exactly two services, one 5000 MB warehouse mount and no Reports volume.
  Only the gateway is public; inner Evidence binds to loopback and PostgreSQL
  has no public domain/TCP proxy. Private fixture connections use no TLS;
  use `verify-full` and suitable CA trust for external warehouses.
- Pages are baked into the source-built image; editing requires rebuilding and
  replacement. Queries run on page load/reload without schedule or
  materialization behavior; larger data needs indexing and query budgeting.
- The warehouse volume survives report replacement but is not an offsite backup.
  Maintenance can cause downtime; 5000 MB is a default allocation. Old same-volume
  schema restore is not empty-volume recovery proof. Follow
  [UPGRADE.md](UPGRADE.md) for full SQL/roles/grants import into a distinct empty
  volume before app start and verify original-credential continuity.
- Source compilation uses upstream locks and ignores install scripts. Resource
  limits, build capacity and architecture compatibility need exact deployment
  checks; no production RAM/cost promise is made.

Public releases contain sanitized source and build instructions, without a
public combined binary image. [LICENSE_REVIEW.md](LICENSE_REVIEW.md) and
PUBLISHING.md accompany them; only findings/local operational records are private.
Exact input grants, notices and default exposure receive finite review, not
blanket legal/security clearance or a universal zero-scanner gate.

Standard zero-compute deletion removes owned verification/source projects and
requires readbacks showing no running owned instances. Shared images are not
removed. Railway retention may include logs, build/deployment metadata, caches,
backups and billing records; cleanup does not establish physical erasure or a
zero bill.

Report failures with recipe/upstream versions, redacted settings, the failed
check and whether a distinct empty volume was used. Never submit `.env`,
passwords, Authorization headers, role password hashes or data dumps.
