import { PosterData } from "../types";
import { sharedHead, baseStyles, escapeHtml, hexToRgba } from "./shared";

export function renderOverlay(data: PosterData, width: number, height: number): string {
  const baseScale = width / 1080;
  const aspectRatio = height / width;
  const isLandscape = width > height;
  const isSquare = !isLandscape && aspectRatio < 1.15;
  const isTall = aspectRatio > 1.6; // Story / A4

  // Height boost for tall/portrait formats to fill vertical space
  const heightBoost = aspectRatio > 1.3 ? Math.min(aspectRatio / 1.3, 1.5) : 1;

  // Spacing compression for height-constrained formats (padding/margin, not fonts)
  const sp = isLandscape ? 0.6 : isSquare ? 0.8 : 1;

  // Format-aware scale: constrained by available content area height
  const outerPad = 48 * baseScale * sp;
  const usableH = height - outerPad * 2;
  // Content-aware estimate: base (company+title+CTA+footer) + per-detail + extras
  const contentRef = 350 + data.details.length * 50
    + (data.salary?.display ? 30 : 0)
    + (data.benefits?.length ? 30 : 0)
    + (data.badge ? 60 : 0)
    + (data.spotlight ? 60 : 0);
  const scale = Math.min(baseScale * heightBoost, usableH / contentRef);

  const primary = data.theme.primary;
  const navy = adjustBrightness(primary, -60);
  const mediumBlue = adjustBrightness(primary, -20);
  const lightBlue = adjustBrightness(primary, 40);

  // Contact
  const contactIcons: Record<string, string> = {
    whatsapp: "fa-brands fa-whatsapp",
    email: "fa-solid fa-envelope",
    phone: "fa-solid fa-phone",
  };
  const contactIcon = contactIcons[data.contact.method] || "fa-solid fa-paper-plane";
  const ctaText = data.cta?.text || "שלחו קורות חיים";

  // === DECORATIVE CIRCLES (with gradient fills, scaled to canvas) ===
  const circleScale = baseScale * Math.max(heightBoost, 1.2);
  const circles = `
    <div style="position:absolute; top:${-30*circleScale}px; left:${-35*circleScale}px; width:${120*circleScale}px; height:${120*circleScale}px; border-radius:50%; background:linear-gradient(135deg, ${hexToRgba(mediumBlue,0.3)}, ${hexToRgba(lightBlue,0.1)}); z-index:1;"></div>
    <div style="position:absolute; top:${70*circleScale}px; left:${50*circleScale}px; width:${40*circleScale}px; height:${40*circleScale}px; border-radius:50%; background:linear-gradient(135deg, ${hexToRgba(primary,0.5)}, ${hexToRgba(navy,0.3)}); z-index:1;"></div>
    <div style="position:absolute; top:${-18*circleScale}px; right:${-22*circleScale}px; width:${80*circleScale}px; height:${80*circleScale}px; border-radius:50%; background:linear-gradient(135deg, ${hexToRgba(lightBlue,0.3)}, ${hexToRgba(mediumBlue,0.15)}); z-index:1;"></div>
    <div style="position:absolute; top:${75*circleScale}px; right:${40*circleScale}px; width:${30*circleScale}px; height:${30*circleScale}px; border-radius:50%; background:linear-gradient(135deg, ${hexToRgba(navy,0.5)}, ${hexToRgba(primary,0.3)}); z-index:1;"></div>
    <div style="position:absolute; bottom:${-40*circleScale}px; left:${-30*circleScale}px; width:${140*circleScale}px; height:${140*circleScale}px; border-radius:50%; background:linear-gradient(135deg, ${hexToRgba(mediumBlue,0.22)}, ${hexToRgba(lightBlue,0.08)}); z-index:1;"></div>
    <div style="position:absolute; bottom:${65*circleScale}px; left:${65*circleScale}px; width:${45*circleScale}px; height:${45*circleScale}px; border-radius:50%; background:linear-gradient(135deg, ${hexToRgba(primary,0.4)}, ${hexToRgba(navy,0.2)}); z-index:1;"></div>
    <div style="position:absolute; bottom:${-15*circleScale}px; right:${-20*circleScale}px; width:${70*circleScale}px; height:${70*circleScale}px; border-radius:50%; background:linear-gradient(135deg, ${hexToRgba(mediumBlue,0.3)}, ${hexToRgba(lightBlue,0.12)}); z-index:1;"></div>
    ${isTall ? `
      <div style="position:absolute; top:${40}%; left:${-20*circleScale}px; width:${90*circleScale}px; height:${90*circleScale}px; border-radius:50%; background:linear-gradient(135deg, ${hexToRgba(primary,0.2)}, ${hexToRgba(lightBlue,0.1)}); z-index:1;"></div>
      <div style="position:absolute; top:${55}%; right:${-15*circleScale}px; width:${60*circleScale}px; height:${60*circleScale}px; border-radius:50%; background:linear-gradient(135deg, ${hexToRgba(mediumBlue,0.25)}, ${hexToRgba(navy,0.12)}); z-index:1;"></div>
    ` : ""}
  `;

  // === HEADLINE BANNERS ===
  const badgeHtml = data.badge ? `
    <div style="
      display: inline-block;
      background: linear-gradient(135deg, ${navy}, ${mediumBlue});
      color: white;
      padding: ${16*scale*sp}px ${36*scale*sp}px;
      font-size: ${34*scale}px;
      font-weight: 800;
      transform: rotate(-2deg);
      direction: rtl;
      box-shadow: 0 ${4*scale}px ${20*scale}px rgba(0,0,0,0.25);
      margin-bottom: ${16*scale*sp}px;
      max-width: 90%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    ">${escapeHtml(data.badge.text)}</div>
  ` : "";

  // === SPOTLIGHT HERO ===
  const spotlightHtml = (() => {
    if (!data.spotlight) return "";
    const st = data.spotlight;
    let bg = "";
    let fg = "";
    let icon = "";
    if (st.type === "salary") {
      bg = "linear-gradient(135deg, #F59E0B, #D97706)";
      fg = "#1E1E1E";
      icon = `<i class="fa-solid fa-shekel-sign" style="margin-left:${10*scale}px;font-size:${30*scale}px;"></i>`;
    } else if (st.type === "tagline") {
      bg = "linear-gradient(135deg, #FFFFFF, #F1F5F9)";
      fg = navy;
      icon = "";
    } else if (st.type === "benefit") {
      bg = "linear-gradient(135deg, #059669, #047857)";
      fg = "#FFFFFF";
      icon = `<i class="fa-solid fa-star" style="margin-left:${10*scale}px;font-size:${28*scale}px;"></i>`;
    }
    return `
      <div style="
        background: ${bg};
        color: ${fg};
        padding: ${18*scale*sp}px ${36*scale*sp}px;
        font-size: ${36*scale}px;
        font-weight: 800;
        text-align: center;
        direction: rtl;
        line-height: 1.3;
        box-shadow: 0 ${6*scale}px ${22*scale}px rgba(0,0,0,0.2);
        margin-top: ${12*scale*sp}px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: ${8*scale}px;
      ">${icon}<span>${escapeHtml(st.text)}</span></div>
    `;
  })();

  const companyBanner = data.company.isConfidential ? "" : `
    <div style="
      background: linear-gradient(135deg, ${navy}, ${adjustBrightness(navy, 20)});
      color: white;
      padding: ${20*scale*sp}px ${40*scale*sp}px;
      font-size: ${48*scale}px;
      font-weight: 900;
      text-align: center;
      direction: rtl;
      line-height: 1.2;
      box-shadow: 0 ${6*scale}px ${24*scale}px rgba(0,0,0,0.3);
      transform: rotate(-0.5deg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    ">${escapeHtml(data.company.name)}</div>
  `;

  const titleBanner = `
    <div style="
      background: linear-gradient(135deg, #FFFFFF, ${hexToRgba(lightBlue, 0.15)});
      color: ${navy};
      padding: ${16*scale*sp}px ${36*scale*sp}px;
      font-size: ${38*scale}px;
      font-weight: 800;
      text-align: center;
      direction: rtl;
      line-height: 1.3;
      box-shadow: 0 ${4*scale}px ${16*scale}px rgba(0,0,0,0.15);
      margin-top: ${8*scale*sp}px;
      transform: rotate(0.5deg);
    ">${escapeHtml(data.title.he)}</div>
  `;

  // === SUB-HEADLINE BAR ===
  const subParts: string[] = [];
  if (data.salary?.display && data.spotlight?.type !== "salary") subParts.push(escapeHtml(data.salary.display));
  if (data.benefits && data.benefits.length > 0) {
    data.benefits.forEach(b => subParts.push(escapeHtml(b)));
  }
  const subHeadline = subParts.length > 0
    ? `<div style="
        background: linear-gradient(135deg, ${navy}, ${mediumBlue});
        color: white;
        padding: ${14*scale*sp}px ${28*scale*sp}px;
        font-size: ${22*scale}px;
        font-weight: 700;
        text-align: center;
        direction: rtl;
        margin-top: ${12*scale*sp}px;
        line-height: 1.5;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      ">${subParts.join(` <span style="opacity:0.5; margin:0 ${6*scale}px;">•</span> `)}</div>`
    : "";

  // === BULLET LIST ===
  const bulletList = data.details.map(d => `
    <div style="
      display: flex;
      align-items: baseline;
      gap: ${14*scale*sp}px;
      direction: rtl;
      margin-bottom: ${10*scale*sp}px;
    ">
      <div style="
        width: ${14*scale}px;
        height: ${14*scale}px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${primary}, ${mediumBlue});
        flex-shrink: 0;
        margin-top: ${10*scale*sp}px;
      "></div>
      <span style="
        font-size: ${24*scale}px;
        color: ${navy};
        font-weight: 600;
        line-height: 1.7;
      ">${escapeHtml(d.value)}</span>
    </div>
  `).join("");

  const pad = outerPad;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Heebo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Heebo', sans-serif;
      font-weight: 400;
      line-height: 1.35;
      color: ${data.theme.textColor};
      overflow: hidden;
      position: relative;
      direction: rtl;
      background: #FFFFFF;
    }
  </style>
