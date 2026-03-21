"use client";

import { PosterDetail } from "@/lib/types";

const ICON_OPTIONS = [
  "briefcase",
  "code",
  "terminal",
  "location-dot",
  "clock",
  "shekel-sign",
  "graduation-cap",
  "id-card",
  "truck-fast",
  "route",
  "arrows-spin",
  "users",
  "star",
  "heart",
  "bolt",
  "phone",
  "envelope",
  "globe",
  "building",
  "car",
  "wrench",
  "hammer",
  "shield-halved",
  "chart-line",
];

interface DetailsEditorProps {
  details: PosterDetail[];
  onChange: (details: PosterDetail[]) => void;
}

export default function DetailsEditor({ details, onChange }: DetailsEditorProps) {
  const maxDetails = 5;
  const isAtMax = details.length >= maxDetails;

  function addRow() {
    if (isAtMax) return;
    onChange([...details, { icon: "briefcase", label: "", value: "" }]);
  }

  function deleteRow(index: number) {
    onChange(details.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof PosterDetail, val: string) {
    const updated = details.map((row, i) =>
      i === index ? { ...row, [field]: val } : row
    );
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {details.map((row, index) => (
        <div key={index} className="glass-card p-3 flex flex-col gap-2 relative">
          <button
            type="button"
            onClick={() => deleteRow(index)}
            className="absolute top-2 left-2 text-gray-400 hover:text-red-400 transition-colors text-xs w-5 h-5 flex items-center justify-center"
            aria-label="מחק שורה"
          >
            ✕
          </button>

          <select
            className="input-field text-sm"
            value={row.icon}
            onChange={(e) => updateRow(index, "icon", e.target.value)}
          >
            {ICON_OPTIONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>

          <input
            className="input-field text-sm"
            type="text"
            dir="rtl"
            placeholder="לדוגמה: ניסיון נדרש"
            value={row.label}
            onChange={(e) => updateRow(index, "label", e.target.value)}
          />

          <input
            className="input-field text-sm"
            type="text"
            dir="rtl"
            placeholder="לדוגמה: 5+ שנים"
            value={row.value}
            onChange={(e) => updateRow(index, "value", e.target.value)}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        disabled={isAtMax}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors border border-dashed ${
          isAtMax
            ? "border-gray-600 text-gray-500 cursor-not-allowed"
            : "border-purple-500 text-purple-400 hover:bg-purple-500/10"
        }`}
      >
        {isAtMax ? "מקסימום 5 פרטים" : "+ הוסף שורה"}
      </button>
    </div>
  );
}
