# Unapplied notice-copy instructions

Keep the original recipe LICENSE at the standalone repository root. If adopting
exclusion, include exclude-source-serif.mjs and its instructions/recipe license.
No cached upstream fonts, archive or executable need to be vendored into the
source-only payload. Retain notice-provenance.json and original-exact-texts.json
with this review's notice files if publishing the review bundle.

Insert this in the Evidence build stage **before** pnpm cli:build:

```dockerfile
RUN mkdir -p /src/cli/static/licenses/fonts \
 && cp /src/cli/static/fonts/geist/LICENSE.txt /src/cli/static/licenses/fonts/geist-LICENSE.txt \
 && cp /src/cli/static/fonts/geist-mono/LICENSE.txt /src/cli/static/licenses/fonts/geist-mono-LICENSE.txt \
 && cp /src/cli/static/fonts/noto-color-emoji/LICENSE.txt /src/cli/static/licenses/fonts/noto-color-emoji-LICENSE.txt
```

Leave the adjacent originals in place. Document and verify authenticated URLs
/licenses/fonts/geist-LICENSE.txt, /licenses/fonts/geist-mono-LICENSE.txt and
/licenses/fonts/noto-color-emoji-LICENSE.txt. The adapter embeds client text
assets recursively. This is a concrete proposed delivery path, not verified
runtime behavior in this pass.

If final asset inspection establishes Fira Mono inclusion, also insert:

```dockerfile
COPY artifact-review/fonts-native/notices/fira-mono-5.2.7-LICENSE.txt /src/cli/static/licenses/fonts/fira-mono-LICENSE.txt
```

The targeted source search found its package.json declaration and no import.
That is not proof of generated asset exclusion. The additional copy is
conditional on actual inclusion.

Selecting Source Serif exclusion needs no new font/license COPY. Retaining
Source Serif instead requires closing its exact conversion/name condition,
then copying its applicable full OFL and exact embedded copyright beside both
fonts and into the accessible collection.

For copied upstream patches/covered libraries, these **build-stage** lines
preserve the recovered original notice texts for delivery through the existing
/dependency-notices runtime COPY:

```dockerfile
COPY artifact-review/fonts-native/notices/Evidence-patch-notices.txt /dependency-notices/upstream-patches/THIRD-PARTY-NOTICES.txt
COPY artifact-review/fonts-native/notices/ssf-0.11.2-LICENSE.txt /dependency-notices/upstream-patches/ssf-LICENSE.txt
COPY artifact-review/fonts-native/notices/echarts-6.1.0-LICENSE.txt /dependency-notices/upstream-patches/echarts-LICENSE.txt
COPY artifact-review/fonts-native/notices/echarts-6.1.0-NOTICE.txt /dependency-notices/upstream-patches/echarts-NOTICE.txt
COPY artifact-review/fonts-native/notices/echarts-6.1.0-LICENSE-d3.txt /dependency-notices/upstream-patches/echarts-LICENSE-d3.txt
COPY artifact-review/fonts-native/notices/zrender-6.1.0-LICENSE.txt /dependency-notices/upstream-patches/zrender-LICENSE.txt
```

Retain the upstream patch files/change descriptions in the **runtime stage**:

```dockerfile
COPY --from=evidence /src/patches/ /usr/share/doc/evidence/upstream-patches/
```

For actual browser-bundled covered libraries, also provide accessible original
license/notice texts. Installed/cached notices are not a final inclusion map.
The existing recipe, Evidence, Node aggregate and warehouse/base notices must
remain with their actual copies.

These snippets were not executed. They do not replace the exact native
collection and applicable source/relinking route needed for a future public
executable/image distribution. Publishing the selected source-only recipe
does not itself convey that executable.
