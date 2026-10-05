# Fonts and native terms — finite r1 followup

Reviewed 2026-10-05. Selected publication: standalone source and build
instructions, with Evidence CLI 0.10.1 at
`474ef4564f00e84991a055a3196fb32fd9d8d63a`, Bun 1.3.11, Node
24.20.0 and PostgreSQL 16.15. This memo refines r1's disposition for that
publication. It does not replace the old inventory or qualify a compiled image.

## Decision for the selected publication

Publishing the original recipe and instructions does **not itself distribute**
Bun, JavaScriptCore, Node, PostgreSQL, an Evidence executable or a Debian image.
There is no identified LGPL obligation to supply a combined application object
archive merely to publish these instructions. Retain the recipe's original MIT
notice with the source. Retain applicable upstream notices whenever upstream
code, patches or font files are actually copied into the public source payload.
A lock entry, download instruction or license declaration is not a copy of the
library it identifies.

Using the recipe to build privately is a different act from conveying its
executable. LGPL 2.0 and 2.1 §0 explicitly say the act of running a program using
the library is not restricted and cover output only when it constitutes a work
based on the library. Here the upstream adapter's `--compile` output contains
Bun runtime code; that observation matters to **distribution of that output**,
not to the licensing of every separately authored report or build instruction.
See the [original LGPL 2.0](notices/lgpl-2.0-LICENSE.txt) and
[LGPL 2.1](notices/lgpl-2.1-LICENSE.txt) texts, §§0, 5 and 6.

Fonts and client JS downloaded by report viewers are copies too. A source-only
release does not excuse font/OFL or client-library notices when the subsequently
deployed application serves those assets. Public image redistribution and
browser asset delivery must not be collapsed into one universal requirement.
Provisioning or conveying a built runtime to another party must be assessed
against that actual delivery; this memo establishes no exemption for that act.

## Exact embedded Source Serif evidence

The two cached source files match r1's hashes:

| Input under `cli/static/fonts/source-serif-4/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `SourceSerif4-Variable.woff2` | 50,824 | `c1df4596be5029233ed2afbb8b2f6ea20784b3fb1aa5d6b5c6519ccd85eb3dfb` |
| `SourceSerif4-Variable-italic.woff2` | 51,516 | `663e7ef3037a56dce81dfc33f68c1e6445995ffd8887991b3c0b68a7689c9da5` |

Read-only extraction of their SFNT name records recovered this exact copyright
in **both** files (name ID 0, Windows Unicode BMP, English US):

> © 2014 - 2021 Adobe Systems Incorporated (http://www.adobe.com/), with Reserved Font Name ‘Source’.

Both have name ID 5:

> Version 4.004;hotconv 1.0.116;makeotfexe 2.5.65601

Their primary name is “Source Serif 4”; PostScript names are
“SourceSerif4-Regular” and “SourceSerif4-Italic”. Both have the original license
URL `http://scripts.sil.org/OFL` in name ID 14. Neither has a full license
description in name ID 13. Exact decoded strings and raw name-record bytes are
in [embedded-font-names.json](embedded-font-names.json). Embedded copyright and
a URL alone do not furnish the full OFL text required by condition 2.

