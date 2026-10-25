import { SAMPLE_IMAGE_DATA_URL } from "./sample-image";
import type { RoastResult } from "./roast/types";

const SAMPLE_FILE_NAME = "sample-architecture.png";
const sampleFiles = new WeakSet<File>();

/** Builds the bundled sample diagram as a File, with no network access. */
export function createSampleFile(): File {
  const bytes = Uint8Array.from(
    atob(SAMPLE_IMAGE_DATA_URL.split(",")[1]),
    (c) => c.charCodeAt(0),
  );
  const file = new File([bytes], SAMPLE_FILE_NAME, { type: "image/png" });
  sampleFiles.add(file);
  return file;
}

/** True for files made by createSampleFile; these get the canned demo roast. */
export function isSampleFile(file: File): boolean {
  return sampleFiles.has(file);
}

/** Pre-written roast of the sample diagram. No model is called. */
export const SAMPLE_ROAST: RoastResult = {
  score: 4,
  roast:
    "Congratulations, you built a system whose headline feature is \"one deployable\" and then drew five boxes inside it like that's a flex. Next.js is doing the UI, the validation, the rate limiting and the AI orchestration. It's not a monolith, it's a Swiss Army knife with a Vercel invoice.\n\nI do respect the magic-byte check and the 4MB cap. But your rate limiter lives in an *optional* Redis, which is like installing a smoke detector and keeping the battery as a nice-to-have. And everything funnels into a single vision provider with no fallback, so when GPT-4o has a bad day, so does your product.",
  issues: [
    { title: "Rate limiting depends on an optional Redis", severity: "high" },
    { title: "Single vision provider, no fallback", severity: "high" },
    {
      title: "UI, validation and AI orchestration in one deployable",
      severity: "medium",
    },
    {
      title: "Logs and cost tracking sit outside any alerting",
      severity: "low",
    },
  ],
  advice:
    "Make the rate limiter a hard dependency (or fail closed when Redis is unreachable) and add a second model behind the same provider interface, so one outage or one runaway client can't take the whole app down.",
};
