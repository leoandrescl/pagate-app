import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

const STEP_X = 250;
const STEP_Y = 180;
const ANGLE_DEG = -45;
const OPACITY = 0.11;
const FONT_SIZE = 12;
const COLOR = rgb(0.47, 0.47, 0.47);

export async function watermarkPdf(
  source: Uint8Array,
  text: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(source, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const overflow = Math.hypot(width, height);

    let row = 0;
    for (let y = -overflow; y <= height + overflow; y += STEP_Y) {
      const offsetX = (row % 2) * (STEP_X / 2);
      for (let x = -overflow; x <= width + overflow; x += STEP_X) {
        page.drawText(text, {
          x: x + offsetX,
          y,
          size: FONT_SIZE,
          font,
          color: COLOR,
          opacity: OPACITY,
          rotate: degrees(ANGLE_DEG),
        });
      }
      row += 1;
    }
  }

  return doc.save();
}