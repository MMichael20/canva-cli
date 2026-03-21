"use client";

import { PosterBackground, BackgroundType, PatternId } from "@/lib/types";

interface BackgroundEditorProps {
  background: PosterBackground;
  onChange: (background: PosterBackground) => void;
}

const TYPE_OPTIONS: { value: BackgroundType; label: string }[] = [
  { value: "solid", label: "צבע אחיד" },
  { value: "image", label: "תמונה" },
  { value: "pattern", label: "דוגמה" },
];

const PATTERN_OPTIONS: { value: PatternId; label: string }[] = [
  { value: "dots", label: "נקודות" },
  { value: "grid", label: "רשת" },
  { value: "diagonal-lines", label: "קווים אלכסוניים" },
];

export default function BackgroundEditor({ background, onChange }: BackgroundEditorProps) {
  const handleTypeChange = (type: BackgroundType) => {
    onChange({ ...background, type });
  };

  const handleImageInput = (val: string) => {
    if (val.startsWith("http")) {
      onChange({
        ...background,
        type: "image",
        imageUrl: val,
        imageQuery: undefined,
      });
    } else {
      onChange({
        ...background,
        type: val ? "image" : background.type,
        imageQuery: val || undefined,
        imageUrl: undefined,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Type selector */}
      <div className="flex gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleTypeChange(opt.value)}
            className={`format-chip flex-1 text-center ${
              background.type === opt.value
                ? "!border-[#6366f1] !bg-[rgba(99,102,241,0.15)] text-[#a5b4fc]"
                : ""
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Solid mode */}
      {background.type === "solid" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/30">צבע רקע</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={background.color || "#0B0D17"}
              onChange={(e) => onChange({ ...background, color: e.target.value })}
              className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-sm text-white/50 font-mono">
              {background.color || "#0B0D17"}
            </span>
          </div>
        </div>
      )}

      {/* Image mode */}
      {background.type === "image" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/30">
              חיפוש תמונה (Unsplash) או URL
            </label>
            <input
              className="input-field"
              placeholder="לדוגמה: office, technology..."
              style={{ direction: "ltr", textAlign: "left" }}
              value={background.imageUrl || background.imageQuery || ""}
              onChange={(e) => handleImageInput(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/30">
              שקיפות שכבת כיסוי —{" "}
              <span className="text-white/50">
                {Math.round((background.overlay ?? 0.4) * 100)}%
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={background.overlay ?? 0.4}
              onChange={(e) =>
                onChange({ ...background, overlay: parseFloat(e.target.value) })
              }
              className="w-full accent-[#6366f1]"
            />
          </div>
        </div>
      )}

      {/* Pattern mode */}
      {background.type === "pattern" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/30">סוג דוגמה</label>
          <select
            className="input-field"
            value={background.pattern || "dots"}
            onChange={(e) =>
              onChange({ ...background, pattern: e.target.value as PatternId })
            }
          >
            {PATTERN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
