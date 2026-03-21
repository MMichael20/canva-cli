"use client";

import { useRef } from "react";
import { PosterCompany } from "@/lib/types";

interface CompanyEditorProps {
  company: PosterCompany;
  onChange: (company: PosterCompany) => void;
}

const LOGO_BG_OPTIONS: { value: PosterCompany["logoBackground"]; label: string }[] = [
  { value: "auto", label: "אוטו" },
  { value: "white", label: "לבן" },
  { value: "dark", label: "כהה" },
  { value: "transparent", label: "שקוף" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 400;
const MAX_HEIGHT = 200;

async function resizeAndEncodeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        const widthRatio = MAX_WIDTH / width;
        const heightRatio = MAX_HEIGHT / height;
        const ratio = Math.min(widthRatio, heightRatio, 1);

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function CompanyEditor({ company, onChange }: CompanyEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("הקובץ גדול מדי — מקסימום 5MB");
      return;
    }

    try {
      const dataUri = await resizeAndEncodeImage(file);
      onChange({ ...company, logoUrl: dataUri });
    } catch {
      alert("שגיאה בטעינת הלוגו");
    } finally {
      // Reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    onChange({ ...company, logoUrl: undefined });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Company name */}
      <div className="flex flex-col gap-1.5">
        <label className="section-title">שם החברה</label>
        <input
          className="input-field"
          type="text"
          dir="rtl"
          value={company.name}
          onChange={(e) => onChange({ ...company, name: e.target.value })}
          placeholder="לדוגמה: גוגל ישראל"
        />
      </div>

      {/* Logo upload */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="format-chip"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fa-solid fa-upload ml-1.5" />
            העלאת לוגו
          </button>

          {company.logoUrl && (
            <button
              type="button"
              className="format-chip text-red-400 border-red-400/30 hover:bg-red-400/10"
              onClick={handleRemoveLogo}
            >
              <i className="fa-solid fa-trash ml-1.5" />
              הסרת לוגו
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleLogoUpload}
        />

        {/* Logo preview */}
        {company.logoUrl && (
          <div
            className="rounded-xl overflow-hidden flex items-center justify-center p-3 mt-1"
            style={{
              width: 120,
              height: 60,
              background:
                company.logoBackground === "white"
                  ? "#ffffff"
                  : company.logoBackground === "dark"
                  ? "#0B0D17"
                  : company.logoBackground === "transparent"
                  ? "transparent"
                  : "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={company.logoUrl}
              alt="לוגו החברה"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </div>
        )}

        {/* Logo background toggle */}
        {company.logoUrl && (
          <div className="flex gap-2 flex-wrap mt-1">
            {LOGO_BG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...company, logoBackground: opt.value })}
                className={`format-chip text-xs px-3 py-1 ${
                  company.logoBackground === opt.value
                    ? "!border-[#6366f1] !bg-[rgba(99,102,241,0.15)] text-[#a5b4fc]"
                    : ""
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
