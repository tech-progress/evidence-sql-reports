# Release qualification and publishing

These instructions target immutable recipe **1.0.1**. Intended standalone
coordinates: `tech-progress/evidence-sql-reports`, tag `v1.0.1`, branch
`release-v1`, source root `/`. Verify them before use. An authoring checkout,
offline graph export or named tag does not prove public source access,
Railway deployment success or marketplace availability. This document remains
applicable before and after publication; record availability/readbacks separately.

## Source-only distribution and finite review

Distribute sanitized standalone source and build instructions, without a public
combined binary image. Include README, release/support docs, `LICENSE`,
`LICENSE_REVIEW.md` and this `PUBLISHING.md`. Only `FINDINGS.md` and local
operational records are private. Preserve upstream links in every GitHub-facing
README, including the standalone repository. Never export credentials,
environment files, database dumps or resolved-secret graphs.

1. Review [LICENSE_REVIEW.md](LICENSE_REVIEW.md) against exact release inputs:
   Evidence 0.10.1 source commit `474ef4564f00e84991a055a3196fb32fd9d8d63a`,
   archive checksum, frozen dependency lock, base/build image digests and the
   recipe/package lock. Preserve applicable grants, notices and corresponding
   source obligations.
2. Record unresolved notice questions for those inputs; resolve them before the
   relevant distribution. Notice copying alone is not a complete license review.
   No zero-scanner requirement or universal legal/security clearance is implied.
   Publishing a binary image would need its own review.
3. Review default exposure: public HTTPS gateway, protected pages/assets/native
   query API, anonymous minimal `/readyz`, loopback-only inner Evidence listener,
   private warehouse and reader least privilege. Shared viewer credentials
   authorize raw SQL; use trusted viewers and synthetic fixtures.

Vendor `evidencedev/serve` image source attestation remains unresolved. This
recipe builds current Evidence from source and does not use Studio or that image.
Source provenance for this recipe does not attest the vendor image.

## Immutable release and local qualification

1. Set `VERSION`, package/lock metadata and dated changelog to 1.0.1. Apply and
   read back the intended official Node 24.20.0 digest in [README.md](README.md).
   Recheck the official PostgreSQL 16.15 Bookworm digest against the pinned
   verified registry index in [README.md](README.md).
   These targets do not establish qualification.
2. Prepare sanitized standalone source. Verify files, notices, locks and upstream
   links. Create immutable standalone tag `v1.0.1` only for that exact tree;
   read back its commit/tree and do not move a published tag. Check `release-v1`
   resolves to the intended commit and both `Dockerfile` and `Dockerfile.postgres`
   exist at source root `/`.
3. Verify public source visibility and Railway GitHub App access independently.
   Use `TEMPLATE_SOURCE_REPO=tech-progress/evidence-sql-reports`,
   `TEMPLATE_SOURCE_BRANCH=release-v1`, `TEMPLATE_SOURCE_ROOT_DIR=/` only after
   these checks. Offline tooling does not perform them.
4. From a secret-free checkout, run focused tests, `scripts/verify.sh`, the source
   build and `scripts/smoke.sh`. Record inputs/results privately. Assert hydrated
   freshness/reconciliation rows in a browser, including changed results after
   refresh and replacement; SQL results and HTML shells alone are insufficient.
5. Qualify full PostgreSQL 16 SQL backup with roles, passwords, ownership and
   grants while writers are quiesced. Restore/import into a **distinct empty
   volume** before starting Reports, preserving original credentials. Existing
   same-volume schema smoke does not satisfy this gate. Follow
   [UPGRADE.md](UPGRADE.md), without reusing the old volume.

## Offline graph tools

`scripts/export-template.sh` uses Railway SDK 3.6.0 locally. It substitutes secret
generator expressions rather than storing generated values and does not create
resources, authorize source access or publish anything. Keep graph files private.

For an existing Composer graph obtained by the authorized operator:

```bash
./scripts/restore-template-draft.sh /tmp/existing-draft.json /tmp/restored-draft.json
./scripts/audit-template.sh /tmp/restored-draft.json
```

Accepted inputs: bare `serializedConfig`, `{serializedConfig: ...}` or
`{data:{template:{serializedConfig: ...}}}`. Restoration requires existing IDs
for exactly `Evidence Reports`, `Warehouse` and one warehouse attachment. It
retains IDs, refuses to invent volume IDs and restores source/build, health,
generated defaults and networking. It supports `volumeAttachments` and legacy
`volumeMounts`. Audit checks source/image drift, variables, start overrides,
ports and the 5000 MB `/var/lib/postgresql/data` attachment. Local checks do
not establish the stored cloud graph's current state.

## Railway qualification, publication and readbacks

- Qualify sequentially with at most one owned active Railway verification
  project. Inspect ownership before creation; finish cleanup before another.
- Deploy the audited draft and verify stored source repo/branch/root and exact
  commit against standalone tag `v1.0.1`. Observe successful deployments and
  current healthy replicas for both services, private connectivity, auth
  rejection, native queries, hydrated reports, refresh, replacement,
  distinct-empty-volume restore and measured resource headroom.
- Confirm exactly two services, one 5000 MB warehouse mount, no Reports volume,
  one public HTTPS gateway, private inner loopback listener and no warehouse
  domain/TCP proxy. Record finite default-exposure checks.
- Register actual marketplace ID/code in repository-wide
  `railway-template-metadata.json` using local metadata. Use the Evidence product
  icon, specific 45–75 character description and all main upstream origins.
  Run root `scripts/sync-template-marketplace.sh` and require root
  `scripts/audit-template-marketplace.sh` to pass.
- Publish with [MARKETPLACE.md](MARKETPLACE.md) after gates pass. Read back listing
  availability and published graph source, variables, health, networking and
  mount. Record actual URLs/IDs privately; add a public deploy link only after
  verifying it exists. Immutable coordinates and availability are separate.
- Perform standard zero-compute deletion of owned verification/source projects
  and read back deletion/absence of running owned instances. Do not remove
  shared images. Historical success does not prove replicas or cleanup.
  Railway may retain logs, build/deployment metadata, caches, backups or billing
  records under its retention policies. Deletion does not prove physical erasure
  or a zero bill.

These instructions assign no completed gate or current publication state.
Recorded operator readbacks establish those facts for the exact release.
