import { NextRequest, NextResponse } from "next/server";
import { FORMATS } from "@/lib/formats";
import { generateHook } from "@/lib/hook-text";
import { generateStyledImage } from "@/lib/gemini";
import { GeneratedAsset } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file was provided." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use PNG, JPEG, or WEBP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Image is too large. Max size is 10MB." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");

  try {
    const results: GeneratedAsset[] = await Promise.all(
      FORMATS.map(async (format) => {
        const hook = generateHook(format.orientation);
        const { base64Image: outputBase64, mimeType } = await generateStyledImage({
          base64Image,
          mimeType: file.type,
          format,
          hook,
        });

        return {
          key: format.key,
          label: format.label,
          width: format.width,
          height: format.height,
          hook,
          image: `data:${mimeType};base64,${outputBase64}`,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Gemini generation failed:", error);
    const message = error instanceof Error ? error.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
