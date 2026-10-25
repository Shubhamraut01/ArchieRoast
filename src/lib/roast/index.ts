import { createJarvisRoast } from "./jarvis";
import { mockRoast } from "./mock";
import type { RoastProvider } from "./types";

/**
 * Uses JarvisLabs when JARVIS_BASE_URL, JARVIS_API_KEY and JARVIS_MODEL are all
 * set, otherwise falls back to the mock so the app runs with no keys.
 */
export const roast: RoastProvider = (image) => {
  const baseURL = process.env.JARVIS_BASE_URL?.trim();
  const apiKey = process.env.JARVIS_API_KEY?.trim();
  const model = process.env.JARVIS_MODEL?.trim();

  if (baseURL && apiKey && model) {
    return createJarvisRoast({ baseURL, apiKey, model })(image);
  }
  return mockRoast(image);
};

export type { RoastIssue, RoastResult } from "./types";
