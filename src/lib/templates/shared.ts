import { PosterData } from "../types";
import { FONT_STACKS } from "../fonts";

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

export function sharedHead(): string {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  `;
}

// === Reusable HTML Components ===

export function renderLogoZone(data: PosterData, scale: number): string {
  if (!data.company.name || data.company.isConfidential) return "";
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

export function renderBenefitChips(data: PosterData, scale: number): string {
  if (!data.benefits || data.benefits.length === 0) return "";
  const chips = data.benefits.map((b) => `
    <span style="
      display: inline-block;
      background: ${hexToRgba(data.theme.primary, 0.15)};
      color: ${data.theme.primary};
      border: 1.5px solid ${hexToRgba(data.theme.primary, 0.3)};
      padding: ${4 * scale}px ${12 * scale}px;
      border-radius: ${16 * scale}px;
      font-size: ${14 * scale}px;
      font-weight: 600;
    ">${escapeHtml(b)}</span>
  `).join("");
  return `<div style="display: flex; flex-wrap: wrap; gap: ${8 * scale}px; justify-content: center;">${chips}</div>`;
}

export function renderSalary(data: PosterData, scale: number): string {
  if (!data.salary?.display) return "";
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
      ${escapeHtml(data.salary.display)}
    </div>
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
