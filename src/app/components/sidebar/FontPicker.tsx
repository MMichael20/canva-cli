"use client";

import { FontStackId } from "@/lib/types";

interface FontPickerProps {
  fontStack: FontStackId;
  onChange: (fontStack: FontStackId) => void;
}

const FONT_OPTIONS: { value: FontStackId; label: string; weight: number }[] = [
  { value: "modern", label: "מודרני", weight: 700 },
  { value: "bold", label: "בולט", weight: 900 },
];

export default function FontPicker({ fontStack, onChange }: FontPickerProps) {
  return (
    <div className="flex gap-3">
      {FONT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
            fontStack === opt.value
              ? "border-[#6366f1] bg-[rgba(99,102,241,0.12)] text-[#a5b4fc]"
              : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 text-white/60"
          }`}
        >
          <span
            className="text-xl leading-none"
            style={{ fontWeight: opt.weight }}
          >
            כותרת
          </span>
          <span className="text-xs">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
