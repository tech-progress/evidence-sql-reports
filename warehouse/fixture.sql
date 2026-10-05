\getenv reader_password REPORT_DB_PASSWORD
CREATE ROLE evidence_reader LOGIN PASSWORD :'reader_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE evidence_reader SET default_transaction_read_only = on;
ALTER ROLE evidence_reader SET statement_timeout = '10s';
ALTER ROLE evidence_reader SET lock_timeout = '3s';
REVOKE ALL ON DATABASE reports FROM PUBLIC;
GRANT CONNECT ON DATABASE reports TO evidence_reader;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA reporting;
CREATE TABLE reporting.pipelines (pipeline text PRIMARY KEY, sla_minutes integer NOT NULL CHECK (sla_minutes > 0));
CREATE TABLE reporting.ingestion_batches (batch_id bigint PRIMARY KEY, pipeline text NOT NULL REFERENCES reporting.pipelines, finished_at timestamptz NOT NULL, status text NOT NULL CHECK (status IN ('success', 'failed')), rows_loaded bigint NOT NULL);
CREATE TABLE reporting.orders (order_id bigint PRIMARY KEY, amount numeric(18,2) NOT NULL, currency text NOT NULL);
CREATE TABLE reporting.payments (payment_id bigint PRIMARY KEY, order_id bigint NOT NULL, amount numeric(18,2) NOT NULL, currency text NOT NULL, status text NOT NULL, provider_ref text NOT NULL);
INSERT INTO reporting.pipelines VALUES ('orders', 60), ('payments', 60), ('customers', 120);
INSERT INTO reporting.ingestion_batches VALUES
  (1, 'orders', current_timestamp - interval '5 minutes', 'success', 5),
  (2, 'payments', current_timestamp - interval '3 hours', 'success', 6),
  (3, 'payments', current_timestamp - interval '1 minute', 'failed', 0),
  (4, 'customers', current_timestamp - interval '2 minutes', 'failed', 0);
INSERT INTO reporting.orders VALUES (1001,120,'USD'), (1002,75,'USD'), (1003,45,'USD'), (1004,20,'USD'), (1005,30,'USD');
INSERT INTO reporting.payments VALUES
  (1,1001,120,'USD','settled','p-1'),
  (2,1002,70,'USD','settled','p-2'),
  (3,1004,20,'EUR','settled','p-3'),
  (4,1005,15,'USD','settled','p-repeat'),
  (5,1005,15,'USD','settled','p-repeat'),
  (6,9999,18,'USD','settled','p-orphan'),
  (7,1003,45,'USD','pending','p-pending');
GRANT USAGE ON SCHEMA reporting TO evidence_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA reporting TO evidence_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA reporting GRANT SELECT ON TABLES TO evidence_reader;
