import { defineRailway, github, group, project, service, volume } from "railway/iac";
import { readFileSync } from "node:fs";

const repo = process.env.TEMPLATE_SOURCE_REPO || "tech-progress/evidence-sql-reports";
const branch = process.env.TEMPLATE_SOURCE_BRANCH || "release-v1";
const rootDirectory = process.env.TEMPLATE_SOURCE_ROOT_DIR || "/";
if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error("Set TEMPLATE_SOURCE_REPO to an accessible owner/repository");
if (branch.includes("/") || !/^[\w.-]+$/.test(branch)) throw new Error("Use a slash-free source branch");
if (!rootDirectory.startsWith("/") || rootDirectory.includes("..")) throw new Error("Use an absolute source rootDirectory without traversal");
const source = github(repo, { branch, rootDirectory });
const defaults = JSON.parse(readFileSync(new URL('../template-defaults.json', import.meta.url), 'utf8'));
const generated = (name: string, key: string) => ({ generator: defaults[name][key].slice(3, -2), preserveExisting: true });

export default defineRailway(() => {
  const warehouseData = volume("Warehouse Data", { sizeMB: 5000 });
  const warehouse = service("Warehouse", {
    source,
    build: { builder: "DOCKERFILE", dockerfilePath: "Dockerfile.postgres" },
    volumeMounts: { "/var/lib/postgresql/data": warehouseData },
    env: {
      POSTGRES_DB: "reports", POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: generated('Warehouse', 'POSTGRES_PASSWORD'),
      REPORT_DB_PASSWORD: generated('Warehouse', 'REPORT_DB_PASSWORD'), PGDATA: "/var/lib/postgresql/data/pgdata",
    },
  });
  const reports = service("Evidence Reports", {
    source,
    build: { builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    healthcheck: "/readyz", healthcheckTimeout: 180,
    env: {
      PORT: "3000", EVIDENCE_BASIC_USER: generated('Evidence Reports', 'EVIDENCE_BASIC_USER'),
      EVIDENCE_BASIC_PASSWORD: generated('Evidence Reports', 'EVIDENCE_BASIC_PASSWORD'),
      EVIDENCE_TELEMETRY_DISABLED: "true", REPORT_DB_HOST: "${{Warehouse.RAILWAY_PRIVATE_DOMAIN}}",
      REPORT_DB_NAME: "${{Warehouse.POSTGRES_DB}}", REPORT_DB_USER: "evidence_reader",
      REPORT_DB_PASSWORD: "${{Warehouse.REPORT_DB_PASSWORD}}", REPORT_DB_SSLMODE: "disable",
    },
  });
  return project("Evidence SQL reports", { resources: [group("Reports", [reports]), group("Private warehouse", [warehouse, warehouseData])] });
});
