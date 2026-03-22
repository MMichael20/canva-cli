import { NextRequest, NextResponse } from "next/server";
import { renderPoster } from "@/lib/renderer";
import { PosterData, FormatId, FORMAT_DIMENSIONS } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { posterData, formatId } = (await request.json()) as {
      posterData: PosterData;
      formatId: FormatId;
    };

    const dimensions = FORMAT_DIMENSIONS[formatId];
    if (!dimensions) {
      return NextResponse.json(
        { error: `Unknown format: ${formatId}` },
        { status: 400 }
      );
    }

    const imageBuffer = await renderPoster(posterData, dimensions.width, dimensions.height);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="poster-${formatId}-${Date.now()}.jpg"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
