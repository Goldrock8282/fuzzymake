"use client";

import { GeneratePanel } from "@/components/fuzzymake/generate-panel";
import { ResultsGrid } from "@/components/fuzzymake/results-grid";
import { useImageGeneration } from "@/hooks/use-image-generation";

export default function Home() {
  const { previewUrl, status, results, error, selectFile, reset, generate } = useImageGeneration();

  return (
    <main className="container py-12">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          FuzzyMake Style v1
        </p>
        <h1 className="text-4xl font-bold tracking-tight">FuzzyMake Thumbnail Generator</h1>
        <p className="text-muted-foreground">
          Upload one product photo and get a pastel, Pinterest-quality Instagram Story, YouTube
          Shorts cover, and YouTube Thumbnail - generated with Gemini 2.5 Flash Image.
        </p>
      </header>

      <section className="mx-auto mt-10 max-w-md">
        <GeneratePanel
          previewUrl={previewUrl}
          status={status}
          error={error}
          onFileSelected={selectFile}
          onClear={reset}
          onGenerate={generate}
        />
      </section>

      <section className="mx-auto mt-12 max-w-6xl">
        <ResultsGrid results={results} />
      </section>
    </main>
  );
}
