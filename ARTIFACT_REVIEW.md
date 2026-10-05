# Artifact review and final identity gate

Reviewed 2026-10-05. The selected public distribution is sanitized standalone
source and build instructions. Planned recipe version 1.0.1 and final pins are
parent-owned. This pass inspected a cached source-built runtime read-only and
fetched exact primary source/notice inputs without builds, installation scripts,
image pulls, vulnerability scans or cloud/publication mutations. Runtime build
and start acceptance for the replacement pins remains a parent verification.

## Subsequent recipe integration

The Dockerfile now retains LICENCE/README-carried notices, the complete public
review bundle, recipe/upstream grants and exact patch descriptions. Hash-guarded
preparation excludes both Source Serif fonts and switches the serif stack to
system fonts before compilation. Original Geist/Geist Mono/Noto Color Emoji
and Fira Mono notices are copied into authenticated `/licenses/fonts/` assets.
Actual HTTP delivery and the changed artifact still require verification.
Build hooks record compiler input and output identities for precise inclusion
review; they do not by themselves grant redistribution permission.

The first measured bundle still retained eight unresolved server inputs through
foreign warehouse drivers: three AWS SDK packages, both ASN.1 RFC helpers,
`cuint`, `stream-events` and `stubs`. No unresolved package from the 24-input
set had a measured browser module contribution in that build. This is a precise
compiler observation, not a general grant or native-exclusion conclusion.
The recipe now removes non-PostgreSQL executor imports/cases at the exact
hash-guarded registry boundary and rejects other connection types explicitly.
It preserves the existing native PostgreSQL executor and public two-service,
one-volume graph. Subsequent compilation, dependency mapping and full native
recovery must verify this advertised PostgreSQL-only selection; a source edit
alone does not prove elimination.

The [24-input supplemental review](artifact-review/supplemental/README.md)
recovers two original package-level grants and several limited portions;
22 inputs retain conditional original-text/scope questions. Their actual server,
browser and native inclusion must be established before treating those questions
as included-artifact blockers or closing them through verified non-inclusion.

After the PostgreSQL registry change, three AWS inputs still appeared through
ExcelJS's optional `unzipper` S3 v3 reader. The recipe replaces only that reader
with a clear unsupported-feature error, retaining local/file/buffer/url/custom
ZIP methods and XLSX processing. The measured subsequent build has none of the
22 conditional inputs in Bun inputs/retained output or the five Rollup module
reports, with no runtime external imports. This resolves the named inclusion
objection for that measured selection, not the absent grants themselves.
Fifty-three rendered browser npm package/version inputs map to retained original
notices. Authenticated HTTP checks verify 566 original notice routes byte-for-byte
(with original source-font bytes distinguished from normalized review copies),
anonymous/incorrect credential denial and 404 for both excluded font files.
These bounded local observations do not replace final release identity, browser
hydration, Railway qualification or applicable future binary-distribution review.

The [font/native followup](artifact-review/fonts-native/FOLLOWUP.md) distinguishes
source-only instructions from browser asset delivery and later executable/image
redistribution. Bun's LGPL object/source requirements for conveying a compiled
output do not themselves impose that delivery obligation on the source-only
recipe. Actual mandatory browser notices are not exempted by that distinction.

The historical review below remains evidence of the earlier input/copy state,
not a claim that these integration steps have completed final qualification.

## Observed inputs and disposition

Evidence 0.10.1 remains at commit `474ef4564f00e84991a055a3196fb32fd9d8d63a`;
no primary reason to change that source was established in this finite review.
Its archive, source grant and lock were compared to the runtime notice copies.
[LICENSE_REVIEW.md](LICENSE_REVIEW.md) gives their identities and license limits.
The cached executable's version is corroborated, but neither a version string
nor these comparisons establish reproducible binary equality or a signed build
attestation. Its historical identity is recorded privately, not as the upcoming
release identity. The vendor `evidencedev/serve` artifact was not selected.

