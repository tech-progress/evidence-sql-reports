#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temp="$(mktemp -d -t rt-evidence-build.XXXXXX)"
umask 077
node "${root}/scripts/generate-env.mjs" > "${temp}/env"
cleanup() { rm -rf "${temp}"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
timeout 900 docker compose --env-file "${temp}/env" --file "${root}/compose.yaml" build
