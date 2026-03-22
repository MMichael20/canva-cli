import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod/v4";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  PosterData,
  PosterVariant,
  TemplateCategory,
  CATEGORY_THEMES,
  CATEGORY_META,
  CATEGORY_ADJACENCY,
} from "@/lib/types";
import { renderThumbnails } from "@/lib/renderer";

const AIOutputSchema = z.object({
  category: z.enum(["standard", "overlay", "split"])
    .describe("Best-fit template category for this role"),
  companyName: z.string().nullable()
    .describe("Company name from the job description, or null if not mentioned / confidential"),
  title: z.object({
    he: z.string().describe("Hebrew headline: job title (max 4 words) if company known, or creative industry+role headline (6-12 words) if company is null"),
    en: z.string().nullable().describe("English job title for tech roles (e.g. 'QA Engineer'), null for non-tech"),
  }),
  subtitle: z.string().nullable()
    .describe("Punchy emotional tagline, max 25 Hebrew characters including spaces, or null"),
  details: z.array(z.object({
    label: z.string().describe("Short Hebrew category label, max 3 words (internal metadata, not displayed)"),
    value: z.string().describe("Self-explanatory descriptive phrase, max ~40 Hebrew chars, must make sense without label"),
  })).describe("3-5 key job details"),
  benefits: z.array(z.string()).nullable()
    .describe("1-3 short benefit tags (max 20 chars each), or null"),
  salaryDisplay: z.string().nullable()
    .describe("Salary as stated: '₪15,000-20,000/חודש' or 'לפי ניסיון', or null"),
  badge: z.object({
    text: z.string().describe("Badge text like 'משרה חדשה!' or 'דרוש/ה בדחיפות!'"),
    style: z.enum(["default", "urgent", "new"]),
  }).nullable(),
  imageQuery: z.string()
    .describe("1-2 English words for Unsplash: the work ENVIRONMENT, not the job title"),
});

