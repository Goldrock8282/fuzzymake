"use client";

import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ImageUploader } from "./image-uploader";
import { GenerationStatus } from "@/hooks/use-image-generation";

interface GeneratePanelProps {
  previewUrl: string | null;
  status: GenerationStatus;
  error: string | null;
  onFileSelected: (file: File) => void;
  onClear: () => void;
  onGenerate: () => void;
}

export function GeneratePanel({
  previewUrl,
  status,
  error,
  onFileSelected,
  onClear,
  onGenerate,
}: GeneratePanelProps) {
  const isGenerating = status === "generating";

  return (
    <div className="space-y-4">
      <ImageUploader
        previewUrl={previewUrl}
        onFileSelected={onFileSelected}
        onClear={onClear}
        disabled={isGenerating}
      />

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!previewUrl || isGenerating}
        onClick={onGenerate}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating with Gemini...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate
          </>
        )}
      </Button>

      {isGenerating && <Progress value={66} className="animate-pulse" />}

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
