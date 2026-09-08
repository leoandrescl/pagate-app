export const PRODUCT_FILES_BUCKET = "product-files";
export const MAX_PRODUCT_FILE_MB = 5;
export const MAX_PRODUCT_FILE_BYTES = MAX_PRODUCT_FILE_MB * 1024 * 1024;

export const ALLOWED_PRODUCT_FILE_EXTENSIONS = [
  "pdf",
  "zip",
  "epub",
  "png",
  "jpg",
  "jpeg",
  "webp",
] as const;

const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  zip: "application/zip",
  epub: "application/epub+zip",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function sanitizeProductFileName(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[^\w.\-()+ ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120);
  return base || "archivo";
}

export function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "") : "";
}

export function mimeForFileName(fileName: string): string {
  return EXT_MIME[extensionOf(fileName)] ?? "application/octet-stream";
}

export function validateProductFile(file: File): string | null {
  if (!file || file.size <= 0) {
    return "Sube el archivo del producto digital.";
  }
  if (file.size > MAX_PRODUCT_FILE_BYTES) {
    return `El archivo supera el máximo de ${MAX_PRODUCT_FILE_MB} MB.`;
  }
  const ext = extensionOf(file.name);
  if (
    !ALLOWED_PRODUCT_FILE_EXTENSIONS.includes(
      ext as (typeof ALLOWED_PRODUCT_FILE_EXTENSIONS)[number],
    )
  ) {
    return "Formato no permitido. Usa PDF, ZIP, EPUB o imagen.";
  }
  return null;
}