const SYSTEM_PROMPT = `You are a Hebrew recruitment copywriter. You receive a Hebrew job description and produce structured JSON for a recruitment poster. You do NOT design the poster — you only produce the content fields below.

Before generating anything, read the full description and identify: What makes THIS role uniquely attractive? The tech stack? Team culture? Career growth? A specific perk? This hook drives your headline, subtitle, and detail ordering.

=== HARD RULES (violating any of these is a critical failure) ===

1. HEBREW ONLY. Exceptions: English job titles for tech roles (e.g. "QA Engineer"), established English tech terms, and the imageQuery field.
2. NEVER use abbreviations containing quotation marks: בע"מ, מנכ"ל, חו"ל, בע"פ, ת"א, ר"ל. Write the full form: בערבון מוגבל, מנהל כללי, חוץ לארץ, בעל פה, תל אביב. Double quotes inside values break JSON parsing.
3. EXTRACT ONLY. Never invent benefits, salary, perks, team culture, or company details not present in the description. You MAY reframe real information to sound appealing — reframing is not fabrication.
4. OMIT rather than fabricate. If a field's information doesn't exist in the description, set it to null (or omit the detail). Never use placeholders: [יש לציין], [___], TBD, N/A.

=== FIELD SPECIFICATIONS ===

── category ──
Which poster template to use.
• "standard" — most jobs. Photo on top, colored content below. Best when the role is people-focused.
• "overlay" — full-bleed photo with frosted glass overlay. Best for industrial, warehouse, logistics, corporate environments, or roles where the physical setting is the selling point.
• "split" — side-by-side layout: photo on the left, content on the right. Best for professional/corporate roles, or when the photo is a strong selling point alongside detailed content.

── companyName (string | null) ──
The hiring company's name, extracted verbatim from the description.
• If a specific company is named → extract it exactly.
• If no company name, or it says חסוי / confidential → null.
• Never invent or guess a company name.

── title.he (string) ──
The poster headline. Behavior depends on whether a company name exists.

When companyName is present — a clean job title, max 4 words:
  GOOD: "בודק/ת תוכנה בכיר/ה"
  GOOD: "מנהל/ת פרויקטים"
  BAD: "בודק/ת תוכנה בכיר/ה עם ניסיון" — too long, detail belongs elsewhere

When companyName is null — a creative headline merging industry + role, 6-12 words:
  GOOD: "חברת סטארטאפ בתחום הבריאות הדיגיטלית מגייסת ארכיטקט/ית ענן"
  GOOD: "ארגון פיננסי בינלאומי מחפש/ת ראש צוות פיתוח"
  BAD: "משרד מוביל מחפש עובד/ת" — "משרד" is vague, "עובד" is meaningless
  Rules for null-company headlines:
  - Vary structure. Don't always use "חברת X מחפשת Y".
  - Use specific descriptors: סטארטאפ, חברת תוכנה, רשת קמעונאית — never "משרד" or "מקום".
  - Vary adjectives: בצמיחה, חדשנית, בינלאומית, מבוססת — don't default to "מובילה".
  - Always use gender-inclusive forms: מפתח/ת, מהנדס/ת, בודק/ת.

── title.en (string | null) ──
English job title for tech roles only (e.g. "QA Engineer", "DevOps Engineer", "Full Stack Developer").
Set to null for non-tech roles (e.g. accountant, warehouse worker, sales).

── subtitle (string | null) ──
A punchy emotional tagline. HARD LIMIT: max 25 Hebrew characters including spaces. Typically 3-5 words. The template renders this with white-space: nowrap — anything over 25 characters gets clipped and looks broken.

GOOD: "הובילו את המוצר הבא" (20 chars, action-driven)
GOOD: "טכנולוגיה שמשנה חיים" (20 chars, impact)
GOOD: "צוות מוצר רב-תחומי" (18 chars, specific)
BAD: "הצטרפו לצוות בדיקות תוכנה מקצועי ומגוון" (41 chars — will clip)
BAD: "משרה מלאה באזור המרכז" (logistic detail, not a hook)
BAD: "הצטרפו אלינו" (generic filler, says nothing)

Reference something specific from the description — a domain, methodology, team structure, or impact. Set to null only if nothing fits.

── details (array of 3-5 objects) ──
Each object has:
  • label (string): Short Hebrew category label, max 3 words. Internal metadata only — NOT visible on the poster.
  • value (string): A self-explanatory descriptive phrase. Max ~40 Hebrew characters. This is the ONLY thing the reader sees.

THE #1 QUALITY RULE: Every value must be a complete, readable phrase that makes sense without its label. The poster shows values as standalone text bars — no label, no icon, no context. A reader glancing at the poster must instantly understand what each line means.

GOOD values (descriptive phrases):
  label: "תחום" → value: "בדיקות ידניות למערכות Web ו-Mobile"
  label: "צוות" → value: "עבודה צמודה עם צוותי פיתוח ומוצר"
  label: "ניסיון" → value: "ניסיון של 5 שנים בתחום הבדיקות"
  label: "מיקום" → value: "תל אביב, עבודה היברידית"
  label: "שעות" → value: "בקרים בלבד, ימים א׳-ה׳"
  label: "כלים" → value: "ניסיון בעבודה עם Jira ו-DevOps"

BAD values (will look broken on the poster):
  "5+ שנות QA" — compressed gibberish, not a readable phrase
  "Jira, Azure DevOps" — tool list with no context
  "STP, STD, STR" — acronym soup
  "Web ו-Mobile" — fragment, not a sentence
  "תואר ראשון רלוונטי" — boring requirement, doesn't sell
  "פיתוח, מוצר ו-UX" — department list, not a detail

Think like a recruiter on the phone: "You'll be working with Jira and CI/CD pipelines" — not "Jira, CI/CD".

Ordering: Lead with the most attractive detail. Include 1 seniority/experience line for filtering, framed as prestige not demand. Fill the rest with environment, scope, tools, or team details that make the role appealing.

If information is missing, skip that detail. Minimum 2, maximum 5.

── benefits (string[] | null) ──
1-3 genuinely differentiating perks mentioned in the description. Max 20 Hebrew characters each.
GOOD: "עבודה היברידית" | "קרן השתלמות" | "ימי כנס וטכנולוגיה"
BAD: "שכר תחרותי" (vague cliche) | "סביבת עבודה נעימה" (meaningless)
If no real, specific benefits are mentioned → null. Do NOT invent benefits.

── salaryDisplay (string | null) ──
Salary as stated in the description.
Format: "₪15,000-20,000/חודש" or "לפי ניסיון" or "₪70-90 לשעה".
If salary is not mentioned → null. NEVER invent a salary.

── badge (object | null) ──
A short attention-grabbing label for the top of the poster. 10-15 Hebrew characters.
• text: "משרה חדשה!" / "דרוש/ה בדחיפות!" / "דרוש/ה!"
• style: "new" for new postings, "urgent" if description says דרוש בדחיפות / ASAP / גיוס מיידי, "default" otherwise.
Set to null only if none fits.

── imageQuery (string) ──
1-2 English words for an Unsplash photo search. Describe the WORK ENVIRONMENT or SETTING — never the job title.

GOOD: "modern office", "warehouse", "restaurant kitchen", "hospital", "construction site", "retail store", "server room", "factory floor"
BAD: "qa engineer", "developer", "accountant", "project manager" — Unsplash has environments and places, not job titles.

Ask yourself: WHERE does this person work? Use that as the query.`;

