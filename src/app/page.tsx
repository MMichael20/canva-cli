"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PosterFormat, TemplateId, FORMAT_DIMENSIONS, TEMPLATES } from "@/lib/types";

const FORMAT_ICONS: Record<PosterFormat, string> = {
  story: "fa-solid fa-mobile-screen",
  square: "fa-solid fa-square",
  a4: "fa-solid fa-file",
};

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

export default function HomePage() {
  const router = useRouter();
  const [format, setFormat] = useState<PosterFormat>("story");
  const [template, setTemplate] = useState<TemplateId>("corporate");

  const handleStart = () => {
    router.push(`/editor?format=${format}&template=${template}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black mb-4">
          צרו פוסטרים{" "}
          <span className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #6366f1, #06b6d4)" }}>
            מקצועיים
          </span>
        </h1>
        <p className="text-lg text-white/50 max-w-lg mx-auto">
          בחרו פורמט ותבנית, מלאו את הפרטים, והורידו פוסטר מוכן לפרסום
        </p>
      </div>

      {/* Step 1: Format */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}>
            1
          </div>
          <h2 className="text-xl font-bold">בחרו פורמט</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {(Object.entries(FORMAT_DIMENSIONS) as [PosterFormat, typeof FORMAT_DIMENSIONS[PosterFormat]][]).map(
            ([key, dim]) => (
              <button
                key={key}
                onClick={() => setFormat(key)}
                className={`glass-card p-6 text-center cursor-pointer ${
                  format === key ? "!border-[#6366f1] !bg-[rgba(99,102,241,0.08)]" : ""
                }`}
              >
                <i className={`${FORMAT_ICONS[key]} text-3xl mb-3 ${
                  format === key ? "text-[#6366f1]" : "text-white/30"
                }`} />
                <div className="font-bold text-lg mb-1">{dim.label}</div>
                <div className="text-sm text-white/40">
                  {dim.width} × {dim.height}
                </div>
              </button>
            )
          )}
        </div>
      </div>

      {/* Step 2: Template */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}>
            2
          </div>
          <h2 className="text-xl font-bold">בחרו תבנית</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(Object.entries(TEMPLATES) as [TemplateId, typeof TEMPLATES[TemplateId]][]).map(
            ([key, tmpl]) => (
              <button
                key={key}
                onClick={() => setTemplate(key)}
                className={`glass-card p-4 cursor-pointer text-center ${
                  template === key ? "!border-[#6366f1] !bg-[rgba(99,102,241,0.08)]" : ""
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  {/* Template preview */}
                  <div
                    className="w-full aspect-[3/4] rounded-xl flex items-center justify-center relative overflow-hidden"
                    style={{ background: TEMPLATE_PREVIEWS[key].gradient }}
                  >
                    <i className={`${TEMPLATE_PREVIEWS[key].icon} text-3xl ${key === "corporate" ? "text-black/15" : "text-white/20"}`} />
                    {template === key && (
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
      </div>

      {/* CTA */}
      <div className="text-center">
        <button onClick={handleStart} className="accent-btn text-lg px-12 py-4">
          <i className="fa-solid fa-arrow-left ml-2" />
          המשיכו לעריכה
        </button>
      </div>
    </div>
  );
}
