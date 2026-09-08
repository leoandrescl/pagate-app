import { NextResponse } from "next/server";
import { consumeDownload } from "@/lib/store";
import { downloadProductFile } from "@/lib/product-files";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const result = await consumeDownload(token);

  if (!result) {
    return NextResponse.json(
      { error: "Link expirado o sin descargas restantes." },
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

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${result.product.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
