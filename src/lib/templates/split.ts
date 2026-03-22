import { PosterData } from "../types";
import { sharedHead, baseStyles, escapeHtml, hexToRgba } from "./shared";

export function renderSplit(data: PosterData, width: number, height: number): string {
  const baseScale = width / 1080;
  const isLandscape = width > height;
  const isSquare = !isLandscape && (height / width) < 1.15;
  const isTall = (height / width) > 1.6;

  // Layout ratios — more header in tall to fill space, less in landscape
  const headerPct = isLandscape ? 36 : isSquare ? 30 : isTall ? 28 : 26;
  const splitPct = 100 - headerPct;
  const photoWidthPct = isLandscape ? 42 : isSquare ? 40 : 40;

  // Curve: photo's right edge bulges into content — bolder arc
  const curveDepth = Math.round(85 * baseScale);
  const splitH = Math.round(height * splitPct / 100);
  const halfSplitH = Math.round(splitH / 2);

  // Scale
  const contentItems = 200 + data.details.length * 50
    + (data.salary?.display ? 45 : 0)
    + (data.benefits?.length ? 45 : 0);
  const scale = Math.min(baseScale, (splitH / contentItems) * 0.85);
  // Taller formats get boosted scale so content fills the space
  const tallBoost = isTall ? 1.15 : 1;
  const s = scale * tallBoost;

  const primary = data.theme.primary;
  const accent = data.theme.secondary;
  const darkPrimary = adjustBrightness(primary, -35);
  const ctaText = data.cta?.text || "לחצו על הלינק למידע נוסף";
  const detailTextColor = adjustBrightness(primary, -50);

  // ══════════════════════════════════════════
  // HEADER — full width, centered
  // ══════════════════════════════════════════
  const headerZone = `
    <div style="
      width: 100%;
      height: ${headerPct}%;
      background: linear-gradient(135deg, ${adjustBrightness(primary, 12)} 0%, ${primary} 60%, ${darkPrimary} 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: ${14 * s}px ${34 * s}px;
      direction: rtl;
      position: relative;
      z-index: 3;
    ">
      <!-- Accent top line -->
      <div style="
        position: absolute;
        top: 0;
        left: 8%;
        right: 8%;
        height: ${4 * s}px;
        background: linear-gradient(to right, transparent, ${accent}, transparent);
        border-radius: ${2 * s}px;
      "></div>

      ${data.badge ? `
        <div style="margin-bottom: ${8 * s}px;">
          <span style="
            background: #F59E0B;
            color: #1A2A3A;
            padding: ${6 * s}px ${20 * s}px;
            border-radius: ${20 * s}px;
            font-size: ${16 * s}px;
            font-weight: 800;
            display: inline-block;
            direction: rtl;
          ">${escapeHtml(data.badge.text)}</span>
        </div>
      ` : ""}

      <div style="
        font-size: ${46 * s}px;
        font-weight: 800;
        color: white;
        line-height: 1.15;
        text-align: center;
        direction: rtl;
      ">${escapeHtml(data.title.he)}</div>

      ${data.title.en ? `
        <div style="
          font-size: ${14 * s}px;
          color: rgba(255,255,255,0.5);
          direction: ltr;
          margin-top: ${4 * s}px;
        ">${escapeHtml(data.title.en)}</div>
      ` : ""}

      ${data.subtitle ? `
        <div style="
          margin-top: ${8 * s}px;
          font-size: ${20 * s}px;
          color: ${accent};
          font-weight: 600;
          direction: rtl;
        ">${escapeHtml(data.subtitle)}</div>
      ` : ""}

      <!-- Company name in header — visible -->
      <div style="
        margin-top: ${10 * s}px;
        font-size: ${14 * s}px;
        color: rgba(255,255,255,0.45);
        direction: rtl;
      ">
        ${!data.company.isConfidential && data.company.name
          ? escapeHtml(data.company.name)
          : "חברה מובילה בתחום"
        }
      </div>
    </div>
  `;

  // ══════════════════════════════════════════
  // PHOTO — left side, clip-path curves right
  // ══════════════════════════════════════════
  const photoPxW = Math.round(width * photoWidthPct / 100) + curveDepth;
  const clipPath = `path('M 0 0 L ${photoPxW - curveDepth} 0 Q ${photoPxW} ${halfSplitH} ${photoPxW - curveDepth} ${splitH} L 0 ${splitH} Z')`;

  const photoZone = `
    <div style="
      width: ${photoWidthPct}%;
      height: 100%;
      position: relative;
      overflow: visible;
      flex-shrink: 0;
      margin-right: ${-curveDepth}px;
      clip-path: ${clipPath};
      z-index: 2;
    ">
      ${data.imageUrl
        ? `<img src="${escapeHtml(data.imageUrl)}" style="width: calc(100% + ${curveDepth}px); height: 100%; object-fit: cover; display: block;" />`
        : `<div style="width: calc(100% + ${curveDepth}px); height: 100%; background: linear-gradient(145deg, ${hexToRgba(accent, 0.4)}, ${hexToRgba(primary, 0.25)});"></div>`
      }

      <!-- Very light overlay — only bottom edge for text -->
      <div style="
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.25) 100%);
        pointer-events: none;
      "></div>
    </div>
  `;

  // ══════════════════════════════════════════
  // CONTENT — right side
  // ══════════════════════════════════════════

  // Benefits — warm amber/gold cards, clearly different from requirements
  const benefitsHtml = (data.benefits && data.benefits.length > 0)
    ? `
      <div style="margin-bottom: ${10 * s}px;">
        ${data.benefits.map((b) => `
          <div style="
            background: linear-gradient(135deg, #F59E0B, #D97706);
            border-radius: ${10 * s}px;
            padding: ${12 * s}px ${18 * s}px;
            text-align: center;
            margin-bottom: ${8 * s}px;
            box-shadow: 0 ${2 * s}px ${8 * s}px rgba(245,158,11,0.3);
          ">
            <span style="
              font-size: ${19 * s}px;
              color: #1A2A3A;
              font-weight: 700;
              direction: rtl;
              display: block;
            "><i class="fa-solid fa-star" style="margin-left: ${6 * s}px; font-size: ${14 * s}px;"></i>${escapeHtml(b)}</span>
          </div>
        `).join("")}
      </div>
    ` : "";

  // Detail bars — white/light, clearly requirements
  const detailBars = data.details.map((d) => `
    <div style="
      background: rgba(255,255,255,0.88);
      border-radius: ${8 * s}px;
      padding: ${11 * s}px ${16 * s}px;
      text-align: right;
      margin-bottom: ${7 * s}px;
    ">
      <span style="
        font-size: ${18 * s}px;
        color: ${detailTextColor};
        font-weight: 600;
        direction: rtl;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      ">${escapeHtml(d.value)}</span>
    </div>
  `).join("");

  // Salary
  const salaryHtml = data.salary?.display
    ? `<div style="
        background: rgba(255,255,255,0.88);
        border-radius: ${8 * s}px;
        padding: ${11 * s}px ${16 * s}px;
        text-align: center;
        margin-bottom: ${8 * s}px;
      ">
        <i class="fa-solid fa-shekel-sign" style="font-size: ${14 * s}px; color: #F59E0B;"></i>
        <span style="font-size: ${18 * s}px; font-weight: 800; color: ${detailTextColor}; margin-right: ${5 * s}px;">${escapeHtml(data.salary.display)}</span>
      </div>`
    : "";

  // CTA — amber/gold to match badge and benefits (#5)
  const ctaButton = `
    <div style="
      background: linear-gradient(135deg, #F59E0B, #D97706);
      color: #1A2A3A;
      padding: ${16 * s}px ${20 * s}px;
      border-radius: ${12 * s}px;
      font-size: ${20 * s}px;
      font-weight: 800;
      text-align: center;
      box-shadow: 0 ${4 * s}px ${16 * s}px rgba(245,158,11,0.35);
      width: 100%;
    ">
      <i class="fa-solid fa-link" style="margin-left: ${8 * s}px;"></i>
      ${escapeHtml(ctaText)}
    </div>
  `;

  const footer = `
    <div style="
      text-align: center;
      font-size: ${11 * s}px;
      color: rgba(255,255,255,0.45);
      margin-top: ${6 * s}px;
    ">Personal Hire - סוכנות גיוס עובדים</div>
  `;

  const pad = 22 * s;
  const contentZone = `
    <div style="
      flex: 1;
      height: 100%;
      background: linear-gradient(180deg, ${primary} 0%, ${darkPrimary} 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: ${16 * s}px ${pad}px ${14 * s}px ${pad}px;
      direction: rtl;
      z-index: 1;
    ">
      <div>
        ${benefitsHtml}
        ${detailBars}
        ${salaryHtml}
      </div>
      <div>
        ${ctaButton}
        ${footer}
      </div>
    </div>
  `;

  // ══════════════════════════════════════════
  // ASSEMBLY
  // ══════════════════════════════════════════
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead()}
  <style>
    ${baseStyles(data, width, height, scale)}
    body { background: ${primary}; }
  </style>
</head>
<body>
  <div style="
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  ">
    ${headerZone}
    <div style="
      width: 100%;
      height: ${splitPct}%;
      display: flex;
      flex-direction: row;
      direction: ltr;
      overflow: hidden;
    ">
      ${photoZone}
      ${contentZone}
    </div>
  </div>
</body>
</html>`;
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
