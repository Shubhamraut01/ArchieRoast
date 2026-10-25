import { randomUUID } from "node:crypto";

import type { Usage } from "../lib/review/types";
import { getTemporalClient } from "./client";
import { temporalConfig, workflowUiUrl, WORKFLOW_TYPE } from "./config";
import { deleteImage, saveImage } from "./image-store";
import type {
  StageWorkflowInput,
  StageWorkflowOutput,
  TemporalInfo,
} from "./types";

type RunInput = Omit<StageWorkflowInput, "imageRef"> & { image?: string };

/** Runs one review step as a Temporal workflow and waits for its result. */
export async function runStageViaTemporal(
  input: RunInput,
): Promise<{ data: unknown; usage: Usage | null; temporal: TemporalInfo }> {
  const cfg = temporalConfig();
  const client = await getTemporalClient();

  const { image, ...rest } = input;
  const imageRef = image ? await saveImage(image) : undefined;
  const workflowId = `review-${input.stage}-${randomUUID()}`;

  let handle;
  try {
    handle = await client.workflow.start(WORKFLOW_TYPE, {
      taskQueue: cfg.taskQueue,
      workflowId,
      args: [{ ...rest, imageRef } satisfies StageWorkflowInput],
      workflowExecutionTimeout: "58 seconds",
    });
  } catch (err) {
    // The workflow never started, so its cleanup activity will not run.
    if (imageRef) await deleteImage(imageRef).catch(() => {});
    throw err;
  }

  const output = (await handle.result()) as StageWorkflowOutput;
  const runId = handle.firstExecutionRunId;
  return {
    data: output.data,
    usage: output.usage,
    temporal: {
      stage: input.stage,
      workflowId,
      runId,
      taskQueue: cfg.taskQueue,
      namespace: cfg.namespace,
      attempts: output.attempt,
      uiUrl: workflowUiUrl(workflowId, runId),
    },
  };
}
