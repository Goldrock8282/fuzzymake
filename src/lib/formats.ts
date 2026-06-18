import { FormatDefinition } from "./types";

export const FORMATS: FormatDefinition[] = [
  {
    key: "story",
    label: "Instagram Story",
    description: "1080 x 1920",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    orientation: "vertical",
  },
  {
    key: "shorts",
    label: "YouTube Shorts Cover",
    description: "1080 x 1920",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    orientation: "vertical",
  },
  {
    key: "thumbnail",
    label: "YouTube Thumbnail",
    description: "1280 x 720",
    width: 1280,
    height: 720,
    aspectRatio: "16:9",
    orientation: "horizontal",
  },
];
