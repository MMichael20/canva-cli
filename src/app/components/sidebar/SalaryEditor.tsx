"use client";

import { useState } from "react";
import { PosterSalary } from "@/lib/types";

interface SalaryEditorProps {
  salary?: PosterSalary;
  onChange: (salary?: PosterSalary) => void;
}

const DEFAULT_SALARY: PosterSalary = {
  currency: "ILS",
  period: "month",
};

export default function SalaryEditor({ salary, onChange }: SalaryEditorProps) {
  const [isOpen, setIsOpen] = useState(!!salary);

  function handleToggle() {
    if (isOpen) {
      setIsOpen(false);
      onChange(undefined);
    } else {
      setIsOpen(true);
      onChange(DEFAULT_SALARY);
    }
  }

  function handleRemove() {
    setIsOpen(false);
    onChange(undefined);
  }

  function update(field: keyof PosterSalary, val: string | number | undefined) {
    if (!salary) return;
    onChange({ ...salary, [field]: val });
  }

  const displayMaxChars = 30;

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {!isOpen ? (
        <button
          type="button"
          onClick={handleToggle}
          className="w-full py-2 rounded-lg text-sm font-medium border border-dashed border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-colors"
        >
          + הוסיפו מידע על שכר
        </button>
      ) : (
        <div className="glass-card p-3 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="section-title text-xs">מטבע</label>
              <select
                className="input-field text-sm"
                value={salary?.currency ?? "ILS"}
                onChange={(e) => update("currency", e.target.value as "ILS" | "USD")}
              >
                <option value="ILS">ILS ₪</option>
                <option value="USD">USD $</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <label className="section-title text-xs">תדירות</label>
              <select
                className="input-field text-sm"
                value={salary?.period ?? "month"}
                onChange={(e) => update("period", e.target.value as "month" | "hour" | "year")}
              >
                <option value="month">חודשי</option>
                <option value="hour">שעתי</option>
                <option value="year">שנתי</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="section-title text-xs">מינימום</label>
              <input
                className="input-field text-sm"
                type="number"
                min={0}
                placeholder="מינימום"
                value={salary?.min ?? ""}
                onChange={(e) =>
                  update("min", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <label className="section-title text-xs">מקסימום</label>
              <input
                className="input-field text-sm"
                type="number"
                min={0}
                placeholder="מקסימום"
                value={salary?.max ?? ""}
                onChange={(e) =>
                  update("max", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="section-title text-xs">תיאור תצוגה (אופציונלי)</label>
            <input
              className="input-field text-sm"
              type="text"
              dir="rtl"
              placeholder="לדוגמה: לפי ניסיון"
              maxLength={displayMaxChars}
              value={salary?.display ?? ""}
              onChange={(e) =>
                update("display", e.target.value || undefined)
              }
            />
            <span className="text-xs text-gray-500 text-left">
              {(salary?.display ?? "").length}/{displayMaxChars} תווים
            </span>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="w-full py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/30"
          >
            הסר שכר
          </button>
        </div>
      )}
    </div>
  );
}
