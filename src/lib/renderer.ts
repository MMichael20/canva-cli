import puppeteer, { Browser } from "puppeteer";
import sharp from "sharp";
import { PosterData, FORMAT_DIMENSIONS } from "./templates";
import { generateTemplateHtml } from "./template-html";

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

    const jpegBuffer = await sharp(screenshot).jpeg({ quality: 92, mozjpeg: true }).toBuffer();

    return jpegBuffer;
  } finally {
    await page.close();
  }
}
