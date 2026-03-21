# Canva-CLI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Israeli recruitment poster builder with research-backed templates, expanded data model (logo, contact, salary, benefits), tiered editor UI, and culturally-aware AI generation.

**Architecture:** HTML string generators rendered via Puppeteer + Sharp. Templates are standalone functions that produce complete HTML documents. The editor is a Next.js 16 React frontend. AI uses OpenAI structured outputs with Zod validation.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, OpenAI SDK, Puppeteer, Sharp, Zod

**Design Document:** `docs/plans/2026-03-22-canva-cli-overhaul.md`

---

## File Structure Overview

### Files to CREATE:
- `src/lib/types.ts` — New PosterData model, all type definitions, format dimensions, theme presets, industry presets
- `src/lib/validation.ts` — Contact validation (Israeli phone), benefits limits, logo constraints
- `src/lib/migration.ts` — Convert old PosterData → new format
- `src/lib/fonts.ts` — Font stack definitions + CSS generation for templates
- `src/lib/templates/shared.ts` — Shared HTML utilities (logo zone, contact bar, details list, benefit chips, badge, sharedHead, escapeHtml, etc.)
- `src/lib/templates/corporate.ts` — Replaces clean-corporate
- `src/lib/templates/photo-banner.ts` — Replaces bold-photo
- `src/lib/templates/classic-split.ts` — Replaces split-color
- `src/lib/templates/bold-urgent.ts` — Replaces vibrant-pop
- `src/lib/templates/logo-centered.ts` — New template
- `src/lib/templates/text-stack.ts` — New template
- `src/lib/templates/index.ts` — Template registry (ID → render function)
- `src/app/components/QuickStart.tsx` — Step 1: style preset + company + title
- `src/app/components/ChooseLook.tsx` — Step 2: template grid with real content preview
- `src/app/components/sidebar/TitleEditor.tsx` — Hebrew + English title fields
- `src/app/components/sidebar/CompanyEditor.tsx` — Company name + logo upload
- `src/app/components/sidebar/ThemePicker.tsx` — 8 theme presets + custom hex
- `src/app/components/sidebar/DetailsEditor.tsx` — Details rows (max 5)
- `src/app/components/sidebar/BenefitsEditor.tsx` — Benefit chip input (max 3)
- `src/app/components/sidebar/SalaryEditor.tsx` — Optional salary range
- `src/app/components/sidebar/ContactEditor.tsx` — Contact method + validation
- `src/app/components/sidebar/BackgroundEditor.tsx` — Solid/image/pattern + overlay
- `src/app/components/sidebar/FontPicker.tsx` — 2 font stack options
- `src/app/components/sidebar/ExportSettings.tsx` — Quality, format, PNG toggle
- `src/app/components/preview/LivePreview.tsx` — iframe preview + format tabs
- `src/app/api/ai-improve/route.ts` — AI content improvement endpoint

### Files to MODIFY:
- `src/lib/renderer.ts` — Updated Sharp pipeline (sharpen, quality targeting), new types import
- `src/app/api/ai-generate/route.ts` — New schema, Israeli-aware prompt, industry context
- `src/app/api/generate/route.ts` — Updated imports for new types
- `src/app/page.tsx` — Wizard flow (QuickStart → ChooseLook → Editor)
- `src/app/editor/page.tsx` — Sidebar editor with tiered controls
- `src/app/globals.css` — New component styles (chips, accordions, wizard steps)
- `src/app/layout.tsx` — Updated metadata

### Files to DELETE (after new templates are complete):
- `src/lib/templates.ts` — Replaced by `src/lib/types.ts`
- `src/lib/template-html.ts` — Replaced by per-template files in `src/lib/templates/`

---

## Task 1: New Type Definitions & Validation

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/validation.ts`

This task establishes the new PosterData model that everything else builds on.

- [ ] **Step 1: Create the new types file**

Create `src/lib/types.ts` with the complete new data model:

```typescript
// === Format Types ===
export type PosterFormat = "square" | "story" | "a4";
export type TemplateId = "photo-banner" | "classic-split" | "corporate" | "bold-urgent" | "logo-centered" | "text-stack";
export type FontStackId = "modern" | "bold";
export type ThemePresetId = "tech-blue" | "corporate-navy" | "startup-purple" | "medical-teal" | "urgent-red" | "warm-orange" | "fresh-green" | "neutral-gray";
export type IndustryPreset = "tech" | "blue-collar" | "retail" | "healthcare" | "finance" | "education" | "general";
export type ContactMethod = "whatsapp" | "email" | "phone" | "link";
export type BadgeStyle = "default" | "urgent" | "new";
export type BackgroundType = "solid" | "image" | "pattern";
export type PatternId = "dots" | "grid" | "diagonal-lines";

// === Core Interfaces ===
export interface PosterDetail {
  icon: string;
  label: string;
  value: string;
}

export interface PosterCompany {
  name: string;
  nameEn?: string;
  logoUrl?: string;          // Base64 data URI
  logoBackground: "auto" | "white" | "dark" | "transparent";
}

export interface PosterTitle {
  he: string;
  en?: string;
}

export interface PosterSalary {
  min?: number;
  max?: number;
  currency: "ILS" | "USD";
  period: "month" | "hour" | "year";
  display?: string;          // Override like "לפי ניסיון"
}

export interface PosterContact {
  method: ContactMethod;
  value: string;
  displayText?: string;
}

export interface PosterCta {
  text: string;
  urgent?: boolean;
}

export interface PosterTheme {
  preset?: ThemePresetId;
  primary: string;
  secondary: string;
  textColor: string;
  bgColor: string;
  fontStack: FontStackId;
}

export interface PosterBackground {
  type: BackgroundType;
  color?: string;
  imageUrl?: string;
  imageQuery?: string;
  overlay?: number;          // 0-1
  pattern?: PatternId;
}

export interface PosterBadge {
  text: string;
  style: BadgeStyle;
}

export interface PosterMeta {
  industry?: IndustryPreset;
}

export interface PosterData {
  format: PosterFormat;
  template: TemplateId;
  company: PosterCompany;
  title: PosterTitle;
  subtitle?: string;
  details: PosterDetail[];
  benefits?: string[];
  salary?: PosterSalary;
  contact: PosterContact;
  cta?: PosterCta;
  theme: PosterTheme;
  background: PosterBackground;
  badge?: PosterBadge;
  meta?: PosterMeta;
}

// === Constants ===
export const FORMAT_DIMENSIONS: Record<PosterFormat, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: "ריבוע (1:1)" },
  story: { width: 1080, height: 1920, label: "סטורי (9:16)" },
  a4: { width: 2480, height: 3508, label: "A4" },
};

export const TEMPLATES: Record<TemplateId, { name: string; description: string }> = {
  "photo-banner": { name: "באנר עם תמונה", description: "תמונת רקע עם פאנל תוכן בולט" },
  "classic-split": { name: "קלאסי ישראלי", description: "תמונה למעלה, פאנל צבעוני למטה" },
  "corporate": { name: "קורפורייט", description: "מקצועי ונקי עם סרגל צבעוני" },
  "bold-urgent": { name: "בולט ודחוף", description: "צבעים חזקים, טקסט ענק, בלי תמונה" },
  "logo-centered": { name: "לוגו במרכז", description: "לוגו החברה דומיננטי עם טיפוגרפיה נקייה" },
  "text-stack": { name: "טקסט בלבד", description: "טיפוגרפיה טהורה, קריאות מקסימלית" },
};

export const THEME_PRESETS: Record<ThemePresetId, { name: string; primary: string; secondary: string; bgColor: string; textColor: string }> = {
  "tech-blue": { name: "כחול-טכנולוגי", primary: "#2563EB", secondary: "#38BDF8", bgColor: "#0A0F1A", textColor: "#F0F0F5" },
  "corporate-navy": { name: "כחול-כהה", primary: "#1E3A5F", secondary: "#4A90D9", bgColor: "#0D1B2A", textColor: "#F0F0F5" },
  "startup-purple": { name: "סגול-סטארטאפ", primary: "#6366F1", secondary: "#06B6D4", bgColor: "#0B0D17", textColor: "#F0F0F5" },
  "medical-teal": { name: "טורקיז-רפואי", primary: "#0D9488", secondary: "#2DD4BF", bgColor: "#0A1210", textColor: "#F0F0F5" },
  "urgent-red": { name: "אדום-דחוף", primary: "#DC2626", secondary: "#F97316", bgColor: "#140A0A", textColor: "#F0F0F5" },
  "warm-orange": { name: "כתום-חם", primary: "#EA580C", secondary: "#F59E0B", bgColor: "#0F1419", textColor: "#F0F0F5" },
  "fresh-green": { name: "ירוק-רענן", primary: "#059669", secondary: "#34D399", bgColor: "#0A1210", textColor: "#F0F0F5" },
  "neutral-gray": { name: "אפור-ניטרלי", primary: "#475569", secondary: "#94A3B8", bgColor: "#F7F7FA", textColor: "#1E293B" },
};

