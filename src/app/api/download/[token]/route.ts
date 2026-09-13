import { NextResponse } from "next/server";
import { consumeDownload, getStoreById } from "@/lib/store";
import { downloadProductFile } from "@/lib/product-files";
import { extensionOf } from "@/lib/product-file-rules";
import {
  applyWatermark,
  buildWatermarkText,
  isWatermarkableExtension,
} from "@/lib/watermark";

type Ctx = { params: Promise<{ token: string }> };

function contentDisposition(filename: string): string {
  const ascii =
    filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\;]/g, "_") || "archivo";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function POST(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const result = await consumeDownload(token);

  if (!result) {
    return NextResponse.json(
      { error: "Link expirado o inválido." },
      { status: 410 },
    );
  }

  if (!result.product.filePath || !result.product.fileName) {
    return NextResponse.json(
      { error: "Este producto no tiene archivo descargable." },
      { status: 400 },
    );
  }

  const file = await downloadProductFile(result.product.filePath);
  if (!file) {
    return NextResponse.json(
      { error: "Archivo no encontrado." },
      { status: 404 },
    );
  }

  const ext = extensionOf(result.product.fileName);
  let body: Uint8Array = file.bytes;

  if (isWatermarkableExtension(ext)) {
    const store = await getStoreById(result.product.creatorId);
    const storeName =
      store?.creator.displayName?.trim() ||
      store?.creator.username?.trim() ||
      "PAGATE";

    const text = buildWatermarkText({
      storeName,
      buyerEmail: result.purchase.buyerEmail,
      transactionId: result.purchase.id,
    });

    try {
      body = await applyWatermark(ext, body, text);
    } catch (err) {
      console.error("[download] watermark failed", err);
      return NextResponse.json(
        { error: "No se pudo preparar el archivo para la descarga." },
        { status: 500 },
      );
    }
  }

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": contentDisposition(result.product.fileName),
      "Cache-Control": "no-store",
    },
  });
}