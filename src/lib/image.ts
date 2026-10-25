const MAX_EDGE = 1536;
// Raw PNG/JPEG above this is re-encoded so the request stays under the API cap.
const MAX_RAW_BYTES = 3 * 1024 * 1024;
const NATIVE_TYPES = ["image/png", "image/jpeg"];

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Returns a PNG/JPEG data URL for the model. Large diagrams are downscaled so
 * the request stays small, fast and cheap; other formats (WebP, AVIF, GIF...)
 * are converted to JPEG. A small PNG/JPEG is sent untouched.
 */
export async function prepareImage(file: File): Promise<string> {
  const native = NATIVE_TYPES.includes(file.type);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (native) return readAsDataUrl(file);
    throw new Error("Couldn't read that image format. Try a PNG or JPG.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && native && file.size <= MAX_RAW_BYTES) {
    bitmap.close();
    return readAsDataUrl(file);
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Couldn't process that image in this browser.");
  }
  // JPEG has no alpha; paint white so transparent images don't turn black.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.92);
}
