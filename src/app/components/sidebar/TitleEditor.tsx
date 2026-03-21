"use client";

interface TitleEditorProps {
  title: { he: string; en?: string };
  onChange: (title: { he: string; en?: string }) => void;
}

export default function TitleEditor({ title, onChange }: TitleEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="section-title">שם תפקיד בעברית</label>
        <input
          className="input-field"
          type="text"
          required
          dir="rtl"
          value={title.he}
          onChange={(e) => onChange({ ...title, he: e.target.value })}
          placeholder="לדוגמה: מהנדס תוכנה"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="section-title">שם תפקיד באנגלית</label>
        <input
          className="input-field"
          type="text"
          style={{ direction: "ltr", textAlign: "left" }}
          value={title.en ?? ""}
          onChange={(e) =>
            onChange({ ...title, en: e.target.value || undefined })
          }
          placeholder="e.g. Software Engineer"
        />
      </div>
    </div>
  );
}
