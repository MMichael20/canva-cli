import { PosterData } from "../types";
import { sharedHead, baseStyles, escapeHtml, hexToRgba } from "./shared";

export function renderNeonDark(data: PosterData, width: number, height: number): string {
  const baseScale = width / 1080;
  const aspectRatio = height / width;
  const isLandscape = width > height;
  const isSquare = !isLandscape && aspectRatio < 1.15;
  const isTall = aspectRatio > 1.6;

  // Content-aware scale to prevent overflow
  const contentRef = 450 + data.details.length * 60
    + (data.salary?.display ? 55 : 0)
    + (data.benefits?.length ? 70 : 0);
  const scale = Math.min(baseScale, (height / contentRef) * 0.88);

  const accent = data.theme.secondary;
  const primary = data.theme.primary;
  // Toned-down warm accent — muted copper instead of bright orange
  const accentWarm = "#C4855C";

  const ctaText = data.cta?.text || "לחצו על הלינק למידע נוסף";
  const contactDisplayText = data.contact.displayText || data.contact.value;

  // Subtle glow — toned down from full neon to refined luminance
  const subtleGlow = (color: string, intensity: number = 1) => `
    0 0 ${6 * intensity}px ${hexToRgba(color, 0.5)},
    0 0 ${15 * intensity}px ${hexToRgba(color, 0.25)},
    0 0 ${30 * intensity}px ${hexToRgba(color, 0.12)}
  `;

  // Box glow — soft
  const boxGlow = (color: string, intensity: number = 1) =>
    `0 0 ${10 * intensity}px ${hexToRgba(color, 0.2)}, 0 0 ${20 * intensity}px ${hexToRgba(color, 0.1)}`;

  // === BACKGROUND — deep with subtle color zones ===
  const bgGradient = `
    background: radial-gradient(ellipse at 25% 15%, ${hexToRgba(accent, 0.05)} 0%, transparent 50%),
                radial-gradient(ellipse at 75% 85%, ${hexToRgba(accentWarm, 0.04)} 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, #12121F 0%, #0A0A14 100%);
  `;

  // === GEOMETRIC ACCENTS (refined, not aggressive) ===
  const geoShapes = `
    <!-- Corner accent — top right -->
    <div style="
      position: absolute;
      top: 0; right: 0;
      width: ${350 * baseScale}px;
      height: ${350 * baseScale}px;
      background: linear-gradient(135deg, ${hexToRgba(accent, 0.07)}, transparent);
      clip-path: polygon(100% 0, 40% 0, 100% 60%);
      z-index: 1;
    "></div>

    <!-- Corner accent — bottom left -->
    <div style="
      position: absolute;
      bottom: 0; left: 0;
      width: ${300 * baseScale}px;
      height: ${300 * baseScale}px;
      background: linear-gradient(315deg, ${hexToRgba(accentWarm, 0.06)}, transparent);
      clip-path: polygon(0 100%, 0 40%, 60% 100%);
      z-index: 1;
    "></div>

    <!-- Accent line — top -->
    <div style="
      position: absolute;
      top: 0; left: 0; right: 0;
      height: ${3 * baseScale}px;
      background: linear-gradient(to right, transparent 10%, ${hexToRgba(accent, 0.6)} 50%, transparent 90%);
      z-index: 5;
    "></div>

    <!-- Accent line — bottom -->
    <div style="
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: ${3 * baseScale}px;
      background: linear-gradient(to right, transparent 10%, ${hexToRgba(accentWarm, 0.5)} 50%, transparent 90%);
      z-index: 5;
    "></div>

    <!-- Dot grid — subtle -->
    <div style="
      position: absolute;
      top: ${50 * baseScale}px;
      left: ${25 * baseScale}px;
      width: ${130 * baseScale}px;
      height: ${130 * baseScale}px;
      background-image: radial-gradient(${hexToRgba(accent, 0.2)} ${1.5 * baseScale}px, transparent ${1.5 * baseScale}px);
      background-size: ${20 * baseScale}px ${20 * baseScale}px;
      z-index: 1;
    "></div>

    <!-- Diagonal stripes — right edge -->
    <div style="
      position: absolute;
      top: ${isTall ? '38%' : '28%'};
      right: 0;
      width: ${60 * baseScale}px;
      height: ${160 * baseScale}px;
      z-index: 1;
      overflow: hidden;
    ">
      <div style="
        width: 100%; height: 100%;
        background: repeating-linear-gradient(
          -45deg,
          transparent,
          transparent ${8 * baseScale}px,
          ${hexToRgba(accent, 0.05)} ${8 * baseScale}px,
          ${hexToRgba(accent, 0.05)} ${10 * baseScale}px
        );
      "></div>
    </div>
  `;

  // === PHOTO ZONE ===
  const photoHeight = isLandscape ? 100 : isSquare ? 35 : 38;
  const photoZone = data.imageUrl ? `
    <div style="
      ${isLandscape
        ? `position: absolute; top: 0; left: 0; width: 42%; height: 100%;`
        : `width: 100%; height: ${photoHeight}%; flex-shrink: 0;`
      }
      overflow: hidden;
      ${isLandscape
        ? `clip-path: polygon(0 0, 100% 0, 75% 100%, 0 100%);`
        : `clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);`
      }
      z-index: 2;
    ">
      <img src="${escapeHtml(data.imageUrl)}" style="
        width: 100%; height: 100%; object-fit: cover;
        filter: brightness(0.7) saturate(1.1) contrast(1.05);
      " />
      <div style="
        position: absolute; inset: 0;
        background: linear-gradient(
          ${isLandscape ? 'to right' : '180deg'},
          ${hexToRgba('#0A0A14', 0.15)} 0%,
          ${hexToRgba('#0A0A14', 0.45)} 60%,
          ${hexToRgba('#0A0A14', 0.75)} 100%
        );
      "></div>
    </div>
    <!-- Glow line matching the photo diagonal edge -->
    ${!isLandscape ? `
    <svg style="
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: ${photoHeight}%;
      z-index: 4;
      pointer-events: none;
      overflow: visible;
    " viewBox="0 0 1080 100" preserveAspectRatio="none">
      <line x1="0" y1="100" x2="1080" y2="85"
        stroke="${accent}" stroke-width="${3 * baseScale}"
        style="filter: drop-shadow(0 0 ${6 * baseScale}px ${accent}) drop-shadow(0 0 ${12 * baseScale}px ${hexToRgba(accent, 0.4)});" />
    </svg>
    ` : ""}
  ` : "";

  // === BADGE ===
  const badgeHtml = data.badge ? `
    <div style="margin-bottom: ${14 * scale}px;">
      <span style="
        display: inline-block;
        background: ${hexToRgba(accent, 0.1)};
        color: ${accent};
        border: ${2 * scale}px solid ${hexToRgba(accent, 0.5)};
        padding: ${9 * scale}px ${26 * scale}px;
        font-size: ${20 * scale}px;
        font-weight: 800;
        letter-spacing: ${1 * scale}px;
        text-shadow: ${subtleGlow(accent, 0.5)};
        box-shadow: ${boxGlow(accent, 0.6)};
        direction: rtl;
      ">${escapeHtml(data.badge.text)}</span>
    </div>
  ` : "";

  // === COMPANY NAME ===
  const companyHtml = !data.company.isConfidential ? `
    <div style="
      font-size: ${24 * scale}px;
      font-weight: 700;
      color: ${hexToRgba(accent, 0.75)};
      letter-spacing: ${2 * scale}px;
      margin-bottom: ${12 * scale}px;
      direction: rtl;
    ">${escapeHtml(data.company.name)}</div>
  ` : "";

  // === JOB TITLE ===
  const titleSize = isLandscape ? 44 : isSquare ? 50 : 56;
  const titleHtml = `
    <div style="
      font-size: ${titleSize * scale}px;
      font-weight: 900;
      color: #FFFFFF;
      text-shadow: ${subtleGlow(accent, 1.2)};
      line-height: 1.15;
      margin-bottom: ${8 * scale}px;
      direction: rtl;
      text-align: ${isLandscape ? 'right' : 'center'};
    ">${escapeHtml(data.title.he)}</div>
  `;

  // === SUBTITLE ===
  const subtitleHtml = data.subtitle ? `
    <div style="
      font-size: ${19 * scale}px;
      font-weight: 600;
      color: ${hexToRgba(accentWarm, 0.85)};
      margin-bottom: ${18 * scale}px;
      direction: rtl;
      text-align: ${isLandscape ? 'right' : 'center'};
    ">${escapeHtml(data.subtitle)}</div>
  ` : "";

  // === BENEFITS (refined cards) ===
  const benefitsHtml = (data.benefits && data.benefits.length > 0) ? `
    <div style="
      display: flex;
      flex-wrap: wrap;
      gap: ${12 * scale}px;
      justify-content: center;
      margin-bottom: ${16 * scale}px;
    ">
      ${data.benefits.map((b) => `
        <div style="
          background: ${hexToRgba(accentWarm, 0.1)};
          color: ${accentWarm};
          border: ${1.5 * scale}px solid ${hexToRgba(accentWarm, 0.35)};
          padding: ${12 * scale}px ${24 * scale}px;
          border-radius: ${10 * scale}px;
          font-size: ${20 * scale}px;
          font-weight: 700;
          box-shadow: ${boxGlow(accentWarm, 0.4)};
          direction: rtl;
          flex: 1;
          min-width: ${140 * scale}px;
          text-align: center;
        "><i class="fa-solid fa-star" style="font-size: ${12 * scale}px; margin-left: ${6 * scale}px; opacity: 0.7;"></i>${escapeHtml(b)}</div>
      `).join("")}
    </div>
  ` : "";

  // === SALARY (HERO — the star of the poster) ===
  const salaryFontSize = isLandscape ? 44 : isSquare ? 48 : 64;
  const salaryIconSize = isLandscape ? 36 : isSquare ? 38 : 50;
  const salaryPad = isSquare ? 20 : 32;
  const salaryHtml = data.salary?.display ? `
    <div style="
      background: linear-gradient(135deg, ${hexToRgba('#D4A053', 0.2)}, ${hexToRgba('#D4A053', 0.06)});
      border: ${3 * scale}px solid ${hexToRgba('#D4A053', 0.55)};
      border-radius: ${18 * scale}px;
      padding: ${salaryPad * scale}px ${32 * scale}px;
      text-align: center;
      margin-bottom: ${18 * scale}px;
      box-shadow: 0 0 ${25 * scale}px ${hexToRgba('#D4A053', 0.25)},
                  0 0 ${50 * scale}px ${hexToRgba('#D4A053', 0.1)};
    ">
      <div style="display: flex; align-items: center; justify-content: center; gap: ${14 * scale}px;">
        <i class="fa-solid fa-shekel-sign" style="
          font-size: ${salaryIconSize * scale}px;
          color: #D4A053;
          text-shadow: 0 0 ${12 * scale}px ${hexToRgba('#D4A053', 0.35)};
        "></i>
        <span style="
          font-size: ${salaryFontSize * scale}px;
          font-weight: 900;
          color: #D4A053;
          text-shadow: 0 0 ${20 * scale}px ${hexToRgba('#D4A053', 0.35)};
        ">${escapeHtml(data.salary.display)}</span>
      </div>
    </div>
  ` : "";

  // === DETAIL CIRCLES (2 top row, 3 bottom row for mobile) ===
  const maxDetails = isSquare ? 3 : Math.min(data.details.length, 5);
  const visibleDetails = data.details.slice(0, maxDetails);

  const circleColors = [
    { bg: hexToRgba(accent, 0.1), border: hexToRgba(accent, 0.3) },
    { bg: hexToRgba(accentWarm, 0.08), border: hexToRgba(accentWarm, 0.25) },
    { bg: hexToRgba(accent, 0.08), border: hexToRgba(accent, 0.25) },
    { bg: hexToRgba(accentWarm, 0.07), border: hexToRgba(accentWarm, 0.2) },
    { bg: hexToRgba(accent, 0.09), border: hexToRgba(accent, 0.28) },
  ];

  // Row 1: 2 bigger circles, Row 2: 3 slightly smaller circles
  const bigSize = Math.round(260 * scale);
  const smallSize = Math.round(210 * scale);

  // Icons matched by detail label keywords
  const detailIcons = [
    "fa-solid fa-briefcase",
    "fa-solid fa-laptop-code",
    "fa-solid fa-file-lines",
    "fa-solid fa-users",
    "fa-solid fa-arrows-spin",
  ];

  const makeCircle = (d: { value: string }, i: number, size: number) => {
    const c = circleColors[i % circleColors.length];
    const icon = detailIcons[i % detailIcons.length];
    const iconSize = size > 220 * scale ? 26 * scale : 22 * scale;
    const textSize = size > 220 * scale ? 17 * scale : 14.5 * scale;
    const iconColor = i % 2 === 0 ? accent : accentWarm;
    return `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: linear-gradient(
          145deg,
          ${hexToRgba('#FFFFFF', 0.1)} 0%,
          ${hexToRgba('#FFFFFF', 0.03)} 50%,
          ${hexToRgba(c.border, 0.05)} 100%
        );
        border: ${1.5 * scale}px solid ${hexToRgba('#FFFFFF', 0.12)};
        backdrop-filter: blur(${8 * scale}px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: ${16 * scale}px;
        gap: ${8 * scale}px;
        box-shadow:
          0 0 ${18 * scale}px ${hexToRgba(c.border, 0.1)},
          inset 0 ${1 * scale}px ${2 * scale}px ${hexToRgba('#FFFFFF', 0.08)};
        flex-shrink: 0;
      ">
        <i class="${icon}" style="
          font-size: ${iconSize}px;
          color: ${iconColor};
          opacity: 0.85;
        "></i>
        <span style="
          font-size: ${textSize}px;
          color: ${hexToRgba('#FFFFFF', 0.88)};
          font-weight: 600;
          text-align: center;
          direction: rtl;
          line-height: 1.3;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        ">${escapeHtml(d.value)}</span>
      </div>`;
  };

  // Split: first 2 in top row (big), rest in bottom row (smaller)
  const topRow = visibleDetails.slice(0, 2);
  const bottomRow = visibleDetails.slice(2);

  const detailCircles = `
    <div style="direction: rtl; margin-bottom: ${10 * scale}px;">
      <!-- Row 1: 2 big circles -->
      <div style="
        display: flex;
        justify-content: center;
        gap: ${20 * scale}px;
        margin-bottom: ${14 * scale}px;
      ">
        ${topRow.map((d, i) => makeCircle(d, i, bigSize)).join("")}
      </div>
      ${bottomRow.length > 0 ? `
      <!-- Row 2: 3 smaller circles -->
      <div style="
        display: flex;
        justify-content: center;
        gap: ${14 * scale}px;
      ">
        ${bottomRow.map((d, i) => makeCircle(d, i + 2, smallSize)).join("")}
      </div>
      ` : ""}
    </div>
  `;

  // Square format — compact bars (circles won't fit)
  const detailBars = visibleDetails.map((d, i) => {
    const borderColor = i % 2 === 0 ? hexToRgba(accent, 0.3) : hexToRgba(accent, 0.18);
    return `
    <div style="
      background: ${hexToRgba('#FFFFFF', 0.04)};
      border-right: ${3 * scale}px solid ${borderColor};
      border-radius: ${6 * scale}px;
      padding: ${9 * scale}px ${16 * scale}px;
      margin-bottom: ${6 * scale}px;
    ">
      <span style="
        font-size: ${17 * scale}px;
        color: ${hexToRgba('#FFFFFF', 0.8)};
        font-weight: 600;
        direction: rtl;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      ">${escapeHtml(d.value)}</span>
    </div>`;
  }).join("");

  // Choose layout based on format
  const detailsSection = isSquare ? detailBars : detailCircles;

  // === CTA BUTTON ===
  const ctaButton = `
    <div style="
      background: linear-gradient(135deg, ${accent}, ${adjustBrightness(accent, -30)});
      color: #0A0A14;
      padding: ${18 * scale}px ${28 * scale}px;
      border-radius: ${12 * scale}px;
      font-size: ${22 * scale}px;
      font-weight: 800;
      text-align: center;
      box-shadow: ${subtleGlow(accent, 1.2)};
      width: 100%;
    ">
      <i class="fa-solid fa-link" style="margin-left: ${10 * scale}px;"></i>
      ${escapeHtml(ctaText)}
      ${contactDisplayText ? `
        <div style="
          font-size: ${14 * scale}px;
          font-weight: 500;
          opacity: 0.5;
          margin-top: ${4 * scale}px;
        ">${escapeHtml(contactDisplayText)}</div>
      ` : ""}
    </div>
  `;

  // === FOOTER ===
  const footer = `
    <div style="
      text-align: center;
      font-size: ${12 * scale}px;
      color: ${hexToRgba('#FFFFFF', 0.18)};
      margin-top: ${10 * scale}px;
    ">*התהליך מנוהל ע"י Personal Hire - סוכנות גיוס עובדים</div>
  `;

  const pad = isLandscape ? 40 * scale : 36 * scale;

  // === LANDSCAPE LAYOUT ===
  if (isLandscape) {
    const ls = scale * 1.15;

    const landscapeBenefits = (data.benefits && data.benefits.length > 0) ? `
      <div style="
        display: flex;
        gap: ${12 * ls}px;
        justify-content: flex-start;
        margin-bottom: ${12 * ls}px;
        direction: rtl;
      ">
        ${data.benefits.map((b) => `
          <div style="
            background: ${hexToRgba(accentWarm, 0.1)};
            color: ${accentWarm};
            border: ${1.5 * ls}px solid ${hexToRgba(accentWarm, 0.3)};
            padding: ${9 * ls}px ${18 * ls}px;
            border-radius: ${8 * ls}px;
            font-size: ${18 * ls}px;
            font-weight: 700;
            white-space: nowrap;
          "><i class="fa-solid fa-star" style="font-size: ${11 * ls}px; margin-left: ${6 * ls}px; opacity: 0.6;"></i>${escapeHtml(b)}</div>
        `).join("")}
      </div>
    ` : "";

    const landscapeSalary = data.salary?.display ? `
      <div style="
        background: linear-gradient(135deg, ${hexToRgba('#D4A053', 0.18)}, ${hexToRgba('#D4A053', 0.05)});
        border: ${2.5 * ls}px solid ${hexToRgba('#D4A053', 0.5)};
        border-radius: ${12 * ls}px;
        padding: ${14 * ls}px ${24 * ls}px;
        text-align: center;
        margin-bottom: ${10 * ls}px;
        box-shadow: 0 0 ${20 * ls}px ${hexToRgba('#D4A053', 0.2)},
                    0 0 ${40 * ls}px ${hexToRgba('#D4A053', 0.08)};
      ">
        <div style="display: flex; align-items: center; justify-content: center; gap: ${10 * ls}px;">
          <i class="fa-solid fa-shekel-sign" style="font-size: ${36 * ls}px; color: #D4A053; text-shadow: 0 0 ${10 * ls}px ${hexToRgba('#D4A053', 0.3)};"></i>
          <span style="font-size: ${44 * ls}px; font-weight: 900; color: #D4A053; text-shadow: 0 0 ${14 * ls}px ${hexToRgba('#D4A053', 0.3)};">${escapeHtml(data.salary.display)}</span>
        </div>
      </div>
    ` : "";

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead()}
  <style>
    ${baseStyles(data, width, height, scale)}
    body { ${bgGradient} }
  </style>
