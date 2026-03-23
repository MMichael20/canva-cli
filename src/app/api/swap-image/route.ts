import { NextRequest, NextResponse } from "next/server";
import { PosterData } from "@/lib/types";
import { renderThumbnails } from "@/lib/renderer";

async function searchUnsplash(query: string, page: number): Promise<string | null> {
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

  const result = await tryQuery(query, page);
  if (result) return result;

  // Fallback: simplify query
  const words = query.split(/\s+/);
  if (words.length > 2) {
    const simplified = words.slice(0, 2).join(" ");
    const fallback = await tryQuery(simplified, page);
    if (fallback) return fallback;
  }

  if (words.length > 1) {
    return tryQuery(words[0], page);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { imageQuery, page, posterData } = (await request.json()) as {
      imageQuery: string;
      page: number;
      posterData: PosterData;
    };

    if (!imageQuery || !posterData) {
      return NextResponse.json({ error: "Missing imageQuery or posterData" }, { status: 400 });
    }

    const imageUrl = await searchUnsplash(imageQuery, page);

    if (!imageUrl) {
      return NextResponse.json({ error: "לא נמצאה תמונה נוספת" }, { status: 404 });
    }

    // Update posterData with new image and render a single thumbnail
    const updatedPosterData = { ...posterData, imageUrl };
    const thumbnails = await renderThumbnails([{
      data: updatedPosterData,
      width: 1080,
      height: 1920,
    }]);

    return NextResponse.json({
      imageUrl,
      thumbnail: thumbnails[0],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