export const INDUSTRY_PRESETS: Record<IndustryPreset, { name: string; defaultTheme: ThemePresetId; defaultTemplate: TemplateId; defaultFontStack: FontStackId; aiContext: string }> = {
  tech: {
    name: "הייטק / סטארטאפ",
    defaultTheme: "startup-purple",
    defaultTemplate: "corporate",
    defaultFontStack: "modern",
    aiContext: "Tech/startup position. Use English job title. Mention tech stack if provided. Casual-professional tone. LinkedIn + Facebook distribution.",
  },
  "blue-collar": {
    name: "שטח / ייצור / לוגיסטיקה",
    defaultTheme: "urgent-red",
    defaultTemplate: "bold-urgent",
    defaultFontStack: "bold",
    aiContext: "Blue-collar/field position. Hebrew only. Emphasize: immediate start, hourly/daily wage, location, transportation. Urgent tone. WhatsApp distribution.",
  },
  retail: {
    name: "קמעונאות / שירות",
    defaultTheme: "warm-orange",
    defaultTemplate: "bold-urgent",
    defaultFontStack: "bold",
    aiContext: "Retail/service position. Friendly tone. Mention: shifts, employee benefits, part-time availability. Hebrew primary.",
  },
  healthcare: {
    name: "בריאות / רפואה",
    defaultTheme: "medical-teal",
    defaultTemplate: "corporate",
    defaultFontStack: "modern",
    aiContext: "Healthcare position. Professional tone. Mention: license requirements, institution name, department. Formal.",
  },
  finance: {
    name: "פיננסים / משפטים",
    defaultTheme: "corporate-navy",
    defaultTemplate: "corporate",
    defaultFontStack: "modern",
    aiContext: "Finance/legal position. Professional, formal tone. Hebrew primary with English terminology where standard.",
  },
  education: {
    name: "חינוך / אקדמיה",
    defaultTheme: "fresh-green",
    defaultTemplate: "classic-split",
    defaultFontStack: "modern",
    aiContext: "Education position. Warm, professional tone. Hebrew primary. Mention qualifications and certifications.",
  },
  general: {
    name: "כללי",
    defaultTheme: "tech-blue",
    defaultTemplate: "corporate",
    defaultFontStack: "modern",
    aiContext: "General position. Neutral professional tone. Hebrew primary.",
  },
};

export const ICON_COLORS = ["purple", "cyan", "pink", "amber", "green", "blue", "red", "emerald"] as const;
export type IconColor = (typeof ICON_COLORS)[number];

export const DEFAULT_POSTER_DATA: PosterData = {
  format: "square",
  template: "corporate",
  company: { name: "", logoBackground: "auto" },
  title: { he: "" },
  details: [],
  contact: { method: "whatsapp", value: "" },
  theme: {
    primary: "#6366F1",
    secondary: "#06B6D4",
    textColor: "#F0F0F5",
    bgColor: "#0B0D17",
    fontStack: "modern",
  },
  background: { type: "solid" },
};
```

- [ ] **Step 2: Create the validation file**

Create `src/lib/validation.ts`:

```typescript
import type { PosterContact, PosterData } from "./types";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateContact(contact: PosterContact): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!contact.value.trim()) {
    errors.push({ field: "contact.value", message: "חובה להזין פרטי קשר" });
    return errors;
  }

  switch (contact.method) {
    case "whatsapp":
    case "phone": {
      // Israeli phone: 05X-XXXXXXX, +972-5X-XXXXXXX, or 10-digit starting with 05
      const cleaned = contact.value.replace(/[\s\-()]/g, "");
      const isValid = /^(\+972|972)?0?5\d{8}$/.test(cleaned) || /^05\d{8}$/.test(cleaned);
      if (!isValid) {
        errors.push({ field: "contact.value", message: "מספר טלפון ישראלי לא תקין (05X-XXXXXXX)" });
      }
      break;
    }
    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.value)) {
        errors.push({ field: "contact.value", message: "כתובת מייל לא תקינה" });
      }
      break;
    }
    case "link": {
      try {
        new URL(contact.value);
      } catch {
        errors.push({ field: "contact.value", message: "כתובת URL לא תקינה" });
      }
      break;
    }
  }

  return errors;
}

export function validateBenefits(benefits: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  if (benefits.length > 3) {
    errors.push({ field: "benefits", message: "ניתן להוסיף עד 3 הטבות" });
  }
  benefits.forEach((b, i) => {
    if (b.length > 20) {
      errors.push({ field: `benefits[${i}]`, message: `הטבה ${i + 1} ארוכה מדי (מקסימום 20 תווים)` });
    }
  });
  return errors;
}

export function validatePosterData(data: PosterData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.title.he.trim()) {
    errors.push({ field: "title.he", message: "חובה להזין שם תפקיד בעברית" });
  }
  if (!data.company.name.trim()) {
    errors.push({ field: "company.name", message: "חובה להזין שם חברה" });
  }
  if (data.details.length > 5) {
    errors.push({ field: "details", message: "ניתן להוסיף עד 5 פרטים" });
  }
  if (data.benefits) {
    errors.push(...validateBenefits(data.benefits));
  }
  if (data.salary?.display && data.salary.display.length > 30) {
    errors.push({ field: "salary.display", message: "תיאור שכר ארוך מדי (מקסימום 30 תווים)" });
  }

  errors.push(...validateContact(data.contact));

  return errors;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /c/Learnings/canva-cli && npx tsc --noEmit src/lib/types.ts src/lib/validation.ts`
Expected: No errors (these files are standalone)

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/validation.ts
git commit -m "feat: add new PosterData model and validation utilities"
```

---

## Task 2: Migration Utility & Font Definitions

**Files:**
- Create: `src/lib/migration.ts`
- Create: `src/lib/fonts.ts`

- [ ] **Step 1: Create the migration file**

Create `src/lib/migration.ts`. This converts old PosterData format to the new one:

```typescript
import type { PosterData, TemplateId } from "./types";

interface OldPosterData {
  format: "story" | "post" | "a4";
  template: string;
  badge?: { icon: string; text: string };
  subtitle?: string;
  titleHe: string;
  titleEn?: string;
  details: Array<{ icon: string; label: string; value: string; highlight?: string }>;
  cta: { text: string; subtext: string; icon: string };
  theme: { primary: string; accent: string; bgColor: string };
  backgroundQuery?: string;
  backgroundUrl?: string;
}

const TEMPLATE_MAP: Record<string, TemplateId> = {
  "bold-photo": "photo-banner",
  "split-color": "classic-split",
  "clean-corporate": "corporate",
  "vibrant-pop": "bold-urgent",
  // Deleted templates → safe default
  "dark-cards": "corporate",
  "gradient-wave": "corporate",
  "minimal-elegant": "corporate",
  "geometric": "corporate",
};

function extractContact(subtext: string): { method: "whatsapp" | "email" | "phone" | "link"; value: string } {
  // Try to find phone number
  const phoneMatch = subtext.match(/0[5]\d[\d\-]{7,}/);
  if (phoneMatch) {
    return { method: "whatsapp", value: phoneMatch[0].replace(/\D/g, "") };
  }
  // Try to find email
  const emailMatch = subtext.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  if (emailMatch) {
    return { method: "email", value: emailMatch[0] };
  }
  // Fallback
  return { method: "whatsapp", value: "" };
}

export function migrateOldPosterData(old: OldPosterData): PosterData {
  const contact = extractContact(old.cta.subtext);

  // NOTE: The old PosterDetail.highlight field is intentionally dropped.
  // The new templates don't use per-value highlighting — the accent color is
  // applied at the template level instead. This is a breaking change for
  // existing posters that used highlights, but the visual impact is minimal.
  return {
    format: old.format === "post" ? "square" : old.format,
    template: TEMPLATE_MAP[old.template] || "corporate",
    company: { name: "", logoBackground: "auto" },
    title: { he: old.titleHe, en: old.titleEn },
    subtitle: old.subtitle,
    details: old.details.map((d) => ({ icon: d.icon, label: d.label, value: d.value })),
    contact,
    cta: { text: old.cta.text },
    theme: {
      primary: old.theme.primary,
      secondary: old.theme.accent,
      textColor: "#F0F0F5",
      bgColor: old.theme.bgColor,
      fontStack: "modern",
    },
    background: {
      type: old.backgroundUrl ? "image" : "solid",
      imageUrl: old.backgroundUrl,
      imageQuery: old.backgroundQuery,
    },
    badge: old.badge ? { text: old.badge.text, style: "default" } : undefined,
  };
}

export function isOldFormat(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return "titleHe" in obj && !("title" in obj);
}
```

