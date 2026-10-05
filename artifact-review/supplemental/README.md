# Supplemental exact-input grant and notice review

Reviewed 2026-10-05 for Evidence CLI 0.10.1 at
`474ef4564f00e84991a055a3196fb32fd9d8d63a`, Node 24.20.0, Bun 1.3.11,
and PostgreSQL 16.15. The selected distribution is source and build instructions.
This pass adds evidence for exactly the 24 previous zero-notice npm inputs;
the existing 983 mappings are unchanged.

All 24 cached npm archives were rechecked against their recorded SHA-512 lock
integrities. The machine-readable [dispositions](dispositions.json) record exact
archive, metadata, source and retained-text hashes, primary URLs, scope limits,
original notice provenance, and each remaining blocker. The review made 53
bounded unauthenticated primary-source GET requests, including initial probes
and a repeated nine-file follow-up. No install, build, image pull, container,
vulnerability scan, API, cloud action, publication or child-agent work was run.

Two package-level text gaps are recovered: `saxes@5.0.1` has its original
release ISC license with inherited notices; `natural-compare@1.4.0` retains
its exact 2012–2015 attribution and the full MIT grant at its author-designated
link. The latter is a live primary reference retrieved on the review date,
not a historical page snapshot. For saxes the tagged source declares 5.0.1
and its README bytes match the published archive; no rebuilt binary equality
or signed source provenance is asserted.

Three inputs have grants for specific portions, with package-wide scope still
unresolved: Neoconfetti's core portion has Puru Vijay's full MIT grant;
PostHog contains TraceKit/Sentry MIT grants and a source-linked UUID Apache
grant; stackback's V8-derived formatstack.js carries a full BSD-3-Clause grant.
The remaining 19 inputs have positive publisher declarations but no recovered
original package grant body. That is an evidence/delivery gap if included,
not a finding that every such input is unlawful.

## Exact remaining decisions

