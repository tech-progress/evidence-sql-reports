FROM mirror.gcr.io/oven/bun:1.3.11@sha256:0733e50325078969732ebe3b15ce4c4be5082f18c4ac1a0f0ca4839c2e4e42a7 AS bun
FROM node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS evidence
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY scripts/fetch-upstream.mjs /tmp/fetch-upstream.mjs
RUN node /tmp/fetch-upstream.mjs && mkdir /src && tar -xzf /tmp/evidence.tar.gz --strip-components=1 -C /src && rm /tmp/evidence.tar.gz
WORKDIR /src
RUN npm install --global pnpm@9.15.0 --ignore-scripts && pnpm install --frozen-lockfile --ignore-scripts && pnpm --filter @evidence/cli exec svelte-kit sync
COPY scripts/prepare-upstream.mjs scripts/build-notice-audit.mjs /recipe/scripts/
COPY artifact-review/ /recipe/artifact-review/
COPY LICENSE LICENSE_REVIEW.md ARTIFACT_REVIEW.md THIRD_PARTY_NOTICES.md /recipe/
RUN node /recipe/scripts/prepare-upstream.mjs /src /recipe
RUN pnpm cli:build && test "$(cli/dist/evidence version)" = "0.10.1"
RUN mkdir -p /dependency-notices && find node_modules -type f \( -iname 'license*' -o -iname 'licence*' -o -iname 'notice*' -o -iname 'copying*' -o -iname 'ofl*' -o -iname 'readme*' \) -exec cp --parents '{}' /dependency-notices/ \;
FROM node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS runtime
RUN mkdir -p /usr/share/doc/node-runtime /usr/share/doc/npm-runtime /usr/share/doc/yarn-runtime \
 && cp /usr/local/LICENSE /usr/share/doc/node-runtime/LICENSE \
 && cp /usr/local/lib/node_modules/npm/LICENSE /usr/share/doc/npm-runtime/LICENSE \
 && cp /opt/yarn-v*/LICENSE /usr/share/doc/yarn-runtime/LICENSE \
 && rm -rf /usr/local/lib/node_modules /opt/yarn* \
 && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/corepack /usr/local/bin/pnpm /usr/local/bin/pnpx
COPY --from=evidence /src/cli/dist/evidence /usr/local/bin/evidence
COPY --from=evidence /src/LICENSE /usr/share/doc/evidence/LICENSE
COPY --from=evidence /src/pnpm-lock.yaml /usr/share/doc/evidence/pnpm-lock.yaml
COPY --from=evidence /src/patches/ /usr/share/doc/evidence/patches/
COPY --from=evidence /dependency-notices/ /usr/share/doc/evidence/dependency-notices/
COPY artifact-review/ /usr/share/doc/evidence/artifact-review/
COPY LICENSE LICENSE_REVIEW.md ARTIFACT_REVIEW.md THIRD_PARTY_NOTICES.md /usr/share/doc/evidence/
WORKDIR /project
COPY --chown=node:node project/ /project/
COPY --chown=node:node runtime/ /project/runtime/
COPY --chown=node:node tests/ /project/tests/
COPY --chown=node:node scripts/smoke.mjs /project/scripts/smoke.mjs
COPY --chown=node:node scripts/draft-tools.mjs /project/scripts/draft-tools.mjs
COPY --chown=node:node template-defaults.json template-descriptions.json template-volumes.json template-networking.json /project/
COPY --chown=node:node VERSION /project/VERSION
COPY --chown=node:node upstream.lock.json /project/upstream.lock.json
COPY LICENSE /usr/share/doc/evidence-template/LICENSE
RUN test "$(evidence version)" = "0.10.1" && node --test tests/config.test.mjs tests/draft.test.mjs

FROM scratch
COPY --from=runtime / /
WORKDIR /project
USER node
EXPOSE 3000
CMD ["node", "runtime/server.mjs"]
