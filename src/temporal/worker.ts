import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { NativeConnection, Worker } from "@temporalio/worker";

import * as activities from "./activities";
import { temporalConfig } from "./config";

async function main() {
  // Inside main(), not at import time, so config is read after env files load.
  loadEnvConfig(process.cwd());
  const cfg = temporalConfig();

  const connection = await NativeConnection.connect({
    address: cfg.address,
    ...(cfg.apiKey ? { tls: true, apiKey: cfg.apiKey } : {}),
  });

  const worker = await Worker.create({
    connection,
    namespace: cfg.namespace,
    taskQueue: cfg.taskQueue,
    workflowsPath: path.resolve(process.cwd(), "src/temporal/workflows.ts"),
    activities,
  });

  console.log(
    `[temporal] worker started: queue "${cfg.taskQueue}" on ${cfg.address} (namespace ${cfg.namespace})`,
  );
  await worker.run();
}

main().catch((err) => {
  console.error("[temporal] worker failed", err);
  process.exit(1);
});
