"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateId, IndustryPreset, PosterCompany, INDUSTRY_PRESETS } from "@/lib/types";
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

  const handleQuickStartComplete = (data: WizardData) => {
    setWizardData(data);
    // Set default template based on industry
    const preset = INDUSTRY_PRESETS[data.industry];
    setTemplate(preset.defaultTemplate);
    setStep(2);
  };

  const handleChooseLookContinue = () => {
    if (!wizardData) return;

    // Store wizard data in sessionStorage for the editor
    sessionStorage.setItem(
      "wizardData",
      JSON.stringify({
        ...wizardData,
        template,
      })
    );

    setStep(3);
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
    </div>
  );
}
