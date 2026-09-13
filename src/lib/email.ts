import { getAppBaseUrl } from "@/lib/urls";
import { downloadProductFile } from "@/lib/product-files";
import { formatClp } from "@/lib/format-clp";
import { formatSlotRange } from "@/lib/slots";
import type { Product, Purchase } from "@/lib/types";

function apiKey(): string {
  return process.env.RESEND_API_KEY?.trim() || "";
}

function fromAddress(): string {
  return process.env.RESEND_FROM?.trim() || "Pagate <hola@pagate.cl>";
}

export function isEmailConfigured(): boolean {
  return Boolean(apiKey());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type SendInput = {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
};

async function send(input: SendInput): Promise<boolean> {
  const key = apiKey();
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.attachments && input.attachments.length > 0
          ? { attachments: input.attachments }
          : {}),
      }),
    });
    if (!res.ok) {
      console.error("[email] resend", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed", err);
    return false;
  }
}

function shell(title: string, body: string): string {
  return `
  <div style="margin:0;padding:32px 16px;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1d1f;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0f766e;">Pagate</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1a1d1f;">${title}</h1>
      ${body}
      <p style="margin:24px 0 0;font-size:12px;color:#8a939b;">Enviado por Pagate.</p>
    </div>
  </div>`;
}

function linkButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:16px 0;padding:12px 22px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">${escapeHtml(label)}</a>`;
}

async function sendDigitalEmail(
  purchase: Purchase,
  product: Product,
): Promise<boolean> {
  const downloadUrl = `${getAppBaseUrl()}/d/${purchase.token}`;
  const attachments: { filename: string; content: string }[] = [];

  if (product.filePath && product.fileName) {
    const file = await downloadProductFile(product.filePath);
    if (file) {
      attachments.push({
        filename: product.fileName,
        content: file.bytes.toString("base64"),
      });
    }
  }

  const body = `
    <p style="margin:0 0 8px;font-size:15px;">Hola ${escapeHtml(purchase.buyerName)},</p>
    <p style="margin:0 0 16px;font-size:15px;">Tu compra de <strong>${escapeHtml(product.name)}</strong> por ${escapeHtml(formatClp(purchase.amountClp))} fue confirmada.</p>
    ${linkButton(downloadUrl, "Descargar archivo")}
    <p style="margin:16px 0 0;font-size:14px;color:#5a636b;">También puedes descargarlo desde este link las veces que necesites:</p>
    <p style="margin:8px 0 0;font-size:13px;word-break:break-all;"><a href="${escapeHtml(downloadUrl)}" style="color:#0f766e;">${escapeHtml(downloadUrl)}</a></p>`;

  return send({
    to: purchase.buyerEmail,
    subject: `Tu descarga: ${product.name}`,
    html: shell(
      `Tu compra está lista${purchase.buyerName ? `, ${purchase.buyerName.split(" ")[0]}` : ""}`,
      body,
    ),
    attachments,
  });
}

async function sendSessionEmail(
  purchase: Purchase,
  product: Product,
): Promise<boolean> {
  const slotText =
    purchase.slotStart && purchase.slotEnd
      ? formatSlotRange(purchase.slotStart, purchase.slotEnd)
      : null;

  const body = `
    <p style="margin:0 0 8px;font-size:15px;">Hola ${escapeHtml(purchase.buyerName)},</p>
    <p style="margin:0 0 16px;font-size:15px;">Tu sesión <strong>${escapeHtml(product.name)}</strong> por ${escapeHtml(formatClp(purchase.amountClp))} fue confirmada.</p>
    ${
      slotText
        ? `<p style="margin:0 0 8px;font-size:15px;">Horario (Chile): <strong>${escapeHtml(slotText)}</strong></p>`
        : ""
    }
    ${
      purchase.meetUrl
        ? `${linkButton(purchase.meetUrl, "Unirme a la videollamada")}`
        : ""
    }`;

  return send({
    to: purchase.buyerEmail,
    subject: `Tu sesión está confirmada: ${product.name}`,
    html: shell(
      `Tu sesión está confirmada${purchase.buyerName ? `, ${purchase.buyerName.split(" ")[0]}` : ""}`,
      body,
    ),
  });
}

export async function sendPurchaseEmail(
  purchase: Purchase,
  product: Product,
): Promise<boolean> {
  if (!isEmailConfigured() || !purchase.buyerEmail) return false;
  if (purchase.status !== "paid") return false;
  return product.type === "session"
    ? sendSessionEmail(purchase, product)
    : sendDigitalEmail(purchase, product);
}