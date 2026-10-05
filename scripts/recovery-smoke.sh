#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
umask 077
exec node "${root}/scripts/recovery-smoke.mjs" "$@"
