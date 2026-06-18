import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuzzyMake Thumbnail Generator",
  description:
    "Turn a product photo into an Instagram Story, YouTube Shorts cover, and YouTube Thumbnail with Gemini 2.5 Flash Image.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
