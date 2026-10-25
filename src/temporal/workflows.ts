import { defineQuery, proxyActivities, setHandler } from "@temporalio/workflow";

// Type-only import: workflow code must stay deterministic and side-effect free.
import type * as activities from "./activities";
import type {
  StageWorkflowInput,
  StageWorkflowOutput,
  WorkflowStage,
} from "./types";

const { runReviewStage } = proxyActivities<typeof activities>({
  startToCloseTimeout: "50 seconds",
  retry: {
    initialInterval: "1 second",
    backoffCoefficient: 2,
    maximumInterval: "10 seconds",
    maximumAttempts: 3,
    nonRetryableErrorTypes: ["ModelClientError"],
  },
});

const { cleanupImage } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
  retry: { maximumAttempts: 3 },
});

export const getStage = defineQuery<WorkflowStage>("getStage");

/** One review step (extract, analyse, roast or redesign) as a durable workflow. */
export async function reviewStageWorkflow(
  input: StageWorkflowInput,
): Promise<StageWorkflowOutput> {
  let stage: WorkflowStage = "queued";
  setHandler(getStage, () => stage);

  try {
    stage = "analyzing";
    const output = await runReviewStage(input);
    stage = "done";
    return output;
  } finally {
    // Runs on success and failure, so the claim-checked image never lingers.
    if (input.imageRef) await cleanupImage(input.imageRef);
  }
}
