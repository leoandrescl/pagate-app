import { buildWatermarkText } from "./text";
import { watermarkPdf } from "./pdf";
import { watermarkImage } from "./image";

export { buildWatermarkText };

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp"]);

export function isWatermarkableExtension(ext: string): boolean {
  return ext === "pdf" || IMAGE_EXTS.has(ext);
}

export async function applyWatermark(
  ext: string,
  source: Uint8Array,
  text: string,
): Promise<Uint8Array> {
  if (ext === "pdf") {
    return watermarkPdf(source, text);
  }
  if (IMAGE_EXTS.has(ext)) {
    return watermarkImage(source);
  }
  return source;
}