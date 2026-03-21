import { NextRequest, NextResponse } from "next/server";
import { renderPoster } from "@/lib/renderer";
import { PosterData } from "@/lib/types";
import { isOldFormat, migrateOldPosterData } from "@/lib/migration";

export async function POST(request: NextRequest) {
  try {
    let data: PosterData = await request.json();

    // Support old format via migration
    if (isOldFormat(data)) {
      data = migrateOldPosterData(data as unknown as Parameters<typeof migrateOldPosterData>[0]);
    }

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
