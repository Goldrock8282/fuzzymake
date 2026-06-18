export type FormatKey = "story" | "shorts" | "thumbnail";

export type Orientation = "vertical" | "horizontal";

export interface FormatDefinition {
  key: FormatKey;
  label: string;
  description: string;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: Orientation;
}

export interface GeneratedAsset {
  key: FormatKey;
  label: string;
  width: number;
  height: number;
  hook: string;
  image: string; // data URL
}

export interface GenerateResponse {
  results: GeneratedAsset[];
}

export interface GenerateErrorResponse {
  error: string;
}
