import puppeteer, { Browser } from "puppeteer";
import sharp from "sharp";
import { PosterData, FORMAT_DIMENSIONS } from "./types";
import { generateTemplateHtml } from "./templates/index";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  return browserInstance;
}

const MAX_FILE_SIZE = 800 * 1024; // 800KB target for WhatsApp
const MIN_QUALITY = 80;

export async function renderPoster(data: PosterData): Promise<Buffer> {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const html = generateTemplateHtml(data);

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
