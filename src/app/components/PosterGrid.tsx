"use client";
import { useState } from "react";
import type { PosterVariant } from "@/lib/types";
import PosterCard from "./PosterCard";

interface PosterGridProps {
  variants: PosterVariant[];
  onSelect: (variant: PosterVariant) => void;
  onReset: () => void;
  onSwapImage?: () => void;
  swapping?: boolean;
}

const INITIAL_COUNT = 3;

export default function PosterGrid({ variants, onSelect, onReset, onSwapImage, swapping }: PosterGridProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleVariants = showAll ? variants : variants.slice(0, INITIAL_COUNT);
  const hasMore = variants.length > INITIAL_COUNT && !showAll;

  return (
    <div className="poster-grid-container">
      <h2 className="poster-grid-title">
        הנה הפוסטרים שלכם — בחרו את המועדף
      </h2>
      <div className="poster-grid">
        {visibleVariants.map((variant, i) => (
          <PosterCard
            key={variant.id}
            variant={variant}
            onClick={() => onSelect(variant)}
            index={i}
          />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="load-more-btn"
        >
          <i className="fa-solid fa-plus" style={{ marginLeft: "8px" }} />
          עוד {variants.length - INITIAL_COUNT} עיצובים
        </button>
      )}
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