</head>
<body>
  <!-- Full-bleed background photo -->
  ${data.imageUrl
    ? `<img src="${escapeHtml(data.imageUrl)}" style="
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 0;
      " />`
    : ""
  }

  <!-- Gradient frosted overlay -->
  <div style="
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(255,255,255,0.55) 0%,
      rgba(255,255,255,0.35) 40%,
      rgba(255,255,255,0.35) 60%,
      rgba(255,255,255,0.55) 100%
    );
    z-index: 0;
  "></div>

  ${circles}

  <!-- Main content -->
  <div style="
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: ${isTall ? 'flex-start' : 'space-between'};
    ${isTall ? `gap: ${20*scale}px;` : ''}
    padding: ${pad}px;
    direction: rtl;
  ">
    <!-- TOP: Banners -->
    <div style="text-align: right;">
      ${badgeHtml}
      ${companyBanner}
      ${titleBanner}
      ${data.jobTitle ? `<div style="
        background: rgba(255,255,255,0.15);
        color: ${navy};
        font-size: ${22*scale}px;
        font-weight: 600;
        text-align: center;
        direction: rtl;
        margin-top: ${8*scale}px;
        padding: ${10*scale}px ${24*scale}px;
        backdrop-filter: blur(${8*scale}px);
      ">${escapeHtml(data.jobTitle)}</div>` : ""}
      ${spotlightHtml}
      ${subHeadline}
    </div>

    <!-- MIDDLE: Bullet list with frosted panel -->
    <div style="
      padding: ${22*scale*sp}px ${28*scale*sp}px;
      background: linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.68));
      border-radius: ${14*scale}px;
      box-shadow: 0 ${4*scale}px ${20*scale}px rgba(0,0,0,0.08);
      backdrop-filter: blur(${8*scale}px);
      ${isTall ? `margin-top: ${20*scale}px;` : ""}
    ">
      ${bulletList}
    </div>

    <!-- BOTTOM: CTA + footer -->
    <div style="${isTall ? 'margin-top: auto;' : ''}">
      <div style="
        background: linear-gradient(135deg, ${navy}, ${mediumBlue});
        color: white;
        padding: ${22*scale*sp}px ${48*scale*sp}px;
        border-radius: ${40*scale}px;
        font-size: ${28*scale}px;
        font-weight: 700;
        text-align: center;
        box-shadow: 0 ${6*scale}px ${24*scale}px ${hexToRgba(navy, 0.35)};
        margin: 0 auto;
        width: fit-content;
        max-width: 85%;
      ">
        ${escapeHtml(ctaText)}
      </div>

      <div style="
        text-align: center;
        font-size: ${14*scale}px;
        color: ${hexToRgba(navy, 0.5)};
        margin-top: ${12*scale*sp}px;
      ">*התהליך מנוהל ע"י Personal Hire - סוכנות גיוס עובדים</div>
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
