import { estimateImpact } from "@/lib/review/energy";
import type { Usage } from "@/lib/review/types";

const fmt = (n: number) => (n < 10 ? n.toFixed(1) : Math.round(n).toString());

export function UsageFooter({ usage, calls }: { usage: Usage; calls: number }) {
  const impact = estimateImpact(usage);
  return (
    <p
      className="text-muted-foreground border-t pt-3 text-[11px] leading-relaxed"
      title="Anchored on Google's reported 0.24 Wh median Gemini prompt and Epoch AI's ~0.3 Wh typical GPT-4o query, widened for reasoning output and image input. Our model's real figure is not published."
    >
      This review used{" "}
      <span className="text-foreground font-medium">
        {usage.totalTokens.toLocaleString()} tokens
      </span>{" "}
      across {calls} model calls. Rough energy estimate:{" "}
      <span className="text-foreground font-medium">
        {fmt(impact.whLow)}–{fmt(impact.whHigh)} Wh
      </span>{" "}
      (about {fmt(impact.gLow)}–{fmt(impact.gHigh)} g CO₂e). An estimate from
      published per-query figures, not a measurement.
    </p>
  );
}