| Input | Remaining action if copied or embedded |
| --- | --- |
| `@aws-sdk/credential-provider-http@3.972.26` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `@aws-sdk/credential-provider-login@3.972.28` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `@aws-sdk/nested-clients@3.996.18` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `@databricks/databricks-sql-kernel-linux-x64-gnu@0.2.0` | The integrity-verified 0.2.0 archive contains only package.json and index.linux-x64-gnu.node. Apache-2.0 appears only as metadata; there is no original grant, copyright, NOTICE, repository or gitHead. For copied/loaded native code, obtain publisher-matched original notices and the native component/dependency provenance, or verify absence. Do not invent a generic Apache attribution or infer the native dependency set from SPDX. |
| `@neoconfetti/svelte@2.2.2` | Release tag contains @neoconfetti/svelte 2.2.2 and a core MIT grant, but no Svelte wrapper grant body. Resolve applicability to any included wrapper code, or prove the final output contains only the licensed core portion. Do not assume the sibling core LICENSE covers all packages. |
| `@nodable/entities@2.1.1` | MIT appears only as publisher/package/README metadata. The npm gitHead 8aa6d25b44b96a547e47c00873baaf5817ae2b9f source archive returned 404. Recover an original grant/notice tied to entities 2.1.1 or verify absence; do not borrow a same-author sibling project's grant. |
| `@posthog/core@1.14.0` | Exact @posthog/core 1.14.0 metadata declares MIT, while the same release's root LICENSE applies Apache-2.0 to primary work and specific MIT terms to named third-party portions. No packages/core/LICENSE was recovered. Resolve the primary core grant's applicable scope instead of claiming a recovered package-wide MIT grant. Retain the release-root Sentry notice and TraceKit grant for included parser-derived code, plus the uuidv7 original LiosK header and immutable-source Apache license for included UUID code. Preserve modification notices where applicable. Exact copied parser bytes match the release tag; modified vendored UUID bytes are not identical to upstream source. |
| `asn1.js-rfc2560@5.0.1` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `asn1.js-rfc5280@3.0.0` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `cuint@0.2.2` | Original source headers retain 'Copyright (C) 2013, Pierre Curto' and 'MIT license', but no full grant/conditions were recovered. The npm gitHead source manifest says 0.2.1 rather than 0.2.2, although many shipped code bytes match. Obtain the 0.2.2 original grant/notice or verify absence; neither matching files nor bare MIT labels supplies the missing body. |
| `dlv@1.1.3` | Exact npm/archive and gitHead README designate https://oss.ninja/mit/developit/, but that request redirects to an unrelated WordPress landing page. No grant accepted from that response. Recover the author's original MIT grant/notice applicable to 1.1.3, or verify absence. |
| `is-reference@3.0.3` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `keyv@4.5.4` | Retain the original 'MIT © Jared Wray' notice, but obtain the missing MIT grant/conditions applicable to 4.5.4 or verify absence. No gitHead was supplied, and bounded v4.5.4/keyv@4.5.4 source-tag candidates returned 404. |
| `locate-character@3.0.0` | MIT appears only as publisher/package/README metadata. LICENSE and README.md at the npm gitHead on the declared GitLab repository returned 404. Recover an original grant/notice tied to 3.0.0 or verify absence; no negative licensing conclusion follows from these responses. |
| `memoize-weak@1.0.2` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `stackback@0.0.2` | Retain the V8 BSD-3-Clause copyright, conditions and disclaimer if formatstack.js is included. The rest of stackback has only its publisher's MIT declaration; recover that original grant/notice or prove those portions absent. The v0.0.2 tag candidate returned 404; this is not a finding of prohibited use. |
| `stream-events@1.0.5` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `stubs@3.0.0` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `tiny-case@1.0.3` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `tr46@0.0.3` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |
| `ts-deepmerge@8.0.0` | The cached exact npm package declares ISC and contains no original grant body. The 8.0.0 source tag candidate reports 7.0.3 in its package.json; reject it as an exact 8.0.0 grant mapping. Obtain publisher-matched 8.0.0 grant/copyright/conditions or verify absence. |
| `xml-naming@0.1.0` | If this exact input is copied or embedded, obtain its original grant/copyright/conditions text tied to this version, or document verified non-inclusion. Preserve the publisher declaration; do not substitute another package's grant. |

The release-tag candidate for `ts-deepmerge` 8.0.0 contains a 7.0.3 source
manifest; it is rejected as an exact-version grant mapping. `cuint`'s npm
gitHead contains a 0.2.1 manifest although many 0.2.2 shipped files match.
`natural-compare`'s gitHead names natural-compare-lite; its index.js matches
the exact input, and the publisher's own README independently designates
the author-hosted grant. None of these mismatches is silently normalized.

PostHog's exact package declares MIT, but the corresponding release root
LICENSE grants Apache-2.0 for the primary work and scoped MIT terms for
third-party code. The recovered root text is retained verbatim with its scope;
it is not relabeled as a package-wide MIT grant. The parser source matches
the tagged source exactly. The vendored UUID source explicitly identifies an
immutable upstream commit but has different bytes, so retain the original
LiosK attribution and applicable modification notices. Its `.LICENSE.txt`
header contains attribution/SPDX only; the actual Apache grant is separately
recovered from that source-linked commit.

The parent should retain applicable [notice texts](notices/) and this index,
then use its final compile dependency/asset map to establish file-level
inclusion or verified absence. Include server, client/static and native
code; dependency labels alone do not establish that a file is absent. The
collector change for LICENCE and license-bearing README files is helpful,
but cannot supply an original grant omitted from those inputs. Also handle
inline source grants and license filename suffixes explicitly.

Notice retention and final integration are still parent verification tasks.
Existing font, Bun/native source/relinking, base-image, build/start acceptance
and final artifact identity conditions remain outside this finite 24-input
pass. These dispositions provide neither universal clearance nor approval
to publish a compiled executable/image.
