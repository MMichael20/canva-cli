"use client";
import type { PosterVariant } from "@/lib/types";
import PosterCard from "./PosterCard";

interface PosterGridProps {
  variants: PosterVariant[];
  onSelect: (variant: PosterVariant) => void;
  onReset: () => void;
  onSwapImage?: () => void;
  swapping?: boolean;
}

export default function PosterGrid({ variants, onSelect, onReset, onSwapImage, swapping }: PosterGridProps) {
  return (
    <div className="poster-grid-container">
      <h2 className="poster-grid-title">
        הנה הפוסטרים שלכם — בחרו את המועדף
      </h2>
      <div className="poster-grid">
        {variants.map((variant, i) => (
          <PosterCard
            key={variant.id}
            variant={variant}
            onClick={() => onSelect(variant)}
            index={i}
          />
        ))}
      </div>
      <div className="poster-grid-actions">
        {onSwapImage && (
          <button
            onClick={onSwapImage}
            disabled={swapping}
            className="swap-image-btn"
          >
            {swapping ? (
              <div className="loading-spinner" />
            ) : (
              <i className="fa-solid fa-image" style={{ marginLeft: "8px" }} />
            )}
            {swapping ? "מחליף תמונה..." : "תמונה אחרת"}
          </button>
        )}
        <button onClick={onReset} className="try-again-btn">
          <i className="fa-solid fa-arrows-rotate" style={{ marginLeft: "8px" }} />
          נסו שוב עם תיאור אחר
        </button>
      </div>
    </div>
  );
}
