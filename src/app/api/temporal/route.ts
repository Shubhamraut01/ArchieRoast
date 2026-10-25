import { connection } from "next/server";

import { getTemporalClient } from "@/temporal/client";
import {
  isTemporalEnabled,
  temporalConfig,
  WORKFLOW_TYPE,
} from "@/temporal/config";

/** Health and proof endpoint: is the server reachable and is a worker polling? */
export async function GET() {
  await connection(); // opt out of prerendering; this must run per request

  if (!isTemporalEnabled()) {
    return Response.json({ enabled: false });
  }

  const cfg = temporalConfig();
  try {
    const client = await getTemporalClient();

    // taskQueueType 1 = workflow task queue
    const queue = await client.connection.workflowService.describeTaskQueue({
      namespace: cfg.namespace,
      taskQueue: { name: cfg.taskQueue },
      taskQueueType: 1,
    });
    const workerPollers = queue.pollers?.length ?? 0;

    // Visibility lists newest first.
    const recentWorkflows = [];
    for await (const wf of client.workflow.list({
      query: `WorkflowType = "${WORKFLOW_TYPE}"`,
    })) {
      recentWorkflows.push({
        workflowId: wf.workflowId,
        runId: wf.runId,
        status: wf.status.name,
        startTime: wf.startTime.toISOString(),
      });
      if (recentWorkflows.length >= 5) break;
    }

    return Response.json({
      enabled: true,
      connected: true,
      address: cfg.address,
      namespace: cfg.namespace,
      taskQueue: cfg.taskQueue,
      workerPollers,
      workerOnline: workerPollers > 0,
      recentWorkflows,
    });
  } catch (err) {
    console.error("temporal status failed", err);
    return Response.json(
      {
        enabled: true,
        connected: false,
        address: cfg.address,
        error: "Could not reach the Temporal server.",
      },
      { status: 503 },
    );
  }
}
