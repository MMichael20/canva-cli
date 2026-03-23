import { PosterData } from "../types";
import { sharedHead, baseStyles, escapeHtml, hexToRgba } from "./shared";

export function renderSpotlight(data: PosterData, width: number, height: number): string {
  const baseScale = width / 1080;
  const aspectRatio = height / width;
  const isLandscape = width > height;
  const isSquare = !isLandscape && aspectRatio < 1.15;
  const isTall = aspectRatio > 1.6;

  // Content-aware scale
  const contentRef = 480 + data.details.length * 55
    + (data.salary?.display ? 65 : 0)
    + (data.benefits?.length ? 55 : 0);
  const scale = Math.min(baseScale, (height / contentRef) * 0.88);

  const primary = data.theme.primary;
  const secondary = data.theme.secondary;
  const darkText = "#1A1A2E";

  const ctaText = data.cta?.text || "לחצו על הלינק למידע נוסף";
  const contactDisplayText = data.contact.displayText || data.contact.value;

  // === CIRCLE PHOTO (the hero element) ===
  const circleSize = isLandscape ? Math.round(280 * scale) : isSquare ? Math.round(300 * scale) : Math.round(380 * scale);
  const ringWidth = Math.round(6 * scale);

  const circlePhoto = `
    <div style="
      width: ${circleSize}px;
      height: ${circleSize}px;
      border-radius: 50%;
      padding: ${ringWidth}px;
      background: linear-gradient(135deg, ${primary}, ${secondary});
      box-shadow: 0 ${8 * scale}px ${30 * scale}px ${hexToRgba(primary, 0.25)},
                  0 ${4 * scale}px ${15 * scale}px rgba(0,0,0,0.1);
      flex-shrink: 0;
      ${isLandscape ? '' : 'margin: 0 auto;'}
    ">
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: hidden;
        background: #E8E8EE;
      ">
        ${data.imageUrl
          ? `<img src="${escapeHtml(data.imageUrl)}" style="width: 100%; height: 100%; object-fit: cover;" />`
          : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, ${hexToRgba(primary, 0.15)}, ${hexToRgba(secondary, 0.1)});"></div>`
        }
      </div>
    </div>
  `;

  // === DECORATIVE SHAPES (light, geometric, airy) ===
  const decorations = `
    <!-- Large soft circle — top left -->
    <div style="
      position: absolute;
      top: -${60 * baseScale}px;
      left: -${40 * baseScale}px;
      width: ${220 * baseScale}px;
      height: ${220 * baseScale}px;
      border-radius: 50%;
      background: ${hexToRgba(primary, 0.06)};
      z-index: 0;
    "></div>

    <!-- Small accent circle — top right -->
    <div style="
      position: absolute;
      top: ${30 * baseScale}px;
      right: ${40 * baseScale}px;
      width: ${50 * baseScale}px;
      height: ${50 * baseScale}px;
      border-radius: 50%;
      background: ${hexToRgba(secondary, 0.12)};
      z-index: 0;
    "></div>

    <!-- Dotted ring — bottom right -->
    <div style="
      position: absolute;
      bottom: ${80 * baseScale}px;
      right: -${30 * baseScale}px;
      width: ${140 * baseScale}px;
      height: ${140 * baseScale}px;
      border-radius: 50%;
      border: ${2 * baseScale}px dashed ${hexToRgba(primary, 0.1)};
      z-index: 0;
    "></div>

    ${isTall ? `
    <!-- Extra soft blob — mid left for tall formats -->
    <div style="
      position: absolute;
      top: 55%;
      left: -${50 * baseScale}px;
      width: ${180 * baseScale}px;
      height: ${180 * baseScale}px;
      border-radius: 50%;
      background: ${hexToRgba(secondary, 0.05)};
      z-index: 0;
    "></div>
    ` : ""}

    <!-- Small filled dot — accent -->
    <div style="
      position: absolute;
      bottom: ${150 * baseScale}px;
      left: ${60 * baseScale}px;
      width: ${16 * baseScale}px;
      height: ${16 * baseScale}px;
      border-radius: 50%;
      background: ${hexToRgba(primary, 0.15)};
      z-index: 0;
    "></div>
  `;

  // === BADGE ===
  const badgeHtml = data.badge ? `
    <div style="margin-bottom: ${12 * scale}px;">
      <span style="
        display: inline-block;
        background: ${primary};
        color: white;
        padding: ${8 * scale}px ${24 * scale}px;
        border-radius: ${20 * scale}px;
        font-size: ${18 * scale}px;
        font-weight: 700;
        letter-spacing: ${0.5 * scale}px;
        direction: rtl;
      ">${escapeHtml(data.badge.text)}</span>
    </div>
  ` : "";

  // === COMPANY NAME ===
  const companyHtml = !data.company.isConfidential ? `
    <div style="
      font-size: ${20 * scale}px;
      font-weight: 600;
      color: ${primary};
      letter-spacing: ${1.5 * scale}px;
      margin-bottom: ${10 * scale}px;
      direction: rtl;
      text-align: center;
    ">${escapeHtml(data.company.name)}</div>
  ` : "";

  // === JOB TITLE ===
  const titleSize = isLandscape ? 40 : isSquare ? 44 : 50;
  const titleHtml = `
    <div style="
      font-size: ${titleSize * scale}px;
      font-weight: 900;
      color: ${darkText};
      line-height: 1.2;
      margin-bottom: ${6 * scale}px;
      direction: rtl;
      text-align: center;
    ">${escapeHtml(data.title.he)}</div>
    ${data.jobTitle ? `<div style="
      font-size: ${20 * scale}px;
      font-weight: 600;
      color: ${hexToRgba(darkText, 0.5)};
      direction: rtl;
      text-align: center;
      margin-top: ${6 * scale}px;
    ">${escapeHtml(data.jobTitle)}</div>` : ''}
  `;

  // === SPOTLIGHT (salary / tagline / benefit banner) ===
  const salaryFontSize = isLandscape ? 40 : isSquare ? 44 : 52;
  const spotlightHtml = data.spotlight ? (() => {
    const spotType = data.spotlight.type;
    const bgGradient = spotType === "benefit"
      ? "linear-gradient(135deg, #059669, #047857)"
      : `linear-gradient(135deg, ${primary}, ${adjustBrightness(primary, -20)})`;
    const shadowColor = spotType === "benefit"
      ? "rgba(5, 150, 105, 0.2)"
      : hexToRgba(primary, 0.2);
    const icon = spotType === "salary"
      ? `<i class="fa-solid fa-shekel-sign" style="
          font-size: ${Math.round(salaryFontSize * 0.75) * scale}px;
          color: white;
        "></i>`
      : spotType === "benefit"
      ? `<i class="fa-solid fa-check" style="
          font-size: ${Math.round(salaryFontSize * 0.75) * scale}px;
          color: white;
        "></i>`
      : "";
    const fontWeight = spotType === "tagline" ? 800 : 900;

    return `
    <div style="
      background: ${bgGradient};
      border-radius: ${14 * scale}px;
      padding: ${isSquare ? 16 * scale : 22 * scale}px ${30 * scale}px;
      text-align: center;
      margin-bottom: ${16 * scale}px;
      box-shadow: 0 ${4 * scale}px ${20 * scale}px ${shadowColor};
    ">
      <div style="display: flex; align-items: center; justify-content: center; gap: ${12 * scale}px;">
        ${icon}
        <span style="
          font-size: ${salaryFontSize * scale}px;
          font-weight: ${fontWeight};
          color: white;
        ">${escapeHtml(data.spotlight.text)}</span>
      </div>
    </div>
  `;
  })() : "";

  // === BENEFITS (colored pills) ===
  const benefitsHtml = (data.benefits && data.benefits.length > 0) ? `
    <div style="
      display: flex;
      flex-wrap: wrap;
      gap: ${10 * scale}px;
      justify-content: center;
      margin-bottom: ${14 * scale}px;
    ">
      ${data.benefits.map((b) => `
        <div style="
          background: ${hexToRgba(primary, 0.08)};
          color: ${primary};
          border: ${1.5 * scale}px solid ${hexToRgba(primary, 0.2)};
          padding: ${10 * scale}px ${22 * scale}px;
          border-radius: ${24 * scale}px;
          font-size: ${18 * scale}px;
          font-weight: 700;
          direction: rtl;
        "><i class="fa-solid fa-check" style="font-size: ${13 * scale}px; margin-left: ${6 * scale}px;"></i>${escapeHtml(b)}</div>
      `).join("")}
    </div>
  ` : "";

  // === DETAIL ITEMS (clean lines with colored dot accent) ===
  const maxDetails = isLandscape ? 3 : isSquare ? 3 : data.details.length;
  const visibleDetails = data.details.slice(0, maxDetails);

  const detailItems = visibleDetails.map((d, i) => `
    <div style="
      display: flex;
      align-items: center;
      gap: ${12 * scale}px;
      direction: rtl;
      padding: ${10 * scale}px 0;
      ${i < visibleDetails.length - 1 ? `border-bottom: ${1 * scale}px solid ${hexToRgba(darkText, 0.08)};` : ''}
    ">
      <div style="
        width: ${10 * scale}px;
        height: ${10 * scale}px;
        border-radius: 50%;
        background: ${i % 2 === 0 ? primary : secondary};
        flex-shrink: 0;
      "></div>
      <span style="
        font-size: ${18 * scale}px;
        color: ${hexToRgba(darkText, 0.75)};
        font-weight: 600;
        direction: rtl;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      ">${escapeHtml(d.value)}</span>
    </div>
  `).join("");

  // === CTA BUTTON ===
  const ctaButton = `
    <div style="
      background: ${primary};
      color: white;
      padding: ${18 * scale}px ${28 * scale}px;
      border-radius: ${30 * scale}px;
      font-size: ${22 * scale}px;
      font-weight: 800;
      text-align: center;
      box-shadow: 0 ${6 * scale}px ${24 * scale}px ${hexToRgba(primary, 0.3)};
      width: 100%;
    ">
      <i class="fa-solid fa-link" style="margin-left: ${10 * scale}px;"></i>
      ${escapeHtml(ctaText)}
      ${contactDisplayText ? `
        <div style="
          font-size: ${13 * scale}px;
          font-weight: 500;
          opacity: 0.7;
          margin-top: ${4 * scale}px;
        ">${escapeHtml(contactDisplayText)}</div>
      ` : ""}
    </div>
  `;

  // === FOOTER ===
  const footer = `
    <div style="
      text-align: center;
      font-size: ${11 * scale}px;
      color: ${hexToRgba(darkText, 0.3)};
      margin-top: ${10 * scale}px;
    ">*התהליך מנוהל ע"י Personal Hire - סוכנות גיוס עובדים</div>
  `;

  const pad = isLandscape ? 36 * scale : 34 * scale;

  // === LANDSCAPE LAYOUT (photo circle left, content right) ===
  if (isLandscape) {
    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead()}
  <style>
    ${baseStyles(data, width, height, scale)}
    body { background: #F8F8FC; }
  </style>
</head>
<body>
  <div style="width: 100%; height: 100%; position: relative; overflow: hidden;">
    ${decorations}

    <div style="
      width: 100%; height: 100%;
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
      padding: ${20 * scale}px ${pad}px;
      gap: ${30 * scale}px;
      z-index: 1;
      position: relative;
    ">
      <!-- Photo circle -->
      ${circlePhoto}

      <!-- Content -->
      <div style="
        flex: 1;
        display: flex;
        flex-direction: column;
        direction: rtl;
      ">
        ${badgeHtml}
        ${companyHtml}
        ${titleHtml}
        ${benefitsHtml}
        ${spotlightHtml}
        ${ctaButton}
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // === PORTRAIT / SQUARE LAYOUT ===
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead()}
  <style>
    ${baseStyles(data, width, height, scale)}
    body { background: #F8F8FC; }
  </style>
</head>
<body>
  <div style="
    width: 100%; height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
  ">
    ${decorations}

    <div style="
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: ${isTall ? 'flex-start' : 'space-between'};
      padding: ${isTall ? 40 * scale : 24 * scale}px ${pad}px ${20 * scale}px;
      z-index: 1;
      position: relative;
      width: 100%;
      ${isTall ? `gap: ${14 * scale}px;` : ''}
    ">
      <div style="width: 100%; text-align: center;">
        ${badgeHtml}
        ${companyHtml}
        ${circlePhoto}
        <div style="margin-top: ${16 * scale}px;">
          ${titleHtml}
        </div>
        ${spotlightHtml}
        ${benefitsHtml}

        <!-- Details -->
        <div style="
          width: 100%;
          padding: 0 ${10 * scale}px;
          margin-bottom: ${12 * scale}px;
        ">
          ${detailItems}
        </div>
      </div>

      <div style="width: 100%; ${isTall ? 'margin-top: auto;' : ''}">
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
