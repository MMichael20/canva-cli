// === Template System ===
export type TemplateCategory = "standard" | "overlay" | "split" | "neon-dark" | "spotlight";
export type TemplateId = TemplateCategory;
export type FontStackId = "modern" | "bold";

// === Social Media Formats ===
export type FormatId = "whatsapp-status" | "instagram-story" | "instagram-post" | "facebook-post" | "a4-print";

export const FORMAT_DIMENSIONS: Record<FormatId, { width: number; height: number; label: string; labelHe: string }> = {
  "whatsapp-status":  { width: 1080, height: 1920, label: "WhatsApp Status",  labelHe: "סטטוס וואטסאפ" },
  "instagram-story":  { width: 1080, height: 1920, label: "Instagram Story",  labelHe: "סטורי אינסטגרם" },
  "instagram-post":   { width: 1080, height: 1080, label: "Instagram Post",   labelHe: "פוסט אינסטגרם" },
  "facebook-post":    { width: 1200, height: 630,  label: "Facebook Post",    labelHe: "פוסט פייסבוק" },
  "a4-print":         { width: 2480, height: 3508, label: "A4 Print",         labelHe: "הדפסה A4" },
};

// === Core Interfaces ===
export interface PosterDetail {
  label: string;
  value: string;
}

export interface PosterData {
  template: TemplateId;
  company: {
    name: string;
    nameEn?: string;
    isConfidential: boolean;
  };
  title: {
    he: string;
    en?: string;
  };
  spotlight: {
    text: string;
    type: "salary" | "tagline" | "benefit";
  };
  details: PosterDetail[];
  benefits?: string[];
  salary?: {
    display: string;
  };
  contact: {
    method: "whatsapp" | "email" | "phone";
    value: string;
    displayText?: string;
  };
  cta: {
    text: string;
    urgent: boolean;
  };
  theme: {
    primary: string;
    secondary: string;
    textColor: string;
    bgColor: string;
    fontStack: FontStackId;
  };
  badge?: {
    text: string;
    style: "default" | "urgent" | "new";
  };
  imageUrl?: string;  // Unsplash image URL for hero/background photo
}

// === API Response Types ===
export interface PosterVariant {
  id: string;
  templateId: TemplateId;
  categoryLabel: string;
  posterData: PosterData;
  thumbnail: string;
}

// === Category Metadata ===
export const CATEGORY_META: Record<TemplateCategory, { label: string; labelHe: string }> = {
  standard:  { label: "Standard",   labelHe: "קלאסי" },
  overlay:   { label: "Overlay",    labelHe: "שכבת תמונה" },
  split:       { label: "Split",      labelHe: "מפוצל" },
  "neon-dark":  { label: "Neon Dark",  labelHe: "ניאון כהה" },
  spotlight:    { label: "Spotlight", labelHe: "זרקור" },
};

export const CATEGORY_THEMES: Record<TemplateCategory, {
  primary: string; secondary: string; bgColor: string; textColor: string; fontStack: FontStackId;
}> = {
  standard:  { primary: "#2563EB", secondary: "#38BDF8", bgColor: "#2563EB", textColor: "#FFFFFF", fontStack: "modern" },
  overlay:   { primary: "#3A6BC5", secondary: "#A8C4E0", bgColor: "#FFFFFF", textColor: "#1B3A7A", fontStack: "modern" },
  split:       { primary: "#1E3A5F", secondary: "#4A90D9", bgColor: "#1E3A5F", textColor: "#FFFFFF", fontStack: "modern" },
  "neon-dark":  { primary: "#0A0A1A", secondary: "#00E5FF", bgColor: "#0A0A1A", textColor: "#FFFFFF", fontStack: "bold" },
  spotlight:    { primary: "#6C5CE7", secondary: "#A29BFE", bgColor: "#F8F8FC", textColor: "#1A1A2E", fontStack: "modern" },
};

export const CATEGORY_ADJACENCY: Record<TemplateCategory, TemplateCategory[]> = {
  standard:    ["overlay", "split"],
  overlay:     ["standard", "split"],
  split:       ["standard", "overlay"],
  "neon-dark": ["overlay", "split"],
  spotlight:   ["standard", "overlay"],
};

