import { roast } from "@/lib/roast";

// Vision models on cold GPUs can be slow.
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;
const DATA_URL = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/;

/** Checks the real file signature, not just the claimed MIME type. */
function hasImageMagicBytes(base64: string): boolean {
  const head = Buffer.from(base64.slice(0, 16), "base64");
  const png = head.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const jpeg = head.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  return png || jpeg;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const image = (body as { image?: unknown })?.image;
  if (typeof image !== "string") {
    return Response.json(
      { error: "Expected an 'image' data URL." },
      { status: 400 },
    );
  }

  const match = DATA_URL.exec(image);
  if (!match || !hasImageMagicBytes(match[2])) {
    return Response.json(
      { error: "Image must be a real PNG or JPG." },
      { status: 415 },
    );
  }

  // base64 inflates size by ~4/3
  if ((match[2].length * 3) / 4 > MAX_BYTES) {
    return Response.json({ error: "Image is over 4MB." }, { status: 413 });
  }

  try {
    return Response.json(await roast(image));
  } catch (err) {
    console.error("roast failed", err);
    return Response.json(
      { error: "The roaster tripped over its own feet. Try again." },
      { status: 502 },
    );
  }
}
