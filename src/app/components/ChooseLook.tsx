"use client";

import { TemplateId, TEMPLATES } from "@/lib/types";

interface ChooseLookProps {
  selectedTemplate: TemplateId;
  onSelect: (template: TemplateId) => void;
  onBack: () => void;
  onContinue: () => void;
}

const TEMPLATE_PREVIEWS: Record<TemplateId, { gradient: string; icon: string }> = {
  "photo-banner": {
    gradient: "linear-gradient(135deg, #2d1b4e 0%, #1a1a2e 50%, #0f2027 100%)",
    icon: "fa-solid fa-image",
  },
  "classic-split": {
    gradient: "linear-gradient(180deg, #1a3a5c 0%, #1a3a5c 45%, #2563EB 45%, #2563EB 100%)",
    icon: "fa-solid fa-circle-half-stroke",
  },
  "corporate": {
    gradient: "linear-gradient(180deg, #2563EB 0%, #2563EB 15%, #F7F7FA 15%, #F7F7FA 100%)",
    icon: "fa-solid fa-building-columns",
  },
  "bold-urgent": {
    gradient: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
    icon: "fa-solid fa-fire",
  },
  "logo-centered": {
    gradient: "linear-gradient(135deg, #0B0D17 0%, #1a1a2e 50%, #16213e 100%)",
    icon: "fa-solid fa-bullseye",
  },
  "text-stack": {
    gradient: "linear-gradient(180deg, #0B0D17 0%, #111827 100%)",
    icon: "fa-solid fa-align-right",
  },
};

export default function ChooseLook({
  selectedTemplate,
  onSelect,
  onBack,
  onContinue,
}: ChooseLookProps) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        {(Object.entries(TEMPLATES) as [TemplateId, (typeof TEMPLATES)[TemplateId]][]).map(
          ([key, tmpl]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`glass-card p-4 cursor-pointer text-center ${
                selectedTemplate === key
                  ? "!border-[#6366f1] !bg-[rgba(99,102,241,0.08)]"
                  : ""
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                {/* Template preview thumbnail */}
                <div
                  className="w-full aspect-[3/4] rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{ background: TEMPLATE_PREVIEWS[key].gradient }}
                >
                  <i
                    className={`${TEMPLATE_PREVIEWS[key].icon} text-3xl ${
                      key === "corporate" ? "text-black/15" : "text-white/20"
                    }`}
                  />
                  {selectedTemplate === key && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                      <i className="fa-solid fa-check text-2xl text-[#6366f1]" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm mb-0.5">{tmpl.name}</div>
                  <div className="text-xs text-white/40 leading-relaxed">
                    {tmpl.description}
                  </div>
                </div>
              </div>
            </button>
          )
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8">
        <button
          onClick={onBack}
          className="format-chip flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-right" />
          חזרה
        </button>
        <button onClick={onContinue} className="accent-btn text-lg px-12 py-4">
          המשיכו לעריכה
          <i className="fa-solid fa-arrow-left mr-2" />
        </button>
      </div>
    </div>
  );
}
