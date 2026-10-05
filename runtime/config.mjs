export function readConfig(environment = process.env) {
  const required = ['EVIDENCE_BASIC_USER', 'EVIDENCE_BASIC_PASSWORD', 'REPORT_DB_HOST',
    'REPORT_DB_NAME', 'REPORT_DB_USER', 'REPORT_DB_PASSWORD', 'REPORT_DB_SSLMODE'];
  for (const key of required) {
    if (!environment[key]?.trim()) throw new Error(`Required variable missing: ${key}`);
  }
  if (environment.EVIDENCE_AUTH_DISABLED) throw new Error('Authentication cannot be disabled');
  if (environment.EVIDENCE_BASIC_USER.includes(':')) throw new Error('Basic username cannot contain a colon');
  if (environment.EVIDENCE_BASIC_PASSWORD.length < 20 || environment.REPORT_DB_PASSWORD.length < 20) {
    throw new Error('Report and warehouse passwords must contain at least 20 characters');
  }
  if (!['disable', 'verify-full'].includes(environment.REPORT_DB_SSLMODE)) {
    throw new Error('Use verify-full for external databases or disable only for the private fixture network');
  }
  const port = Number(environment.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || port === 3001) throw new Error('Invalid PORT');
  return {
    port,
    authorization: `Basic ${Buffer.from(`${environment.EVIDENCE_BASIC_USER}:${environment.EVIDENCE_BASIC_PASSWORD}`).toString('base64')}`,
  };
}

export const readinessSql = `select current_setting('transaction_read_only') = 'on' as read_only,
  not (rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls) as restricted_role,
  not has_schema_privilege(current_user, 'reporting', 'CREATE') as no_schema_write,
  bool_and(has_table_privilege(current_user, table_name, 'SELECT') and
    not has_table_privilege(current_user, table_name, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) as select_only,
  (select count(*) from reporting.pipelines) >= 0 as warehouse_available
from pg_roles cross join unnest(array['reporting.pipelines', 'reporting.ingestion_batches',
  'reporting.orders', 'reporting.payments']) as tables(table_name)
where rolname = current_user group by rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls`;

export function roleIsSafe(row) {
  return row?.read_only === true && row.restricted_role === true && row.no_schema_write === true &&
    row.select_only === true && row.warehouse_available === true;
}
