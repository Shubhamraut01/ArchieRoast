import OpenAI from "openai";

import type { Usage } from "./types";

export type LlmConfig = { baseURL: string; apiKey: string; model: string };

export function readConfig(): LlmConfig | null {
  const baseURL = process.env.JARVIS_BASE_URL?.trim();
  const apiKey = process.env.JARVIS_API_KEY?.trim();
  const model = process.env.JARVIS_MODEL?.trim();
  return baseURL && apiKey && model ? { baseURL, apiKey, model } : null;
}

type Part =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

/**
 * One chat completion against the JarvisLabs OpenAI-compatible endpoint.
 * The model is a reasoning model: it spends thousands of hidden tokens
 * before answering, so max_tokens must be generous or `content` comes back null.
 */
export async function chat(
  config: LlmConfig,
  system: string,
  user: Part[],
  maxTokens = 8000,
): Promise<{ text: string; usage: Usage | null }> {
  const client = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    timeout: 55_000, // stay under the route's 60s limit
    maxRetries: 0,
  });

  const completion = await client.chat.completions.create({
    model: config.model,
    temperature: 0.7,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const choice = completion.choices[0];
  const text = choice?.message?.content;
  if (!text) {
    throw new Error(
      `Model returned no content (finish_reason: ${choice?.finish_reason}).`,
    );
  }

  const u = completion.usage;
  return {
    text,
    usage: u
      ? {
          promptTokens: u.prompt_tokens,
          completionTokens: u.completion_tokens,
          totalTokens: u.total_tokens,
        }
      : null,
  };
}

/** Pulls the first {...} block out of model output and parses it. */
export function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("Model reply contained no JSON object.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}
