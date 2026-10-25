import OpenAI from "openai";

import { parseRoast } from "./parse";
import { SYSTEM_PROMPT, USER_PROMPT } from "./prompt";
import type { RoastProvider } from "./types";

export type JarvisConfig = {
  baseURL: string;
  apiKey: string;
  model: string;
};

/** JarvisLabs serves vLLM behind an OpenAI-compatible API. */
export function createJarvisRoast(config: JarvisConfig): RoastProvider {
  const client = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    timeout: 55_000, // stay under the route's 60s limit
    maxRetries: 0,
  });

  async function ask(imageDataUrl: string) {
    const completion = await client.chat.completions.create({
      model: config.model,
      temperature: 0.8,
      // Reasoning models spend 1-2k hidden tokens before answering; a small
      // cap leaves `content` null.
      max_tokens: 6000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });
    const choice = completion.choices[0];
    if (!choice?.message?.content) {
      throw new Error(
        `Model returned no content (finish_reason: ${choice?.finish_reason}).`,
      );
    }
    return choice.message.content;
  }

  return async (imageDataUrl) => {
    try {
      return parseRoast(await ask(imageDataUrl));
    } catch (err) {
      // Open models occasionally wrap or break JSON; one retry is cheap.
      if (err instanceof OpenAI.APIError) throw err;
      return parseRoast(await ask(imageDataUrl));
    }
  };
}
