"use client";

import { Suspense, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  PosterData,
  PosterDetail,
  PosterFormat,
  TemplateId,
  FORMAT_DIMENSIONS,
  DEFAULT_POSTER_DATA,
} from "@/lib/templates";
import { generateTemplateHtml } from "@/lib/template-html";

type InputMode = "manual" | "ai" | "json";

const AVAILABLE_MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini (מהיר וזול)" },
  { id: "gpt-4o", label: "GPT-4o (איכותי)" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { id: "gpt-4.1", label: "GPT-4.1" },
];

const ICON_OPTIONS = [
  { value: "fa-solid fa-briefcase", label: "תיק עבודה" },
  { value: "fa-solid fa-code", label: "קוד" },
  { value: "fa-solid fa-terminal", label: "טרמינל" },
  { value: "fa-solid fa-location-dot", label: "מיקום" },
  { value: "fa-solid fa-clock", label: "שעון" },
  { value: "fa-solid fa-shekel-sign", label: "שכר" },
  { value: "fa-solid fa-graduation-cap", label: "השכלה" },
  { value: "fa-solid fa-id-card", label: "תעודה" },
  { value: "fa-solid fa-truck-fast", label: "משאית" },
  { value: "fa-solid fa-route", label: "מסלול" },
  { value: "fa-solid fa-arrows-spin", label: "CI/CD" },
  { value: "fa-solid fa-users", label: "צוות" },
  { value: "fa-solid fa-star", label: "כוכב" },
  { value: "fa-solid fa-heart", label: "לב" },
  { value: "fa-solid fa-bolt", label: "ברק" },
  { value: "fa-solid fa-phone", label: "טלפון" },
  { value: "fa-solid fa-envelope", label: "מייל" },
  { value: "fa-solid fa-globe", label: "גלובוס" },
  { value: "fa-solid fa-building", label: "בניין" },
  { value: "fa-solid fa-car", label: "רכב" },
  { value: "fa-solid fa-wrench", label: "מפתח ברגים" },
  { value: "fa-solid fa-hammer", label: "פטיש" },
  { value: "fa-solid fa-shield-halved", label: "אבטחה" },
  { value: "fa-solid fa-chart-line", label: "גרף" },
];

const THEME_PRESETS = [
  { name: "סגול-תכלת", primary: "#6366F1", accent: "#06B6D4", bg: "#0B0D17" },
  { name: "כתום-צהוב", primary: "#EA580C", accent: "#F59E0B", bg: "#0F1419" },
  { name: "ירוק-טורקיז", primary: "#059669", accent: "#14B8A6", bg: "#0A1210" },
  { name: "ורוד-סגול", primary: "#EC4899", accent: "#8B5CF6", bg: "#120A14" },
  { name: "אדום-כתום", primary: "#DC2626", accent: "#F97316", bg: "#140A0A" },
  { name: "כחול-תכלת", primary: "#2563EB", accent: "#38BDF8", bg: "#0A0F1A" },
];

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="loading-spinner" /></div>}>
      <EditorContent />
    </Suspense>
  );
}

