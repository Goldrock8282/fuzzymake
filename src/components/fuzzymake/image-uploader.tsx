"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function ImageUploader({ previewUrl, onFileSelected, onClear, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file || !ACCEPTED_TYPES.includes(file.type)) return;
      onFileSelected(file);
    },
    [onFileSelected]
  );

  if (previewUrl) {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Uploaded product preview"
          className="h-72 w-full object-contain bg-white"
        />
        {!disabled && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-3 top-3 rounded-full"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex h-72 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-center transition-colors",
        isDragging ? "border-primary bg-accent" : "border-border bg-muted/40 hover:bg-muted/70"
      )}
    >
      <ImagePlus className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="font-medium">Drag &amp; drop your product photo</p>
        <p className="text-sm text-muted-foreground">or click to browse - PNG, JPEG, or WEBP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}
