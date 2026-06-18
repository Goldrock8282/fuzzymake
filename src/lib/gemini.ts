import { GoogleGenAI } from "@google/genai";
import { FormatDefinition } from "./types";
import { buildImagePrompt } from "./prompts";

const MODEL = "gemini-2.5-flash-image";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export interface GenerateImageInput {
  base64Image: string;
  mimeType: string;
  format: FormatDefinition;
  hook: string;
}

export interface GenerateImageOutput {
  base64Image: string;
  mimeType: string;
}

/** Calls Gemini 2.5 Flash Image to turn the source product photo into one styled output format. */
export async function generateStyledImage({
  base64Image,
  mimeType,
  format,
  hook,
}: GenerateImageInput): Promise<GenerateImageOutput> {
  const ai = getClient();
  const prompt = buildImagePrompt(format, hook);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: format.aspectRatio,
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    throw new Error(
      `Gemini did not return an image for ${format.label}. ${
        response.candidates?.[0]?.finishReason ?? ""
      }`.trim()
    );
  }

  return {
    base64Image: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
  };
}
