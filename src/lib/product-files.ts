import { createAdminClient } from "@/lib/supabase/admin";
import {
  mimeForFileName,
  PRODUCT_FILES_BUCKET,
  sanitizeProductFileName,
} from "@/lib/product-file-rules";

export {
  MAX_PRODUCT_FILE_BYTES,
  MAX_PRODUCT_FILE_MB,
  PRODUCT_FILES_BUCKET,
  validateProductFile,
} from "@/lib/product-file-rules";

export async function uploadProductFile(input: {
  storeId: string;
  productId: string;
  file: File;
}): Promise<{ fileName: string; filePath: string }> {
  const fileName = sanitizeProductFileName(input.file.name);
  const filePath = `${input.storeId}/${input.productId}/${fileName}`;
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const contentType = input.file.type || mimeForFileName(fileName);

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(PRODUCT_FILES_BUCKET)
    .upload(filePath, bytes, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(
      error.message.includes("Bucket not found")
        ? "Falta el bucket product-files en Supabase Storage. Ejecuta supabase/schema.sql."
        : `No se pudo subir el archivo: ${error.message}`,
    );
  }

  return { fileName, filePath };
}

export async function downloadProductFile(
  filePath: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(PRODUCT_FILES_BUCKET)
    .download(filePath);

  if (error || !data) return null;

  const bytes = Buffer.from(await data.arrayBuffer());
  return {
    bytes,
    contentType: mimeForFileName(filePath),
  };
}
