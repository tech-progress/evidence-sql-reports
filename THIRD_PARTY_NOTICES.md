# Third-party notices

This source recipe uses [Evidence](https://github.com/evidence-dev/evidence),
[Node.js](https://nodejs.org/), [Bun](https://bun.sh/),
[pnpm](https://pnpm.io/) and [PostgreSQL](https://www.postgresql.org/).
Original recipe code is MIT-licensed; upstream software, fonts and trademarks
retain their own rights. No upstream endorsement is implied.

The finite reviewed Evidence source is 0.10.1, commit
`474ef4564f00e84991a055a3196fb32fd9d8d63a`, archive SHA-256
`02d5200d5fb427b6fa204d984f10c12c9a62e9cb2a119828605244e635a53e16`.
Bun 1.3.11 and pnpm 9.15.0 are the reviewed build inputs. Node 22.22.0 is the
historical runtime; Node 24.20.0 and PostgreSQL 16.15 are intended parent-selected
replacement inputs, not a claim about an already rebuilt release.

## Preserved originals

The [notice index](artifact-review/NOTICE_INDEX.md) links each recovered original
notice or explicitly identified verbatim license excerpt to a file named by its
SHA-256. [notice-manifest.json](artifact-review/notice-manifest.json) records
original input identity, primary link, byte count, hash, and the kind of evidence.
The collection includes 950 cached package notice files, the exact Evidence MIT
notice, upstream patch notice, three adjacent font notices, versioned Bun/Node/
PostgreSQL terms, an Adobe Source Serif family license, and supplemental notices
from integrity-verified exact npm archives or their npm gitHead source.

Preserve the entire original text, including multiple copyrights, exceptions and
notices inside an aggregate file. The collection can include tools and unused
optional dependencies. Presence here does not assert runtime inclusion, nor does
a recovered family license attest an exact font conversion. The 24 remaining
original-text gaps are named in
[npm-gap-disposition.json](artifact-review/npm-gap-disposition.json); primary
published license declarations are recorded separately from recovered full grants.
The [supplemental review](artifact-review/supplemental/README.md) recovers two
package-level texts and scoped third-party portions. Twenty-two exact inputs
still need original grant/scope resolution if actually copied or embedded;
the installed input closure is not an inclusion map.

## Component dispositions

| Input | Applicable disposition |
| --- | --- |
| Evidence CLI and original shared core | MIT; preserve exact upstream copyright and grant |
| npm MIT / ISC / BSD inputs | Preserve applicable copyright, permission, conditions and disclaimers |
| Apache-2.0 inputs | Preserve license, applicable NOTICE and modification notices |
| JSZip 3.10.1 | MIT option selected from MIT OR GPLv3 |
| DOMPurify 3.4.13 | Apache-2.0 option selected; preserve its copyright header |
| argparse 2.0.1 | Preserve complete Python/PSF lineage terms |
| big-integer 1.6.52 | Unlicense; original grant retained |
| minimatch 10.2.4 | Blue Oak Model License 1.0.0; provide license text or required link |
| Lightning CSS 1.32.0 / 1.33.0 | MPL-2.0 tool; covered source obligations if the tool/code is redistributed |
| lz4 0.6.5 | MIT wrapper / BSD library; separately identify GPL program/test inclusion if distributing binaries |
| Geist / Geist Mono / Noto Color Emoji / Fira Mono | OFL-1.1; preserve copyright and OFL, obey reserved names |
| Source Serif 4 font inputs | Excluded before embedding by hash-guarded recipe preparation; conversion/name provenance remains unresolved, not waived |
| Bun native runtime in compiled Evidence | MIT plus native/embedded dependency terms, including applicable LGPL source and relinking obligations |
| Node runtime | Retain the exact selected version's aggregate LICENSE |
| PostgreSQL | PostgreSQL grant; retain base/package notices independently |

Upstream patches apply to `ssf` 0.11.2 (Apache-2.0), `echarts` 6.1.0
(Apache-2.0), and `zrender` 6.1.0 (BSD-3-Clause). The upstream
[patch notice](https://github.com/evidence-dev/evidence/blob/474ef4564f00e84991a055a3196fb32fd9d8d63a/patches/THIRD-PARTY-NOTICES.md)
and preserved [patch inputs](artifact-review/patched-inputs/) document those
modifications. Retain the changes and notices when the patched software is copied
or bundled, including browser bundles whose minification may remove headers.

The recipe additionally changes Evidence's executor registry to PostgreSQL-only,
excludes Source Serif before embedding, and removes the optional S3 v3 download
method from `unzipper` 0.12.5. The latter retains its original MIT license,
local/buffer/custom ZIP readers and XLSX processing. Exact original input guards
and modifications are in [prepare-upstream.mjs](scripts/prepare-upstream.mjs);
compiler maps and renewed native acceptance, not these source edits alone,
establish final inclusion and behavior.

## Build-time delivery

These source notices must accompany the artifact where its terms require them.
The source-only publication route does not waive mandatory notice/grant delivery
in a generated server or browser asset. The required copy inputs and pending
artifact identity checks are in [ARTIFACT_REVIEW.md](ARTIFACT_REVIEW.md).
The notice collection provides finite evidence, not permission to redistribute
an unreviewed vendor image or a universal security/legal assurance.