- [ ] **Step 2: Create the fonts file**

Create `src/lib/fonts.ts`:

```typescript
import type { FontStackId } from "./types";

export interface FontStack {
  name: string;
  headlineWeight: number;
  bodyWeight: number;
  family: string;
  lineHeight: number;
  lineHeightBidi: number;
}

export const FONT_STACKS: Record<FontStackId, FontStack> = {
  modern: {
    name: "מודרני",
    headlineWeight: 700,
    bodyWeight: 400,
    family: "'Heebo', sans-serif",
    lineHeight: 1.35,
    lineHeightBidi: 1.4,
  },
  bold: {
    name: "בולט",
    headlineWeight: 900,
    bodyWeight: 500,
    family: "'Heebo', sans-serif",
    lineHeight: 1.35,
    lineHeightBidi: 1.4,
  },
};

export function fontCss(stackId: FontStackId): string {
  const stack = FONT_STACKS[stackId];
  return `
    .headline { font-family: ${stack.family}; font-weight: ${stack.headlineWeight}; line-height: ${stack.lineHeight}; }
    .body-text { font-family: ${stack.family}; font-weight: ${stack.bodyWeight}; line-height: ${stack.lineHeight}; }
    .bidi-text { font-family: ${stack.family}; line-height: ${stack.lineHeightBidi}; }
  `;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/migration.ts src/lib/fonts.ts
git commit -m "feat: add migration utility and font stack definitions"
```

---

## Task 3: Shared Template Utilities

**Files:**
- Create: `src/lib/templates/shared.ts`

This extracts and enhances the shared utilities from the old `template-html.ts`.

- [ ] **Step 1: Create shared template utilities**

Create `src/lib/templates/shared.ts`:

```typescript
import { PosterData, FORMAT_DIMENSIONS, ICON_COLORS, IconColor } from "../types";
import { FONT_STACKS } from "../fonts";

// === Icon Color System ===

export const ICON_GRADIENTS: Record<IconColor, [string, string]> = {
  purple: ["#6366F1", "#818CF8"],
  cyan: ["#06B6D4", "#22D3EE"],
  pink: ["#EC4899", "#F472B6"],
  amber: ["#F59E0B", "#FBBF24"],
  green: ["#10B981", "#34D399"],
  blue: ["#2563EB", "#3B82F6"],
  red: ["#DC2626", "#EF4444"],
  emerald: ["#059669", "#10B981"],
};

export function getIconColor(index: number): IconColor {
  return ICON_COLORS[index % ICON_COLORS.length];
}

// === Text Utilities ===

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// === Color Utilities ===

export function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// === Shared HTML Fragments ===

export function sharedHead(data: PosterData): string {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  `;
}

export function backgroundCss(data: PosterData): string {
  if (data.background.type === "image" && data.background.imageUrl) {
    return `url('${data.background.imageUrl}') center/cover no-repeat`;
  }
  if (data.background.type === "pattern") {
    return data.background.color || data.theme.bgColor;
  }
  return `linear-gradient(135deg, ${data.theme.bgColor} 0%, ${adjustColor(data.theme.bgColor, 15)} 50%, ${data.theme.bgColor} 100%)`;
}

export function patternOverlayCss(data: PosterData, scale: number): string {
  if (data.background.type !== "pattern" || !data.background.pattern) return "";
  const patterns: Record<string, string> = {
    dots: `radial-gradient(circle, ${hexToRgba(data.theme.primary, 0.08)} 1px, transparent 1px)`,
    grid: `linear-gradient(${hexToRgba(data.theme.primary, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRgba(data.theme.primary, 0.05)} 1px, transparent 1px)`,
    "diagonal-lines": `repeating-linear-gradient(45deg, ${hexToRgba(data.theme.primary, 0.04)}, ${hexToRgba(data.theme.primary, 0.04)} 1px, transparent 1px, transparent ${20 * scale}px)`,
  };
  return patterns[data.background.pattern] || "";
}

export function imageOverlayCss(data: PosterData): string {
  if (data.background.type !== "image" || !data.background.imageUrl) return "";
  const opacity = data.background.overlay ?? 0.6;
  return `linear-gradient(to bottom, ${hexToRgba(data.theme.bgColor, opacity)}, ${hexToRgba(data.theme.bgColor, opacity)})`;
}

// === Reusable HTML Components ===

export function renderLogoZone(data: PosterData, scale: number): string {
  if (!data.company.logoUrl && !data.company.name) return "";

  if (data.company.logoUrl) {
    const logoBg = data.company.logoBackground === "white" ? "#FFFFFF"
      : data.company.logoBackground === "dark" ? "#1a1a2e"
      : "transparent";
    const containerStyle = logoBg !== "transparent"
      ? `background: ${logoBg}; border-radius: ${8 * scale}px; padding: ${6 * scale}px ${12 * scale}px;`
      : "";
    return `
      <div class="logo-zone" style="${containerStyle}">
        <img src="${escapeHtml(data.company.logoUrl)}" alt="${escapeHtml(data.company.name)}"
          style="max-width: ${200 * scale}px; max-height: ${60 * scale}px; object-fit: contain;"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        <div style="display: none; font-size: ${22 * scale}px; font-weight: 700; color: ${data.theme.primary};">
          ${escapeHtml(data.company.name)}
        </div>
      </div>
    `;
  }

  return `
    <div class="logo-zone" style="font-size: ${22 * scale}px; font-weight: 700; color: ${data.theme.primary};">
      ${escapeHtml(data.company.name)}
    </div>
  `;
}

export function renderBadge(data: PosterData, scale: number): string {
  if (!data.badge) return "";
  const bgColors: Record<string, string> = {
    default: data.theme.primary,
    urgent: "#DC2626",
    new: "#059669",
  };
  const bg = bgColors[data.badge.style] || data.theme.primary;
  return `
    <div class="poster-badge" style="
      display: inline-block;
      background: ${bg};
      color: white;
      padding: ${6 * scale}px ${16 * scale}px;
      border-radius: ${20 * scale}px;
      font-size: ${16 * scale}px;
      font-weight: 700;
      letter-spacing: 0.5px;
    ">${escapeHtml(data.badge.text)}</div>
  `;
}