async function searchUnsplash(query: string, page = 1): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  async function tryQuery(q: string, p: number): Promise<string | null> {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=1&page=${p}&orientation=portrait`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.results?.[0]?.urls?.regular || null;
    } catch {
      return null;
    }
  }

  // Try the full query first
  const result = await tryQuery(query, page);
  if (result) return result;

  // Fallback: simplify query by taking first 2-3 words (drop overly specific terms)
  const words = query.split(/\s+/);
  if (words.length > 2) {
    const simplified = words.slice(0, 2).join(" ");
    const fallback = await tryQuery(simplified, page);
    if (fallback) return fallback;
  }

  // Last resort: just use the first word (the role/profession)
  if (words.length > 1) {
    return tryQuery(words[0], page);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, model } = body as { description: string; model?: string };

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty description" },
        { status: 400 }
      );
    }

    if (description.length > 5000) {
      return NextResponse.json(
        { error: "Description too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    const openai = new OpenAI();

    const completion = await openai.chat.completions.parse({
      model: model || process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Create a recruitment poster from this job description:\n${description}`,
        },
      ],
      response_format: zodResponseFormat(AIOutputSchema, "poster_data"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to generate structured poster data from AI" },
        { status: 500 }
      );
    }

    // Start Unsplash search immediately (runs while we process the rest)
    const imageUrlPromise = searchUnsplash(parsed.imageQuery);

    // Sanitize detail values — fix truncated Hebrew (e.g. בע"פ → בע when " breaks JSON)
    // and remove garbage/placeholder values
    parsed.details = parsed.details.filter((d) => {
      const v = d.value.trim();
      // Drop if value is too short (truncated by quote issue), a placeholder, or gibberish
      if (v.length < 3) return false;
      if (/^\[.*\]$/.test(v) || /^(TBD|N\/A|asdasd)/i.test(v)) return false;
      return true;
    });

    // Build company object based on AI detection
    const isConfidential = !parsed.companyName;
    const company = isConfidential
      ? { name: "", nameEn: "", isConfidential: true }
      : { name: parsed.companyName!, isConfidential: false };

    // Build ordered category list: AI-picked first, then adjacency order
    const pickedCategory: TemplateCategory = parsed.category;
    const categoryOrder: TemplateCategory[] = [
      pickedCategory,
      ...CATEGORY_ADJACENCY[pickedCategory],
    ];

    const imageUrl = await imageUrlPromise;

    // Build shared text content (same across all variants)
    const sharedContent = {
      company,
      title: {
        he: parsed.title.he,
        en: parsed.title.en || undefined,
      },
      subtitle: parsed.subtitle || undefined,
      details: parsed.details,
      benefits: parsed.benefits || undefined,
      salary: parsed.salaryDisplay ? { display: parsed.salaryDisplay } : undefined,
      contact: {
        method: "phone" as const,
        value: "",
      },
      cta: {
        text: "לחצו על הלינק למידע נוסף",
        urgent: parsed.badge?.style === "urgent",
      },
      badge: parsed.badge || undefined,
      imageUrl: imageUrl || undefined,
    };

    const now = Date.now();

    // Create variants — one per category with different themes
    const variants: PosterVariant[] = categoryOrder.map((category) => {
      const theme = CATEGORY_THEMES[category];
      const meta = CATEGORY_META[category];

      const posterData: PosterData = {
        ...sharedContent,
        template: category,
        theme: { ...theme },
      };

      return {
        id: `${category}-${now}`,
        templateId: category,
        categoryLabel: meta.labelHe,
        posterData,
        thumbnail: "",
      };
    });

    // Render thumbnails in parallel at story dimensions (1080x1920)
    const thumbnailInputs = variants.map((v) => ({
      data: v.posterData,
      width: 1080,
      height: 1920,
    }));

    const thumbnails = await renderThumbnails(thumbnailInputs);

    // Attach thumbnails to variants
    for (let i = 0; i < variants.length; i++) {
      variants[i].thumbnail = thumbnails[i];
    }

    return NextResponse.json({ variants, imageQuery: parsed.imageQuery });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
