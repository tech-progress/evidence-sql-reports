#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "${root}/scripts/draft-tools.mjs" restore "${1:?Provide existing Composer JSON}" "${2:?Provide output JSON}"