</head>
<body>
  <div style="width: 100%; height: 100%; position: relative; overflow: hidden;">
    ${geoShapes}
    ${photoZone}

    <div style="
      position: absolute;
      top: 0; right: 0;
      width: 60%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: ${14 * ls}px ${32 * ls}px;
      z-index: 3;
      direction: rtl;
    ">
      ${badgeHtml}
      ${companyHtml}

      <div style="
        font-size: ${48 * ls}px;
        font-weight: 900;
        color: #FFFFFF;
        text-shadow: ${subtleGlow(accent, 1.2)};
        line-height: 1.15;
        margin-bottom: ${10 * ls}px;
        direction: rtl;
      ">${escapeHtml(data.title.he)}</div>

      ${subtitleHtml}
      ${landscapeBenefits}
      ${landscapeSalary}

      <div style="
        background: linear-gradient(135deg, ${accent}, ${adjustBrightness(accent, -30)});
        color: #0A0A14;
        padding: ${12 * ls}px ${22 * ls}px;
        border-radius: ${10 * ls}px;
        font-size: ${20 * ls}px;
        font-weight: 800;
        text-align: center;
        box-shadow: ${subtleGlow(accent, 1)};
      ">
        <i class="fa-solid fa-link" style="margin-left: ${8 * ls}px;"></i>
        ${escapeHtml(ctaText)}
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
    body { ${bgGradient} }
  </style>
</head>
<body>
  <div style="
    width: 100%; height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  ">
    ${geoShapes}
    ${photoZone}

    <div style="
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: ${isTall ? 'flex-start' : 'space-between'};
      padding: ${isTall ? 22 * scale : 14 * scale}px ${pad}px ${18 * scale}px;
      z-index: 3;
      position: relative;
      ${isTall ? `gap: ${8 * scale}px;` : ''}
    ">
      <div>
        <div style="text-align: center;">
          ${badgeHtml}
          ${companyHtml}
        </div>
        ${titleHtml}
        ${subtitleHtml}
        ${benefitsHtml}
        ${salaryHtml}
        ${detailsSection}
      </div>

      <div style="${isTall ? 'margin-top: auto;' : ''}">
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
