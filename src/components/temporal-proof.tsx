import { ExternalLink, Workflow } from "lucide-react";

import type { TemporalInfo } from "@/temporal/types";

const STAGE_LABEL: Record<TemporalInfo["stage"], string> = {
  extract: "Read the diagram",
  analyse: "Analysed it",
  roast: "Wrote the roast",
  redesign: "Redrew it",
};

/** Shows that each review step ran as a Temporal workflow, with a link to its history. */
export function TemporalProof({ runs }: { runs: TemporalInfo[] }) {
  if (runs.length === 0) return null;
  const { taskQueue, namespace } = runs[0];

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 space-y-2.5 rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 duration-500">
      <div className="flex items-center gap-2">
        <Workflow className="size-4 text-violet-400" />
        <h3 className="text-sm font-semibold">Orchestrated by Temporal</h3>
      </div>
      <p className="text-muted-foreground text-[11px]">
        Each step ran as a durable workflow on task queue{" "}
        <code className="text-violet-300">{taskQueue}</code> (namespace{" "}
        {namespace}), so a failed model call is retried automatically.
      </p>
      <ul className="space-y-1.5">
        {runs.map((run) => (
          <li
            key={run.workflowId}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs"
          >
            <span>
              <span className="font-medium">{STAGE_LABEL[run.stage]}</span>
              <span className="text-muted-foreground">
                {" "}
                · model call succeeded on attempt {run.attempts}
                {run.attempts > 1 ? " (auto-retried)" : ""}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <code
                className="text-muted-foreground text-[10px]"
                title={run.workflowId}
              >
                {run.workflowId.slice(0, 22)}…
              </code>
              <a
                href={run.uiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-violet-300 hover:underline"
              >
                View execution history
                <ExternalLink className="size-3" />
              </a>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
