# SQL freshness and reconciliation

This protected report pack queries a dedicated **SELECT-only PostgreSQL role**.
The bundled warehouse contains synthetic fixtures, not business data.

- [Freshness and failed ingestion](/freshness)
- [Order/payment reconciliation](/reconciliation)

Reports run live queries when opened or reloaded. Reload the page after an
upstream ingestion; there is no scheduled materialization or Studio dependency.
All viewers share the same database role and the same Basic Auth credential.

```sql connection_status
select current_user as warehouse_role,
       current_setting('transaction_read_only') as transaction_read_only,
       current_timestamp as observed_at
```

{% table data="connection_status" /%}

The freshness thresholds and expected pipelines live in `reporting.pipelines`.
Reconciliation uses settled payment amounts, detects missing and orphaned
orders, flags currency differences and duplicate provider references, and
compares amounts exactly as PostgreSQL numeric values.

[Original software and font notices](/licenses/THIRD_PARTY_NOTICES.md)
accompany the report interface and its assets.
