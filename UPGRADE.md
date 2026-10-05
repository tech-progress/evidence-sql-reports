# Upgrade and recovery

## Release identity and backups

Recipe 1.0.1 targets immutable standalone tag `v1.0.1` in
`tech-progress/evidence-sql-reports`. Verify its commit/tree and source access
using [PUBLISHING.md](PUBLISHING.md); moving branch `release-v1` is not an
immutable rollback identity. Record `VERSION`, source/archive hash, dependency
locks and actual image digests for each qualified release.

Node 24.20.0 and PostgreSQL 16.15 Bookworm are intended 1.0.1 targets, not
qualification claims. Verify the PostgreSQL digest before pinning it and run
fresh build/start checks after pin changes. Evidence remains CLI 0.10.1 at
source commit `474ef4564f00e84991a055a3196fb32fd9d8d63a` until primary upstream
evidence supports a change.

Keep encrypted PostgreSQL backups outside the platform and build context.
Preserve full SQL, roles, role password hashes, ownership, grants/default
privileges and role/database settings. Store original administrator, reader
and viewer credentials in a secret manager. Reports has no mutable volume;
recover pages/connector configuration from the verified release.

## Distinct empty-volume recovery gate

Existing `scripts/smoke.sh` dumps the reports database and restores its schema
into the **same volume**, with cluster roles and credentials already present.
That checks schema restoration; it does **not** prove empty-volume recovery,
original-credential continuity, PITR or remote disaster recovery.

Qualify the following separately before claiming fresh-volume recovery:

1. Quiesce ingestion and every other writer, stop Reports and keep writers
   stopped through backup/cutover. Use PostgreSQL 16 tools and private operator
   access to take a **full SQL cluster dump with `pg_dumpall`**, including roles,
   password hashes, databases, data, ownership and grants. Do not use
   `--no-role-passwords`, `--no-owner` or `--no-acl` for this qualification.
   Store the dump with restrictive permissions outside the checkout; it is a
   secret, not a release artifact. Record backup completion and integrity.
2. Stop the old warehouse and preserve its volume for rollback. Allocate a
   **distinct empty volume**, record its different identity and verify emptiness
   before PostgreSQL initialization. Never attach, copy PGDATA from or reuse
   the old volume to satisfy this gate. Keep replacement private and Reports
   stopped.
3. Initialize compatible PostgreSQL 16 on the new volume with a controlled
   restore bootstrap. Normal empty-volume initialization seeds fixture roles
   and tables; suppress that seeding for recovery to avoid full-import collisions.
   Explicitly review bootstrap-role/database collisions, including the existing
   `postgres` role; reconcile only known bootstrap statements while retaining
   restored passwords, ownership and grants. Do not ignore general SQL errors.
4. Import reviewed full SQL with `psql` and `ON_ERROR_STOP=1` through private
   operator access **before starting Reports**. Fail on unexpected errors.
   Confirm restored database/schema/data, role flags, SELECT-only grants,
   default privileges, read-only setting and timeouts. Restore required health/
   initialization markers only after import validation; markers alone are not
   restoration proof.
5. Verify network authentication with the **original** administrator and reader
   credentials rather than regenerating passwords to make tests pass. Preserve
   original viewer credentials too. Set service variables/references to those
   originals and the replacement private hostname. Entrypoint variables do not
   rewrite restored role passwords.
6. Start Reports only after import and SQL checks pass. Verify readiness,
   original viewer access, anonymous/wrong-password rejection, prohibited writes,
   queries and browser-hydrated rows. Confirm restored data survives refresh
   and report replacement on the new volume. Record volume identities, import
   results and credential-continuity checks privately without printing secrets.
   Resume writers only after cutover checks succeed.

This procedure is a qualification requirement; the shipped smoke script does
not automate it. Retain the old volume until the operator accepts recovery,
then delete owned test resources under the cleanup policy.

## Compatible updates and rollback

Update `VERSION`, package/lock metadata and dated [CHANGELOG.md](CHANGELOG.md),
pin changes independently and rebuild. Run structural/runtime and browser checks
on exact inputs. Replace Reports while retaining the warehouse volume; queries
must reflect live data after replacement.

Schema, variable, authentication-state, project-format or topology changes need
an explicit migration and may require a major release. Do not start a different
PostgreSQL major on existing PGDATA; use tested dump/restore or supported
`pg_upgrade`. A 16-series target alone does not prove compatibility. Roll back
Reports to a previously verified immutable release; if schema changed, restore
compatible data into a separate private cluster before switching Reports.

## Secret rotation

- **Viewer:** change `EVIDENCE_BASIC_PASSWORD` and replace Reports; test old,
  anonymous and new credentials, including browser-cached credentials.
- **Reader:** change existing `evidence_reader` password through private admin
  access using safe input handling, update Warehouse's `REPORT_DB_PASSWORD`,
  then replace Reports to refresh its reference. Recheck least privilege and
  failed writes.
- **Administrator:** change the PostgreSQL role password and corresponding
  `POSTGRES_PASSWORD`; never pass it to Reports.

Changing environment variables on existing volumes does not rotate passwords.
Do not destroy a business-data volume to force initialization.
