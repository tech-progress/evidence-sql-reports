# License review — source recipe scope

Reviewed 2026-10-05. This review covers the original recipe and finite inputs for
Evidence 0.10.1 at commit `474ef4564f00e84991a055a3196fb32fd9d8d63a`.
The selected publication is sanitized source and build instructions. A compiled
Evidence executable or combined runtime image is a separate distribution.

The owner's MIT authorization applies to newly authored recipe, wrapper and
report code under [LICENSE](LICENSE). It does not relicense dependencies, fonts,
upstream patches or trademarks. No rights or source attestation for
`evidencedev/serve` are inferred; that vendor artifact is outside this selection.

## Affirmative source grant and exact inputs

The [Evidence source LICENSE at the selected commit](https://github.com/evidence-dev/evidence/blob/474ef4564f00e84991a055a3196fb32fd9d8d63a/LICENSE)
is MIT: use, modification and redistribution are permitted with the copyright
and permission notice preserved. The fetched source archive SHA-256 is
`02d5200d5fb427b6fa204d984f10c12c9a62e9cb2a119828605244e635a53e16`.
The reviewed runtime's Evidence notice and `pnpm-lock.yaml` match that archive
byte-for-byte. The original notice SHA-256 is
`818e8dba24d293850aa1f7804d330512fdf29c5cd2b304235602d3176084534c`;
the lock SHA-256 is
`51f9cf09cce5254144be99ae86825a7d17094f45d38f33d9620a1c4d146e0255`.
The CLI and original shared `core` source fall within that grant; third-party
material used by `core` retains its own terms. A workspace package being private
or lacking its own LICENSE file does not override the repository grant.

The finite inventory contains 950 cached dependency notice files in 901 pnpm
installation contexts, representing 896 exact package versions. The complete
lock contains 1,049 package versions. A conservative CLI/core build closure
contains 1,010 versions, including dev tools and optional foreign-platform
packages; that is an input envelope, not a binary inclusion claim. Forty-seven
additional exact npm archives were fetched without installation and verified
against the source lock integrity. Original notice texts were recovered for 23
of these inputs, including grants carried in README files and exact npm gitHead
sources. The remaining 24 have primary published permissive license declarations
but incomplete original attribution/grant-text records. Their precise disposition
is in [npm-gap-disposition.json](artifact-review/npm-gap-disposition.json).
Missing a standalone LICENSE is not treated as proof of a missing grant.

[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the
[original notice index](artifact-review/NOTICE_INDEX.md) preserve recovered texts,
primary links and SHA-256 identities. Cached collection provenance is distinguished
from independently integrity-verified npm archives. This is not universal legal
clearance or a demand for a universal SBOM before publishing original source.

## Required conditions and unresolved artifact inputs

- MIT, ISC and BSD inputs require preservation of the applicable notices;
  Apache-2.0 inputs require the license and applicable NOTICE text, plus notices
  of modifications. Preserve the Evidence `ssf`, `echarts` and `zrender` patch
  notices and the patches' change descriptions. These are upstream modifications,
  not changes authored in this review.
- JSZip 3.10.1 offers MIT OR GPLv3; use its MIT option. DOMPurify 3.4.13 offers
  Apache-2.0 or MPL-2.0; use the Apache option and retain its copyright header.
  A license document mentioning GPL does not automatically impose GPL on all
  software in this build. `argparse` carries Python/PSF lineage terms; retain its
  complete original notice. `big-integer` uses the Unlicense and `minimatch` the
  Blue Oak Model License 1.0.0; preserve their recovered texts.
- Lightning CSS 1.32.0/1.33.0 is MPL-2.0 and is a build dependency here. CSS
  generated with it does not, solely because of tool use, become MPL software.
  Redistributing its executable or covered code would require its notice and
  the corresponding covered source under MPL §3.2. The cached `lz4` notice set
  distinguishes the BSD library from GPL programs/tests; final inclusion must
  distinguish those files before any separate binary distribution.
- Geist, Geist Mono, Noto Color Emoji and Fira Mono have recovered OFL-1.1
  notices. Preserve copyright and OFL text with font copies; respect reserved
  font names for modifications and the prohibition on selling fonts alone.
  Two embedded Source Serif 4 WOFF2 inputs have no adjacent notice in the pinned
  source. An [Adobe 4.004R family grant](https://github.com/adobe-fonts/source-serif/blob/4.004R/LICENSE.md)
  was recovered, but exact subset/conversion attribution has not been established.
  Complete that attribution and attach its copyright/OFL text, or exclude those
  exact fonts, before distributing the built browser assets. Other bundled font
  notices may already be embedded as static assets; final verification must
  establish their accessible delivery rather than infer absence from disk alone.
- [Bun 1.3.11's primary terms](https://github.com/oven-sh/bun/blob/bun-v1.3.11/LICENSE.md)
  declare Bun itself MIT and identify statically linked JavaScriptCore/WebKit
  under LGPL, other linked libraries, and embedded polyfills. Bun's runtime is
  part of a `bun build --compile` output; calling Bun a build-only tool does not
  resolve those terms. Before distributing that executable, identify the actual
  native inputs, preserve their notices, and provide the applicable LGPL
  corresponding source and relinking/object materials or another compliant
  distribution mechanism. A generic upstream link alone does not prove fulfillment.
  This source review does not approve compiled-binary redistribution.
- [Node 22.22.0](https://github.com/nodejs/node/blob/v22.22.0/LICENSE) and
  [target Node 24.20.0](https://github.com/nodejs/node/blob/v24.20.0/LICENSE)
  carry aggregate MIT and third-party notices. The historical runtime's Node
  notice matches the official 22.22.0 text. Retain the matching aggregate notice
  in the final base. [PostgreSQL 16.15's grant](https://github.com/postgres/postgres/blob/REL_16_15/COPYRIGHT)
  permits use/modification/distribution with its copyright and permission notices;
  base-distribution packages retain their separate notices/source obligations.
  This does not review or approve redistribution of the whole Debian base.

Source-recipe publication is within the identified original/source grants, with
these build conditions disclosed. Artifact notice delivery remains incomplete:
repair the copy inputs, resolve exact-font attribution, and resolve actual native
Bun redistribution conditions when selecting a binary distribution. The parent
owns production pins, recipe version, build verification and publication.
