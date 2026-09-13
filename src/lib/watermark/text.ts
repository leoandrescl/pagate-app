const SAFE_ASCII_RE = /[\x20-\x7e]/g;

function sanitizeAscii(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(SAFE_ASCII_RE)
    ?.join("")
    .trim() ?? "";
}

export type WatermarkInput = {
  storeName: string;
  buyerEmail: string;
  transactionId: string;
};

export function buildWatermarkText(input: WatermarkInput): string {
  const storeName = sanitizeAscii(input.storeName || "PAGATE");
  const buyerEmail = sanitizeAscii(input.buyerEmail || "");
  const transactionId = sanitizeAscii(input.transactionId || "");
  return `VENDEDOR: ${storeName} \u2022 COMPRADOR: ${buyerEmail} \u2022 ID: ${transactionId} \u2022 PAGATE.CL`.toUpperCase();
}