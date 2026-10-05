#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_name=rt-evidence-sql-reports-18309
if [[ -n "$(docker ps -aq --filter "label=com.docker.compose.project=${project_name}")" ]]; then
  echo "Refusing to replace an existing ${project_name} stack." >&2; exit 1
fi
if [[ -n "$(docker volume ls -q --filter "label=com.docker.compose.project=${project_name}")" ]]; then
  echo "Refusing to reuse existing ${project_name} data." >&2; exit 1
fi
if [[ -n "$(docker network ls -q --filter "label=com.docker.compose.project=${project_name}")" ]]; then
  echo "Refusing to reuse an existing ${project_name} network." >&2; exit 1
fi
temp="$(mktemp -d -t rt-evidence-smoke.XXXXXX)"
umask 077
node "${root}/scripts/generate-env.mjs" > "${temp}/env"
compose=(docker compose --project-name "${project_name}" --env-file "${temp}/env" --file "${root}/compose.yaml")
cleanup() { timeout 60 "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true; rm -rf "${temp}"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
timeout 900 "${compose[@]}" build
timeout 240 "${compose[@]}" up --detach --wait --wait-timeout 180
run_smoke() {
  timeout 120 "${compose[@]}" exec -T -e BASE_URL=http://127.0.0.1:3000 -e REPORT_PROJECT_DIR=/project reports node scripts/smoke.mjs "$1"
  if [[ "${BROWSER_SMOKE:-0}" == 1 ]]; then
    timeout 120 node "${root}/scripts/browser-smoke.cjs" "${temp}/env" "$1"
  fi
}
run_smoke baseline
timeout 30 "${compose[@]}" exec -T postgres psql -U postgres -d reports --set ON_ERROR_STOP=1 <<'SQL'
UPDATE reporting.ingestion_batches SET finished_at = current_timestamp WHERE pipeline = 'payments' AND status = 'success';
UPDATE reporting.payments SET amount = 75 WHERE payment_id = 2;
SQL
run_smoke refreshed
timeout 45 "${compose[@]}" stop postgres
timeout 15 "${compose[@]}" exec -T reports node -e 'const response=await fetch("http://127.0.0.1:3000/readyz",{signal:AbortSignal.timeout(10000)}); if(response.status!==503) process.exit(1); console.log("PASS database outage readiness");'
timeout 240 "${compose[@]}" up --detach --wait --wait-timeout 180
run_smoke refreshed
timeout 60 "${compose[@]}" exec -T postgres pg_dump -U postgres -d reports --format=custom > "${temp}/warehouse.dump"
timeout 45 "${compose[@]}" rm --stop --force reports
timeout 240 "${compose[@]}" up --detach --wait --wait-timeout 180
run_smoke refreshed
timeout 30 "${compose[@]}" exec -T postgres psql -U postgres -d reports --set ON_ERROR_STOP=1 -c 'DROP SCHEMA reporting CASCADE;'
timeout 15 "${compose[@]}" exec -T reports node -e 'const response=await fetch("http://127.0.0.1:3000/readyz",{signal:AbortSignal.timeout(10000)}); if(response.status!==503) process.exit(1);'
timeout 60 "${compose[@]}" exec -T postgres pg_restore -U postgres -d reports --exit-on-error < "${temp}/warehouse.dump"
timeout 15 "${compose[@]}" exec -T reports node runtime/healthcheck.mjs
run_smoke refreshed
mapfile -t container_ids < <("${compose[@]}" ps --quiet)
[[ "${#container_ids[@]}" -eq 2 ]] || { echo 'Expected two owned containers for stats.' >&2; exit 1; }
timeout 15 docker stats --no-stream --format '{{.Name}} {{.MemUsage}} {{.CPUPerc}}' "${container_ids[@]}"
cleanup
trap - EXIT INT TERM
[[ -z "$(docker ps -aq --filter "label=com.docker.compose.project=${project_name}")" ]]
[[ -z "$(docker volume ls -q --filter "label=com.docker.compose.project=${project_name}")" ]]
[[ -z "$(docker network ls -q --filter "label=com.docker.compose.project=${project_name}")" ]]
echo 'PASS container replacement, SQL refresh, schema backup/restore and zero owned containers/volumes'