export function renderDetailsList(data: PosterData, scale: number, layout: "list" | "grid" = "list"): string {
  if (data.details.length === 0) return "";

  const items = data.details.map((detail, i) => {
    const color = getIconColor(i);
    const [gradFrom, gradTo] = ICON_GRADIENTS[color];
    return `
      <div class="detail-item" style="
        display: flex;
        align-items: center;
        gap: ${12 * scale}px;
        ${layout === "grid" ? `padding: ${10 * scale}px;` : `padding: ${8 * scale}px 0;`}
      ">
        <div style="
          width: ${38 * scale}px;
          height: ${38 * scale}px;
          border-radius: ${10 * scale}px;
          background: linear-gradient(135deg, ${gradFrom}, ${gradTo});
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          <i class="${escapeHtml(detail.icon)}" style="font-size: ${16 * scale}px; color: white;"></i>
        </div>
        <div>
          <div style="font-size: ${14 * scale}px; color: ${hexToRgba(data.theme.textColor, 0.5)}; font-weight: 400;">
            ${escapeHtml(detail.label)}
          </div>
          <div style="font-size: ${18 * scale}px; color: ${data.theme.textColor}; font-weight: 600;">
            ${escapeHtml(detail.value)}
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (layout === "grid") {
    return `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${8 * scale}px;">${items}</div>`;
  }
  return `<div class="details-list">${items}</div>`;
}

export function renderBenefitChips(data: PosterData, scale: number): string {
  if (!data.benefits || data.benefits.length === 0) return "";
  const chips = data.benefits.map((b) => `
    <span style="
      display: inline-block;
      background: ${hexToRgba(data.theme.primary, 0.15)};
      color: ${data.theme.primary};
      padding: ${4 * scale}px ${12 * scale}px;
      border-radius: ${16 * scale}px;
      font-size: ${14 * scale}px;
      font-weight: 600;
    ">${escapeHtml(b)}</span>
  `).join("");
  return `<div style="display: flex; flex-wrap: wrap; gap: ${8 * scale}px; justify-content: center;">${chips}</div>`;
}

export function renderSalary(data: PosterData, scale: number): string {
  if (!data.salary) return "";
  let text = data.salary.display || "";
  if (!text) {
    const curr = data.salary.currency === "ILS" ? "₪" : "$";
    const period = data.salary.period === "month" ? "/חודש" : data.salary.period === "hour" ? "/שעה" : "/שנה";
    if (data.salary.min && data.salary.max) {
      text = `${curr}${data.salary.min.toLocaleString()}-${curr}${data.salary.max.toLocaleString()} ${period}`;
    } else if (data.salary.min) {
      text = `מ-${curr}${data.salary.min.toLocaleString()} ${period}`;
    } else if (data.salary.max) {
      text = `עד ${curr}${data.salary.max.toLocaleString()} ${period}`;
    }
  }
  if (!text) return "";
  return `
    <div style="
      display: flex;
      align-items: center;
      gap: ${8 * scale}px;
      font-size: ${18 * scale}px;
      font-weight: 700;
      color: ${data.theme.primary};
    ">
      <i class="fa-solid fa-shekel-sign" style="font-size: ${16 * scale}px;"></i>
      ${escapeHtml(text)}
    </div>
  `;
}

export function renderContactBar(data: PosterData, scale: number): string {
  const icons: Record<string, string> = {
    whatsapp: "fa-brands fa-whatsapp",
    email: "fa-solid fa-envelope",
    phone: "fa-solid fa-phone",
    link: "fa-solid fa-link",
  };
  const icon = icons[data.contact.method] || "fa-solid fa-paper-plane";
  const displayText = data.contact.displayText
    || (data.contact.method === "whatsapp" ? `וואטסאפ: ${data.contact.value}` : data.contact.value);
  const ctaText = data.cta?.text || "שלחו קורות חיים";
  const isUrgent = data.cta?.urgent;

  return `
    <div class="contact-bar" style="
      background: ${data.theme.primary};
      ${isUrgent ? `animation: pulse-border 2s infinite; box-shadow: 0 0 ${20 * scale}px ${hexToRgba(data.theme.primary, 0.4)};` : ""}
      padding: ${16 * scale}px ${24 * scale}px;
      border-radius: ${14 * scale}px;
      text-align: center;
      color: white;
    ">
      <div style="font-size: ${22 * scale}px; font-weight: 700; margin-bottom: ${6 * scale}px;">
        <i class="${icon}" style="margin-left: ${8 * scale}px;"></i>
        ${escapeHtml(ctaText)}
      </div>
      <div style="font-size: ${16 * scale}px; font-weight: 400; opacity: 0.85;">
        ${escapeHtml(displayText)}
      </div>
    </div>
  `;
}

export function renderCompanyFooter(data: PosterData, scale: number): string {
  return `
    <div style="
      text-align: center;
      font-size: ${13 * scale}px;
      color: ${hexToRgba(data.theme.textColor, 0.3)};
      padding-top: ${8 * scale}px;
    ">${escapeHtml(data.company.name)}${data.company.nameEn ? ` | ${escapeHtml(data.company.nameEn)}` : ""}</div>
  `;
}

// === Base styles shared by all templates ===

export function baseStyles(data: PosterData, width: number, height: number, scale: number): string {
  const fontStack = FONT_STACKS[data.theme.fontStack];
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      font-family: ${fontStack.family};
      font-weight: ${fontStack.bodyWeight};
      line-height: ${fontStack.lineHeight};
      color: ${data.theme.textColor};
      overflow: hidden;
      position: relative;
      direction: rtl;
    }
    @keyframes pulse-border {
      0%, 100% { box-shadow: 0 0 ${20 * scale}px ${hexToRgba(data.theme.primary, 0.4)}; }
      50% { box-shadow: 0 0 ${30 * scale}px ${hexToRgba(data.theme.primary, 0.7)}; }
    }
  `;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/templates/shared.ts
git commit -m "feat: add shared template HTML utilities"
```

---

## Task 4: Corporate Template (POC — First Template)

**Files:**
- Create: `src/lib/templates/corporate.ts`
- Create: `src/lib/templates/index.ts`

This is the proof-of-concept template. Based on the old `clean-corporate` but redesigned: higher contrast, brand-color header bar, logo zone, contact bar, benefit chips.

- [ ] **Step 1: Create the corporate template**

Create `src/lib/templates/corporate.ts`:

```typescript
import { PosterData, FORMAT_DIMENSIONS } from "../types";
import {
  sharedHead, backgroundCss, baseStyles, escapeHtml,
  renderLogoZone, renderBadge, renderDetailsList,
  renderBenefitChips, renderSalary, renderContactBar,
  renderCompanyFooter, hexToRgba, adjustColor,
} from "./shared";

export function renderCorporate(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isSquare = data.format === "square";

  const headerHeight = isSquare ? 140 * scale : 180 * scale;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    ${baseStyles(data, width, height, scale)}

    body {
      background: #F7F7FA;
      color: #1E293B;
    }

    .header-bar {
      background: ${data.theme.primary};
      height: ${headerHeight}px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 ${40 * scale}px;
      position: relative;
    }

    .header-bar::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${4 * scale}px;
      background: ${data.theme.secondary};
    }

    .content {
      padding: ${32 * scale}px ${40 * scale}px;
      display: flex;
      flex-direction: column;
      gap: ${20 * scale}px;
      height: calc(100% - ${headerHeight}px);
      justify-content: space-between;
    }

    .title-he {
      font-size: ${isSquare ? 42 * scale : 48 * scale}px;
      font-weight: 800;
      color: #1E293B;
      line-height: 1.2;
    }

    .title-en {
      font-size: ${20 * scale}px;
      color: #64748B;
      font-weight: 400;
      direction: ltr;
      text-align: right;
      margin-top: ${4 * scale}px;
    }

    .subtitle {
      font-size: ${18 * scale}px;
      color: #64748B;
      font-weight: 400;
    }

    .divider {
      height: 1px;
      background: #E2E8F0;
      margin: ${8 * scale}px 0;
    }

    /* Faint grid background */
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px);
      background-size: ${40 * scale}px ${40 * scale}px;
      pointer-events: none;
      z-index: 0;
    }

    .content { position: relative; z-index: 1; }
  </style>
</head>
<body>
  <div class="header-bar">
    ${renderLogoZone({
      ...data,
      theme: { ...data.theme, textColor: "#FFFFFF", primary: "#FFFFFF" },
    }, scale)}
    ${renderBadge({
      ...data,
      badge: data.badge ? { ...data.badge, style: "default" } : undefined,
      theme: { ...data.theme, primary: "#FFFFFF" },
    }, scale)}
  </div>

  <div class="content">
    <div>
      ${data.subtitle ? `<div class="subtitle">${escapeHtml(data.subtitle)}</div>` : ""}
      <div class="title-he">${escapeHtml(data.title.he)}</div>
      ${data.title.en ? `<div class="title-en">${escapeHtml(data.title.en)}</div>` : ""}
    </div>

    <div class="divider"></div>

    ${renderDetailsList({ ...data, theme: { ...data.theme, textColor: "#1E293B" } }, scale, "grid")}

    ${renderSalary({ ...data, theme: { ...data.theme } }, scale)}

    ${renderBenefitChips(data, scale)}

    ${renderContactBar(data, scale)}

    ${renderCompanyFooter({ ...data, theme: { ...data.theme, textColor: "#1E293B" } }, scale)}
  </div>
</body>
</html>`;
}
```

- [ ] **Step 2: Create the template registry**

Create `src/lib/templates/index.ts`:

```typescript
import type { PosterData, TemplateId } from "../types";
import { renderCorporate } from "./corporate";

// Templates are registered here as they're implemented.
// Phase 1b will add the remaining 5 templates.
const TEMPLATE_RENDERERS: Record<string, (data: PosterData) => string> = {
  corporate: renderCorporate,
};

export function generateTemplateHtml(data: PosterData): string {
  const renderer = TEMPLATE_RENDERERS[data.template];
  if (!renderer) {
    throw new Error(`Unknown template: ${data.template}. Available: ${Object.keys(TEMPLATE_RENDERERS).join(", ")}`);
  }
  return renderer(data);
}

export function getAvailableTemplates(): TemplateId[] {
  return Object.keys(TEMPLATE_RENDERERS) as TemplateId[];
}
```

- [ ] **Step 3: Verify the template renders valid HTML**

Manually test by creating a simple script or using the dev server. The HTML should be a self-contained document that opens in a browser.

Run: `cd /c/Learnings/canva-cli && npx tsc --noEmit src/lib/templates/index.ts src/lib/templates/corporate.ts src/lib/templates/shared.ts`

- [ ] **Step 4: Commit**

```bash
git add src/lib/templates/corporate.ts src/lib/templates/index.ts
git commit -m "feat: add corporate template as POC for new template architecture"
```

---

## Task 5: Update Renderer Pipeline

**Files:**
- Modify: `src/lib/renderer.ts`

Update the renderer to use the new types and add Sharp sharpening + quality targeting.

- [ ] **Step 1: Update renderer.ts**

Replace the entire file with:

```typescript
import puppeteer, { Browser } from "puppeteer";
import sharp from "sharp";
import { PosterData, FORMAT_DIMENSIONS } from "./types";
import { generateTemplateHtml } from "./templates/index";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  return browserInstance;
}

