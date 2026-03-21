"use client";

import { useState, useRef } from "react";
import {
  IndustryPreset,
  PosterCompany,
  INDUSTRY_PRESETS,
} from "@/lib/types";

interface QuickStartProps {
  onComplete: (data: {
    industry: IndustryPreset;
    company: PosterCompany;
    titleHe: string;
    aiMode?: { description: string; model: string };
  }) => void;
}

const AI_MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o-mini" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4.1-mini", label: "GPT-4.1-mini" },
  { id: "gpt-4.1", label: "GPT-4.1" },
];

export default function QuickStart({ onComplete }: QuickStartProps) {
  const [industry, setIndustry] = useState<IndustryPreset>("general");
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [titleHe, setTitleHe] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("הקובץ גדול מדי (מקסימום 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxW = 400;
        const maxH = 200;
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        setLogoUrl(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    onComplete({
      industry,
      company: {
        name: companyName,
        logoUrl,
        logoBackground: "auto",
      },
      titleHe,
      aiMode: aiEnabled
        ? { description: aiDescription, model: aiModel }
        : undefined,
    });
  };

  return (
    <div className="space-y-8">
      {/* Industry Presets */}
      <div>
        <h3 className="section-title">תחום / ענף</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(INDUSTRY_PRESETS) as [IndustryPreset, (typeof INDUSTRY_PRESETS)[IndustryPreset]][]).map(
            ([key, preset]) => (
              <button
                key={key}
                onClick={() => setIndustry(key)}
                className={`format-chip ${industry === key ? "active" : ""}`}
              >
                {preset.name}
              </button>
            )
          )}
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label className="section-title block">שם החברה</label>
        <input
          type="text"
          className="input-field"
          placeholder="לדוגמה: חברת דוגמה בע״מ"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="section-title block">לוגו (אופציונלי)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleLogoUpload}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="format-chip"
          >
            <i className="fa-solid fa-upload ml-2" />
            העלאת לוגו
          </button>
          {logoUrl && (
            <>
              <div
                className="w-12 h-12 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="לוגו" className="max-w-full max-h-full object-contain" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setLogoUrl(undefined);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-sm text-red-400 hover:text-red-300 cursor-pointer"
              >
                הסרה
              </button>
            </>
          )}
        </div>
      </div>

      {/* Job Title */}
      <div>
        <label className="section-title block">שם התפקיד (עברית)</label>
        <input
          type="text"
          className="input-field"
          placeholder="לדוגמה: מפתח/ת Full Stack"
          value={titleHe}
          onChange={(e) => setTitleHe(e.target.value)}
        />
      </div>

      {/* AI Toggle */}
      <div className="glass-card p-5">
        <label className="flex items-center gap-3 cursor-pointer mb-0">
          <div
            className={`w-11 h-6 rounded-full relative transition-colors ${
              aiEnabled ? "bg-[#6366f1]" : "bg-white/10"
            }`}
            onClick={() => setAiEnabled(!aiEnabled)}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                aiEnabled ? "left-0.5" : "left-[22px]"
              }`}
            />
          </div>
          <span className="font-medium" onClick={() => setAiEnabled(!aiEnabled)}>
            <i className="fa-solid fa-wand-magic-sparkles ml-2 text-[#6366f1]" />
            תנו ל-AI למלא הכל
          </span>
        </label>

        {aiEnabled && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="section-title block">תארו את המשרה...</label>
              <textarea
                className="input-field"
                placeholder="לדוגמה: דרוש/ה מפתח/ת React עם ניסיון של 3 שנים, עבודה היברידית מתל אביב..."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="section-title block">מודל AI</label>
              <select
                className="input-field"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Continue */}
      <div className="text-center pt-4">
        <button onClick={handleContinue} className="accent-btn text-lg px-12 py-4">
          המשיכו לבחירת תבנית
          <i className="fa-solid fa-arrow-left mr-2" />
        </button>
      </div>
    </div>
  );
}
