import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod/v4";
import { zodResponseFormat } from "openai/helpers/zod";

const SuggestionSchema = z.object({
  suggestions: z.array(z.object({
    field: z.string().describe("Dot-path to the field, e.g. 'title.he', 'details[2].value', 'benefits'"),
    current: z.string().describe("Current value"),
    suggested: z.string().describe("Improved value"),
    reason: z.string().describe("Brief reason for the change in Hebrew"),
  })),
});

const SYSTEM_PROMPT = `You are a recruitment poster content optimizer for the Israeli job market.

You receive a poster's current data and suggest improvements. Your suggestions should:
- Shorten text that's too long for a poster (max 5 words per detail value, 4 words for headlines)
- Fix Hebrew grammar or make text more natural
- Improve benefit tags to be more specific and compelling
- Suggest better detail ordering (most important first)
- Flag missing critical information (location, contact method)

Return 1-5 specific, actionable suggestions. Each suggestion must have the exact current value and a concrete replacement.
Do NOT suggest changes that are purely stylistic preferences. Only suggest changes that improve clarity, readability, or effectiveness.`;

export async function POST(request: NextRequest) {
  try {
    const { posterData, model } = await request.json();

    const openai = new OpenAI();

    const completion = await openai.chat.completions.parse({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Improve this recruitment poster:\n${JSON.stringify(posterData, null, 2)}`,
        },
      ],
      response_format: zodResponseFormat(SuggestionSchema, "suggestions"),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
