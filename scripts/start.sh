#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${1:-${root}/.env}"
test -f "${env_file}" || { echo 'Generate an environment file with scripts/generate-env.mjs first.' >&2; exit 1; }
timeout 240 docker compose --env-file "${env_file}" --file "${root}/compose.yaml" up --detach --no-build --wait --wait-timeout 180
echo 'Reports started on http://127.0.0.1:18309; use generated viewer credentials. Data is retained until explicitly removed.'