const MAX_FILE_SIZE = 800 * 1024; // 800KB target for WhatsApp
const MIN_QUALITY = 80;

export async function renderPoster(data: PosterData): Promise<Buffer> {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const html = generateTemplateHtml(data);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 500));

    const screenshot = (await page.screenshot({ type: "png" })) as Buffer;

    // Apply sharpening to counteract WhatsApp compression blur
    let quality = 88;
    let jpegBuffer = await sharp(screenshot)
      .sharpen({ sigma: 0.5 })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    // Iteratively reduce quality if file is too large
    while (jpegBuffer.length > MAX_FILE_SIZE && quality > MIN_QUALITY) {
      quality -= 2;
      jpegBuffer = await sharp(screenshot)
        .sharpen({ sigma: 0.5 })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    return jpegBuffer;
  } finally {
    await page.close();
  }
}
```

- [ ] **Step 2: Add compatibility re-exports**

To keep the build working while we transition, create re-export shims so existing imports don't break. Add to the BOTTOM of `src/lib/templates.ts` (the old file):

```typescript
// Re-export new types for gradual migration
export type { PosterData as PosterDataNew } from "./types";
```

And update `src/lib/template-html.ts` to also re-export from the new template registry by adding at the bottom:

```typescript
// Forward to new template system for any new template IDs
export { generateTemplateHtml as generateTemplateHtmlNew } from "./templates/index";
```

This keeps old imports working until Task 7 when we delete the old files.

- [ ] **Step 3: Verify build passes**

Run: `cd /c/Learnings/canva-cli && npx tsc --noEmit`
Expected: Build passes — old files still export everything the editor and pages need.

- [ ] **Step 4: Commit**

```bash
git add src/lib/renderer.ts src/lib/templates.ts src/lib/template-html.ts
git commit -m "feat: update renderer with sharpening and quality targeting for WhatsApp"
```

---

## Task 6: Update API Routes

**Files:**
- Modify: `src/app/api/generate/route.ts`
- Modify: `src/app/api/ai-generate/route.ts`

- [ ] **Step 1: Update generate/route.ts**

Update the import to use new types:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { renderPoster } from "@/lib/renderer";
import { PosterData } from "@/lib/types";
import { isOldFormat, migrateOldPosterData } from "@/lib/migration";

export async function POST(request: NextRequest) {
  try {
    let data: PosterData = await request.json();

    // Support old format via migration
    if (isOldFormat(data)) {
      data = migrateOldPosterData(data as unknown as Parameters<typeof migrateOldPosterData>[0]);
    }

    const imageBuffer = await renderPoster(data);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="poster-${data.format}-${Date.now()}.jpg"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update ai-generate/route.ts with new schema and Israeli-aware prompt**

Replace the entire file:

```typescript
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod/v4";
import { zodResponseFormat } from "openai/helpers/zod";
import { INDUSTRY_PRESETS, IndustryPreset } from "@/lib/types";

const PosterDataSchema = z.object({
  template: z.enum(["photo-banner", "classic-split", "corporate", "bold-urgent", "logo-centered", "text-stack"]),
  company: z.object({
    name: z.string().describe("Company name in Hebrew"),
    nameEn: z.string().nullable().describe("Company name in English, or null"),
  }),
  title: z.object({
    he: z.string().describe("Job title in Hebrew — max 4 words"),
    en: z.string().nullable().describe("Job title in English (for tech roles), or null"),
  }),
  subtitle: z.string().nullable().describe("Department or tagline, or null"),
  details: z.array(z.object({
    icon: z.string().describe("Font Awesome 6 solid class, e.g. 'fa-solid fa-briefcase'"),
    label: z.string().describe("Short Hebrew label — max 3 words"),
    value: z.string().describe("Hebrew value — max 5 words"),
  })).describe("3-5 key job details"),
  benefits: z.array(z.string()).nullable().describe("1-3 short benefit tags (max 20 chars each), or null"),
  salary: z.object({
    display: z.string().nullable().describe("Salary display text like 'לפי ניסיון' or '₪15,000-20,000/חודש', or null"),
  }).nullable(),
  contact: z.object({
    method: z.enum(["whatsapp", "email", "phone", "link"]),
    value: z.string().describe("Contact value — phone number, email, or URL"),
    displayText: z.string().nullable().describe("Override display text, or null"),
  }),
  cta: z.object({
    text: z.string().describe("Call-to-action text in Hebrew"),
    urgent: z.boolean().describe("Whether to show urgent styling"),
  }),
  theme: z.object({
    primary: z.string().describe("Primary hex color"),
    secondary: z.string().describe("Secondary/accent hex color"),
    bgColor: z.string().describe("Background hex color"),
  }),
  badge: z.object({
    text: z.string().describe("Badge text like 'משרה חדשה', 'דרוש/ה!', 'דחוף'"),
    style: z.enum(["default", "urgent", "new"]),
  }).nullable(),
  backgroundQuery: z.string().nullable().describe("English Unsplash query for background, or null. Must be abstract/environmental — never search for people."),
});

const SYSTEM_PROMPT = `You are a recruitment content specialist for the Israeli job market.

Your job is to generate structured JSON for a recruitment poster.

RULES:
- Job titles: Use the standard Israeli market term. Tech roles keep English titles (e.g., "Full Stack Developer") but everything else is Hebrew.
- Tone: Direct and informative. Israeli recruitment posts are NOT flowery. No "exciting opportunity" or "dynamic team" — state what the job IS.
- Benefits: Only mention benefits that are DIFFERENTIATING. "Pension" alone is not a benefit (it's legally required). "Keren Hishtalmut from day 1" or "Hybrid 3 days" IS a benefit. Max 3 benefits, max 20 chars each.
- Location: Always include city. Add landmark context for commute (e.g., "תל אביב — ליד תחנת השלום").
- Contact: Israeli candidates expect a direct WhatsApp number. Prefer whatsapp method.
- Length: Poster text must be ultra-concise. Max 5 words per detail value. Headlines max 4 words Hebrew.
- Details: Pick the 3-5 most relevant from: location, scope (full/part-time), experience, key tech/skill requirement, start date. Do NOT include generic details like "great atmosphere".
- Template selection:
  * "corporate" - general professional roles, finance, legal, HR (light bg, clean)
  * "photo-banner" - roles where workplace imagery matters (with background image)
  * "classic-split" - general roles, classic Israeli recruitment style
  * "bold-urgent" - retail, delivery, blue-collar, urgent hires (bold colors, no image)
  * "logo-centered" - established companies with strong brand
  * "text-stack" - maximum readability, WhatsApp-optimized
- Color schemes: Choose colors that reflect the industry. Tech = blues/purples. Urgent = reds/oranges. Healthcare = teals/greens. Corporate = navy/gray.
- Background queries: Only abstract/environmental queries (modern office, tel aviv skyline, warehouse interior). NEVER search for people.`;