The conservative CLI/core dependency closure includes build tools and optional
foreign platforms. It must not be described as the set of embedded dependencies.
The Bun adapter bundles server code and embeds built client/static files; core's
sandbox build emits three browser bundles (chart, HTML, map). Dev-dependency labels
therefore do not exclude fonts or UI dependencies from the generated artifact.

## Concrete required license inputs

The existing file-name collector recovers many notices but misses `LICENCE`
spellings and licenses carried in README text. This is an actionable incomplete
notice-copy rule, not a finding that every package without LICENSE is illegal.
The supplemental exact archive review recovered 23 inputs' original texts;
24 still have primary license declarations with incomplete original texts.

The parent should preserve these inputs in the build-stage notice directory and
copy them into the final artifact's accessible documentation:

| Required input | Build / delivery requirement |
| --- | --- |
| Exact Evidence `LICENSE` and `pnpm-lock.yaml` | Keep current exact-source copies; the lock identifies inputs but is not a grant |
| Recovered `artifact-review/notices/`, `NOTICE_INDEX.md`, `notice-manifest.json`, and `THIRD_PARTY_NOTICES.md` | Include the original notice collection and attribution index in the runtime; verify links survive the selected layout |
| Installed package notices | Extend collection to case-insensitive `license*`, `licence*`, `notice*`, `copying*`, `ofl*`; preserve directory identity and nested notices |
| License-bearing README sections | Copy the recovered verbatim grants for named inputs; do not assume a file-name collector finds inline licenses |
| `patches/THIRD-PARTY-NOTICES.md` and the three exact patches | Preserve change descriptions with the patched libraries and their Apache/BSD texts |
| Static font copyrights and OFL texts | Keep each font's original notice in embedded/static delivery and accessible documentation; complete exact Source Serif attribution or exclude those inputs |
| Bun 1.3.11 original terms and actual linked-library/polyfill notices | Bun is embedded runtime code in the compiled output; resolve applicable LGPL corresponding-source/relinking materials for any binary redistribution |
| Selected Node aggregate LICENSE | Retain base-delivered text and verify it matches the selected version; historical notice does not stand in for the new one |
| Warehouse PostgreSQL and Debian package notices | Preserve upstream/base delivery; copying only PostgreSQL's permissive grant does not replace distribution-package obligations |
| Original recipe `LICENSE` | Include with copied recipe/wrapper/report code; currently it is not explicitly copied by the Reports Dockerfile |

Illustrative parent integration, with destinations chosen to preserve index links:

```dockerfile
COPY artifact-review/ /usr/share/doc/evidence/artifact-review/
COPY LICENSE LICENSE_REVIEW.md ARTIFACT_REVIEW.md THIRD_PARTY_NOTICES.md /usr/share/doc/evidence/
# From the verified build source, also retain upstream patch change notices,
# font notices and additional actual Bun/native compliance inputs.
# Do not add binaries or private artifacts to the source publication payload.
```

This snippet does not satisfy the unresolved native source/relinking conditions
by itself. The production Dockerfiles and build acceptance were not changed here.
Before any compiled-binary/image redistribution, close the precise native and
font conditions and deliver any missing notices for code actually included.
Source publication may describe these conditions without claiming artifact
redistribution approval or requiring universal scanner clearance.

## Finite primary maintenance review

