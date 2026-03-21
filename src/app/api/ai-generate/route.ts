import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod/v4";
import { zodResponseFormat } from "openai/helpers/zod";

const PosterDetailSchema = z.object({
  icon: z.string().describe("Font Awesome 6 solid class, e.g. 'fa-solid fa-briefcase'"),
  label: z.string().describe("Short Hebrew label"),
  value: z.string().describe("Hebrew value text"),
  highlight: z.string().nullable().describe("Part of value to highlight in accent color, or null if none"),
});

const PosterDataSchema = z.object({
  format: z.enum(["story", "post", "a4"]),
  template: z.enum(["dark-cards", "bold-photo", "split-color", "geometric", "gradient-wave", "clean-corporate", "vibrant-pop", "minimal-elegant"]),
  badge: z.object({
    icon: z.string().describe("Font Awesome 6 solid class"),
    text: z.string().describe("Short Hebrew badge text"),
  }),
  subtitle: z.string().describe("Hebrew subtitle above the title"),
  titleHe: z.string().describe("Main Hebrew title - the job/position name"),
  titleEn: z.string().describe("English translation of the title"),
  details: z.array(PosterDetailSchema).describe("3-6 detail cards with job info"),
  cta: z.object({
    text: z.string().describe("Hebrew call-to-action text"),
    subtext: z.string().describe("Hebrew secondary CTA text"),
    icon: z.string().describe("Font Awesome 6 solid class"),
  }),
  theme: z.object({
    primary: z.string().describe("Primary hex color for the poster"),
    accent: z.string().describe("Accent hex color for highlights"),
    bgColor: z.string().describe("Background hex color, should be dark"),
  }),
  backgroundQuery: z.string().nullable().describe("English search query for Unsplash background image, or null if not needed"),
});

const SYSTEM_PROMPT = `You are a Hebrew-speaking graphic designer specializing in recruitment posters for Israeli companies.

Your job is to generate structured JSON for a recruitment poster based on the user's description.

Guidelines:
- All text content must be in Hebrew (except titleEn which is English)
- Pick visually appealing, professional color schemes. Primary and accent should contrast well against a dark background.
- Use Font Awesome 6 Solid icons (fa-solid fa-*). Pick icons that are relevant to each detail.
- Generate 3-6 detail cards covering: location, experience, job type, salary (if mentioned), key requirements, benefits, etc.
- The badge should be attention-grabbing (e.g. "מגייסים!", "דרוש/ה!", "הצטרפו אלינו!")
- The CTA should encourage applying
- If the description mentions a specific field/industry, reflect that in icon and color choices
- For backgroundQuery, provide a short English query that would find a relevant, professional background image on Unsplash (e.g. "modern office workspace", "tech startup", "medical team")
- Choose the template based on context:
  * "dark-cards" - tech roles, developers, engineers (dark, modern)
  * "bold-photo" - visual/creative roles where imagery matters
  * "split-color" - general roles, public sector, services (classic Israeli style)
  * "geometric" - startups, modern tech companies (edgy, bold)
  * "gradient-wave" - marketing, creative, social media roles (flowing, modern)
  * "clean-corporate" - corporate, finance, legal, HR (light bg, professional)
  * "vibrant-pop" - retail, restaurants, delivery, blue-collar (loud, bright colors)
  * "minimal-elegant" - executive, luxury, consulting (understated, premium)`;

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
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular as string;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, format, template, model } = body as {
      description: string;
      format: "story" | "post" | "a4";
      template: string;
      model?: string;
    };

    if (!description || !format || !template) {
      return NextResponse.json(
        { error: "Missing required fields: description, format, template" },
        { status: 400 }
      );
    }

    const openai = new OpenAI();

    const completion = await openai.chat.completions.parse({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Create a recruitment poster with the following details:\nFormat: ${format}\nTemplate: ${template}\nDescription: ${description}`,
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

    // Override format and template with the user's explicit choices
    const posterData = {
      ...parsed,
      format,
      template,
    };

    // Search Unsplash for background image if a query was generated
    if (posterData.backgroundQuery) {
      const backgroundUrl = await searchUnsplash(posterData.backgroundQuery);
      if (backgroundUrl) {
        (posterData as Record<string, unknown>).backgroundUrl = backgroundUrl;
      }
    }

    return NextResponse.json(posterData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
