import { sumUsage } from "./energy";
import { chat, extractJson, readConfig, type LlmConfig } from "./llm";
import {
  MOCK_ANALYSIS,
  MOCK_INVENTORY,
  MOCK_REDESIGN,
  MOCK_ROAST,
} from "./mock-data";
import {
  ANALYSE_SYSTEM,
  EXTRACT_SYSTEM,
  EXTRACT_USER,
  REDESIGN_SYSTEM,
  ROAST_SYSTEM,
} from "./prompts";
import type {
  Analysis,
  Inventory,
  Redesign,
  RoastText,
  StageResponse,
  Usage,
} from "./types";
import {
  validateAnalysis,
  validateInventory,
  validateRedesign,
  validateRoast,
} from "./validate";

type Part = Parameters<typeof chat>[2][number];

/** Calls the model, parses and validates; retries once if the JSON is bad. */
async function run<T>(
  config: LlmConfig,
  system: string,
  user: Part[],
  validate: (raw: unknown) => T,
): Promise<StageResponse<T>> {
  const usages: (Usage | null)[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const { text, usage } = await chat(config, system, user);
    usages.push(usage);
    try {
      return { data: validate(extractJson(text)), usage: sumUsage(usages) };
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }
  throw new Error("unreachable");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Mock stages wait like a real model call so the UI feels the same. */
const mock = async <T>(data: T, minMs: number, spreadMs: number) => {
  await sleep(minMs + Math.random() * spreadMs);
  return { data, usage: null } satisfies StageResponse<T>;
};

const json = (v: unknown) => JSON.stringify(v);

export async function extract(
  image: string,
): Promise<StageResponse<Inventory>> {
  const config = readConfig();
  if (!config) return mock(MOCK_INVENTORY, 3000, 1500);
  return run(
    config,
    EXTRACT_SYSTEM,
    [
      { type: "text", text: EXTRACT_USER },
      { type: "image_url", image_url: { url: image } },
    ],
    validateInventory,
  );
}

export async function analyse(
  inventory: Inventory,
): Promise<StageResponse<Analysis>> {
  const config = readConfig();
  if (!config) return mock(MOCK_ANALYSIS, 4000, 1500);
  return run(
    config,
    ANALYSE_SYSTEM,
    [{ type: "text", text: `Inventory:\n${json(inventory)}` }],
    validateAnalysis,
  );
}

export async function roast(
  inventory: Inventory,
  analysis: Analysis,
): Promise<StageResponse<RoastText>> {
  const config = readConfig();
  if (!config) return mock(MOCK_ROAST, 2000, 1000);
  return run(
    config,
    ROAST_SYSTEM,
    [
      {
        type: "text",
        text: `Inventory:\n${json(inventory)}\n\nAnalysis:\n${json(analysis)}`,
      },
    ],
    validateRoast,
  );
}

export async function redesign(
  inventory: Inventory,
  analysis: Analysis,
): Promise<StageResponse<Redesign>> {
  const config = readConfig();
  if (!config) return mock(MOCK_REDESIGN, 3000, 1500);
  return run(
    config,
    REDESIGN_SYSTEM,
    [
      {
        type: "text",
        text: `Inventory:\n${json(inventory)}\n\nProposed changes:\n${json(analysis.changes)}`,
      },
    ],
    validateRedesign,
  );
}
