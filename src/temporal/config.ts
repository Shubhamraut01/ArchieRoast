export const WORKFLOW_TYPE = "reviewStageWorkflow";

export function isTemporalEnabled(): boolean {
  return process.env.TEMPORAL_ENABLED === "true";
}

/** Read lazily so env files loaded at startup (or by the worker) are honoured. */
export function temporalConfig() {
  const apiKey = process.env.TEMPORAL_API_KEY?.trim() || undefined;
  const namespace = process.env.TEMPORAL_NAMESPACE?.trim() || "default";
  return {
    address: process.env.TEMPORAL_ADDRESS?.trim() || "localhost:7233",
    namespace,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE?.trim() || "archie-roast",
    apiKey,
    // Temporal Cloud needs TLS; the local dev server does not.
    tls: Boolean(apiKey),
    uiBase:
      process.env.TEMPORAL_UI_URL?.trim().replace(/\/$/, "") ||
      `http://localhost:8233/namespaces/${namespace}`,
  };
}

export function workflowUiUrl(workflowId: string, runId: string): string {
  return `${temporalConfig().uiBase}/workflows/${encodeURIComponent(workflowId)}/${runId}/history`;
}
