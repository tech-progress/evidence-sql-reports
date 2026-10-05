# Order and payment reconciliation

Compare order totals with settled payments, including partial/missing payments,
orphaned references, wrong currencies, and duplicate provider transaction IDs.
This is a diagnostics report: it does not write refunds or mutate the warehouse.

```sql reconciliation
with payment_totals as (
  select order_id, sum(amount) as paid_amount,
         string_agg(distinct currency, ',' order by currency) as payment_currencies,
         count(*) - count(distinct provider_ref) as duplicate_references
  from reporting.payments where status = 'settled' group by order_id
)
select coalesce(orders.order_id, payment_totals.order_id) as order_id,
       orders.amount as order_amount,
       coalesce(payment_totals.paid_amount, 0) as paid_amount,
       coalesce(payment_totals.paid_amount, 0) - coalesce(orders.amount, 0) as difference,
       orders.currency as order_currency,
       payment_totals.payment_currencies,
       coalesce(payment_totals.duplicate_references, 0) as duplicate_references,
       case
         when orders.order_id is null then 'ORPHAN'
         when payment_totals.order_id is null then 'MISSING'
         when payment_totals.payment_currencies <> orders.currency then 'CURRENCY'
         when payment_totals.duplicate_references > 0 then 'DUPLICATE'
         when payment_totals.paid_amount <> orders.amount then 'MISMATCH'
         else 'MATCH'
       end as reconciliation_status
from reporting.orders orders
full outer join payment_totals using (order_id)
order by order_id
```

{% table data="reconciliation" /%}

An exact zero difference is not sufficient when the currency is wrong or a
provider reference is duplicated. Amounts are fixed precision; no floating-point
tolerance silently masks discrepancies. Failed/pending payments are excluded.
