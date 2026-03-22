import puppeteer, { Browser } from "puppeteer";
import sharp from "sharp";
import { PosterData } from "./types";
import { generateTemplateHtml } from "./templates/index";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  return browserInstance;
}

const MAX_FILE_SIZE = 800 * 1024; // 800KB target for WhatsApp
const MIN_QUALITY = 80;

export async function renderPoster(data: PosterData, width: number, height: number): Promise<Buffer> {
  const html = generateTemplateHtml(data, width, height);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 500));

    const screenshot = (await page.screenshot({ type: "png" })) as Buffer;

    // Apply sharpening to counteract WhatsApp compression blur
    let quality = 88;
    let jpegBuffer = await sharp(screenshot)
      .sharpen({ sigma: 0.5 })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    // Iteratively reduce quality if file is too large
    while (jpegBuffer.length > MAX_FILE_SIZE && quality > MIN_QUALITY) {
      quality -= 2;
      jpegBuffer = await sharp(screenshot)
        .sharpen({ sigma: 0.5 })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    return jpegBuffer;
  } finally {
    await page.close();
  }
}

export async function renderThumbnails(
  variants: Array<{ data: PosterData; width: number; height: number }>
): Promise<string[]> {
  const browser = await getBrowser();
  return Promise.all(
    variants.map(async ({ data, width, height }) => {
      const thumbW = Math.round(width / 2);
      const thumbH = Math.round(height / 2);
      const html = generateTemplateHtml(data, thumbW, thumbH);
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: thumbW, height: thumbH });
        await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
        await page.evaluate(() => document.fonts.ready);
        await new Promise((r) => setTimeout(r, 300));
        const screenshot = await page.screenshot({ type: "png" }) as Buffer;
        const jpeg = await sharp(screenshot)
          .sharpen({ sigma: 0.5 })
          .jpeg({ quality: 70, mozjpeg: true })
          .toBuffer();
        return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
      } finally {
        await page.close();
      }
    })
  );
}
