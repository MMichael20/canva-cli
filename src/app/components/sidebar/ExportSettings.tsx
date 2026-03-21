"use client";

import { PosterFormat, PosterBadge, BadgeStyle, FORMAT_DIMENSIONS } from "@/lib/types";

interface ExportSettingsProps {
  format: PosterFormat;
  badge?: PosterBadge;
  onFormatChange: (format: PosterFormat) => void;
  onBadgeChange: (badge?: PosterBadge) => void;
}

const FORMAT_OPTIONS: { value: PosterFormat; label: string; sub: string }[] = [
  { value: "square", label: "ריבוע", sub: "1080×1080" },
  { value: "story", label: "סטורי", sub: "1080×1920" },
  { value: "a4", label: "A4", sub: "2480×3508" },
];

const BADGE_STYLE_OPTIONS: { value: BadgeStyle; label: string }[] = [
  { value: "default", label: "רגיל" },
  { value: "urgent", label: "דחוף" },
  { value: "new", label: "חדש" },
];

export default function ExportSettings({
  format,
  badge,
  onFormatChange,
  onBadgeChange,
}: ExportSettingsProps) {
  const dims = FORMAT_DIMENSIONS[format];

  const handleBadgeTextChange = (text: string) => {
    if (!text) {
      onBadgeChange(undefined);
    } else {
      onBadgeChange({ text, style: badge?.style ?? "default" });
    }
  };

  const handleBadgeStyleChange = (style: BadgeStyle) => {
    onBadgeChange({ text: badge?.text ?? "", style });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Format selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-white/30">פורמט ייצוא</label>
        <div className="flex gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFormatChange(opt.value)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all cursor-pointer ${
                format === opt.value
                  ? "border-[#6366f1] bg-[rgba(99,102,241,0.12)] text-[#a5b4fc]"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 text-white/60"
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-[10px] opacity-60">{opt.sub}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-white/20">
          {dims.width}×{dims.height} פיקסלים
        </p>
      </div>

      {/* Badge editor */}
      <div className="flex flex-col gap-3">
        <label className="text-xs text-white/30">תג עליון</label>
        <input
          className="input-field"
          type="text"
          dir="rtl"
          placeholder="לדוגמה: דחוף! משרה חמה"
          value={badge?.text ?? ""}
          onChange={(e) => handleBadgeTextChange(e.target.value)}
        />
        {badge?.text && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/30">סגנון תג</label>
            <select
              className="input-field"
              value={badge.style}
              onChange={(e) => handleBadgeStyleChange(e.target.value as BadgeStyle)}
            >
              {BADGE_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
