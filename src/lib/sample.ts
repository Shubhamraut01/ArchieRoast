import { SAMPLE_IMAGE_DATA_URL } from "./sample-image";

const SAMPLE_FILE_NAME = "sample-architecture.png";
const sampleFiles = new WeakSet<File>();

/** Builds the bundled sample diagram as a File, with no network access. */
export function createSampleFile(): File {
  const bytes = Uint8Array.from(
    atob(SAMPLE_IMAGE_DATA_URL.split(",")[1]),
    (c) => c.charCodeAt(0),
  );
  const file = new File([bytes], SAMPLE_FILE_NAME, { type: "image/png" });
  sampleFiles.add(file);
  return file;
}

/** True for files made by createSampleFile; these play the canned review. */
export function isSampleFile(file: File): boolean {
  return sampleFiles.has(file);
}
