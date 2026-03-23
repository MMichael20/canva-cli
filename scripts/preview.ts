import { renderStandard } from "../src/lib/templates/standard";
import { renderOverlay } from "../src/lib/templates/overlay";
import { renderSplit } from "../src/lib/templates/split";
import { renderNeonDark } from "../src/lib/templates/neon-dark";
import { renderSpotlight } from "../src/lib/templates/spotlight";
import { PosterData, FORMAT_DIMENSIONS, FormatId, CATEGORY_THEMES } from "../src/lib/types";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const qaJobData: PosterData = {
  template: "standard",
  company: {
    name: "טכנולוגיות אינפיניטי",
    nameEn: "Infinity Technologies",
    isConfidential: false,
  },
  title: {
    he: "בודק/ת תוכנה ידני/ת בכיר/ה",
    en: "Senior Manual QA Engineer",
  },
  spotlight: { text: "₪18,000-25,000 לחודש", type: "salary" },
  details: [
    { label: "ניסיון", value: "ניסיון של 5 שנים לפחות בבדיקות תוכנה" },
    { label: "סביבת עבודה", value: "בדיקות ידניות למערכות Web ו-Mobile" },
    { label: "תיעוד", value: "כתיבת מסמכי בדיקות STP, STD ו-STR" },
    { label: "צוות", value: "עבודה צמודה עם צוותי פיתוח, מוצר ו-UX" },
    { label: "מתודולוגיה", value: "עבודה בסביבת Agile/Scrum" },
  ],
  benefits: ["עבודה היברידית", "קרן השתלמות"],
  salary: { display: "₪18,000-25,000 לחודש" },
  contact: { method: "phone", value: "" },
  cta: { text: "לחצו על הלינק למידע נוסף", urgent: false },
  badge: { text: "דרוש/ה!", style: "default" },
  theme: CATEGORY_THEMES.standard,
  imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1080",
};

const TEMPLATES = [
  { name: "standard", render: renderStandard, theme: CATEGORY_THEMES.standard },
  { name: "overlay", render: renderOverlay, theme: CATEGORY_THEMES.overlay },
  { name: "split", render: renderSplit, theme: CATEGORY_THEMES.split },
  { name: "neon-dark", render: renderNeonDark, theme: CATEGORY_THEMES["neon-dark"] },
  { name: "spotlight", render: renderSpotlight, theme: CATEGORY_THEMES.spotlight },
] as const;

const FORMATS: FormatId[] = [
  "instagram-post",
  "whatsapp-status",
  "instagram-story",
  "facebook-post",
];

async function main() {
  const outDir = path.join(__dirname, "..", "preview");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  for (const tmpl of TEMPLATES) {
    for (const formatId of FORMATS) {
      const { width, height, label } = FORMAT_DIMENSIONS[formatId];
      const data = { ...qaJobData, template: tmpl.name as PosterData["template"], theme: { ...tmpl.theme } };
      const html = tmpl.render(data, width, height);

      const page = await browser.newPage();
      await page.setViewport({ width, height });
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
      await page.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 500));

      const outPath = path.join(outDir, `${tmpl.name}-${formatId}.png`);
      await page.screenshot({ type: "png", path: outPath });
      console.log(`Saved: preview/${tmpl.name}-${formatId}.png  (${width}x${height} — ${label})`);
      await page.close();
    }
  }

  await browser.close();
}

main().catch(console.error);
