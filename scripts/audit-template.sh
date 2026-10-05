#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "${root}/scripts/draft-tools.mjs" audit "${1:?Provide local Composer JSON}"
