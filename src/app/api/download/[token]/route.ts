import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { consumeDownload } from "@/lib/store";

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

  const fileAbs = path.join(
    process.cwd(),
    "public",
    result.product.filePath.replace(/^\//, ""),
  );

  try {
    const bytes = await fs.readFile(fileAbs);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.product.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Archivo no encontrado." },
      { status: 404 },
    );
  }
}
