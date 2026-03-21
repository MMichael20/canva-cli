"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  PosterData,
  PosterFormat,
  TemplateId,
  DEFAULT_POSTER_DATA,
  INDUSTRY_PRESETS,
  THEME_PRESETS,
  IndustryPreset,
} from "@/lib/types";
import TitleEditor from "../components/sidebar/TitleEditor";
import CompanyEditor from "../components/sidebar/CompanyEditor";
import ThemePicker from "../components/sidebar/ThemePicker";
import DetailsEditor from "../components/sidebar/DetailsEditor";
import BenefitsEditor from "../components/sidebar/BenefitsEditor";
import SalaryEditor from "../components/sidebar/SalaryEditor";
import ContactEditor from "../components/sidebar/ContactEditor";
import BackgroundEditor from "../components/sidebar/BackgroundEditor";
import FontPicker from "../components/sidebar/FontPicker";
import ExportSettings from "../components/sidebar/ExportSettings";
import LivePreview from "../components/preview/LivePreview";

type InputMode = "manual" | "ai";

const AVAILABLE_MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini (מהיר וזול)" },
  { id: "gpt-4o", label: "GPT-4o (איכותי)" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { id: "gpt-4.1", label: "GPT-4.1" },
];

/* ── Inline Accordion ─────────────────────────────────────────── */
function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card overflow-hidden accordion-section">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 cursor-pointer"
      >
        <span className="section-title !mb-0">{title}</span>
        <i
          className={`fa-solid fa-chevron-down transition-transform ${open ? "rotate-180" : ""}`}
          style={{ fontSize: 12 }}
        />
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

/* ── Page wrapper (Suspense boundary for useSearchParams) ───── */
export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="loading-spinner" />
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}

