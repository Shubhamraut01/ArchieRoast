import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Claim-check pattern: the data URL lives on disk and only its id travels
// through Temporal. The server and worker must therefore share a filesystem.
const DIR = path.join(os.tmpdir(), "archieroast-images");
const MAX_AGE_MS = 10 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Rejects anything but a uuid, so a ref can never escape DIR. */
function fileFor(ref: string): string {
  if (!UUID.test(ref)) throw new Error("Invalid image reference.");
  return path.join(DIR, `${ref}.txt`);
}

async function sweepOld() {
  const now = Date.now();
  for (const name of await fs.readdir(DIR).catch(() => [])) {
    const file = path.join(DIR, name);
    const stat = await fs.stat(file).catch(() => null);
    if (stat && now - stat.mtimeMs > MAX_AGE_MS)
      await fs.rm(file, { force: true });
  }
}

export async function saveImage(dataUrl: string): Promise<string> {
  await fs.mkdir(DIR, { recursive: true });
  await sweepOld();
  const ref = randomUUID();
  await fs.writeFile(fileFor(ref), dataUrl, "utf8");
  return ref;
}

export async function loadImage(ref: string): Promise<string> {
  return fs.readFile(fileFor(ref), "utf8");
}

export async function deleteImage(ref: string): Promise<void> {
  await fs.rm(fileFor(ref), { force: true });
}
