import type { Usage } from "../lib/review/types";

export type StageName = "extract" | "analyse" | "roast" | "redesign";

/**
 * Workflow input. The image is never inlined: Temporal payloads are capped at
 * ~2MB and a diagram can be 4MB, so `extract` carries a claim-check reference.
 */
export type StageWorkflowInput = {
  stage: StageName;
  imageRef?: string;
  inventory?: unknown;
  analysis?: unknown;
};

export type StageWorkflowOutput = {
  data: unknown;
  usage: Usage | null;
  /** Activity attempt that finally succeeded (1 = no retry needed). */
  attempt: number;
};

export type WorkflowStage = "queued" | "analyzing" | "done";

/** Sent to the browser so the UI can show proof of orchestration. */
export type TemporalInfo = {
  stage: StageName;
  workflowId: string;
  runId: string;
  taskQueue: string;
  namespace: string;
  attempts: number;
  uiUrl: string;
};
