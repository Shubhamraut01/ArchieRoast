import { rateLimit } from "@/lib/rate-limit";
import { analyse, extract, redesign, roast } from "@/lib/review/stages";
import { validateAnalysis, validateInventory } from "@/lib/review/validate";

// Vision/reasoning models on cold GPUs can be slow; each stage is its own request.
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_JSON_BYTES = 200 * 1024;
const REQUESTS_PER_MINUTE = 30; // a full review is 3-4 requests
const DATA_URL = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/;

/** Checks the real file signature, not just the claimed MIME type. */
function hasImageMagicBytes(base64: string): boolean {
  const head = Buffer.from(base64.slice(0, 16), "base64");
  const png = head.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const jpeg = head.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  return png || jpeg;
}

const bad = (error: string, status = 400) =>
  Response.json({ error }, { status });

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip, REQUESTS_PER_MINUTE)) {
    return bad("Easy there. Too many requests, try again in a minute.", 429);
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_IMAGE_BYTES * 1.4) return bad("Payload is too large.", 413);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Body must be JSON.");
  }

  try {
    switch (body.stage) {
      case "extract": {
        const match =
          typeof body.image === "string" ? DATA_URL.exec(body.image) : null;
        if (!match || !hasImageMagicBytes(match[2])) {
          return bad("Image must be a real PNG or JPG.", 415);
        }
        if ((match[2].length * 3) / 4 > MAX_IMAGE_BYTES) {
          return bad("Image is over 4MB.", 413);
        }
        return Response.json(await extract(body.image as string));
      }
      case "analyse": {
        if (JSON.stringify(body).length > MAX_JSON_BYTES)
          return bad("Payload is too large.", 413);
        return Response.json(await analyse(validateInventory(body.inventory)));
      }
      case "roast":
      case "redesign": {
        if (JSON.stringify(body).length > MAX_JSON_BYTES)
          return bad("Payload is too large.", 413);
        const inventory = validateInventory(body.inventory);
        const analysis = validateAnalysis(body.analysis);
        return Response.json(
          body.stage === "roast"
            ? await roast(inventory, analysis)
            : await redesign(inventory, analysis),
        );
      }
      default:
        return bad("Unknown stage.");
    }
  } catch (err) {
    console.error(`review stage '${String(body.stage)}' failed`, err);
    return bad("The roaster tripped over its own feet. Try again.", 502);
  }
}