The [Evidence path history](https://api.github.com/repos/evidence-dev/evidence/commits?path=cli/static/fonts/source-serif-4&sha=474ef4564f00e84991a055a3196fb32fd9d8d63a&per_page=10)
returned one introduction commit,
[505885dade016e8357f64fb10f0cf8e6e590dc55](https://github.com/evidence-dev/evidence/commit/505885dade016e8357f64fb10f0cf8e6e590dc55),
with both files marked added. Its message is “publish evidence core”, with
GitOrigin-RevId 740c4a27636bc51e4aa104d51960f85acb0169e0. The bounded history
does not identify a converter, subset recipe or permission to retain the
reserved name. The Git blob IDs are respectively
30dbe2d6277f9764c9c1bdc697da340eff0b6ef8 and
94250309c741153505ce38956c5f5bdccb0be5c0. The commit API returned 300 files;
only selected relevant fields were retained, not an exhaustive commit diff.

The Adobe 4.004R tag resolves to
a9eaef81588dddd479f2275d87b3707ed7ae2847. Its
[immutable original OFL](https://raw.githubusercontent.com/adobe-fonts/source-serif/a9eaef81588dddd479f2275d87b3707ed7ae2847/LICENSE.md)
was fetched and matches r1 byte-for-byte: SHA-256
`bb1e7cb76848ee07553f92081428cd5e6eb41a85b65114cb15cc66d22718bf27`.
It begins:

> Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'. All Rights Reserved. Source is a trademark of Adobe in the United States and/or other countries.

OFL condition 2 requires that copyright and the license accompany each font
copy. Condition 3 restricts reserved names for modified versions. The definition
of a modified version includes deletion of components and changing formats.
Knowing the family grant and exact embedded copyright does not establish that
these particular converted/subset files may retain their primary name.

A bounded Google Fonts comparison also failed to establish exact provenance.
The [pinned Google metadata](https://raw.githubusercontent.com/google/fonts/08dc85da6bca7ae308a6f1d38d0b137465646071/ofl/sourceserif4/METADATA.pb)
has the same old embedded copyright but names different PostScript variants.
Its current-at-that-commit OFL begins “Copyright 2014 The Source Serif 4 Project
Authors”; it has no declared reserved name. This later family text is retained
as [comparison evidence](notices/Google-SourceSerif4-OFL-comparison.txt), not
selected as the grant for the two Evidence files. Four current gstatic Latin
variants were fetched and hashed in memory: none matches either input. The
weight-only variants were close in size (50,936 / 51,576 bytes) but different
in hash; similar size is not source identity. No older CDN version guessing,
font rewriting or broad search was undertaken.

**Concrete unresolved keep-font blocker:** establish the primary conversion or
subset lineage of these two exact hashes, including any retained-name permission
or applicable grant without that restriction; then attach the exact embedded
copyright and the applicable full OFL with each delivered font copy. There is no
finding that every converter requires an extra attribution, or that these files
are necessarily infringements. That determination was not made.

## Concrete exclusion proposal

[exclude-source-serif.mjs](exclude-source-serif.mjs) is an unapplied proposal.
[PROPOSED_DOCKERFILE.patch](PROPOSED_DOCKERFILE.patch) shows its exact integration
point: **after** verified upstream extraction and **before** installation/Vite/
asset embedding. It checks the original Evidence license, lock, adapter, CSS,
theme-stack file and both fonts against exact SHA-256 pins before doing anything.

With `--apply` on a disposable upstream build tree, it removes both font files,
removes their two CSS faces, and maps the serif option to Georgia / Times New
Roman / generic serif plus the existing emoji fallback. The CLI ships no
Spectral files; its existing Spectral declarations remain unused by this stack.
No replacement font is downloaded or redistributed. Existing documentation in
the upstream tree can still mention the old font family; the release description
should identify the system-serif substitution.

The adapter recursively discovers the built client assets and embeds them as
Bun file imports. Deleting files after compilation, changing the report theme
alone, or merely hiding a font URL would not prove exclusion. This proposal
acts before that discovery. It changes the build source derived from the pinned
upstream, so retain the Evidence MIT notice and record the substitution in the
release's build instructions.

Preview without modifying the cached source:

```bash
node artifact-review/fonts-native/exclude-source-serif.mjs --check /path/to/verified/upstream
```

Parent integration, if selected, copies the script into the build context and
runs its `--apply` mode only on the disposable extracted source, as shown in
the proposed patch. No production edit or apply-mode execution occurred here.
The read-only check passed against the exact cached source, generating CSS hash
20c8ee87aab49f836c9716c5c8686fcfc6dc8ab643127f5a12ceef9eb8c468ac
and stack hash
829cd6f10f9106a19075990e4631c6b62fa5387911df10b6e5f2ca5ac49ffd7f.
Build/start and final embedded-file verification remain unperformed, as requested.
Before claiming exclusion in a release, verify both WOFF2 hashes/paths are absent
from the final client/embedded asset map and test a serif report in a browser.
A system font changes typography and can change layout.

## Original grants and mandatory notices, matched to actual copies

[notice-provenance.json](notice-provenance.json) identifies the original source
hash, delivered text hash, version, primary location and provenance for every
text supplied here. No generic MIT, Apache or OFL boilerplate replaces an
original holder's notice. Some delivered text files normalize CRLF or add a
final LF; [original-exact-texts.json](original-exact-texts.json) preserves the
exact original UTF-8 strings for those cases, including the original Adobe
CRLF text and Bun's missing terminal LF.

| Actual publication/delivery | Original input and action |
| --- | --- |
| Original recipe, wrapper, reports and this proposed script | [Recipe MIT](notices/recipe-LICENSE.txt), copyright “2026 tech-progress contributors”: retain `LICENSE` in the standalone source. |
| Copied Evidence/core/adapter source, or generated code carrying it | [Evidence MIT](notices/Evidence-LICENSE.txt), copyright “2026 Evidence”: retain this full notice. Verified archive SHA-256 is `02d5200d5fb427b6fa204d984f10c12c9a62e9cb2a119828605244e635a53e16`; lock SHA-256 is `51f9cf09cce5254144be99ae86825a7d17094f45d38f33d9620a1c4d146e0255`. Archive/lock identity is not a substitute for the grant. |
| Copied upstream patches or the patched libraries | Preserve [upstream patch attribution](notices/Evidence-patch-notices.txt), original patches and their existing change notices. [ssf Apache text](notices/ssf-0.11.2-LICENSE.txt), [ECharts aggregate license](notices/echarts-6.1.0-LICENSE.txt), [ECharts NOTICE](notices/echarts-6.1.0-NOTICE.txt), [d3 notice](notices/echarts-6.1.0-LICENSE-d3.txt), and [zrender BSD text](notices/zrender-6.1.0-LICENSE.txt) must follow copied covered material and retained applicable attributions. Do not label the patches MIT. |
| Geist, Geist Mono, Noto Color Emoji font copies | Their full original OFL notices are supplied here: [Geist](notices/geist-LICENSE.txt), [Geist Mono](notices/geist-mono-LICENSE.txt), [Noto](notices/noto-color-emoji-LICENSE.txt). Keep adjacent originals before embedding and accessible originals with browser-delivered copies. Exact copyright lines are “Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font)”, “Copyright (c) 2023 Vercel, in collaboration with basement.studio”, and “Copyright 2013 Google LLC”. |
| Fira Mono copies, if included | Preserve [5.2.7 original OFL](notices/fira-mono-5.2.7-LICENSE.txt). Its published text begins “Google Inc.”; preserve that exact supplied attribution without inventing a copyright year or replacing it with another family's notice. Inclusion must be established from the actual generated assets, not the dev-dependency label. |
| The two Source Serif copies, if retained | Use the exact embedded copyright above and full applicable OFL. [Adobe 4.004R](notices/Adobe-4.004R-LICENSE.txt) is an affirmative family grant, but it does not close the specific retained-name/conversion condition. Select exclusion or close that condition. |
| Instructions obtaining/running Bun 1.3.11 | [Exact Bun terms](notices/Bun-1.3.11-LICENSE.md) declare Bun itself MIT and enumerate linked-library/polyfill terms. Tag resolves to a04817ce2b7f1a1e8b7cbf8af8f2c027ab072f1d. The document is a declaration and component inventory, not a complete set of linked-library original notices. No Bun executable is furnished by publishing the recipe. |
| Copied Node 24.20.0 source/runtime | Preserve [the exact aggregate original LICENSE](notices/Node-24.20.0-LICENSE.txt), including third-party notices. It grants Node under MIT with “Copyright Node.js contributors. All rights reserved.” Tool use alone does not require attaching every Node notice to authored reports. |
| Copied PostgreSQL 16.15 source/runtime | Preserve [original COPYRIGHT](notices/PostgreSQL-16.15-COPYRIGHT.txt): PostgreSQL Global Development Group 1996–2026 and The Regents of the University of California 1994. The permissive grant requires copyright and permission notices in copies. It does not replace Debian/base-package obligations for an image someone distributes. |

The earlier conservative dependency closure is still an input envelope, not a
claim that all packages are embedded. This finite followup does not resolve the
24 r1 packages with incomplete original text. Those gaps matter if their covered
material is copied/distributed; they do not become a prerequisite to publishing
unrelated authored source merely because the instructions download dependencies.

## Minimal parent copy instructions

[COPY_INSTRUCTIONS.md](COPY_INSTRUCTIONS.md) supplies exact, unapplied build-stage
and runtime-stage copy snippets for the inputs below.

For the source-only standalone payload, preserve the original recipe LICENSE.
Include the selected build-substitution script and its instructions if adopting
exclusion. Retain this notice collection/index if the publication carries this
review. Do not copy private artifacts, cached upstream source archives, fonts,
executables or images into that payload merely to supply notices.

When the build produces assets for viewers, keep all existing adjacent
`cli/static/fonts/{geist,geist-mono,noto-color-emoji}/LICENSE.txt` files in
place. For clear centralized delivery, copy those three texts and the original
Fira Mono text, **if its font is included**, into
`/src/cli/static/licenses/fonts/` **before** `pnpm cli:build`; give them
distinct family filenames. The adapter's recursive client asset map can then
deliver them at `/licenses/fonts/<family>-LICENSE.txt`, under the same auth
as the font assets. Link these paths in the published usage/notice documentation
and verify they return the original texts. Retain original notices for every
other actual bundled client library in an accessible notice collection too.
This recommendation adds no Source Serif license when exclusion is selected.

For image documentation, preserve production's existing recipe, Evidence,
Node and warehouse/base notices. The current Dockerfiles already copy the
recipe LICENSE; r1's earlier missing-copy observation is historical. During this
followup, another workspace edit expanded the production collector to `licence*`,
`ofl*` and `readme*`; this followup did not make that edit. Preserve nested paths
and recovered inline/README grants for actual included inputs. Preserve
the original patch notices and applicable package LICENSE/NOTICE files. Copying
this review directory wholesale is optional and does not satisfy native
relinking requirements by itself.

## Separate concrete blocker for a future compiled distribution

The pinned [Bun declaration](notices/Bun-1.3.11-LICENSE.md) states static
JavaScriptCore/WebKit linking under LGPL-2, and lists TinyCC under LGPL-2.1 plus
other linked libraries and embedded polyfills. The pinned Evidence adapter
does run `bun build --compile`. Neither observation grants permission to
omit original notices in the resulting executable's delivery.

For any selected public executable/image, the missing evidence is **that
runtime's** exact native revisions/configuration, their original copyright/
license notices, and a working applicable LGPL §6 delivery route. Under an
appropriate §6(a) route this means corresponding library source including
modifications and build scripts, plus the application object code and/or source
and materials needed to let the recipient modify and relink the library.
Other §6 alternatives have their own conditions; a written offer or dynamic
replacement mechanism must actually meet the chosen version's requirements.
An upstream WebKit URL and Bun's brief relink commands do not establish that
the chosen Bun version and final compiled Evidence application can be rebuilt
and relinked from the materials delivered.

Both §6 texts also require prominent notice that the library is used and
covered by LGPL, a copy of that license, and distribution terms permitting
modification for the customer's own use and reverse engineering to debug those
modifications. Their displayed-copyright condition applies when the work
displays copyright notices during execution. Preserve the actual holders'
notices rather than replacing them with Bun's license summary. The dynamic
mechanism alternative described in LGPL 2.1 §6(b) must not be assumed to be
available under the older LGPL 2.0 wording or in Bun's current static build.

This is a **future binary-distribution blocker**, not a demand to invent a
single license for the combined artifact, publish all authored source under
LGPL, or run a universal scanner before source-recipe publication. Browser font
and JS notices remain necessary for the copies that viewers receive.

## Verification boundary

Only the two new fonts-native directories were written, using apply_patch.
No old review/manifests, production files, other templates or repository-wide
files were changed by this followup. No builds, installs, image pulls, scanners,
containers, cloud actions, pushes or child agents were used. The research
skill's suggested background-agent step was overridden by the explicit
no-children constraint. Primary requests were bounded to the named font history,
two Google CSS variants plus their four Latin samples, Adobe grant/tag, Bun
tag/build files and the two original GNU license texts. The initial
LICENSE-MIT and BuildWebKit.cmake guesses returned 404; no full Bun MIT grant
or exact native revision is inferred from those missing paths.
