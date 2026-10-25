import { ApplicationFailure, Context } from "@temporalio/activity";
import { APIError } from "openai";

// Relative imports only: the worker runs under tsx, which has no "@/" alias.
import { analyse, extract, redesign, roast } from "../lib/review/stages";
import { validateAnalysis, validateInventory } from "../lib/review/validate";
import { deleteImage, loadImage } from "./image-store";
import type { StageWorkflowInput, StageWorkflowOutput } from "./types";

/** 4xx from the model API means our request is wrong; retrying cannot help. */
function isClientError(err: unknown): err is APIError {
  return (
    err instanceof APIError &&
    typeof err.status === "number" &&
    err.status >= 400 &&
    err.status < 500 &&
    err.status !== 408 &&
    err.status !== 429
  );
}

export async function runReviewStage(
  input: StageWorkflowInput,
): Promise<StageWorkflowOutput> {
  const attempt = Context.current().info.attempt;

  // Demo switch: fail the first N attempts so retries are visible live.
  const failFirst = Number(process.env.DEMO_FAIL_FIRST_ATTEMPTS ?? 0);
  if (failFirst > 0 && attempt <= failFirst) {
    throw new Error(
      `Simulated model failure on attempt ${attempt} of ${failFirst} (DEMO_FAIL_FIRST_ATTEMPTS)`,
    );
  }

  try {
    const result =
      input.stage === "extract"
        ? await extract(await loadImage(input.imageRef ?? ""))
        : input.stage === "analyse"
          ? await analyse(validateInventory(input.inventory))
          : input.stage === "roast"
            ? await roast(
                validateInventory(input.inventory),
                validateAnalysis(input.analysis),
              )
            : await redesign(
                validateInventory(input.inventory),
                validateAnalysis(input.analysis),
              );
    return { data: result.data, usage: result.usage, attempt };
  } catch (err) {
    if (isClientError(err)) {
      throw ApplicationFailure.nonRetryable(
        `Model rejected the request (${err.status}): ${err.message}`,
        "ModelClientError",
      );
    }
    throw err;
  }
}

export async function cleanupImage(imageRef: string): Promise<void> {
  await deleteImage(imageRef);
}