async function searchUnsplash(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  try {
    const res = await fetch(
      \`https://api.unsplash.com/search/photos?query=\${encodeURIComponent(query)}&per_page=1&orientation=portrait\`,
      { headers: { Authorization: \`Client-ID \${accessKey}\` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, format, template, model, industry } = body as {
      description: string;
      format: string;
      template?: string;
      model?: string;
      industry?: IndustryPreset;
    };

    if (!description || !format) {
      return NextResponse.json(
        { error: "Missing required fields: description, format" },
        { status: 400 }
      );
    }

    const industryContext = industry && INDUSTRY_PRESETS[industry]
      ? \`\\nIndustry context: \${INDUSTRY_PRESETS[industry].aiContext}\`
      : "";

    const openai = new OpenAI();

    const completion = await openai.chat.completions.parse({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: \`Create a recruitment poster.\\nFormat: \${format}\${template ? \`\\nPreferred template: \${template}\` : ""}\${industryContext}\\nDescription: \${description}\`,
        },
      ],
      response_format: zodResponseFormat(PosterDataSchema, "poster_data"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to generate structured poster data from AI" },
        { status: 500 }
      );
    }

    // Build full PosterData from AI output
    const posterData = {
      format,
      template: template || parsed.template,
      company: {
        name: parsed.company.name,
        nameEn: parsed.company.nameEn || undefined,
        logoBackground: "auto" as const,
      },
      title: {
        he: parsed.title.he,
        en: parsed.title.en || undefined,
      },
      subtitle: parsed.subtitle || undefined,
      details: parsed.details,
      benefits: parsed.benefits || undefined,
      salary: parsed.salary?.display ? { display: parsed.salary.display, currency: "ILS" as const, period: "month" as const } : undefined,
      contact: {
        method: parsed.contact.method,
        value: parsed.contact.value,
        displayText: parsed.contact.displayText || undefined,
      },
      cta: parsed.cta,
      theme: {
        primary: parsed.theme.primary,
        secondary: parsed.theme.secondary,
        textColor: "#F0F0F5",
        bgColor: parsed.theme.bgColor,
        fontStack: (industry === "blue-collar" || industry === "retail" ? "bold" : "modern") as const,
      },
      background: {
        type: "solid" as const,
      },
      badge: parsed.badge || undefined,
    };

    // Search Unsplash if query provided
    if (parsed.backgroundQuery) {
      const imageUrl = await searchUnsplash(parsed.backgroundQuery);
      if (imageUrl) {
        posterData.background = { type: "image" as const, imageUrl, overlay: 0.6 };
      }
    }

    return NextResponse.json(posterData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

Note: The template literal backticks inside the string need to be actual backticks. The `\`` escaping above is for the markdown — in the actual file use normal template literals.

- [ ] **Step 3: Verify build**

Run: `cd /c/Learnings/canva-cli && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/generate/route.ts src/app/api/ai-generate/route.ts
git commit -m "feat: update API routes with new schema and Israeli-aware AI prompt"
```

---

## Task 7: Remaining Templates (Phase 1b)

**Files:**
- Create: `src/lib/templates/photo-banner.ts`
- Create: `src/lib/templates/classic-split.ts`
- Create: `src/lib/templates/bold-urgent.ts`
- Create: `src/lib/templates/logo-centered.ts`
- Create: `src/lib/templates/text-stack.ts`
- Modify: `src/lib/templates/index.ts`

Each template is a standalone HTML string generator function using the shared utilities. Follow the **exact same pattern** as the `corporate` template in Task 4. Every template function:

1. Takes `(data: PosterData)` and returns a complete `<!DOCTYPE html>` string
2. Starts with `const { width, height } = FORMAT_DIMENSIONS[data.format]; const scale = width / 1080;`
3. Uses `sharedHead(data)` in `<head>`, `baseStyles(data, width, height, scale)` in `<style>`
4. Composes body from shared utilities: `renderLogoZone()`, `renderBadge()`, `renderDetailsList()`, `renderBenefitChips()`, `renderSalary()`, `renderContactBar()`, `renderCompanyFooter()`
5. All dimensions multiplied by `scale` (e.g., `${40 * scale}px`)
6. HTML uses `lang="he" dir="rtl"`, body overrides colors per template
7. Uses `backgroundCss(data)` for background, `imageOverlayCss(data)` for image overlay
8. Exports a single function: `export function renderTemplateName(data: PosterData): string`

Reference the OLD templates in `src/lib/template-html.ts` for CSS patterns — the old `renderBoldPhoto` (line 346), `renderSplitColor` (line 629), `renderVibrantPop` (line 1154) contain the layout CSS that should be adapted.

- [ ] **Step 1: Create photo-banner template**

Create `src/lib/templates/photo-banner.ts`. Based on old `renderBoldPhoto` (template-html.ts line 346-623).

**Layout structure (top to bottom):**
```
┌─────────────────────────┐
│ [Logo]        [Badge]   │ ← over image, absolute positioned
│                         │
│    Background Image     │ ← 40% height, with gradient overlay
│    (or gradient)        │   using imageOverlayCss()
├─────────────────────────┤
│ Subtitle                │
│ TITLE HE (large)        │ ← 60% height content area
│ Title En (small, gray)  │   bgColor background
│                         │
│ ── divider ──           │
│ [detail] [detail]       │ ← renderDetailsList(data, scale, "grid")
│ [detail] [detail]       │
│                         │
│ [benefit] [benefit]     │ ← renderBenefitChips()
│ ₪ salary                │ ← renderSalary()
│                         │
│ ┌─ Contact Bar ───────┐ │ ← renderContactBar()
│ └─────────────────────┘ │
│    Company Footer       │ ← renderCompanyFooter()
└─────────────────────────┘
```

**Key CSS:** Image section uses `position: absolute; top: 0; height: 40%; background: [imageUrl] center/cover`. Content section has `margin-top: 40%`. Image gets overlay via `::after` with gradient from transparent to bgColor.

- [ ] **Step 2: Create classic-split template**

Create `src/lib/templates/classic-split.ts`. Based on old `renderSplitColor` (template-html.ts line 629-876).

**Layout structure:**
```
┌─────────────────────────┐
│                         │
│    Background Image     │ ← 45% height
│    (diagonal clip)      │   clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%)
│           [Logo]        │ ← centered at bottom of image section
├─ diagonal edge ─────────┤
│ [Badge]                 │
│ Subtitle                │ ← colored panel (primary color background)
│ TITLE HE               │   white text
│ Title En                │
│                         │
│ [icon] label: value     │ ← renderDetailsList(data, scale, "list")
│ [icon] label: value     │   (NOT circles — inline icons for compression)
│                         │
│ [benefit] [benefit]     │
│ ₪ salary                │
│                         │
│ ┌─ Contact Bar ───────┐ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Key CSS:** Panel background is `data.theme.primary`. Text color forced to white. Diagonal achieved with `clip-path` on the image section.

- [ ] **Step 3: Create bold-urgent template**

Create `src/lib/templates/bold-urgent.ts`. Based on old `renderVibrantPop` (template-html.ts line 1154-1325).

**Layout structure:**
```
┌─────────────────────────┐
│        ╔═══╗            │ ← solid primary color background
│        ║   ║  [Badge]   │   large faded icon (40% opacity, 300*scale px)
│        ╚═══╝            │   as decorative background element
│  [Logo]                 │
│                         │
│  TITLE HE               │ ← GIANT text: 56*scale px (largest of all)
│  (no English title)     │   Hebrew only for this template
│                         │
│  ⚡ value  📍 value     │ ← details as ICON+VALUE only, no labels
│  🕐 value  💰 value     │   use renderDetailsList but override to hide labels
│                         │
│  [benefit] [benefit]    │
│                         │
│  ┌─ Contact Bar ──────┐ │ ← white background contact bar (inverted)
│  └────────────────────┘ │
└─────────────────────────┘
```

**Key CSS:** Body background is `data.theme.primary`. All text white. Contact bar inverted (white bg, primary text). Details show only icon + value (hide `.detail-label` with `display:none`). Giant faded icon uses `position:absolute; font-size:${300*scale}px; opacity:0.08`.

- [ ] **Step 4: Create logo-centered template**

Create `src/lib/templates/logo-centered.ts`. **New template — no old equivalent to reference.**

**Layout structure:**
```
┌─────────────────────────┐
│          [Badge]        │ ← dark background (theme bgColor)
│                         │
│      ┌──────────┐       │ ← logo container: 30% height, centered
│      │  LOGO    │       │   white/transparent background pill
│      └──────────┘       │   if no logo, shows company name large
│      Company Name       │   in primary color
│                         │
│  ─── thin divider ───   │ ← 1px line in secondary color
│                         │
│      TITLE HE           │ ← centered, medium-large
│      Title En           │
│                         │
│  [icon] label: value    │ ← renderDetailsList centered
│  [icon] label: value    │
│                         │
│  [benefit] [benefit]    │ ← renderBenefitChips centered
│  ₪ salary               │
│                         │
│  ┌─ Contact Bar ──────┐ │
│  └────────────────────┘ │
│      Company Footer     │
└─────────────────────────┘
```

**Key CSS:** Everything centered (`text-align: center`). Logo container has `max-width: 60%`, auto margins. Minimal decoration — no patterns, no overlays. The brand is the design.

- [ ] **Step 5: Create text-stack template**

Create `src/lib/templates/text-stack.ts`. **New template — no old equivalent to reference.**

**Layout structure:**
```
┌─────────────────────────┐
│ [Badge]  Company Name   │ ← dark background (theme bgColor)
│                         │   company name in secondary color, top-right
│                         │
│ TITLE HE                │ ← GIANT text, the biggest readable
│ (Title En)              │   title is the hero element
│                         │
│ ─── accent line ───     │ ← 3px line in primary color
│                         │
│ 📍 מיקום: תל אביב       │ ← details as bold stacked text
│ 💼 ניסיון: 3+ שנים      │   each detail is a full-width row
│ ⏰ היקף: משרה מלאה      │   icon + label + value inline
│                         │
│ [benefit] [benefit]     │ ← renderBenefitChips
│ ₪ salary                │
│                         │
│ ┌─ Contact Bar ───────┐ │ ← full-width contact bar
│ └─────────────────────┘ │
│    Company Footer       │
└─────────────────────────┘
```

**Key CSS:** No decorative elements. Maximum font sizes. Line height 1.35. Details use large font (20*scale). Title uses 52*scale. High contrast only — `color: white` on dark bg. Must be readable at 400px width (WhatsApp thumbnail) — test by checking that font sizes at scale=0.37 (400/1080) are still >=9px.

- [ ] **Step 6: Register all templates in index.ts**

Update `src/lib/templates/index.ts` to import and register all 6 templates:

```typescript
import type { PosterData, TemplateId } from "../types";
import { renderCorporate } from "./corporate";
import { renderPhotoBanner } from "./photo-banner";
import { renderClassicSplit } from "./classic-split";
import { renderBoldUrgent } from "./bold-urgent";
import { renderLogoCentered } from "./logo-centered";
import { renderTextStack } from "./text-stack";

const TEMPLATE_RENDERERS: Record<TemplateId, (data: PosterData) => string> = {
  corporate: renderCorporate,
  "photo-banner": renderPhotoBanner,
  "classic-split": renderClassicSplit,
  "bold-urgent": renderBoldUrgent,
  "logo-centered": renderLogoCentered,
  "text-stack": renderTextStack,
};

export function generateTemplateHtml(data: PosterData): string {
  const renderer = TEMPLATE_RENDERERS[data.template];
  if (!renderer) {
    throw new Error(`Unknown template: ${data.template}. Available: ${Object.keys(TEMPLATE_RENDERERS).join(", ")}`);
  }
  return renderer(data);
}

export function getAvailableTemplates(): TemplateId[] {
  return Object.keys(TEMPLATE_RENDERERS) as TemplateId[];
}
```

- [ ] **Step 7: Update page.tsx and editor/page.tsx imports**

Both `src/app/page.tsx` and `src/app/editor/page.tsx` still import from the old files. Update their imports to point to the new types:

In `src/app/page.tsx`: Change `import { PosterFormat, TemplateId, FORMAT_DIMENSIONS, TEMPLATES } from "@/lib/templates"` to `import { PosterFormat, TemplateId, FORMAT_DIMENSIONS, TEMPLATES } from "@/lib/types"`. Also update the template IDs used in `TEMPLATE_PREVIEWS` to match the new template names.

In `src/app/editor/page.tsx`: Change `import { ... } from "@/lib/templates"` to `import { ... } from "@/lib/types"` and `import { generateTemplateHtml } from "@/lib/template-html"` to `import { generateTemplateHtml } from "@/lib/templates/index"`. Update template-specific references (template IDs, format names).

- [ ] **Step 8: Delete old template files**

Remove `src/lib/template-html.ts` and `src/lib/templates.ts` since they're fully replaced.

- [ ] **Step 9: Verify all templates compile**

Run: `cd /c/Learnings/canva-cli && npx tsc --noEmit`

- [ ] **Step 10: Commit**

```bash
git add src/lib/templates/ src/app/page.tsx src/app/editor/page.tsx
git rm src/lib/template-html.ts src/lib/templates.ts
git commit -m "feat: add all 6 redesigned templates and remove old template files"
```

---

## Task 8: Editor UI — Quick Start & Choose Look

**Files:**
- Create: `src/app/components/QuickStart.tsx`
- Create: `src/app/components/ChooseLook.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create QuickStart component**

Create `src/app/components/QuickStart.tsx`. This is the first step of the wizard. It shows:
- Industry preset chips (tech, blue-collar, retail, healthcare, finance, education, general)
- Company name input
- Logo upload button (file picker, client-side resize to max 400x200, convert to base64)
- Job title input (Hebrew)
- "Let AI fill everything" button that expands a textarea + model selector
- "Continue" button that passes data to next step

Props: `onComplete: (data: { industry: IndustryPreset; company: PosterCompany; titleHe: string; aiMode?: { description: string; model: string } }) => void`

- [ ] **Step 2: Create ChooseLook component**

Create `src/app/components/ChooseLook.tsx`. This shows 6 template cards in a grid. Each card has:
- A thumbnail preview showing the template with the user's actual content from Step 1
- Template name + description
- Click to select
- Back button + Continue button

Props: `data: Partial<PosterData>; onSelect: (template: TemplateId) => void; onBack: () => void`

The thumbnails should render mini previews by generating the template HTML and displaying it in a tiny iframe (same technique used in the current editor preview).

- [ ] **Step 3: Update page.tsx to wizard flow**

Replace the current home page with a 3-step wizard:
1. QuickStart → collects industry, company, title
2. ChooseLook → selects template
3. Redirects to `/editor?format=square&template=X` with state passed via URL params or sessionStorage

- [ ] **Step 4: Verify the wizard flow works**

Run: `cd /c/Learnings/canva-cli && npm run dev`
Test: Navigate through all 3 steps. Verify template thumbnails render with user content.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/QuickStart.tsx src/app/components/ChooseLook.tsx src/app/page.tsx
git commit -m "feat: add wizard flow with QuickStart and ChooseLook steps"
```

---

## Task 9: Editor UI — Tier 1 Components (Always Visible)

**Files:**
- Create: `src/app/components/sidebar/TitleEditor.tsx`
- Create: `src/app/components/sidebar/CompanyEditor.tsx`
- Create: `src/app/components/sidebar/ThemePicker.tsx`

- [ ] **Step 1: Create TitleEditor**

Create `src/app/components/sidebar/TitleEditor.tsx`. Two input fields: Hebrew title (required, RTL) and English title (optional, LTR). Uses the `input-field` CSS class. Props: `title: PosterTitle; onChange: (title: PosterTitle) => void`.

- [ ] **Step 2: Create CompanyEditor**

Create `src/app/components/sidebar/CompanyEditor.tsx`. Company name input + logo upload. Logo upload: file picker (PNG/JPG/SVG/WebP, max 5MB), client-side resize to max 400x200 via canvas, convert to base64 data URI, preview thumbnail, background mode toggle (auto/white/dark/transparent). Props: `company: PosterCompany; onChange: (company: PosterCompany) => void`.

- [ ] **Step 3: Create ThemePicker**

Create `src/app/components/sidebar/ThemePicker.tsx`. Grid of 8 preset buttons, each showing two color swatches (primary + secondary) and a Hebrew name. Plus a "custom" option with hex color input. Uses `THEME_PRESETS` from types. Props: `theme: PosterTheme; onChange: (theme: PosterTheme) => void`.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/sidebar/TitleEditor.tsx src/app/components/sidebar/CompanyEditor.tsx src/app/components/sidebar/ThemePicker.tsx
git commit -m "feat: add Tier 1 sidebar components (title, company, theme)"
```

---

## Task 10: Editor UI — Tier 2 Components (Accordions)

**Files:**
- Create: `src/app/components/sidebar/DetailsEditor.tsx`
- Create: `src/app/components/sidebar/BenefitsEditor.tsx`
- Create: `src/app/components/sidebar/SalaryEditor.tsx`
- Create: `src/app/components/sidebar/ContactEditor.tsx`

- [ ] **Step 1: Create DetailsEditor**

Create `src/app/components/sidebar/DetailsEditor.tsx`. Max 5 detail rows. Each row: icon dropdown (using ICON_OPTIONS from current editor), label input, value input, delete button. Add row button (disabled at 5). Shows "maximum reached" warning. Props: `details: PosterDetail[]; onChange: (details: PosterDetail[]) => void`.

- [ ] **Step 2: Create BenefitsEditor**

Create `src/app/components/sidebar/BenefitsEditor.tsx`. Chip/tag-style input. Type a benefit, press Enter to add as a chip. Max 3 chips. Max 20 chars per chip (show remaining). Click chip X to remove. Props: `benefits: string[]; onChange: (benefits: string[]) => void`.

- [ ] **Step 3: Create SalaryEditor**

Create `src/app/components/sidebar/SalaryEditor.tsx`. Toggle to show/hide salary section. When shown: currency dropdown (ILS/USD), period dropdown (month/hour/year), min/max number inputs, display text override input. Props: `salary?: PosterSalary; onChange: (salary?: PosterSalary) => void`.

- [ ] **Step 4: Create ContactEditor**

Create `src/app/components/sidebar/ContactEditor.tsx`. Method dropdown (WhatsApp/Email/Phone/Link with Hebrew labels). Value input with real-time validation using `validateContact()` from validation.ts — shows inline error message. Display text override input. Props: `contact: PosterContact; onChange: (contact: PosterContact) => void`.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/sidebar/DetailsEditor.tsx src/app/components/sidebar/BenefitsEditor.tsx src/app/components/sidebar/SalaryEditor.tsx src/app/components/sidebar/ContactEditor.tsx
git commit -m "feat: add Tier 2 sidebar components (details, benefits, salary, contact)"
```

---

## Task 11: Editor UI — Remaining Components & Preview

**Files:**
- Create: `src/app/components/sidebar/BackgroundEditor.tsx`
- Create: `src/app/components/sidebar/FontPicker.tsx`
- Create: `src/app/components/sidebar/ExportSettings.tsx`
- Create: `src/app/components/preview/LivePreview.tsx`

- [ ] **Step 1: Create BackgroundEditor**

Create `src/app/components/sidebar/BackgroundEditor.tsx`. Type selector (solid/image/pattern). Solid: shows color picker. Image: Unsplash search input OR direct URL input, overlay opacity slider (0-1). Pattern: dropdown (dots/grid/diagonal-lines). Props: `background: PosterBackground; onChange: (background: PosterBackground) => void`.

- [ ] **Step 2: Create FontPicker**

Create `src/app/components/sidebar/FontPicker.tsx`. Two buttons showing "מודרני" and "בולט" with sample text preview at each weight. Uses `FONT_STACKS` from fonts.ts. Props: `fontStack: FontStackId; onChange: (fontStack: FontStackId) => void`.

- [ ] **Step 3: Create ExportSettings**

Create `src/app/components/sidebar/ExportSettings.tsx`. Format selector (square default, story, a4) with dimension labels. Badge text input + style dropdown (default/urgent/new). JPEG/PNG toggle. Props: `posterData: PosterData; onChange: (updates: Partial<PosterData>) => void`.

- [ ] **Step 4: Create LivePreview**

Create `src/app/components/preview/LivePreview.tsx`. Same iframe technique as current editor: generates template HTML via `generateTemplateHtml(posterData)`, renders in iframe, scales to fit container using ResizeObserver. Adds format tabs (square/story/a4) that temporarily override the format for preview. Shows "Export JPG" button that calls `/api/generate`, displays the result, and shows a download button. Props: `posterData: PosterData`.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/sidebar/BackgroundEditor.tsx src/app/components/sidebar/FontPicker.tsx src/app/components/sidebar/ExportSettings.tsx src/app/components/preview/LivePreview.tsx
git commit -m "feat: add background, font, export settings, and live preview components"
```

---

## Task 12: Editor Page Assembly

**Files:**
- Modify: `src/app/editor/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add new CSS for sidebar layout**

Add to `src/app/globals.css`: accordion styles (collapsible sections with chevron icon), chip input styles, range slider styles, sidebar tier dividers.

- [ ] **Step 2: Rewrite editor/page.tsx**

Replace the current 642-line editor with the new sidebar layout. Structure:

```
EditorPage (Suspense wrapper)
└── EditorContent
    ├── Header (title + back link)
    └── Grid [sidebar | preview]
        ├── Sidebar
        │   ├── Tier 1 (always visible)
        │   │   ├── TitleEditor
        │   │   ├── CompanyEditor
        │   │   ├── ThemePicker
        │   │   └── Template switcher (dropdown or mini grid)
        │   ├── Tier 2 (accordion sections)
        │   │   ├── DetailsEditor
        │   │   ├── BenefitsEditor
        │   │   ├── SalaryEditor
        │   │   ├── ContactEditor
        │   │   ├── BackgroundEditor
        │   │   └── FontPicker
        │   ├── Tier 3 (behind "Advanced" toggle)
        │   │   └── ExportSettings
        │   ├── "Export JPG" button
        │   └── "Improve with AI" button (calls /api/ai-improve)
        └── LivePreview
```

State: single `useState<PosterData>` initialized from URL params (format, template) + sessionStorage (company, title from wizard). Each sidebar component gets a slice of state + updater callback. The `posterData` is passed to `LivePreview` which re-renders on every change via `useMemo`.

Keep the AI mode tab from the current editor (textarea + model selector) as an alternative to the sidebar — user can switch between "Manual" and "AI" tabs like the current editor.

- [ ] **Step 3: Verify the full editor flow**

Run: `cd /c/Learnings/canva-cli && npm run dev`
Test: Go through wizard → arrive at editor → modify all fields → verify live preview updates → export JPG

- [ ] **Step 4: Commit**

```bash
git add src/app/editor/page.tsx src/app/globals.css
git commit -m "feat: assemble tiered sidebar editor with all controls and live preview"
```

---

## Task 13: AI Improvement Endpoint

**Files:**
- Create: `src/app/api/ai-improve/route.ts`

- [ ] **Step 1: Create the AI improvement endpoint**

Create `src/app/api/ai-improve/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod/v4";
import { zodResponseFormat } from "openai/helpers/zod";

const SuggestionSchema = z.object({
  suggestions: z.array(z.object({
    field: z.string().describe("Dot-path to the field, e.g. 'title.he', 'details[2].value', 'benefits'"),
    current: z.string().describe("Current value"),
    suggested: z.string().describe("Improved value"),
    reason: z.string().describe("Brief reason for the change in Hebrew"),
  })),
});

const SYSTEM_PROMPT = `You are a recruitment poster content optimizer for the Israeli job market.

You receive a poster's current data and suggest improvements. Your suggestions should:
- Shorten text that's too long for a poster (max 5 words per detail value, 4 words for headlines)
- Fix Hebrew grammar or make text more natural
- Improve benefit tags to be more specific and compelling
- Suggest better detail ordering (most important first)
- Flag missing critical information (location, contact method)

Return 1-5 specific, actionable suggestions. Each suggestion must have the exact current value and a concrete replacement.
Do NOT suggest changes that are purely stylistic preferences. Only suggest changes that improve clarity, readability, or effectiveness.`;

export async function POST(request: NextRequest) {
  try {
    const { posterData, model } = await request.json();

    const openai = new OpenAI();

    const completion = await openai.chat.completions.parse({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Improve this recruitment poster:\n${JSON.stringify(posterData, null, 2)}`,
        },
      ],
      response_format: zodResponseFormat(SuggestionSchema, "suggestions"),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/ai-improve/route.ts
git commit -m "feat: add AI content improvement endpoint"
```

---

## Task 14: Update Layout & Metadata

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

Minor updates: update the app title/description, ensure Font Awesome is loaded.

No structural changes needed — the current layout with nav + main is fine.

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "chore: update app metadata"
```

---

## Task 15: Integration Testing & Polish

**Files:**
- No new files — this is testing and fixing

- [ ] **Step 1: Start the dev server**

Run: `cd /c/Learnings/canva-cli && npm run dev`

- [ ] **Step 2: Test the full flow end-to-end**

1. Open the app → QuickStart wizard appears
2. Select an industry preset → colors and template pre-fill
3. Enter company name and job title
4. Click through to ChooseLook → template thumbnails show real content
5. Select a template → redirected to editor
6. In editor: modify all Tier 1 fields, expand Tier 2 accordions, test all inputs
7. Verify live preview updates on every change
8. Export JPG → download works
9. Test AI generation mode
10. Test with all 6 templates at all 3 formats

- [ ] **Step 3: Test validation**

1. Try invalid WhatsApp number → error message appears
2. Try invalid email → error message appears
3. Try adding >5 details → warning shown
4. Try benefit >20 chars → error shown
5. Test logo upload with PNG, JPG → renders in preview

- [ ] **Step 4: Test migration**

1. Switch editor to JSON mode
2. Paste old-format JSON (with titleHe, cta.subtext, etc.)
3. Verify it auto-migrates and renders correctly

- [ ] **Step 5: Fix any issues found**

Address any rendering bugs, layout issues, or validation gaps.

- [ ] **Step 6: Build check**

Run: `cd /c/Learnings/canva-cli && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "fix: integration testing fixes and polish"
```

---

## Summary

| Task | Description | Phase |
|---|---|---|
| 1 | New type definitions & validation | 1a |
| 2 | Migration utility & font definitions | 1a |
| 3 | Shared template utilities | 1a |
| 4 | Corporate template (POC) | 1a |
| 5 | Update renderer pipeline | 1a |
| 6 | Update API routes | 1a |
| 7 | Remaining 5 templates + cleanup | 1b |
| 8 | Editor UI — wizard flow (QuickStart + ChooseLook) | 2 |
| 9 | Editor UI — Tier 1 components | 2 |
| 10 | Editor UI — Tier 2 components | 2 |
| 11 | Editor UI — remaining components + preview | 2 |
| 12 | Editor page assembly | 2 |
| 13 | AI improvement endpoint | 3 |
| 14 | Update layout & metadata | 3 |
| 15 | Integration testing & polish | 3 |

**Notes:**
- Presets (industry + theme) are inlined in `types.ts` rather than a separate `presets.ts` — keeps imports simpler
- The old `PosterDetail.highlight` field is intentionally dropped in migration (see Task 2)
- Format selection moves from home page to Tier 3 editor settings; default is now "square"