The [Node 22.22.0 release](https://nodejs.org/en/blog/release/v22.22.0) is a
historical security release, with fixes to TLS, permission checks and unsafe
buffer creation. It is not evidence that all later issues are absent. The
[target 24.20.0 release](https://nodejs.org/en/blog/release/v24.20.0) and its exact
aggregate license were retrieved. The parent-specified official Node digest must
be tied to the final build by the parent; this review did not independently
verify that Node image's registry manifest or rebuild it.

[Bun 1.3.11 release notes](https://bun.sh/blog/bun-v1.3.11) describe included
HTTP chunked-transfer hardening, CRLF injection fixes, path buffer-overflow and
native bounds-validation fixes. These are affirmative fixes in that version,
not claims that it is affected by those already fixed defects. The reviewed
source/build retains Bun 1.3.11; Node replacement alone does not replace the
Bun runtime embedded in Evidence. No universal advisory sweep was performed.

Primary [PostgreSQL 16.14](https://www.postgresql.org/docs/release/16.14/) and
[16.15](https://www.postgresql.org/docs/release/16.15/) notes establish concrete
same-series maintenance reasons to replace historical 16.13: startup-packet
recursion and allocation-overflow fixes in 16.14, and SQL-triggerable memory
safety fixes in 16.15, including portal row-type checks (CVE-2026-16239).
A SELECT-only role and private network do not remove database-engine memory
safety exposure. The official `16.15-bookworm` registry index was fetched by GET;
its raw SHA-256 matched the registry digest header, with both amd64 and arm64
children recorded privately. This verifies immutable metadata, not the running
warehouse version or full base-package security status. No cross-major migration
is proposed. PostgreSQL says no dump/restore is required from 16.X; existing
installations must assess the release's plugin whitelist, pgcrypto cleanup and
COPY-script changes, plus conditional `btree_gist`/`ltree` reindexing.

## Default HTTP, authentication and raw SQL exposure

Source review shows public HTTP on the Reports gateway, Basic Auth configured by
required generated credentials, and the Evidence child bound to loopback. The
wrapper rejects an auth-disable variable. Upstream gates static assets, SSR and
API traffic in serve mode and disables Studio auth/development routes. The public
readiness endpoint discloses readiness only, but performs a database query on
request. Authenticated `/api/query` accepts arbitrary SQL strings against the
configured connector; it is not restricted to predefined report SQL. Credential
holders receive the database role's data/query capabilities. The default role is
restricted and readiness checks read-only/table privilege properties; these are
not a SQL sandbox, per-report authorization or a bound on database work.

Use Railway HTTPS for Basic Auth, retain private-only warehouse networking,
use `verify-full` for external database TLS, and restrict connector credentials
and data to the intended readership. The reviewed gateway's request/upstream
timeouts do not prove database query cancellation or resource limits. No live
probe or general penetration test was performed in this pass.

Standard project deletion stops owned service compute. Backups, volumes, logs,
platform retention and billing records can persist under their respective
policies; deletion is not a physical-erasure or zero-billing assertion. No owned
active Railway project was created by this review.

## Final artifact identity and future recheck

The parent must record and verify these before describing a final release as
qualified; this historical review does not fill them with assumed values:

1. Standalone repository revision, source-only file allowlist, release version,
   upstream source/archive/lock hashes, and production recipe hash.
2. Selected Node/Bun/PostgreSQL OCI index and platform-child digests, actual
   build-platform architecture, base versions and original notices.
3. Evidence executable SHA-256, compile target, actual dependency/asset map,
   and output bundle/font hashes from the exact final build. Distinguish
   inputs installed only for build from runtime/static/native inclusion.
4. Original grants and notices for included inputs, exact font attribution,
   patch-change notices and applicable native source/relinking delivery.
   Resolve the named gaps or document verified non-inclusion.
5. Correct artifact COPY paths, intact notice hashes/index links, accessible
   embedded font/browser attribution, recipe license, and corresponding-source
   delivery where the selected redistribution mechanism requires it.
6. Railway build/start commands and authorized parent runtime acceptance with
   the selected final pins; auth failures, static/API protection, raw SQL role
   boundaries and private warehouse exposure. Preserve retention disclosure.
7. Recheck only changed inputs and relevant primary releases/advisories when a
   pin, archive, platform, bundle, font, copy rule or exposure default changes.
   Record concrete deltas; do not carry this review forward as blanket clearance.

Publication graph, marketplace sync/audit, credentials and cloud lifecycle remain
parent-owned. No operational identities or private review artifacts belong in
the standalone public source payload.
