/* Verifies the Temporal integration end to end. Run: npm run verify:temporal */
import { randomUUID } from "node:crypto";

import { loadEnvConfig } from "@next/env";
import { Client, Connection } from "@temporalio/client";

import {
  temporalConfig,
  workflowUiUrl,
  WORKFLOW_TYPE,
} from "../src/temporal/config";
import { deleteImage, loadImage, saveImage } from "../src/temporal/image-store";

const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

let failed = false;
const ok = (msg: string) => console.log(`  [ok]   ${msg}`);
const fail = (msg: string) => {
  failed = true;
  console.log(`  [FAIL] ${msg}`);
};

async function main() {
  loadEnvConfig(process.cwd());
  const cfg = temporalConfig();
  console.log(
    `Verifying Temporal at ${cfg.address} (namespace ${cfg.namespace}, queue ${cfg.taskQueue})\n`,
  );

  // 1. Claim-check round trip, no server needed.
  const ref = await saveImage(PNG_1X1);
  if ((await loadImage(ref)) === PNG_1X1)
    ok("claim-check saves and loads an image");
  else fail("claim-check round trip");
  await deleteImage(ref);
  await loadImage(ref).then(
    () => fail("claim-checked image should be deleted"),
    () => ok("claim-checked image is deleted afterwards"),
  );
  await loadImage("../../etc/passwd").then(
    () => fail("path traversal was not rejected"),
    () => ok("path traversal in an image ref is rejected"),
  );

  // 2. Connect.
  let connection: Connection;
  try {
    connection = await Connection.connect({
      address: cfg.address,
      ...(cfg.apiKey ? { tls: true, apiKey: cfg.apiKey } : {}),
    });
    ok(`connected to ${cfg.address}`);
  } catch {
    fail(
      `could not connect to ${cfg.address}. Is "npm run temporal:server" running?`,
    );
    return;
  }
  const client = new Client({ connection, namespace: cfg.namespace });

  // 3. A worker is polling.
  const queue = await connection.workflowService.describeTaskQueue({
    namespace: cfg.namespace,
    taskQueue: { name: cfg.taskQueue },
    taskQueueType: 1,
  });
  if ((queue.pollers?.length ?? 0) > 0)
    ok(
      `worker is polling "${cfg.taskQueue}" (${queue.pollers?.length} poller)`,
    );
  else {
    fail(`no worker polling "${cfg.taskQueue}". Run "npm run worker".`);
    return;
  }

  // 4. Run a real workflow with a fixed, tiny inventory (analyse needs no image).
  const workflowId = `verify-${randomUUID()}`;
  const handle = await client.workflow.start(WORKFLOW_TYPE, {
    taskQueue: cfg.taskQueue,
    workflowId,
    workflowExecutionTimeout: "58 seconds",
    args: [
      {
        stage: "analyse",
        inventory: {
          isArchitecture: true,
          summary: "A web app with one API and one database.",
          components: [
            { name: "Web app", kind: "client" },
            { name: "API", kind: "api" },
            { name: "Postgres", kind: "database" },
          ],
          connections: [
            { from: "Web app", to: "API" },
            { from: "API", to: "Postgres" },
          ],
          regions: [],
        },
      },
    ],
  });
  try {
    const out = (await handle.result()) as {
      attempt: number;
      data: { changes?: unknown[] };
    };
    ok(
      `workflow ${workflowId} completed on attempt ${out.attempt} with ${out.data.changes?.length ?? 0} proposed changes`,
    );
  } catch (err) {
    fail(
      `workflow failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }

  // 5. History shows the activity was scheduled.
  const history = await handle.fetchHistory();
  const scheduled = history.events?.some(
    (e) =>
      e.activityTaskScheduledEventAttributes?.activityType?.name ===
      "runReviewStage",
  );
  if (scheduled)
    ok("history contains a runReviewStage ActivityTaskScheduled event");
  else fail("no runReviewStage activity in history");

  console.log(
    `\nOpen in the Temporal UI:\n  ${workflowUiUrl(workflowId, handle.firstExecutionRunId)}`,
  );
}

main()
  .catch((err) => {
    fail(String(err));
  })
  .finally(() => {
    console.log(failed ? "\nResult: FAILED" : "\nResult: all checks passed");
    process.exit(failed ? 1 : 0);
  });
