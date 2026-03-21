import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod/v4";
import { zodResponseFormat } from "openai/helpers/zod";
import { INDUSTRY_PRESETS, IndustryPreset, FontStackId, PosterBackground } from "@/lib/types";

const PosterDataSchema = z.object({
  template: z.enum(["photo-banner", "classic-split", "corporate", "bold-urgent", "logo-centered", "text-stack"]),
  company: z.object({
    name: z.string().describe("Company name in Hebrew"),
    nameEn: z.string().nullable().describe("Company name in English, or null"),
  }),
  title: z.object({
    he: z.string().describe("Job title in Hebrew — max 4 words"),
    en: z.string().nullable().describe("Job title in English (for tech roles), or null"),
  }),
  subtitle: z.string().nullable().describe("Department or tagline, or null"),
  details: z.array(z.object({
    icon: z.string().describe("Font Awesome 6 solid class, e.g. 'fa-solid fa-briefcase'"),
    label: z.string().describe("Short Hebrew label — max 3 words"),
    value: z.string().describe("Hebrew value — max 5 words"),
  })).describe("3-5 key job details"),
  benefits: z.array(z.string()).nullable().describe("1-3 short benefit tags (max 20 chars each), or null"),
  salary: z.object({
    display: z.string().nullable().describe("Salary display text like 'לפי ניסיון' or '₪15,000-20,000/חודש', or null"),
  }).nullable(),
  contact: z.object({
    method: z.enum(["whatsapp", "email", "phone", "link"]),
    value: z.string().describe("Contact value — phone number, email, or URL"),
    displayText: z.string().nullable().describe("Override display text, or null"),
  }),
  cta: z.object({
    text: z.string().describe("Call-to-action text in Hebrew"),
    urgent: z.boolean().describe("Whether to show urgent styling"),
  }),
  theme: z.object({
    primary: z.string().describe("Primary hex color"),
    secondary: z.string().describe("Secondary/accent hex color"),
    bgColor: z.string().describe("Background hex color"),
  }),
  badge: z.object({
    text: z.string().describe("Badge text like 'משרה חדשה', 'דרוש/ה!', 'דחוף'"),
    style: z.enum(["default", "urgent", "new"]),
  }).nullable(),
  backgroundQuery: z.string().nullable().describe("English Unsplash query for background, or null. Must be abstract/environmental — never search for people."),
});

const SYSTEM_PROMPT = `You are a recruitment content specialist for the Israeli job market.

Your job is to generate structured JSON for a recruitment poster.

RULES:
- Job titles: Use the standard Israeli market term. Tech roles keep English titles (e.g., "Full Stack Developer") but everything else is Hebrew.
- Tone: Direct and informative. Israeli recruitment posts are NOT flowery. No "exciting opportunity" or "dynamic team" — state what the job IS.
- Benefits: Only mention benefits that are DIFFERENTIATING. "Pension" alone is not a benefit (it's legally required). "Keren Hishtalmut from day 1" or "Hybrid 3 days" IS a benefit. Max 3 benefits, max 20 chars each.
- Location: Always include city. Add landmark context for commute (e.g., "תל אביב — ליד תחנת השלום").
- Contact: Israeli candidates expect a direct WhatsApp number. Prefer whatsapp method.
- Length: Poster text must be ultra-concise. Max 5 words per detail value. Headlines max 4 words Hebrew.
- Details: Pick the 3-5 most relevant from: location, scope (full/part-time), experience, key tech/skill requirement, start date. Do NOT include generic details like "great atmosphere".
- Template selection:
  * "corporate" - general professional roles, finance, legal, HR (light bg, clean)
  * "photo-banner" - roles where workplace imagery matters (with background image)
  * "classic-split" - general roles, classic Israeli recruitment style
  * "bold-urgent" - retail, delivery, blue-collar, urgent hires (bold colors, no image)
  * "logo-centered" - established companies with strong brand
  * "text-stack" - maximum readability, WhatsApp-optimized
- Color schemes: Choose colors that reflect the industry. Tech = blues/purples. Urgent = reds/oranges. Healthcare = teals/greens. Corporate = navy/gray.
- Background queries: Only abstract/environmental queries (modern office, tel aviv skyline, warehouse interior). NEVER search for people.`;

async function searchUnsplash(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, format, template, model, industry } = body as {
      description: string;
      format: string;
      template?: string;
      model?: string;
      industry?: IndustryPreset;
    };

    if (!description || !format) {
      return NextResponse.json(
        { error: "Missing required fields: description, format" },
        { status: 400 }
      );
    }

    const industryContext = industry && INDUSTRY_PRESETS[industry]
      ? `\nIndustry context: ${INDUSTRY_PRESETS[industry].aiContext}`
      : "";

    const openai = new OpenAI();

    const completion = await openai.chat.completions.parse({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Create a recruitment poster.\nFormat: ${format}${template ? `\nPreferred template: ${template}` : ""}${industryContext}\nDescription: ${description}`,
        },
      ],
      response_format: zodResponseFormat(PosterDataSchema, "poster_data"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to generate structured poster data from AI" },
        { status: 500 }
      );
    }

    // Build full PosterData from AI output
    const fontStack: FontStackId = (industry === "blue-collar" || industry === "retail") ? "bold" : "modern";
    const posterData: {
      format: string;
      template: string;
      company: { name: string; nameEn?: string; logoBackground: "auto" };
      title: { he: string; en?: string };
      subtitle?: string;
      details: { icon: string; label: string; value: string }[];
      benefits?: string[];
      salary?: { display: string; currency: "ILS"; period: "month" };
      contact: { method: "whatsapp" | "email" | "phone" | "link"; value: string; displayText?: string };
      cta: { text: string; urgent: boolean };
      theme: { primary: string; secondary: string; textColor: string; bgColor: string; fontStack: FontStackId };
      background: PosterBackground;
      badge?: { text: string; style: "default" | "urgent" | "new" };
    } = {
      format,
      template: template || parsed.template,
      company: {
        name: parsed.company.name,
        nameEn: parsed.company.nameEn || undefined,
        logoBackground: "auto" as const,
      },
      title: {
        he: parsed.title.he,
        en: parsed.title.en || undefined,
      },
      subtitle: parsed.subtitle || undefined,
      details: parsed.details,
      benefits: parsed.benefits || undefined,
      salary: parsed.salary?.display ? { display: parsed.salary.display, currency: "ILS" as const, period: "month" as const } : undefined,
      contact: {
        method: parsed.contact.method,
        value: parsed.contact.value,
        displayText: parsed.contact.displayText || undefined,
      },
      cta: parsed.cta,
      theme: {
        primary: parsed.theme.primary,
        secondary: parsed.theme.secondary,
        textColor: "#F0F0F5",
        bgColor: parsed.theme.bgColor,
        fontStack,
      },
      background: {
        type: "solid",
      },
      badge: parsed.badge || undefined,
    };

    // Search Unsplash if query provided
    if (parsed.backgroundQuery) {
      const imageUrl = await searchUnsplash(parsed.backgroundQuery);
      if (imageUrl) {
        posterData.background = { type: "image" as const, imageUrl, overlay: 0.6 };
      }
    }

    return NextResponse.json(posterData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