/* ── Main editor content ─────────────────────────────────────── */
function EditorContent() {
  const searchParams = useSearchParams();
  const format = (searchParams.get("format") || "story") as PosterFormat;
  const template = (searchParams.get("template") || "corporate") as TemplateId;

  const [mode, setMode] = useState<InputMode>("manual");
  const [aiDescription, setAiDescription] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [aiLoading, setAiLoading] = useState(false);
  const [improveLoading, setImproveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [posterData, setPosterData] = useState<PosterData>(() => {
    const base: PosterData = {
      ...DEFAULT_POSTER_DATA,
      format,
      template,
    };
    return base;
  });

  // Read wizard data from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wizard");
      if (!raw) return;
      const wizard = JSON.parse(raw) as {
        company?: string;
        title?: string;
        industry?: IndustryPreset;
        format?: PosterFormat;
        template?: TemplateId;
      };

      setPosterData((prev) => {
        const updated = { ...prev };

        if (wizard.company) {
          updated.company = { ...updated.company, name: wizard.company };
        }
        if (wizard.title) {
          updated.title = { ...updated.title, he: wizard.title };
        }
        if (wizard.format) {
          updated.format = wizard.format;
        }
        if (wizard.template) {
          updated.template = wizard.template;
        }
        if (wizard.industry && INDUSTRY_PRESETS[wizard.industry]) {
          const preset = INDUSTRY_PRESETS[wizard.industry];
          updated.meta = { industry: wizard.industry };
          // Apply industry defaults only if theme hasn't been customized
          if (!prev.theme.preset) {
            const themePreset = THEME_PRESETS[preset.defaultTheme];
            if (themePreset) {
              updated.theme = {
                ...updated.theme,
                preset: preset.defaultTheme,
                primary: themePreset.primary,
                secondary: themePreset.secondary,
                bgColor: themePreset.bgColor,
                textColor: themePreset.textColor,
              };
            }
          }
        }

        return updated;
      });

      // Clear wizard data after reading
      sessionStorage.removeItem("wizard");
    } catch {
      // Ignore sessionStorage errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = <K extends keyof PosterData>(key: K, value: PosterData[K]) => {
    setPosterData((prev) => ({ ...prev, [key]: value }));
  };

  /* ── AI generate ───────────────────────────────────────────── */
  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) return;
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: aiDescription,
          format: posterData.format,
          template: posterData.template,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "שגיאה ביצירת תוכן AI");
      }

      const aiData: PosterData = await res.json();
      setPosterData(aiData);
      setMode("manual"); // Switch to manual with all fields filled
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
    } finally {
      setAiLoading(false);
    }
  };

  /* ── AI improve ────────────────────────────────────────────── */
  const handleAiImprove = async () => {
    setImproveLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(posterData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "שגיאה בשיפור AI");
      }

      const improved = await res.json();
      console.log("AI improve response:", improved);
      if (improved && typeof improved === "object" && improved.format) {
        setPosterData(improved as PosterData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
    } finally {
      setImproveLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">עריכת פוסטר</h1>
        </div>
        <a
          href="/"
          className="text-white/40 hover:text-white/70 transition-colors text-sm"
        >
          <i className="fa-solid fa-arrow-right ml-1" />
          חזרה
        </a>
      </div>

      {/* Grid: sidebar | preview */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_500px] gap-10">
        {/* ── Sidebar (scrollable left panel) ──────────────── */}
        <div className="space-y-5 max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-1 sidebar-scroll">
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
          </div>

          {/* ── AI Mode ───────────────────────────────────── */}
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
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiDescription.trim()}
                className="accent-btn w-full flex items-center justify-center gap-3 text-lg py-4"
              >
                {aiLoading ? (
                  <>
                    <div className="loading-spinner" />
                    מייצר תוכן...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles" />
                    ייצור עם AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Manual Mode ───────────────────────────────── */}
          {mode === "manual" && (
            <>
              {/* Tier 1 — always visible */}
              <div className="glass-card p-6 space-y-6">
                <TitleEditor
                  title={posterData.title}
                  onChange={(title) => updateField("title", title)}
                />
                <CompanyEditor
                  company={posterData.company}
                  onChange={(company) => updateField("company", company)}
                />
                <ThemePicker
                  theme={posterData.theme}
                  onChange={(theme) => updateField("theme", theme)}
                />
              </div>

              {/* Tier 2 — collapsible accordion sections */}
              <Accordion title="פרטי המשרה" defaultOpen>
                <DetailsEditor
                  details={posterData.details}
                  onChange={(details) => updateField("details", details)}
                />
              </Accordion>

              <Accordion title="הטבות">
                <BenefitsEditor
                  benefits={posterData.benefits ?? []}
                  onChange={(benefits) => updateField("benefits", benefits.length > 0 ? benefits : undefined)}
                />
              </Accordion>

              <Accordion title="שכר">
                <SalaryEditor
                  salary={posterData.salary}
                  onChange={(salary) => updateField("salary", salary)}
                />
              </Accordion>

              <Accordion title="איש קשר" defaultOpen>
                <ContactEditor
                  contact={posterData.contact}
                  onChange={(contact) => updateField("contact", contact)}
                />
              </Accordion>

              <Accordion title="רקע ותמונה">
                <BackgroundEditor
                  background={posterData.background}
                  onChange={(background) => updateField("background", background)}
                />
              </Accordion>

              <Accordion title="גופן">
                <FontPicker
                  fontStack={posterData.theme.fontStack}
                  onChange={(fontStack) =>
                    updateField("theme", { ...posterData.theme, fontStack })
                  }
                />
              </Accordion>

              {/* Tier 3 — behind advanced toggle */}
              <div>
                <button
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="w-full flex items-center justify-between p-3 text-sm text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                >
                  <span>הגדרות מתקדמות</span>
                  <i
                    className={`fa-solid fa-chevron-down transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                    style={{ fontSize: 11 }}
                  />
                </button>
                {advancedOpen && (
                  <div className="glass-card p-6 mt-1">
                    <ExportSettings
                      format={posterData.format}
                      badge={posterData.badge}
                      onFormatChange={(f) => updateField("format", f)}
                      onBadgeChange={(badge) => updateField("badge", badge)}
                    />
                  </div>
                )}
              </div>

              {/* "Improve with AI" button */}
              <button
                onClick={handleAiImprove}
                disabled={improveLoading}
                className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
              >
                {improveLoading ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18 }} />
                    משפר...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles text-[#6366f1]" />
                    שפר עם AI
                  </>
                )}
              </button>
            </>
          )}

          {/* Error display */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <i className="fa-solid fa-triangle-exclamation ml-2" />
              {error}
            </div>
          )}
        </div>

        {/* ── Preview (sticky right panel) ─────────────────── */}
        <div className="lg:sticky lg:top-8 self-start">
          <LivePreview posterData={posterData} />
        </div>
      </div>
    </div>
  );
}
