import puppeteer, { Browser } from "puppeteer";
import sharp from "sharp";
import { PosterData } from "./types";
import { generateTemplateHtml } from "./templates/index";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  try {
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to launch browser. ${msg}\n` +
      `Ensure Chrome is installed: npx puppeteer browsers install chrome`
    );
  }
  return browserInstance;
}

export async function renderPoster(data: PosterData, width: number, height: number): Promise<Buffer> {
  const html = generateTemplateHtml(data, width, height);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 500));

    const screenshot = (await page.screenshot({ type: "png" })) as Buffer;

    const jpegBuffer = await sharp(screenshot)
      .sharpen({ sigma: 0.5 })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    return jpegBuffer;
  } finally {
    await page.close();
  }
}

export async function renderThumbnails(
  variants: Array<{ data: PosterData; width: number; height: number }>
): Promise<string[]> {
  const browser = await getBrowser();
  const results: string[] = [];
  for (const { data, width, height } of variants) {
    const thumbW = Math.round(width / 2);
    const thumbH = Math.round(height / 2);
    const html = generateTemplateHtml(data, thumbW, thumbH);
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: thumbW, height: thumbH });
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 300));
      const screenshot = await page.screenshot({ type: "png" }) as Buffer;
      const jpeg = await sharp(screenshot)
        .sharpen({ sigma: 0.5 })
        .jpeg({ quality: 70, mozjpeg: true })
        .toBuffer();
      results.push(`data:image/jpeg;base64,${jpeg.toString("base64")}`);
    } finally {
      await page.close();
    }
  }
  return results;
}
