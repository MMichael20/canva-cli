"use client";
import type { PosterVariant } from "@/lib/types";

interface PosterCardProps {
  variant: PosterVariant;
  onClick: () => void;
  index: number;
}

export default function PosterCard({ variant, onClick, index }: PosterCardProps) {
  return (
    <button
      className="poster-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <img
        src={variant.thumbnail}
        alt={variant.posterData.title.he}
        className="poster-card-img"
      />
      <div className="poster-card-label">
        {variant.categoryLabel}
      </div>
    </button>
  );
}
