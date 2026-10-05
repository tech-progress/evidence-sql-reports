# Deploy and Host Evidence SQL reports on Railway

Deploy protected SQL/Markdown reports for ingestion freshness and order/payment
reconciliation. Synthetic fixtures include stale pipelines, mismatched payments,
duplicate references and missing orders.

## About Hosting Evidence SQL reports

Evidence Reports uses the current source-built Evidence CLI, its native direct
PostgreSQL connector and shared HTTP Basic Auth. A private warehouse persists
on one 5000 MB volume; Reports has no volume. The public gateway fronts an
inner loopback-only Evidence listener. Retrieve generated viewer credentials
privately from service variables and use the HTTPS report domain.

## Why Deploy Evidence SQL reports on Railway

Keep the warehouse private, use a dedicated SELECT-only role and version report
definitions with code. Database-aware readiness checks the fixture connection
and report-table privileges. Reload a report to query current data.

## Common Use Cases

- Find stale or never-successful ingestions while retaining failed-run context.
- Reconcile order totals against settled payments with currency/duplicate checks.
- Evaluate reviewed reports on synthetic data before adapting warehouse views.

## Dependencies for Evidence SQL reports

Only trusted viewers should receive the shared credential: it authorizes raw
SQL within reader grants. This engine does not provide Evidence Studio accounts,
SSO, web editing or per-viewer RLS. PostgreSQL has no public domain or TCP proxy.
Source build, sizing and full empty-volume recovery require separate
qualification before business-data use.

### Deployment Dependencies

- [Evidence](https://github.com/evidence-dev/evidence) CLI 0.10.1, exact source
  commit `474ef4564f00e84991a055a3196fb32fd9d8d63a` and frozen lock. Vendor
  `evidencedev/serve` image provenance remains unresolved; that image is unused.
- [PostgreSQL](https://www.postgresql.org), intended 16.15 Bookworm target with
  official digest verification required, and one 5000 MB persistent mount.
- [Node.js](https://nodejs.org), intended official 24.20.0 target; Bun and pnpm
  are build tools. Target versions are not qualification claims.
- Verified GitHub source access and generated independent secrets.

Recipe 1.0.1 instructions target standalone immutable tag `v1.0.1` in
`tech-progress/evidence-sql-reports`, branch `release-v1`, root `/`. Verify
coordinates with [PUBLISHING.md](PUBLISHING.md). Sanitized source and build
instructions are the distribution; no public combined binary image is offered.
This text does not assert marketplace availability. Publication and live graph
readbacks must be recorded separately.
