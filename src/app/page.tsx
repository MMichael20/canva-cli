"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateId, IndustryPreset, PosterCompany, PosterData, INDUSTRY_PRESETS } from "@/lib/types";
import QuickStart from "./components/QuickStart";
import ChooseLook from "./components/ChooseLook";

interface WizardData {
  industry: IndustryPreset;
  company: PosterCompany;
  titleHe: string;
  aiMode?: { description: string; model: string };
}

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [template, setTemplate] = useState<TemplateId>("corporate");
  const [isAiMode, setIsAiMode] = useState(false);

  const handleQuickStartComplete = (data: WizardData) => {
    setWizardData(data);
    // Set default template based on industry
    const preset = INDUSTRY_PRESETS[data.industry];
    setTemplate(preset.defaultTemplate);
    setStep(2);
  };

  const handleChooseLookContinue = async () => {
    if (!wizardData) return;

    // Store wizard data in sessionStorage for the editor
    sessionStorage.setItem(
      "wizardData",
      JSON.stringify({
        ...wizardData,
        template,
      })
    );

    setIsAiMode(!!wizardData.aiMode);
    setStep(3);

    if (wizardData.aiMode) {
      // AI mode: call the generation API, save full poster data, then redirect
      try {
        const res = await fetch("/api/ai-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: wizardData.aiMode.description,
            format: "square",
            template,
            model: wizardData.aiMode.model,
          }),
        });

        if (res.ok) {
          const aiData: PosterData = await res.json();
          sessionStorage.setItem("wizardPosterData", JSON.stringify(aiData));
        }
        // If AI call fails, we still redirect — editor will use wizardData fallback
      } catch {
        // Network error — still redirect; editor handles gracefully
      }
    } else {
      // Manual mode: brief intentional delay so the loading screen feels real
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    router.push(`/editor?format=square&template=${template}`);
  };

  const stepLabels = ["פרטים ראשוניים", "בחירת תבנית", "עריכה"];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black mb-4">
          צרו פוסטרים{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #6366f1, #06b6d4)",
            }}
          >
            מקצועיים
          </span>
        </h1>
        <p className="text-lg text-white/50 max-w-lg mx-auto">
          בחרו תחום ותבנית, מלאו את הפרטים, והורידו פוסטר מוכן לפרסום
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {stepLabels.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`w-8 h-px ${
                    isDone ? "bg-[#6366f1]" : "bg-white/10"
                  }`}
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    isActive || isDone ? "" : "bg-white/5 text-white/30"
                  }`}
                  style={
                    isActive || isDone
                      ? {
                          background:
                            "linear-gradient(135deg, #6366f1, #818cf8)",
                        }
                      : undefined
                  }
                >
                  {isDone ? (
                    <i className="fa-solid fa-check text-xs" />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isActive
                      ? "text-white font-medium"
                      : isDone
                        ? "text-[#6366f1]"
                        : "text-white/30"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {step === 1 && <QuickStart onComplete={handleQuickStartComplete} />}
      {step === 2 && (
        <ChooseLook
          selectedTemplate={template}
          onSelect={setTemplate}
          onBack={() => setStep(1)}
          onContinue={handleChooseLookContinue}
        />
      )}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-24 gap-8">
          <div className="glass-card p-12 flex flex-col items-center gap-6 max-w-sm w-full text-center">
            {/* Animated poster icon */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              <i className="fa-solid fa-file-image text-white text-3xl" />
            </div>

            {/* Spinner */}
            <div className="loading-spinner" style={{ width: 32, height: 32 }} />

            {/* Text */}
            <div className="space-y-2">
              <p className="text-white font-semibold text-lg">
                מכינים את הפוסטר שלכם...
              </p>
              {isAiMode && (
                <p className="text-white/50 text-sm">
                  AI יוצר את התוכן...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
