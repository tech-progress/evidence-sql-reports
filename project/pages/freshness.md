# Warehouse freshness

A missing successful ingestion is **NEVER**, even when failed batches exist.
The latest successful load is compared with each pipeline's SLA in minutes.
Failed attempts are shown separately so a failed recent run cannot hide stale data.

```sql freshness
select pipeline.pipeline,
       pipeline.sla_minutes,
       max(batch.finished_at) filter (where batch.status = 'success') as last_success,
       round(extract(epoch from (current_timestamp -
         max(batch.finished_at) filter (where batch.status = 'success'))) / 60, 1) as age_minutes,
       coalesce(sum(batch.rows_loaded) filter (where batch.status = 'success'), 0) as rows_loaded,
       count(batch.batch_id) filter (where batch.status = 'failed') as failed_attempts,
       case
         when max(batch.finished_at) filter (where batch.status = 'success') is null then 'NEVER'
         when max(batch.finished_at) filter (where batch.status = 'success') <
           current_timestamp - pipeline.sla_minutes * interval '1 minute' then 'STALE'
         else 'FRESH'
       end as freshness_status
from reporting.pipelines pipeline
left join reporting.ingestion_batches batch using (pipeline)
group by pipeline.pipeline, pipeline.sla_minutes
order by pipeline.pipeline
```

{% table data="freshness" /%}

The fixtures intentionally include a fresh orders pipeline, stale payments,
and a customers pipeline that has never succeeded. An operator must fix
ingestion or record a successful batch; editing this page cannot repair data.
