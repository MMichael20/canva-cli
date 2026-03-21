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
