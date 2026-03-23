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
  category: z.enum(["standard", "overlay", "split", "neon-dark", "spotlight"])
    .describe("Best-fit template category for this role"),
  companyName: z.string().nullable()
    .describe("Company name from the job description, or null if not mentioned / confidential"),
  title: z.object({
    he: z.string().describe("Emotional Hebrew hook headline — an ad-style call-to-action or compelling statement, NOT a dry job title"),
    en: z.string().nullable().describe("English job title for tech roles (e.g. 'QA Engineer'), null for non-tech"),
  }),
  jobTitle: z.string()
    .describe("The actual job role name in Hebrew, e.g. 'בודק/ת תוכנה בכיר/ה' — shown as secondary text below the hook"),
  spotlight: z.object({
    text: z.string().describe("The single most compelling hook for this job — salary if impressive, otherwise a punchy Hebrew tagline or standout benefit"),
    type: z.enum(["salary", "tagline", "benefit"]).describe("What kind of hook this is, so templates can style it appropriately"),
  }),
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

const SYSTEM_PROMPT = `You are a Hebrew advertising copywriter specializing in recruitment ads for social media. You write PROMOTIONAL content — not job listings. Think Instagram sponsored posts, Facebook ads, WhatsApp story promotions. Every line should make someone stop scrolling.

Before generating anything, read the full description and identify: What makes THIS role uniquely attractive? The tech stack? Team culture? Career growth? A specific perk? This hook drives your headline, spotlight, and detail ordering.

Your output is for PAID SOCIAL MEDIA ADS — write like a marketer, not an HR manager.

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
The poster's BIG HEADLINE — an emotional, ad-style hook. NOT a job title. This is the text that makes someone stop scrolling. Max 8 Hebrew words.

You decide the style based on what works best for the specific role:

Style 1 — Direct call-to-action:
  GOOD: "אנחנו מחפשים אותך!"
  GOOD: "מוכנים לצעד הבא בקריירה?"
  GOOD: "הצטרפו למהפכה שלנו!"

Style 2 — Role-specific hook:
  GOOD: "מי יוביל את הצוות הטכנולוגי שלנו?"
  GOOD: "את/ה הבודק/ת שהמוצר שלנו צריך"
  GOOD: "מחפשים ארכיטקט/ית ענן שישנה את הכל"

Style 3 — Value proposition:
  GOOD: "הקריירה שתמיד חלמת עליה"
  GOOD: "הזדמנות שלא חוזרת פעמיים"
  GOOD: "כאן עושים את העתיד"

BAD (too dry, sounds like a job listing):
  "בודק/ת תוכנה בכיר/ה" — this is the job title, not a hook
  "דרוש/ה מנהל/ת פרויקטים" — boring, no emotion
  "משרה מלאה באזור המרכז" — logistic detail

Pick the style that fits the description best. If the company is well-known, you can reference it: "הצטרפו לגוגל!" If the role is unique, highlight it. If the benefits are amazing, tease them. Use your judgment.

── title.en (string | null) ──
Set to null. We no longer display English titles.

── jobTitle (string) ──
The actual job role name in Hebrew. This is displayed as SECONDARY text below the hook headline. Keep it clean and factual — 2-4 words.
GOOD: "בודק/ת תוכנה בכיר/ה"
GOOD: "מנהל/ת פרויקטים"
GOOD: "מפתח/ת Full Stack"
Always use gender-inclusive forms: מפתח/ת, מהנדס/ת, בודק/ת.

── spotlight (object) ──
The single biggest visual element on the poster — the hook that makes someone stop scrolling. Contains:
  • text (string): The display text. Max 30 Hebrew characters including spaces.
  • type ("salary" | "tagline" | "benefit"): What kind of hook this is.

DECISION LOGIC — pick the strongest hook:
1. If salary is a specific impressive range (e.g. "₪18,000-25,000 לחודש") → use it as text, type: "salary"
2. If salary is vague ("לפי ניסיון", "תחרותי", "שכר גבוה") or missing → write a punchy Hebrew tagline, type: "tagline"
3. If a single benefit is more compelling than the salary (e.g. "עבודה מהבית 5 ימים") → use it, type: "benefit"

GOOD spotlight examples:
  type "salary": text "₪18,000-25,000 לחודש"
  type "tagline": text "בואו לעצב את העתיד"
  type "tagline": text "הובילו את המוצר הבא"
  type "benefit": text "עבודה מהבית מלאה"
BAD:
  "הצטרפו אלינו" — generic filler
  "משרה מלאה באזור המרכז" — logistic detail, not a hook
  "לפי ניסיון" — not compelling, write a tagline instead

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

async function searchUnsplashMultiple(query: string, count = 10): Promise<string[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];

  async function tryQuery(q: string): Promise<string[]> {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=${count}&orientation=portrait`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || [])
        .map((r: { urls?: { regular?: string } }) => r.urls?.regular)
        .filter(Boolean) as string[];
    } catch {
      return [];
    }
  }

  // Try the full query first
  let results = await tryQuery(query);
  if (results.length > 0) return shuffle(results);

  // Fallback: simplify query
  const words = query.split(/\s+/);
  if (words.length > 2) {
    results = await tryQuery(words.slice(0, 2).join(" "));
    if (results.length > 0) return shuffle(results);
  }

  // Last resort: first word only
  if (words.length > 1) {
    results = await tryQuery(words[0]);
    if (results.length > 0) return shuffle(results);
  }

  return [];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
    const imageUrlsPromise = searchUnsplashMultiple(parsed.imageQuery, 10);

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

    // Build ordered category list: AI-picked first, adjacents next, then remaining
    const pickedCategory: TemplateCategory = parsed.category;
    const adjacents = CATEGORY_ADJACENCY[pickedCategory];
    const allCategories: TemplateCategory[] = ["standard", "overlay", "split", "neon-dark", "spotlight"];
    const remaining = allCategories.filter(
      (c) => c !== pickedCategory && !adjacents.includes(c)
    );
    const categoryOrder: TemplateCategory[] = [
      pickedCategory,
      ...adjacents,
      ...remaining,
    ];

    const imageUrls = await imageUrlsPromise;

    // Build shared text content (same across all variants, except image)
    const sharedContent = {
      company,
      title: {
        he: parsed.title.he,
        en: parsed.title.en || undefined,
      },
      jobTitle: parsed.jobTitle,
      spotlight: parsed.spotlight,
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
    };

    const now = Date.now();

    // Create variants — each gets a different random image
    const variants: PosterVariant[] = categoryOrder.map((category, i) => {
      const theme = CATEGORY_THEMES[category];
      const meta = CATEGORY_META[category];

      const posterData: PosterData = {
        ...sharedContent,
        template: category,
        theme: { ...theme },
        imageUrl: imageUrls[i % imageUrls.length] || undefined,
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
