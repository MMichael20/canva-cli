import { PosterData } from "../types";
import { sharedHead, baseStyles, escapeHtml, hexToRgba } from "./shared";

export function renderStandard(data: PosterData, width: number, height: number): string {
  const wScale = width / 1080;
  const isLandscape = width > height;
  const isSquare = !isLandscape && (height / width) < 1.15;

  // Adaptive photo zone: less photo for height-constrained formats
  const photoPercent = isLandscape ? 100 : isSquare ? 35 : 42;
  const photoWidthPct = isLandscape ? 40 : 100;

  // Format-aware scale: constrained by content area to prevent overflow
  const contentAreaH = isLandscape ? height : height * (1 - photoPercent / 100);
  // Content-aware estimate: base (title+spotlight+CTA+footer+padding) + per-detail + extras
  const contentRef = 350 + 120
    + data.details.length * 70
    + (data.salary?.display && data.spotlight.type !== "salary" ? 75 : 0)
    + (data.benefits?.length ? 50 : 0);
  const scale = Math.min(wScale, (contentAreaH / contentRef) * 0.92);

  const primary = data.theme.primary;
  const secondary = data.theme.secondary;

  // Contact / CTA
  const contactDisplayText = data.contact.displayText || data.contact.value;
  const ctaText = data.cta?.text || "לחצו על הלינק למידע נוסף";

  // Derive darker shade for list item text
  const listTextColor = adjustBrightness(primary, -40);

  // === PHOTO ZONE ===
  const photoZone = `
    <div style="
      ${isLandscape ? `width: ${photoWidthPct}%; height: 100%;` : `width: 100%; height: ${photoPercent}%;`}
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
    ">
      ${data.imageUrl
        ? `<img src="${escapeHtml(data.imageUrl)}" style="width: 100%; height: 100%; object-fit: cover;" />`
        : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, ${hexToRgba(primary, 0.3)}, ${hexToRgba(secondary, 0.2)});"></div>`
      }

      <!-- Gradient overlay — dark at top for hook text, dark at bottom for company name -->
      <div style="
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to bottom,
          rgba(0,0,0,0.4) 0%,
          rgba(0,0,0,0.05) 35%,
          rgba(0,0,0,0.05) 55%,
          rgba(0,0,0,0.5) 100%
        );
        pointer-events: none;
      "></div>

      ${!isLandscape ? `<!-- Concave curved divider (scoop shape — dips in center, rises at edges) -->
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: ${80 * scale}px;
        z-index: 2;
        overflow: hidden;
      ">
        <svg viewBox="0 0 1080 80" preserveAspectRatio="none" style="width: 100%; height: 100%; display: block;">
          <path d="M0,0 Q540,80 1080,0 L1080,80 L0,80 Z" fill="${primary}" />
        </svg>
      </div>` : ""}

      <!-- Hook text on photo (top-right for RTL) -->
      <div style="
        position: absolute;
        top: ${32 * scale}px;
        left: ${54 * scale}px;
        right: ${54 * scale}px;
        z-index: 3;
        direction: rtl;
        text-align: right;
      ">
        <!-- Badge hook — sharp corners (no border-radius) like reference -->
        ${data.badge ? `
          <div style="margin-bottom: ${12 * scale}px;">
            <span style="
              background: ${hexToRgba(primary, 0.9)};
              color: white;
              padding: ${12 * scale}px ${28 * scale}px;
              font-size: ${32 * scale}px;
              font-weight: 800;
              box-shadow: 0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.2);
              display: inline-block;
              line-height: 1.3;
              direction: rtl;
            ">${escapeHtml(data.badge.text)}</span>
          </div>
        ` : ""}

      </div>

      ${!data.company.isConfidential ? `<!-- Company name at bottom of photo -->
      <div style="
        position: absolute;
        bottom: ${isLandscape ? 40 * scale : 90 * scale}px;
        left: 0;
        right: 0;
        text-align: center;
        z-index: 3;
      ">
        <div style="
          font-size: ${40 * scale}px;
          font-weight: 800;
          color: white;
          text-shadow: 0 ${2 * scale}px ${16 * scale}px rgba(0,0,0,0.6);
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 90%;
          margin: 0 auto;
        ">${escapeHtml(data.company.name)}</div>
        ${data.company.nameEn ? `
          <div style="
            font-size: ${18 * scale}px;
            color: rgba(255,255,255,0.8);
            text-shadow: 0 ${1 * scale}px ${8 * scale}px rgba(0,0,0,0.5);
            margin-top: ${4 * scale}px;
            direction: ltr;
          ">${escapeHtml(data.company.nameEn)}</div>
        ` : ""}
      </div>` : ""}
    </div>
  `;

  // === DETAIL BARS (gradient glass, no icons, centered, big text) ===
  const detailBars = data.details.map((d) => `
    <div style="
      background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.75));
      border-radius: ${14 * scale}px;
      padding: ${22 * scale}px ${32 * scale}px;
      text-align: center;
      margin-bottom: ${14 * scale}px;
      box-shadow: 0 ${2 * scale}px ${10 * scale}px rgba(0,0,0,0.08);
    ">
      <span style="
        font-size: ${28 * scale}px;
        color: ${listTextColor};
        font-weight: 700;
        direction: rtl;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      ">${escapeHtml(d.value)}</span>
    </div>
  `).join("");

  // === SPOTLIGHT (biggest visual element — type-dependent styling) ===
  const spotlightBg = data.spotlight.type === "salary"
    ? "#F59E0B"
    : data.spotlight.type === "benefit"
      ? "#059669"
      : primary;
  const spotlightColor = data.spotlight.type === "tagline" ? "white" : "#1A2A3A";
  const spotlightIcon = data.spotlight.type === "salary"
    ? `<i class="fa-solid fa-shekel-sign" style="font-size: ${36 * scale}px; color: ${spotlightColor}; margin-left: ${12 * scale}px;"></i>`
    : data.spotlight.type === "benefit"
      ? `<i class="fa-solid fa-star" style="font-size: ${36 * scale}px; color: ${spotlightColor}; margin-left: ${12 * scale}px;"></i>`
      : "";
  const spotlightHtml = `
    <div style="
      background: ${spotlightBg};
      border-radius: ${16 * scale}px;
      padding: ${28 * scale}px ${32 * scale}px;
      text-align: center;
      margin-bottom: ${16 * scale}px;
      margin-top: ${4 * scale}px;
      box-shadow: 0 ${6 * scale}px ${24 * scale}px rgba(0,0,0,0.2);
    ">
      ${spotlightIcon}
      <span style="
        font-size: ${44 * scale}px;
        font-weight: 900;
        color: ${spotlightColor};
        line-height: 1.2;
        display: block;
        margin-top: ${spotlightIcon ? `${8 * scale}px` : "0"};
      ">${escapeHtml(data.spotlight.text)}</span>
    </div>
  `;

  // === SALARY (secondary, only if spotlight is NOT salary to avoid duplication) ===
  const salaryHtml = (data.salary?.display && data.spotlight.type !== "salary")
    ? `<div style="
        background: #F59E0B;
        border-radius: ${12 * scale}px;
        padding: ${20 * scale}px ${28 * scale}px;
        text-align: center;
        margin-bottom: ${16 * scale}px;
        margin-top: ${4 * scale}px;
      ">
        <i class="fa-solid fa-shekel-sign" style="
          font-size: ${24 * scale}px;
          color: #1A2A3A;
        "></i>
        <span style="
          font-size: ${28 * scale}px;
          font-weight: 800;
          color: #1A2A3A;
          margin-right: ${8 * scale}px;
        ">${escapeHtml(data.salary.display)}</span>
      </div>`
    : "";

  // === BENEFIT CHIPS ===
  const benefitsHtml = (data.benefits && data.benefits.length > 0)
    ? `<div style="
        display: flex;
        flex-wrap: wrap;
        gap: ${10 * scale}px;
        justify-content: center;
        margin-bottom: ${20 * scale}px;
      ">
        ${data.benefits.map((b) => `
          <span style="
            display: inline-block;
            background: rgba(255,255,255,0.18);
            color: white;
            border: ${2 * scale}px solid rgba(255,255,255,0.4);
            padding: ${8 * scale}px ${22 * scale}px;
            border-radius: ${24 * scale}px;
            font-size: ${18 * scale}px;
            font-weight: 600;
          ">${escapeHtml(b)}</span>
        `).join("")}
       </div>`
    : "";

  // === CTA BUTTON (green #5BBD2B with subtle border + shadow) ===
  const ctaButton = `
    <div style="
      background: #5BBD2B;
      color: white;
      padding: ${22 * scale}px ${32 * scale}px;
      border-radius: ${14 * scale}px;
      font-size: ${24 * scale}px;
      font-weight: 700;
      text-align: center;
      box-shadow: 0 ${6 * scale}px ${24 * scale}px rgba(91,189,43,0.35);
      border: ${2 * scale}px solid ${adjustBrightness("#5BBD2B", -25)};
      width: 100%;
    ">
      <i class="fa-solid fa-link" style="margin-left: ${10 * scale}px;"></i>
      ${escapeHtml(ctaText)}
      <div style="
        font-size: ${17 * scale}px;
        font-weight: 400;
        opacity: 0.9;
        margin-top: ${6 * scale}px;
      ">${escapeHtml(contactDisplayText)}</div>
    </div>
  `;

  // === FOOTER (subdued, dark, small) ===
  const footer = `
    <div style="
      text-align: center;
      font-size: ${13 * scale}px;
      color: rgba(255,255,255,0.5);
      margin-top: ${10 * scale}px;
    ">*התהליך מנוהל ע"י Personal Hire - סוכנות גיוס עובדים</div>
  `;

  // === CONTENT SECTION ===
  // Outer padding: ~5-8% of width = 54-86px at 1080
  const sidePadding = 54 * scale;
  const contentSection = `
    <div style="
      ${isLandscape ? `width: ${100 - photoWidthPct}%; height: 100%;` : "flex: 1;"}
      background: linear-gradient(180deg, ${primary} 0%, ${adjustBrightness(primary, -25)} 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: ${isLandscape
        ? `${32 * scale}px ${sidePadding}px`
        : `${20 * scale}px ${sidePadding}px ${28 * scale}px`
      };
      ${!isLandscape ? `margin-top: ${-30 * scale}px;` : ""}
      position: relative;
      z-index: 2;
    ">
      <div>
        <!-- Job Title (hero text — 48-56pt range) -->
        <div style="
          text-align: center;
          margin-bottom: ${28 * scale}px;
        ">
          <div style="
            font-size: ${62 * scale}px;
            font-weight: 800;
            color: white;
            line-height: 1.15;
          ">${escapeHtml(data.title.he)}</div>
          ${data.jobTitle ? `<div style="
            font-size: ${34 * scale}px;
            font-weight: 600;
            color: rgba(255,255,255,0.8);
            direction: rtl;
            text-align: center;
            margin-top: ${6 * scale}px;
          ">${escapeHtml(data.jobTitle)}</div>` : ""}
        </div>

        <!-- Spotlight -->
        ${spotlightHtml}

        <!-- Detail bars -->
        <div style="margin-bottom: ${8 * scale}px;">
          ${detailBars}
        </div>

        <!-- Salary (secondary) -->
        ${salaryHtml}

        <!-- Benefits -->
        ${benefitsHtml}
      </div>

      <div>
        ${ctaButton}
        ${footer}
      </div>
    </div>
  `;

  // === LANDSCAPE LAYOUT ===
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
  <div style="
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    position: relative;
  ">
    ${photoZone}
    ${contentSection}
  </div>
</body>
</html>`;
  }

  // === PORTRAIT LAYOUT ===
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
    position: relative;
  ">
    ${photoZone}
    ${contentSection}
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
