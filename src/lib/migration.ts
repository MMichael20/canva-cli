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
  "dark-cards": "corporate",
  "gradient-wave": "corporate",
  "minimal-elegant": "corporate",
  "geometric": "corporate",
};

function extractContact(subtext: string): { method: "whatsapp" | "email" | "phone" | "link"; value: string } {
  const phoneMatch = subtext.match(/0[5]\d[\d\-]{7,}/);
  if (phoneMatch) {
    return { method: "whatsapp", value: phoneMatch[0].replace(/\D/g, "") };
  }
  const emailMatch = subtext.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  if (emailMatch) {
    return { method: "email", value: emailMatch[0] };
  }
  return { method: "whatsapp", value: "" };
}

export function migrateOldPosterData(old: OldPosterData): PosterData {
  const contact = extractContact(old.cta.subtext);

  // NOTE: The old PosterDetail.highlight field is intentionally dropped.
  // The new templates don't use per-value highlighting — the accent color is
  // applied at the template level instead.
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
