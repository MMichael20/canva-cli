"use client";

import { PosterContact, ContactMethod } from "@/lib/types";
import { validateContact } from "@/lib/validation";

interface ContactEditorProps {
  contact: PosterContact;
  onChange: (contact: PosterContact) => void;
}

const METHOD_LABELS: Record<ContactMethod, string> = {
  whatsapp: "וואטסאפ",
  email: "מייל",
  phone: "טלפון",
  link: "קישור",
};

const METHOD_PLACEHOLDERS: Record<ContactMethod, string> = {
  whatsapp: "05X-XXXXXXX",
  email: "email@example.com",
  phone: "05X-XXXXXXX",
  link: "https://...",
};

export default function ContactEditor({ contact, onChange }: ContactEditorProps) {
  const errors = contact.value ? validateContact(contact) : [];
  const valueError = errors.find((e) => e.field === "contact.value");

  function update(field: keyof PosterContact, val: string) {
    onChange({ ...contact, [field]: val });
  }

  function handleMethodChange(method: ContactMethod) {
    onChange({ ...contact, method, value: "" });
  }

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <div className="flex flex-col gap-1">
        <label className="section-title">אמצעי יצירת קשר</label>
        <select
          className="input-field"
          value={contact.method}
          onChange={(e) => handleMethodChange(e.target.value as ContactMethod)}
        >
          {(Object.keys(METHOD_LABELS) as ContactMethod[]).map((method) => (
            <option key={method} value={method}>
              {METHOD_LABELS[method]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="section-title">פרטי קשר</label>
        <input
          className={`input-field ${valueError ? "border-red-500" : ""}`}
          type={contact.method === "email" ? "email" : "text"}
          dir={contact.method === "link" || contact.method === "email" ? "ltr" : "rtl"}
          placeholder={METHOD_PLACEHOLDERS[contact.method]}
          value={contact.value}
          onChange={(e) => update("value", e.target.value)}
        />
        {valueError && (
          <p className="text-red-400 text-xs">{valueError.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="section-title">טקסט תצוגה (אופציונלי)</label>
        <input
          className="input-field"
          type="text"
          dir="rtl"
          placeholder="טקסט תצוגה"
          value={contact.displayText ?? ""}
          onChange={(e) => update("displayText", e.target.value)}
        />
      </div>
    </div>
  );
}
