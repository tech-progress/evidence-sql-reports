#!/usr/bin/env bash
set -euo pipefail
[[ "${POSTGRES_DB}" == reports && "${POSTGRES_USER}" == postgres ]]
[[ "${#REPORT_DB_PASSWORD}" -ge 20 ]]
psql --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" --set ON_ERROR_STOP=1 --file /opt/reporting/fixture.sql
touch "${PGDATA}/reporting-initialized"