function EditorContent() {
  const searchParams = useSearchParams();
  const format = (searchParams.get("format") || "story") as PosterFormat;
  const template = (searchParams.get("template") || "dark-cards") as TemplateId;

  const [mode, setMode] = useState<InputMode>("manual");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [posterData, setPosterData] = useState<PosterData>({
    ...DEFAULT_POSTER_DATA,
    format,
    template,
    details: [
      { icon: "fa-solid fa-briefcase", label: "ניסיון נדרש", value: "3+ שנים" },
      { icon: "fa-solid fa-code", label: "טכנולוגיות", value: "" },
      { icon: "fa-solid fa-location-dot", label: "מיקום", value: "" },
    ],
  });

  const updateField = <K extends keyof PosterData>(key: K, value: PosterData[K]) => {
    setPosterData((prev) => ({ ...prev, [key]: value }));
  };

  const updateDetail = (index: number, field: keyof PosterDetail, value: string) => {
    setPosterData((prev) => {
      const details = [...prev.details];
      details[index] = { ...details[index], [field]: value };
      return { ...prev, details };
    });
  };

  const addDetail = () => {
    setPosterData((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        { icon: "fa-solid fa-star", label: "", value: "" },
      ],
    }));
  };

  const removeDetail = (index: number) => {
    setPosterData((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const generate = useCallback(async (data: PosterData) => {
    setLoading(true);
    setError(null);
    setPreviewUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "שגיאה ביצירת הפוסטר");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = async () => {
    if (mode === "json") {
      try {
        const parsed = JSON.parse(jsonInput) as PosterData;
        parsed.format = format;
        parsed.template = template;
        await generate(parsed);
      } catch {
        setError("JSON לא תקין");
      }
      return;
    }

    if (mode === "ai") {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: aiDescription,
            format,
            template,
            model: selectedModel,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "שגיאה ביצירת תוכן AI");
        }

        const aiData: PosterData = await res.json();
        setPosterData(aiData);
        await generate(aiData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
        setLoading(false);
      }
      return;
    }

    await generate(posterData);
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `poster-${format}-${Date.now()}.jpg`;
    a.click();
  };

  const dims = FORMAT_DIMENSIONS[format];

  // Live preview: generate HTML from current posterData
  const liveHtml = useMemo(() => {
    try {
      return generateTemplateHtml(posterData);
    } catch {
      return null;
    }
  }, [posterData]);

  // Measure the preview container to calculate iframe scale
  const previewRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(440);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const iframeScale = containerWidth / dims.width;
  const scaledHeight = dims.height * iframeScale;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">עריכת פוסטר</h1>
          <p className="text-sm text-white/40">
            {dims.label} • {dims.width}×{dims.height}
          </p>
        </div>
        <a href="/" className="text-white/40 hover:text-white/70 transition-colors text-sm">
          <i className="fa-solid fa-arrow-right ml-1" />
          חזרה
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_500px] gap-10">
        {/* Left: Form */}
        <div className="space-y-5">
          {/* Mode tabs */}
          <div className="tab-bar">
            <button
              className={`tab-item ${mode === "manual" ? "active" : ""}`}
              onClick={() => setMode("manual")}
            >
              <i className="fa-solid fa-pen ml-2" />
              ידני
            </button>
            <button
              className={`tab-item ${mode === "ai" ? "active" : ""}`}
              onClick={() => setMode("ai")}
            >
              <i className="fa-solid fa-wand-magic-sparkles ml-2" />
              AI
            </button>
            <button
              className={`tab-item ${mode === "json" ? "active" : ""}`}
              onClick={() => setMode("json")}
            >
              <i className="fa-solid fa-code ml-2" />
              JSON
            </button>
          </div>

          {/* AI Mode */}
          {mode === "ai" && (
            <div className="glass-card p-6 space-y-4">
              <div className="section-title">תיאור המשרה</div>
              <textarea
                className="input-field"
                placeholder="תארו את המשרה... לדוגמה: מחפשים מהנדס QA אוטומציה עם 5 שנות ניסיון, ידע ב-Selenium ו-Python, תל אביב, היברידי"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
              />
              <div className="section-title">מודל AI</div>
              <select
                className="input-field"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* JSON Mode */}
          {mode === "json" && (
            <div className="glass-card p-6 space-y-4">
              <div className="section-title">הדביקו JSON של פוסטר</div>
              <textarea
                className="input-field json-editor"
                placeholder='{"badge":{"icon":"fa-solid fa-bolt","text":"מגייסים!"},...}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
              <p className="text-xs text-white/30">
                הפורמט צריך להתאים למבנה PosterData. השדות format ו-template ייקבעו אוטומטית.
              </p>
            </div>
          )}

          {/* Manual Mode */}
          {mode === "manual" && (
            <>
              {/* Theme */}
              <div className="glass-card p-6">
                <div className="section-title">ערכת צבעים</div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t.name}
                      onClick={() =>
                        updateField("theme", {
                          primary: t.primary,
                          accent: t.accent,
                          bgColor: t.bg,
                        })
                      }
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        posterData.theme.primary === t.primary
                          ? "border-white/20 bg-white/[0.04]"
                          : "border-white/[0.04] hover:border-white/10"
                      }`}
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ background: t.primary }}
                        />
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ background: t.accent }}
                        />
                      </div>
                      <span className="text-sm">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge */}
              <div className="glass-card p-6 space-y-4">
                <div className="section-title">תג עליון</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/30 mb-1 block">טקסט</label>
                    <input
                      className="input-field"
                      value={posterData.badge.text}
                      onChange={(e) =>
                        updateField("badge", { ...posterData.badge, text: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/30 mb-1 block">אייקון</label>
                    <select
                      className="input-field"
                      value={posterData.badge.icon}
                      onChange={(e) =>
                        updateField("badge", { ...posterData.badge, icon: e.target.value })
                      }
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Titles */}
              <div className="glass-card p-6 space-y-4">
                <div className="section-title">כותרות</div>
                <div>
                  <label className="text-xs text-white/30 mb-1 block">כותרת משנה</label>
                  <input
                    className="input-field"
                    value={posterData.subtitle}
                    onChange={(e) => updateField("subtitle", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/30 mb-1 block">שם תפקיד בעברית</label>
                  <input
                    className="input-field"
                    value={posterData.titleHe}
                    onChange={(e) => updateField("titleHe", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/30 mb-1 block">שם תפקיד באנגלית</label>
                  <input
                    className="input-field"
                    style={{ direction: "ltr", textAlign: "left" }}
                    value={posterData.titleEn}
                    onChange={(e) => updateField("titleEn", e.target.value)}
                  />
                </div>
              </div>

              {/* Background */}
              <div className="glass-card p-6 space-y-4">
                <div className="section-title">תמונת רקע</div>
                <div>
                  <label className="text-xs text-white/30 mb-1 block">
                    חיפוש תמונה (Unsplash) או URL ישיר
                  </label>
                  <input
                    className="input-field"
                    placeholder="לדוגמה: office, technology, truck..."
                    style={{ direction: "ltr", textAlign: "left" }}
                    value={posterData.backgroundUrl || posterData.backgroundQuery || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith("http")) {
                        updateField("backgroundUrl", val);
                        updateField("backgroundQuery", undefined);
                      } else {
                        updateField("backgroundQuery", val);
                        updateField("backgroundUrl", undefined);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="section-title !mb-0">פרטי המשרה</div>
                  <button
                    onClick={addDetail}
                    className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-plus ml-1" />
                    הוסיפו שורה
                  </button>
                </div>
                {posterData.details.map((detail, i) => (
                  <div key={i} className="relative rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-3">
                    {/* Delete button — top left corner */}
                    <button
                      onClick={() => removeDetail(i)}
                      className="absolute top-3 left-3 text-white/15 hover:text-red-400 transition-colors cursor-pointer text-xs"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                    {/* Row 1: Icon select */}
                    <div>
                      <label className="text-xs text-white/30 mb-1 block">אייקון</label>
                      <select
                        className="input-field w-full sm:w-48"
                        value={detail.icon}
                        onChange={(e) => updateDetail(i, "icon", e.target.value)}
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Row 2: Label + Value side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/30 mb-1 block">כותרת</label>
                        <input
                          className="input-field"
                          placeholder="לדוגמה: ניסיון נדרש"
                          value={detail.label}
                          onChange={(e) => updateDetail(i, "label", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/30 mb-1 block">ערך</label>
                        <input
                          className="input-field"
                          placeholder="לדוגמה: 5+ שנים"
                          value={detail.value}
                          onChange={(e) => updateDetail(i, "value", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="glass-card p-6 space-y-4">
                <div className="section-title">קריאה לפעולה (CTA)</div>
                <div>
                  <label className="text-xs text-white/30 mb-1 block">טקסט ראשי</label>
                  <input
                    className="input-field"
                    value={posterData.cta.text}
                    onChange={(e) =>
                      updateField("cta", { ...posterData.cta, text: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/30 mb-1 block">טקסט משני</label>
                  <input
                    className="input-field"
                    value={posterData.cta.subtext}
                    onChange={(e) =>
                      updateField("cta", { ...posterData.cta, subtext: e.target.value })
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="accent-btn w-full flex items-center justify-center gap-3 text-lg py-4"
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                מייצר פוסטר...
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-export" />
                ייצוא JPG
              </>
            )}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <i className="fa-solid fa-triangle-exclamation ml-2" />
              {error}
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="lg:sticky lg:top-8 self-start">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title !mb-0">תצוגה מקדימה</div>
            <div className="flex items-center gap-2 text-xs">
              {previewUrl ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-circle text-[6px]" />
                  JPG מוכן
                </span>
              ) : (
                <span className="text-[#6366f1] flex items-center gap-1.5">
                  <i className="fa-solid fa-circle text-[6px] animate-pulse" />
                  תצוגה חיה
                </span>
              )}
            </div>
          </div>

          {/* Live iframe preview / rendered JPG */}
          <div
            ref={previewRef}
            className="w-full rounded-2xl overflow-hidden border border-white/[0.06] bg-[#111118] relative"
            style={{ height: `${Math.min(scaledHeight, 700)}px`, maxHeight: "75vh" }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="poster preview"
                className="w-full h-full object-contain"
              />
            ) : liveHtml ? (
              <iframe
                srcDoc={liveHtml}
                title="Live poster preview"
                sandbox="allow-same-origin"
                className="border-0 pointer-events-none"
                style={{
                  width: `${dims.width}px`,
                  height: `${dims.height}px`,
                  transform: `scale(${iframeScale})`,
                  transformOrigin: "top right",
                  position: "absolute",
                  top: 0,
                  right: 0,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-center text-white/20 p-8">
                <div>
                  <i className="fa-solid fa-image text-5xl mb-4 block" />
                  <p>הפוסטר יופיע כאן</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-3">
            {previewUrl && (
              <button
                onClick={handleDownload}
                className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-sm font-medium cursor-pointer"
              >
                <i className="fa-solid fa-download ml-2" />
                הורידו JPG
              </button>
            )}
            {previewUrl && (
              <button
                onClick={() => setPreviewUrl(null)}
                className="py-3 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-sm cursor-pointer text-white/40"
                title="חזרה לתצוגה חיה"
              >
                <i className="fa-solid fa-arrow-rotate-left" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
