"use client";

import { PosterTheme, THEME_PRESETS, ThemePresetId } from "@/lib/types";

interface ThemePickerProps {
  theme: PosterTheme;
  onChange: (theme: PosterTheme) => void;
}

const PRESET_IDS = Object.keys(THEME_PRESETS) as ThemePresetId[];

export default function ThemePicker({ theme, onChange }: ThemePickerProps) {
  const handlePresetClick = (presetId: ThemePresetId) => {
    const preset = THEME_PRESETS[presetId];
    onChange({
      ...theme,
      preset: presetId,
      primary: preset.primary,
      secondary: preset.secondary,
      bgColor: preset.bgColor,
      textColor: preset.textColor,
    });
  };

  const handleCustomHex = (hex: string) => {
    // Allow partial input while typing
    onChange({
      ...theme,
      preset: undefined,
      primary: hex,
    });
  };

  const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex);

  return (
    <div className="flex flex-col gap-4">
      {/* Preset grid */}
      <div className="grid grid-cols-2 gap-2">
        {PRESET_IDS.map((presetId) => {
          const preset = THEME_PRESETS[presetId];
          const isSelected = theme.preset === presetId;

          return (
            <button
              key={presetId}
              type="button"
              onClick={() => handlePresetClick(presetId)}
              className={`glass-card p-3 flex items-center gap-2.5 text-right cursor-pointer transition-all ${
                isSelected
                  ? "!border-[#6366f1] !bg-[rgba(99,102,241,0.1)]"
                  : "hover:border-white/20"
              }`}
            >
              {/* Color circles */}
              <div className="flex gap-1 shrink-0">
                <span
                  className="w-4 h-4 rounded-full border border-white/10"
                  style={{ background: preset.primary }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-white/10"
                  style={{ background: preset.secondary }}
                />
              </div>

              {/* Name */}
              <span className="text-xs font-medium leading-tight flex-1 text-right">
                {preset.name}
              </span>

              {/* Selected check */}
              {isSelected && (
                <i className="fa-solid fa-check text-[#6366f1] text-xs shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom primary color */}
      <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
        <label className="section-title">צבע מותאם אישית</label>
        <div className="flex items-center gap-3">
          {/* Color swatch */}
          <div
            className="w-9 h-9 rounded-lg border border-white/15 shrink-0 cursor-pointer overflow-hidden"
            style={{ background: isValidHex(theme.primary) ? theme.primary : "#6366F1" }}
          >
            <input
              type="color"
              className="opacity-0 w-full h-full cursor-pointer"
              value={isValidHex(theme.primary) ? theme.primary : "#6366F1"}
              onChange={(e) => handleCustomHex(e.target.value)}
            />
          </div>

          {/* Hex text input */}
          <input
            className="input-field font-mono uppercase flex-1"
            type="text"
            style={{ direction: "ltr", textAlign: "left" }}
            maxLength={7}
            value={theme.primary}
            onChange={(e) => handleCustomHex(e.target.value)}
            placeholder="#6366F1"
          />
        </div>
      </div>
    </div>
  );
}
