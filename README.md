# FuzzyMake Thumbnail Generator

Upload one product photo and generate three on-brand marketing assets with **Gemini 2.5 Flash Image**:

| Format | Size | Aspect Ratio |
| --- | --- | --- |
| Instagram Story | 1080 x 1920 | 9:16 |
| YouTube Shorts Cover | 1080 x 1920 | 9:16 |
| YouTube Thumbnail | 1280 x 720 | 16:9 |

All outputs follow **FuzzyMake Style v1**: pastel DIY aesthetic, soft studio lighting,
Pinterest-quality composition, high-CTR thumbnail style, centered product, large bold
typography, clean background, shallow depth of field, vibrant but soft colors. A hook line
(e.g. `SO EASY!`, `DIY IN 1 MIN!`, `DIY IN FEW MIN`) is generated automatically and rendered
into each image.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui-style components
- Gemini API (`gemini-2.5-flash-image`) via `@google/genai`

## Getting started

```bash
npm install
cp .env.example .env
# add your key to .env
npm run dev
```

Get a Gemini API key at https://aistudio.google.com/apikey and set it in `.env`:

```
GEMINI_API_KEY=your-key-here
```

Open http://localhost:3000, drag and drop a product photo, click **Generate**, then download
each generated asset.

## How it works

1. The browser uploads the image as `multipart/form-data` to `POST /api/generate`.
2. The API route (`src/app/api/generate/route.ts`) validates the file, then for each of the
   three formats: picks a hook line (`src/lib/hook-text.ts`), builds a styled prompt
   (`src/lib/prompts.ts`), and calls Gemini 2.5 Flash Image (`src/lib/gemini.ts`) with the
   source image plus the prompt and the target aspect ratio.
3. Generated images come back as base64 and are returned as data URLs, which the UI renders
   and offers as downloads.

## Project structure

```
src/
  app/
    api/generate/route.ts   # Gemini API route
    page.tsx                # main UI
    layout.tsx, globals.css
  components/
    ui/                      # shadcn-style primitives (button, card, progress)
    fuzzymake/               # feature components (uploader, panel, results)
  hooks/use-image-generation.ts
  lib/
    formats.ts               # output format definitions
    hook-text.ts             # automatic hook generation
    prompts.ts                # FuzzyMake Style v1 prompt builder
    gemini.ts                 # Gemini API client
    types.ts, utils.ts
```
