import { PosterData } from "../types";
import { sharedHead, baseStyles, escapeHtml, hexToRgba } from "./shared";

export function renderSplit(data: PosterData, width: number, height: number): string {
  const baseScale = width / 1080;
  const aspectRatio = height / width;
  const isLandscape = width > height;
  const isSquare = !isLandscape && aspectRatio < 1.15;
  const isTall = aspectRatio > 1.6;

  // Scale
  const contentRef = 420 + data.details.length * 55
    + 80 /* spotlight */
    + (data.benefits?.length ? 50 : 0);
  const scale = Math.min(baseScale, (height / contentRef) * 0.88);

  const primary = data.theme.primary;
  const accent = data.theme.secondary;
  const ctaText = data.cta?.text || "לחצו על הלינק למידע נוסף";

  // === FULL-BLEED PHOTO BACKGROUND ===
  const photoBg = data.imageUrl ? `
    <img src="${escapeHtml(data.imageUrl)}" style="
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      z-index: 0;
    " />
    <!-- Gradient overlay — photo visible top, smooth blend into color -->
    <div style="
      position: absolute; inset: 0;
      background: linear-gradient(
        ${isLandscape ? '270deg' : '180deg'},
        transparent 0%,
        rgba(0,0,0,0.08) ${isLandscape ? '25%' : '20%'},
        ${hexToRgba(primary, 0.65)} ${isLandscape ? '45%' : '38%'},
        ${hexToRgba(primary, 0.92)} ${isLandscape ? '60%' : '50%'},
        ${primary} ${isLandscape ? '75%' : '62%'}
      );
      z-index: 1;
    "></div>
  ` : `
    <div style="
      position: absolute; inset: 0;
      background: linear-gradient(135deg, ${primary}, ${adjustBrightness(primary, -30)});
      z-index: 0;
    "></div>
  `;

  // === DECORATIVE ACCENT LINE ===
  const accentLine = `
    <div style="
      width: ${80 * scale}px;
      height: ${4 * scale}px;
      background: linear-gradient(to right, ${accent}, #F59E0B);
      border-radius: ${2 * scale}px;
      margin-bottom: ${16 * scale}px;
      margin-top: ${4 * scale}px;
    "></div>
  `;

  // === BADGE ===
  const badgeHtml = data.badge ? `
    <div style="
      display: inline-block;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(${4 * scale}px);
      border: ${1.5 * scale}px solid rgba(255,255,255,0.25);
      color: white;
      padding: ${9 * scale}px ${24 * scale}px;
      border-radius: ${22 * scale}px;
      font-size: ${18 * scale}px;
      font-weight: 800;
      margin-bottom: ${12 * scale}px;
      direction: rtl;
    ">${escapeHtml(data.badge.text)}</div>
  ` : "";

  // === COMPANY ===
  const companyHtml = !data.company.isConfidential ? `
    <div style="
      font-size: ${18 * scale}px;
      font-weight: 600;
      color: rgba(255,255,255,0.6);
      letter-spacing: ${2 * scale}px;
      margin-bottom: ${10 * scale}px;
      direction: rtl;
    ">${escapeHtml(data.company.name)}</div>
  ` : "";

  // === TITLE ===
  const titleSize = isLandscape ? 48 : isSquare ? 54 : 64;
  const titleHtml = `
    <div style="
      font-size: ${titleSize * scale}px;
      font-weight: 900;
      color: white;
      line-height: 1.15;
      margin-bottom: ${12 * scale}px;
      direction: rtl;
    ">${escapeHtml(data.title.he)}</div>
    ${data.jobTitle ? `<div style="
      font-size: ${32 * scale}px;
      font-weight: 600;
      color: rgba(255,255,255,0.8);
      direction: rtl;
      margin-top: ${6 * scale}px;
    ">${escapeHtml(data.jobTitle)}</div>` : ''}
  `;

  // === SPOTLIGHT ===
  const spotlightSize = isLandscape ? 34 : isSquare ? 38 : 46;
  const spotlightHtml = (() => {
    const t = data.spotlight.type;
    const icon = t === "salary"
      ? `<i class="fa-solid fa-shekel-sign" style="font-size: ${Math.round(spotlightSize * 0.7) * scale}px; margin-left: ${10 * scale}px;"></i>`
      : t === "benefit"
      ? `<i class="fa-solid fa-star" style="font-size: ${Math.round(spotlightSize * 0.6) * scale}px; margin-left: ${10 * scale}px;"></i>`
      : "";
    const bg = t === "salary"
      ? "linear-gradient(135deg, #F59E0B, #D97706)"
      : t === "benefit"
      ? "linear-gradient(135deg, #059669, #047857)"
      : `linear-gradient(135deg, ${accent}, ${adjustBrightness(accent, -20)})`;
    const color = t === "salary" ? "#1A1A2E" : "white";

    return `
      <div style="
        background: ${bg};
        border-radius: ${14 * scale}px;
        padding: ${18 * scale}px ${26 * scale}px;
        margin-bottom: ${18 * scale}px;
        box-shadow: 0 ${6 * scale}px ${20 * scale}px rgba(0,0,0,0.25);
      ">
        <div style="
          font-size: ${spotlightSize * scale}px;
          font-weight: 900;
          color: ${color};
          text-align: center;
          direction: rtl;
          line-height: 1.2;
        ">${icon}${escapeHtml(data.spotlight.text)}</div>
      </div>
    `;
  })();

  // === BENEFITS (glass pills) ===
  const benefitsHtml = (data.benefits && data.benefits.length > 0) ? `
    <div style="
      display: flex;
      flex-wrap: wrap;
      gap: ${10 * scale}px;
      margin-bottom: ${16 * scale}px;
      direction: rtl;
    ">
      ${data.benefits.map((b) => `
        <div style="
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(${6 * scale}px);
          border: ${1 * scale}px solid rgba(255,255,255,0.2);
          color: white;
          padding: ${10 * scale}px ${20 * scale}px;
          border-radius: ${22 * scale}px;
          font-size: ${17 * scale}px;
          font-weight: 700;
        "><i class="fa-solid fa-check" style="font-size: ${12 * scale}px; margin-left: ${6 * scale}px; opacity: 0.7;"></i>${escapeHtml(b)}</div>
      `).join("")}
    </div>
  ` : "";

  // === DETAILS (clean list with accent dots) ===
  const maxDetails = isLandscape ? 3 : isSquare ? 3 : Math.min(data.details.length, 4);
  const detailItems = data.details.slice(0, maxDetails).map((d, i) => {
    const dotColor = i % 2 === 0 ? accent : '#F59E0B';
    return `
    <div style="
      padding: ${10 * scale}px ${16 * scale}px;
      margin-bottom: ${6 * scale}px;
      background: rgba(255,255,255,${i % 2 === 0 ? '0.07' : '0.04'});
      border-radius: ${10 * scale}px;
      border-right: ${3 * scale}px solid ${hexToRgba(dotColor, 0.4)};
      display: flex;
      align-items: center;
      gap: ${10 * scale}px;
      direction: rtl;
    ">
      <div style="
        width: ${8 * scale}px;
        height: ${8 * scale}px;
        border-radius: 50%;
        background: ${dotColor};
        flex-shrink: 0;
      "></div>
      <span style="
        font-size: ${17 * scale}px;
        color: rgba(255,255,255,0.88);
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      ">${escapeHtml(d.value)}</span>
    </div>`;
  }).join("");

  const detailsCard = `
    <div style="margin-bottom: ${14 * scale}px;">
      ${detailItems}
    </div>
  `;

  // === CTA ===
  const ctaButton = `
    <div style="
      background: linear-gradient(135deg, ${accent}, ${adjustBrightness(accent, -15)});
      color: white;
      padding: ${18 * scale}px ${26 * scale}px;
      border-radius: ${14 * scale}px;
      font-size: ${22 * scale}px;
      font-weight: 800;
      text-align: center;
      box-shadow: 0 ${6 * scale}px ${24 * scale}px ${hexToRgba(accent, 0.3)};
      width: 100%;
    ">
      <i class="fa-solid fa-link" style="margin-left: ${8 * scale}px;"></i>
      ${escapeHtml(ctaText)}
    </div>
  `;

  // === FOOTER ===
  const footer = `
    <div style="
      text-align: center;
      font-size: ${11 * scale}px;
      color: rgba(255,255,255,0.3);
      margin-top: ${8 * scale}px;
    ">*התהליך מנוהל ע"י Personal Hire - סוכנות גיוס עובדים</div>
  `;

  const pad = isLandscape ? 36 * scale : 34 * scale;

  // === LANDSCAPE: photo left half, content right half ===
  if (isLandscape) {
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
  <div style="width: 100%; height: 100%; position: relative; overflow: hidden;">
    ${photoBg}

    <div style="
      position: absolute; inset: 0;
      display: flex;
      flex-direction: row-reverse;
      z-index: 2;
    ">
      <!-- Content side (right in RTL) -->
      <div style="
        width: 55%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: ${16 * scale}px ${pad}px;
        direction: rtl;
        gap: ${4 * scale}px;
      ">
        ${badgeHtml}
        ${companyHtml}
        ${titleHtml}
        ${accentLine}
        ${spotlightHtml}
        ${benefitsHtml}
        ${ctaButton}
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // === PORTRAIT / SQUARE: photo top, content bottom with overlap ===
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
  <div style="width: 100%; height: 100%; position: relative; overflow: hidden;">
    ${photoBg}

    <!-- Content panel — positioned at bottom -->
    <div style="
      position: absolute;
      bottom: 0; left: 0; right: 0;
      ${isTall ? 'top: 36%;' : isSquare ? 'top: 22%;' : 'top: 30%;'}
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: ${20 * scale}px ${pad}px ${22 * scale}px;
      direction: rtl;
      gap: ${6 * scale}px;
    ">
      <div>
        ${badgeHtml}
        ${companyHtml}
        ${titleHtml}
        ${accentLine}
        ${spotlightHtml}
        ${benefitsHtml}
        ${detailsCard}
      </div>

      <div>
        ${ctaButton}
        ${footer}
      </div>
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
