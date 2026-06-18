import { GeneratedAsset } from "@/lib/types";
import { ResultCard } from "./result-card";

interface ResultsGridProps {
  results: GeneratedAsset[];
}

export function ResultsGrid({ results }: ResultsGridProps) {
  if (results.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((asset) => (
        <ResultCard key={asset.key} asset={asset} />
      ))}
    </div>
  );
}
