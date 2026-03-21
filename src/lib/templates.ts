export type PosterFormat = "story" | "post" | "a4";
export type TemplateId = "dark-cards" | "bold-photo" | "split-color" | "geometric" | "gradient-wave" | "clean-corporate" | "vibrant-pop" | "minimal-elegant";

export interface PosterDetail {
  icon: string; // Font Awesome class like "fa-solid fa-briefcase"
  label: string;
  value: string;
  highlight?: string; // part of value to highlight in accent color
}

export interface PosterData {
  format: PosterFormat;
  template: TemplateId;
  badge: { icon: string; text: string };
  subtitle: string;
  titleHe: string;
  titleEn: string;
  details: PosterDetail[];
  cta: { text: string; subtext: string; icon: string };
  theme: {
    primary: string;
    accent: string;
    bgColor: string;
  };
  backgroundQuery?: string;
  backgroundUrl?: string;
}

export const FORMAT_DIMENSIONS: Record<PosterFormat, { width: number; height: number; label: string }> = {
  story: { width: 1080, height: 1920, label: "אינסטגרם סטורי" },
  post: { width: 1080, height: 1080, label: "אינסטגרם פוסט" },
  a4: { width: 2480, height: 3508, label: "A4" },
};

export const TEMPLATES: Record<TemplateId, { name: string; description: string }> = {
  "dark-cards": { name: "כרטיסים כהים", description: "רקע כהה עם כרטיסי מידע מעוצבים" },
  "bold-photo": { name: "תמונה דומיננטית", description: "תמונת רקע גדולה עם טקסט בולט" },
  "split-color": { name: "קלאסי ישראלי", description: "תמונה למעלה, פאנל צבעוני למטה עם עיגולי מידע" },
  "geometric": { name: "גיאומטרי מודרני", description: "חיתוכים אלכסוניים וצורות בולטות בסגנון סטארטאפ" },
  "gradient-wave": { name: "גל גרדיאנט", description: "צורות גל זורמות עם מעבר צבעים מודרני" },
  "clean-corporate": { name: "קורפורייט נקי", description: "רקע בהיר, עיצוב מקצועי ומסודר" },
  "vibrant-pop": { name: "צבעוני ובולט", description: "צבעים חזקים, טקסט ענק, בלי תמונה" },
  "minimal-elegant": { name: "מינימלי אלגנטי", description: "הרבה מרחב לבן, עיצוב עדין ומוקפד" },
};

export const ICON_COLORS = ["purple", "cyan", "pink", "amber", "green", "blue", "red", "emerald"] as const;
export type IconColor = (typeof ICON_COLORS)[number];

export const DEFAULT_POSTER_DATA: PosterData = {
  format: "story",
  template: "dark-cards",
  badge: { icon: "fa-solid fa-bolt", text: "מגייסים!" },
  subtitle: "אנחנו מחפשים",
  titleHe: "תפקיד חדש",
  titleEn: "New Position",
  details: [],
  cta: { text: "מתאים לך? שלח/י קורות חיים", subtext: "לפרטים נוספים שלחו הודעה", icon: "fa-solid fa-paper-plane" },
  theme: { primary: "#6366F1", accent: "#06B6D4", bgColor: "#0B0D17" },
};
