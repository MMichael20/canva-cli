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
