import { NextRequest, NextResponse } from "next/server";
import { renderPoster } from "@/lib/renderer";
import { PosterData } from "@/lib/templates";

export async function POST(request: NextRequest) {
  try {
    const data: PosterData = await request.json();
    const imageBuffer = await renderPoster(data);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="poster-${data.format}-${Date.now()}.jpg"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
