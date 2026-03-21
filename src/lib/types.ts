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
