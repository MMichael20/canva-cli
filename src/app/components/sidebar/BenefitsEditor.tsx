"use client";

import { useState } from "react";

interface BenefitsEditorProps {
  benefits: string[];
  onChange: (benefits: string[]) => void;
}

export default function BenefitsEditor({ benefits, onChange }: BenefitsEditorProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const maxBenefits = 3;
  const maxChars = 20;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const trimmed = input.trim();
    if (!trimmed) return;

    if (benefits.length >= maxBenefits) {
      setError("ניתן להוסיף עד 3 הטבות");
      return;
    }
    if (trimmed.length > maxChars) {
      setError(`מקסימום ${maxChars} תווים`);
      return;
    }

    onChange([...benefits, trimmed]);
    setInput("");
    setError(null);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    if (error) setError(null);
  }

  function removeBenefit(index: number) {
    onChange(benefits.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {benefits.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {benefits.map((benefit, index) => (
            <span
              key={index}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm"
            >
              {benefit}
              <button
                type="button"
                onClick={() => removeBenefit(index)}
                className="text-purple-400 hover:text-red-400 transition-colors leading-none"
                aria-label={`הסר ${benefit}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <input
          className="input-field text-sm"
          type="text"
          dir="rtl"
          placeholder="הקלד הטבה ולחץ Enter להוספה"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={benefits.length >= maxBenefits}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{benefits.length}/{maxBenefits} הטבות</span>
          <span className={input.length > maxChars ? "text-red-400" : ""}>
            {input.length}/{maxChars} תווים
          </span>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    </div>
  );
}
