import type { RoastIssue, RoastResult, Severity } from "./types";

const SEVERITIES: Severity[] = ["low", "medium", "high"];

/** Pulls the first {...} block out of model output and validates its shape. */
export function parseRoast(raw: string): RoastResult {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("Model reply contained no JSON object.");
  }

  const data = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;

  const roast = typeof data.roast === "string" ? data.roast.trim() : "";
  const advice = typeof data.advice === "string" ? data.advice.trim() : "";
  const score = Math.round(Number(data.score));
  if (!roast) throw new Error("Model reply is missing 'roast'.");
  if (!Number.isFinite(score))
    throw new Error("Model reply is missing 'score'.");

  const issues: RoastIssue[] = Array.isArray(data.issues)
    ? data.issues.flatMap((item): RoastIssue[] => {
        const { title, severity } = (item ?? {}) as Record<string, unknown>;
        if (typeof title !== "string" || !title.trim()) return [];
        return [
          {
            title: title.trim(),
            severity: SEVERITIES.includes(severity as Severity)
              ? (severity as Severity)
              : "medium",
          },
        ];
      })
    : [];

  return {
    roast,
    score: Math.min(10, Math.max(1, score)),
    issues,
    advice,
  };
}
