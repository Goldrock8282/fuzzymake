"use client";

import { useCallback, useState } from "react";
import { GenerateErrorResponse, GenerateResponse, GeneratedAsset } from "@/lib/types";

export type GenerationStatus = "idle" | "generating" | "success" | "error";

export function useImageGeneration() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [results, setResults] = useState<GeneratedAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectFile = useCallback((nextFile: File) => {
    setFile(nextFile);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(nextFile);
    });
    setResults([]);
    setError(null);
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setResults([]);
    setError(null);
    setStatus("idle");
  }, []);

  const generate = useCallback(async () => {
    if (!file) return;

    setStatus("generating");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as GenerateResponse | GenerateErrorResponse;

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Generation failed.");
      }

      setResults(payload.results);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }, [file]);

  return {
    file,
    previewUrl,
    status,
    results,
    error,
    selectFile,
    reset,
    generate,
  };
}
