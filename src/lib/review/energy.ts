import type { Usage } from "./types";

/**
 * Rough, order-of-magnitude energy estimate for the model calls behind a review.
 *
 * It is NOT a measurement: nobody publishes the real figure for this model.
 * Anchors, both for a typical short text prompt:
 *  - Google: median Gemini text prompt ~0.24 Wh (0.10 Wh counting only the
 *    accelerators), ~0.03 gCO2e. cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference
 *  - Epoch AI: typical GPT-4o query ~0.3 Wh, and long inputs or reasoning
 *    models cost more. epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use
 * Epoch's long-input example (10k tokens, ~2.5 Wh) works out to ~0.25 Wh
 * per 1k tokens. Reasoning output and image input push it higher, hence a range.
 */
const WH_PER_1K_TOKENS = { low: 0.2, high: 1.0 };

/** gCO2e per Wh: Google's reported ~0.125 (renewable-heavy) up to a typical grid mix. */
const G_CO2E_PER_WH = { low: 0.1, high: 0.45 };

export type Impact = {
  whLow: number;
  whHigh: number;
  gLow: number;
  gHigh: number;
};

export function estimateImpact(usage: Usage): Impact {
  const k = usage.totalTokens / 1000;
  const whLow = k * WH_PER_1K_TOKENS.low;
  const whHigh = k * WH_PER_1K_TOKENS.high;
  return {
    whLow,
    whHigh,
    gLow: whLow * G_CO2E_PER_WH.low,
    gHigh: whHigh * G_CO2E_PER_WH.high,
  };
}

export function sumUsage(list: (Usage | null)[]): Usage | null {
  const real = list.filter((u): u is Usage => u !== null);
  if (real.length === 0) return null;
  return real.reduce(
    (a, u) => ({
      promptTokens: a.promptTokens + u.promptTokens,
      completionTokens: a.completionTokens + u.completionTokens,
      totalTokens: a.totalTokens + u.totalTokens,
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  );
}
