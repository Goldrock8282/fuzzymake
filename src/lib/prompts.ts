import { FormatDefinition } from "./types";

export const STYLE_NAME = "FuzzyMake Style v1";

const STYLE_REQUIREMENTS = [
  "pastel DIY aesthetic",
  "soft studio lighting",
  "Pinterest-quality composition",
  "high CTR thumbnail style",
  "product centered",
  "large bold typography",
  "clean background",
  "shallow depth of field",
  "vibrant but soft colors",
].join(", ");

/**
 * Builds the Gemini 2.5 Flash Image prompt for one output format.
 * The hook text is generated server-side and baked into the prompt so the
 * model renders it as the large bold typography overlay.
 */
export function buildImagePrompt(format: FormatDefinition, hook: string): string {
  return `You are generating marketing artwork in "${STYLE_NAME}".

Use the attached product photo as the hero subject. Re-light and re-compose it into a brand-new ${format.label} image (${format.width}x${format.height}px, ${format.aspectRatio} aspect ratio).

Style requirements: ${STYLE_REQUIREMENTS}.

Typography: render the exact text "${hook}" as large, bold, high-contrast typography placed where it does not cover the product. Use a clean sans-serif display font.

Composition rules:
- The product from the source photo must remain clearly recognizable and be the visual focus, centered in frame.
- Background must be simple, soft, and uncluttered so the product and text pop.
- Lighting must look like a soft studio setup, not harsh flash.
- Depth of field should be shallow, gently blurring anything behind the product.
- Colors should feel vibrant yet soft and pastel, never neon or harsh.
- Compose for a ${format.orientation} ${format.aspectRatio} frame with strong visual hierarchy and high click-through appeal.

Output only the final image.`;
}
