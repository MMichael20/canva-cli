import { PosterData, FORMAT_DIMENSIONS, ICON_COLORS, IconColor } from "./templates";

const ICON_GRADIENTS: Record<IconColor, [string, string]> = {
  purple: ["#6366F1", "#818CF8"],
  cyan: ["#06B6D4", "#22D3EE"],
  pink: ["#EC4899", "#F472B6"],
  amber: ["#F59E0B", "#FBBF24"],
  green: ["#10B981", "#34D399"],
  blue: ["#2563EB", "#3B82F6"],
  red: ["#DC2626", "#EF4444"],
  emerald: ["#059669", "#10B981"],
};

function getIconColor(index: number): IconColor {
  return ICON_COLORS[index % ICON_COLORS.length];
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function highlightValue(value: string, highlight?: string, accentColor?: string): string {
  if (!highlight) return escapeHtml(value);
  const escaped = escapeHtml(value);
  const escapedHighlight = escapeHtml(highlight);
  return escaped.replace(
    escapedHighlight,
    `<span style="color: ${accentColor || "#06B6D4"}; font-weight: 700;">${escapedHighlight}</span>`
  );
}

function sharedHead(data: PosterData): string {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  `;
}

function backgroundCss(data: PosterData): string {
  if (data.backgroundUrl) {
    return `url('${data.backgroundUrl}') center/cover no-repeat`;
  }
  return `linear-gradient(135deg, ${data.theme.bgColor} 0%, ${adjustColor(data.theme.bgColor, 15)} 50%, ${data.theme.bgColor} 100%)`;
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE: dark-cards
// ─────────────────────────────────────────────────────────────

function renderDarkCards(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isPost = data.format === "post";
  const isA4 = data.format === "a4";

  const detailCards = data.details
    .map((detail, i) => {
      const color = getIconColor(i);
      const [gradFrom, gradTo] = ICON_GRADIENTS[color];
      return `
        <div class="detail-card">
          <div class="detail-icon" style="background: linear-gradient(135deg, ${gradFrom}, ${gradTo});">
            <i class="${escapeHtml(detail.icon)}"></i>
          </div>
          <div class="detail-content">
            <div class="detail-label">${escapeHtml(detail.label)}</div>
            <div class="detail-value">${highlightValue(detail.value, detail.highlight, data.theme.accent)}</div>
          </div>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Heebo', sans-serif;
      background: ${backgroundCss(data)};
      color: #FFFFFF;
      overflow: hidden;
      position: relative;
      direction: rtl;
    }

    /* Grid pattern overlay */
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
      background-size: ${60 * scale}px ${60 * scale}px;
      pointer-events: none;
      z-index: 0;
    }

    /* Background overlay for image backgrounds */
    body::after {
      content: '';
      position: absolute;
      inset: 0;
      background: ${data.backgroundUrl ? `linear-gradient(180deg, rgba(11,13,23,0.85) 0%, rgba(11,13,23,0.7) 40%, rgba(11,13,23,0.85) 100%)` : "transparent"};
      pointer-events: none;
      z-index: 0;
    }

    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: ${isA4 ? 120 * scale : isPost ? 60 * scale : 80 * scale}px ${70 * scale}px;
      justify-content: ${isPost ? "center" : "flex-start"};
      gap: ${isPost ? 24 * scale : 32 * scale}px;
      padding-top: ${isPost ? 60 * scale : isA4 ? 180 * scale : 140 * scale}px;
    }

    /* Glow orb behind title */
    .glow-orb {
      position: absolute;
      width: ${400 * scale}px;
      height: ${400 * scale}px;
      border-radius: 50%;
      background: radial-gradient(circle, ${data.theme.primary}33 0%, transparent 70%);
      top: ${isPost ? 80 * scale : 120 * scale}px;
      right: -${80 * scale}px;
      filter: blur(${80 * scale}px);
      pointer-events: none;
      z-index: 0;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: ${12 * scale}px;
      background: linear-gradient(135deg, ${data.theme.primary}22, ${data.theme.accent}22);
      border: 1px solid ${data.theme.primary}44;
      border-radius: ${50 * scale}px;
      padding: ${12 * scale}px ${28 * scale}px;
      font-size: ${26 * scale}px;
      font-weight: 600;
      color: ${data.theme.accent};
      width: fit-content;
      backdrop-filter: blur(10px);
    }

    .badge i {
      font-size: ${22 * scale}px;
    }

    .subtitle {
      font-size: ${32 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.65);
      margin-top: ${8 * scale}px;
      letter-spacing: 0.02em;
    }

    .title-he {
      font-size: ${isPost ? 64 * scale : 72 * scale}px;
      font-weight: 800;
      line-height: 1.15;
      background: linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.85) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .title-en {
      font-size: ${isPost ? 36 * scale : 42 * scale}px;
      font-weight: 300;
      color: ${data.theme.accent};
      letter-spacing: 0.08em;
      margin-top: ${4 * scale}px;
      opacity: 0.9;
    }

    .divider {
      width: ${120 * scale}px;
      height: ${3 * scale}px;
      background: linear-gradient(90deg, ${data.theme.primary}, ${data.theme.accent});
      border-radius: ${2 * scale}px;
      margin: ${16 * scale}px 0;
    }

    .details {
      display: flex;
      flex-direction: column;
      gap: ${16 * scale}px;
      margin: ${isPost ? 8 * scale : 20 * scale}px 0;
    }

    .detail-card {
      display: flex;
      align-items: center;
      gap: ${20 * scale}px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: ${18 * scale}px;
      padding: ${20 * scale}px ${24 * scale}px;
      backdrop-filter: blur(12px);
      transition: all 0.3s ease;
    }

    .detail-icon {
      width: ${56 * scale}px;
      height: ${56 * scale}px;
      border-radius: ${14 * scale}px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.3);
    }

    .detail-icon i {
      font-size: ${24 * scale}px;
      color: #FFFFFF;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: ${4 * scale}px;
    }

    .detail-label {
      font-size: ${22 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.5);
    }

    .detail-value {
      font-size: ${28 * scale}px;
      font-weight: 600;
      color: #FFFFFF;
      line-height: 1.3;
    }

    .cta-section {
      margin-top: auto;
      ${isPost ? `margin-top: ${16 * scale}px;` : ""}
    }

    .cta-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${16 * scale}px;
      background: linear-gradient(135deg, ${data.theme.primary}, ${data.theme.accent});
      border-radius: ${18 * scale}px;
      padding: ${28 * scale}px ${40 * scale}px;
      font-size: ${30 * scale}px;
      font-weight: 700;
      color: #FFFFFF;
      box-shadow:
        0 ${4 * scale}px ${24 * scale}px ${data.theme.primary}44,
        0 ${1 * scale}px ${2 * scale}px rgba(255,255,255,0.1) inset;
      text-align: center;
    }

    .cta-button i {
      font-size: ${28 * scale}px;
    }

    .cta-subtext {
      text-align: center;
      font-size: ${22 * scale}px;
      color: rgba(255,255,255,0.45);
      margin-top: ${14 * scale}px;
      font-weight: 300;
    }

    /* Decorative corner accents */
    .corner-accent {
      position: absolute;
      width: ${80 * scale}px;
      height: ${80 * scale}px;
      border: ${2 * scale}px solid ${data.theme.primary}22;
      z-index: 0;
    }
    .corner-accent.top-right { top: ${30 * scale}px; right: ${30 * scale}px; border-bottom: none; border-left: none; border-radius: 0 ${12 * scale}px 0 0; }
    .corner-accent.bottom-left { bottom: ${30 * scale}px; left: ${30 * scale}px; border-top: none; border-right: none; border-radius: 0 0 0 ${12 * scale}px; }
  </style>
</head>
<body>
  <div class="glow-orb"></div>
  <div class="corner-accent top-right"></div>
  <div class="corner-accent bottom-left"></div>

  <div class="container">
    <div class="badge">
      <i class="${escapeHtml(data.badge.icon)}"></i>
      ${escapeHtml(data.badge.text)}
    </div>

    <div class="subtitle">${escapeHtml(data.subtitle)}</div>

    <div class="title-he">${escapeHtml(data.titleHe)}</div>
    <div class="title-en">${escapeHtml(data.titleEn)}</div>

    <div class="divider"></div>

    <div class="details">
      ${detailCards}
    </div>

    <div class="cta-section">
      <div class="cta-button">
        <i class="${escapeHtml(data.cta.icon)}"></i>
        ${escapeHtml(data.cta.text)}
      </div>
      <div class="cta-subtext">${escapeHtml(data.cta.subtext)}</div>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE: bold-photo
// ─────────────────────────────────────────────────────────────

function renderBoldPhoto(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isPost = data.format === "post";
  const isA4 = data.format === "a4";

  const photoHeight = isPost ? 42 : 48;
  const panelHeight = 100 - photoHeight;

  const detailItems = data.details
    .map((detail, i) => {
      const color = getIconColor(i);
      const [gradFrom, gradTo] = ICON_GRADIENTS[color];
      return `
        <div class="detail-item">
          <div class="detail-dot" style="background: linear-gradient(135deg, ${gradFrom}, ${gradTo});"></div>
          <div class="detail-icon-sm" style="color: ${gradFrom};">
            <i class="${escapeHtml(detail.icon)}"></i>
          </div>
          <div class="detail-text">
            <span class="detail-label">${escapeHtml(detail.label)}</span>
            <span class="detail-value">${highlightValue(detail.value, detail.highlight, data.theme.accent)}</span>
          </div>
        </div>
      `;
    })
    .join("");

  const bgImage = data.backgroundUrl
    ? `url('${data.backgroundUrl}') center/cover no-repeat`
    : `linear-gradient(135deg, ${data.theme.bgColor} 0%, ${adjustColor(data.theme.bgColor, 30)} 50%, ${data.theme.bgColor} 100%)`;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Heebo', sans-serif;
      color: #FFFFFF;
      overflow: hidden;
      direction: rtl;
      background: ${data.theme.bgColor};
    }

    .photo-section {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: ${photoHeight}%;
      background: ${bgImage};
      z-index: 0;
    }

    .photo-section::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(0,0,0,0.3) 0%,
        rgba(0,0,0,0.15) 40%,
        rgba(0,0,0,0.5) 75%,
        ${data.theme.bgColor} 100%
      );
    }

    .title-overlay {
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      height: ${photoHeight + 8}%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: ${30 * scale}px ${60 * scale}px;
      z-index: 2;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: ${10 * scale}px;
      background: ${data.theme.primary};
      border-radius: ${8 * scale}px;
      padding: ${10 * scale}px ${24 * scale}px;
      font-size: ${24 * scale}px;
      font-weight: 700;
      color: #FFFFFF;
      width: fit-content;
      margin-bottom: ${16 * scale}px;
      box-shadow: 0 ${4 * scale}px ${20 * scale}px ${data.theme.primary}66;
    }

    .badge i {
      font-size: ${20 * scale}px;
    }

    .subtitle {
      font-size: ${28 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.75);
      margin-bottom: ${8 * scale}px;
      text-shadow: 0 ${2 * scale}px ${12 * scale}px rgba(0,0,0,0.6);
    }

    .title-he {
      font-size: ${isPost ? 72 * scale : 80 * scale}px;
      font-weight: 900;
      line-height: 1.1;
      color: #FFFFFF;
      text-shadow: 0 ${4 * scale}px ${30 * scale}px rgba(0,0,0,0.7);
    }

    .title-en {
      font-size: ${isPost ? 34 * scale : 40 * scale}px;
      font-weight: 300;
      color: ${data.theme.accent};
      letter-spacing: 0.1em;
      margin-top: ${6 * scale}px;
      text-shadow: 0 ${2 * scale}px ${16 * scale}px rgba(0,0,0,0.6);
    }

    .bottom-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${panelHeight}%;
      background: ${data.theme.bgColor};
      z-index: 3;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: ${24 * scale}px ${60 * scale}px ${isPost ? 36 * scale : 50 * scale}px;
      gap: ${16 * scale}px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${14 * scale}px ${24 * scale}px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: ${14 * scale}px;
      background: rgba(255,255,255,0.04);
      border-radius: ${12 * scale}px;
      padding: ${16 * scale}px ${18 * scale}px;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .detail-dot {
      width: ${6 * scale}px;
      height: ${36 * scale}px;
      border-radius: ${3 * scale}px;
      flex-shrink: 0;
    }

    .detail-icon-sm {
      font-size: ${22 * scale}px;
      flex-shrink: 0;
      width: ${30 * scale}px;
      text-align: center;
    }

    .detail-text {
      display: flex;
      flex-direction: column;
      gap: ${2 * scale}px;
      min-width: 0;
    }

    .detail-label {
      font-size: ${20 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.45);
      display: block;
    }

    .detail-value {
      font-size: ${24 * scale}px;
      font-weight: 600;
      color: #FFFFFF;
      display: block;
      line-height: 1.3;
    }

    .cta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, ${data.theme.primary}, ${data.theme.accent});
      border-radius: ${16 * scale}px;
      padding: ${24 * scale}px ${32 * scale}px;
      margin-top: ${8 * scale}px;
      box-shadow: 0 ${6 * scale}px ${30 * scale}px ${data.theme.primary}55;
    }

    .cta-text {
      font-size: ${28 * scale}px;
      font-weight: 700;
    }

    .cta-subtext {
      font-size: ${20 * scale}px;
      font-weight: 400;
      opacity: 0.85;
      margin-top: ${4 * scale}px;
    }

    .cta-icon-circle {
      width: ${60 * scale}px;
      height: ${60 * scale}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .cta-icon-circle i {
      font-size: ${26 * scale}px;
      color: #FFFFFF;
    }

    /* Decorative line at top of panel */
    .panel-line {
      width: ${100 * scale}px;
      height: ${3 * scale}px;
      background: linear-gradient(90deg, ${data.theme.primary}, ${data.theme.accent});
      border-radius: ${2 * scale}px;
      margin-bottom: ${12 * scale}px;
    }
  </style>
</head>
<body>
  <div class="photo-section"></div>

  <div class="title-overlay">
    <div class="badge">
      <i class="${escapeHtml(data.badge.icon)}"></i>
      ${escapeHtml(data.badge.text)}
    </div>
    <div class="subtitle">${escapeHtml(data.subtitle)}</div>
    <div class="title-he">${escapeHtml(data.titleHe)}</div>
    <div class="title-en">${escapeHtml(data.titleEn)}</div>
  </div>

  <div class="bottom-panel">
    <div class="panel-line"></div>

    <div class="details-grid">
      ${detailItems}
    </div>

    <div class="cta-bar">
      <div>
        <div class="cta-text">${escapeHtml(data.cta.text)}</div>
        <div class="cta-subtext">${escapeHtml(data.cta.subtext)}</div>
      </div>
      <div class="cta-icon-circle">
        <i class="${escapeHtml(data.cta.icon)}"></i>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE: split-color
// ─────────────────────────────────────────────────────────────

function renderSplitColor(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isPost = data.format === "post";
  const isA4 = data.format === "a4";

  const photoPercent = 45;
  const panelColor = adjustColor(data.theme.primary, 25);

  const bgImage = data.backgroundUrl
    ? `url('${data.backgroundUrl}') center/cover no-repeat`
    : `linear-gradient(135deg, ${data.theme.bgColor} 0%, ${adjustColor(data.theme.bgColor, 30)} 50%, ${data.theme.bgColor} 100%)`;

  const circleItems = data.details
    .map((detail, i) => {
      const color = getIconColor(i);
      const [gradFrom, gradTo] = ICON_GRADIENTS[color];
      return `
        <div class="circle-item">
          <div class="circle-icon" style="background: linear-gradient(135deg, ${gradFrom}, ${gradTo});">
            <i class="${escapeHtml(detail.icon)}"></i>
          </div>
          <div class="circle-label">${escapeHtml(detail.label)}</div>
          <div class="circle-value">${highlightValue(detail.value, detail.highlight, data.theme.accent)}</div>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Heebo', sans-serif;
      color: #FFFFFF;
      overflow: hidden;
      direction: rtl;
      position: relative;
      background: ${data.theme.bgColor};
    }

    .photo-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: ${photoPercent}%;
      background: ${bgImage};
      z-index: 0;
    }

    .photo-top::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(0,0,0,0.35) 0%,
        rgba(0,0,0,0.2) 50%,
        rgba(0,0,0,0.55) 100%
      );
    }

    .badge {
      position: absolute;
      top: ${24 * scale}px;
      left: ${30 * scale}px;
      z-index: 3;
      display: inline-flex;
      align-items: center;
      gap: ${10 * scale}px;
      background: ${data.theme.primary};
      border-radius: ${8 * scale}px;
      padding: ${10 * scale}px ${22 * scale}px;
      font-size: ${22 * scale}px;
      font-weight: 700;
      color: #FFFFFF;
      box-shadow: 0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.3);
    }

    .badge i {
      font-size: ${18 * scale}px;
    }

    .photo-titles {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: ${photoPercent}%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: ${30 * scale}px ${50 * scale}px;
      z-index: 2;
    }

    .subtitle {
      font-size: ${28 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.8);
      margin-bottom: ${8 * scale}px;
      text-shadow: 0 ${2 * scale}px ${10 * scale}px rgba(0,0,0,0.6);
    }

    .title-he {
      font-size: ${isPost ? 62 * scale : 70 * scale}px;
      font-weight: 900;
      line-height: 1.1;
      color: #FFFFFF;
      text-shadow: 0 ${4 * scale}px ${24 * scale}px rgba(0,0,0,0.7);
    }

    .color-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${100 - photoPercent}%;
      background: ${panelColor};
      z-index: 1;
      display: flex;
      flex-direction: column;
      padding: ${isPost ? 28 * scale : 36 * scale}px ${50 * scale}px ${isPost ? 24 * scale : 40 * scale}px;
      gap: ${isPost ? 16 * scale : 24 * scale}px;
    }

    .panel-title-en {
      font-size: ${isPost ? 32 * scale : 38 * scale}px;
      font-weight: 300;
      color: ${data.theme.accent};
      letter-spacing: 0.08em;
      opacity: 0.9;
    }

    .circles-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: ${isPost ? 14 * scale : 20 * scale}px;
      justify-items: center;
      flex: 1;
      align-content: center;
    }

    .circle-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${8 * scale}px;
      text-align: center;
    }

    .circle-icon {
      width: ${isPost ? 72 * scale : 86 * scale}px;
      height: ${isPost ? 72 * scale : 86 * scale}px;
      border-radius: 50%;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 ${4 * scale}px ${18 * scale}px rgba(0,0,0,0.2);
    }

    .circle-icon i {
      font-size: ${isPost ? 28 * scale : 34 * scale}px;
      color: #FFFFFF;
    }

    .circle-label {
      font-size: ${isPost ? 18 * scale : 20 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.7);
    }

    .circle-value {
      font-size: ${isPost ? 20 * scale : 24 * scale}px;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.3;
    }

    .cta-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${14 * scale}px;
      background: ${data.theme.bgColor};
      border-radius: ${14 * scale}px;
      padding: ${22 * scale}px ${30 * scale}px;
      margin-top: auto;
    }

    .cta-bar i {
      font-size: ${24 * scale}px;
      color: ${data.theme.accent};
    }

    .cta-text {
      font-size: ${26 * scale}px;
      font-weight: 700;
      color: #FFFFFF;
    }

    .cta-subtext {
      font-size: ${20 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.6);
      margin-right: ${12 * scale}px;
    }
  </style>
</head>
<body>
  <div class="photo-top"></div>

  <div class="badge">
    <i class="${escapeHtml(data.badge.icon)}"></i>
    ${escapeHtml(data.badge.text)}
  </div>

  <div class="photo-titles">
    <div class="subtitle">${escapeHtml(data.subtitle)}</div>
    <div class="title-he">${escapeHtml(data.titleHe)}</div>
  </div>

  <div class="color-panel">
    <div class="panel-title-en">${escapeHtml(data.titleEn)}</div>

    <div class="circles-grid">
      ${circleItems}
    </div>

    <div class="cta-bar">
      <i class="${escapeHtml(data.cta.icon)}"></i>
      <div class="cta-text">${escapeHtml(data.cta.text)}</div>
      <div class="cta-subtext">${escapeHtml(data.cta.subtext)}</div>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE: geometric
// ─────────────────────────────────────────────────────────────

function renderGeometric(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isPost = data.format === "post";
  const isA4 = data.format === "a4";

  const bgImage = data.backgroundUrl
    ? `url('${data.backgroundUrl}') center/cover no-repeat`
    : `linear-gradient(135deg, ${data.theme.primary} 0%, ${adjustColor(data.theme.primary, -30)} 100%)`;

  const detailBars = data.details
    .map((detail, i) => {
      const color = getIconColor(i);
      const [gradFrom, gradTo] = ICON_GRADIENTS[color];
      return `
        <div class="detail-bar">
          <div class="detail-bar-text">
            <div class="detail-bar-label">${escapeHtml(detail.label)}</div>
            <div class="detail-bar-value">${highlightValue(detail.value, detail.highlight, data.theme.accent)}</div>
          </div>
          <div class="detail-bar-icon" style="background: linear-gradient(135deg, ${gradFrom}, ${gradTo});">
            <i class="${escapeHtml(detail.icon)}"></i>
          </div>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Heebo', sans-serif;
      color: #FFFFFF;
      overflow: hidden;
      direction: rtl;
      position: relative;
      background: ${data.theme.bgColor};
    }

    .diagonal-photo {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${bgImage};
      clip-path: polygon(0 0, 100% 0, 0 65%);
      z-index: 1;
    }

    .diagonal-photo::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(0,0,0,0.2) 0%,
        rgba(0,0,0,0.4) 100%
      );
    }

    /* Decorative accent lines along the diagonal */
    .diagonal-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      clip-path: polygon(0 63%, 100% 0, 100% 2%, 0 65%);
      background: ${data.theme.accent};
      z-index: 2;
      opacity: 0.7;
    }

    .diagonal-line-thin {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      clip-path: polygon(0 65.5%, 100% 2.5%, 100% 3%, 0 66%);
      background: ${data.theme.primary};
      z-index: 2;
      opacity: 0.4;
    }

    .badge {
      position: absolute;
      top: ${28 * scale}px;
      right: ${40 * scale}px;
      z-index: 5;
      display: inline-flex;
      align-items: center;
      gap: ${10 * scale}px;
      background: ${data.theme.accent};
      border-radius: ${8 * scale}px;
      padding: ${10 * scale}px ${24 * scale}px;
      font-size: ${22 * scale}px;
      font-weight: 700;
      color: #FFFFFF;
      box-shadow: 0 ${4 * scale}px ${20 * scale}px rgba(0,0,0,0.4);
    }

    .badge i {
      font-size: ${18 * scale}px;
    }

    .content-area {
      position: absolute;
      top: ${isPost ? 38 : 42}%;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 3;
      display: flex;
      flex-direction: column;
      padding: ${isPost ? 24 * scale : 36 * scale}px ${50 * scale}px ${isPost ? 20 * scale : 30 * scale}px;
      gap: ${isPost ? 14 * scale : 20 * scale}px;
    }

    .title-he {
      font-size: ${isPost ? 64 * scale : 76 * scale}px;
      font-weight: 900;
      line-height: 1.05;
      color: #FFFFFF;
    }

    .title-en {
      font-size: ${isPost ? 30 * scale : 36 * scale}px;
      font-weight: 300;
      color: ${data.theme.accent};
      letter-spacing: 0.1em;
      margin-top: ${-4 * scale}px;
    }

    .subtitle {
      font-size: ${24 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.6);
    }

    .divider {
      width: ${100 * scale}px;
      height: ${3 * scale}px;
      background: linear-gradient(90deg, ${data.theme.accent}, ${data.theme.primary});
      border-radius: ${2 * scale}px;
    }

    .details {
      display: flex;
      flex-direction: column;
      gap: ${isPost ? 10 * scale : 14 * scale}px;
      flex: 1;
      justify-content: center;
    }

    .detail-bar {
      display: flex;
      align-items: center;
      gap: ${16 * scale}px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: ${12 * scale}px;
      padding: ${isPost ? 14 * scale : 18 * scale}px ${20 * scale}px;
    }

    .detail-bar-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: ${2 * scale}px;
    }

    .detail-bar-label {
      font-size: ${isPost ? 18 * scale : 20 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.5);
    }

    .detail-bar-value {
      font-size: ${isPost ? 22 * scale : 26 * scale}px;
      font-weight: 600;
      color: #FFFFFF;
      line-height: 1.3;
    }

    .detail-bar-icon {
      width: ${isPost ? 46 * scale : 54 * scale}px;
      height: ${isPost ? 46 * scale : 54 * scale}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 ${4 * scale}px ${14 * scale}px rgba(0,0,0,0.3);
    }

    .detail-bar-icon i {
      font-size: ${isPost ? 20 * scale : 24 * scale}px;
      color: #FFFFFF;
    }

    .cta-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${14 * scale}px;
      background: ${data.theme.accent};
      border-radius: ${14 * scale}px;
      padding: ${22 * scale}px ${30 * scale}px;
      margin-top: auto;
      box-shadow: 0 ${6 * scale}px ${24 * scale}px ${data.theme.accent}55;
    }

    .cta-bar i {
      font-size: ${24 * scale}px;
      color: #FFFFFF;
    }

    .cta-text {
      font-size: ${26 * scale}px;
      font-weight: 700;
      color: #FFFFFF;
    }

    .cta-subtext {
      font-size: ${20 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.8);
      margin-right: ${12 * scale}px;
    }
  </style>
</head>
<body>
  <div class="diagonal-photo"></div>
  <div class="diagonal-line"></div>
  <div class="diagonal-line-thin"></div>

  <div class="badge">
    <i class="${escapeHtml(data.badge.icon)}"></i>
    ${escapeHtml(data.badge.text)}
  </div>

  <div class="content-area">
    <div class="title-he">${escapeHtml(data.titleHe)}</div>
    <div class="title-en">${escapeHtml(data.titleEn)}</div>
    <div class="subtitle">${escapeHtml(data.subtitle)}</div>
    <div class="divider"></div>

    <div class="details">
      ${detailBars}
    </div>

    <div class="cta-bar">
      <i class="${escapeHtml(data.cta.icon)}"></i>
      <div class="cta-text">${escapeHtml(data.cta.text)}</div>
      <div class="cta-subtext">${escapeHtml(data.cta.subtext)}</div>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE: vibrant-pop
// ─────────────────────────────────────────────────────────────

function renderVibrantPop(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isPost = data.format === "post";
  const isA4 = data.format === "a4";

  const detailRows = data.details
    .map((detail, i) => {
      return `
        <div class="detail-simple">
          <i class="${escapeHtml(detail.icon)}"></i>
          <span class="detail-value">${highlightValue(detail.value, detail.highlight, data.theme.accent)}</span>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Heebo', sans-serif;
      background: ${data.theme.primary};
      color: #FFFFFF;
      overflow: hidden;
      position: relative;
      direction: rtl;
    }

    /* Giant faded decorative icon */
    .bg-deco {
      position: absolute;
      top: ${isPost ? 10 : 15}%;
      left: -10%;
      font-size: ${600 * scale}px;
      color: #FFFFFF;
      opacity: 0.06;
      pointer-events: none;
      z-index: 0;
      line-height: 1;
    }

    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: ${isA4 ? 80 * scale : isPost ? 50 * scale : 60 * scale}px ${60 * scale}px;
      gap: ${isPost ? 18 * scale : 28 * scale}px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: ${10 * scale}px;
      background: ${data.theme.accent};
      border-radius: ${50 * scale}px;
      padding: ${10 * scale}px ${26 * scale}px;
      font-size: ${22 * scale}px;
      font-weight: 700;
      color: #FFFFFF;
      width: fit-content;
    }

    .badge i {
      font-size: ${18 * scale}px;
    }

    .mega-title {
      font-size: ${isPost ? 100 * scale : 120 * scale}px;
      font-weight: 900;
      line-height: 1.05;
      color: #FFFFFF;
      margin-top: ${isPost ? 10 * scale : 20 * scale}px;
    }

    .details-stack {
      display: flex;
      flex-direction: column;
      gap: ${isPost ? 14 * scale : 20 * scale}px;
      margin-top: ${isPost ? 10 * scale : 24 * scale}px;
      flex-grow: 1;
    }

    .detail-simple {
      display: flex;
      align-items: center;
      gap: ${18 * scale}px;
      font-size: ${30 * scale}px;
      font-weight: 600;
      color: #FFFFFF;
    }

    .detail-simple i {
      font-size: ${28 * scale}px;
      width: ${36 * scale}px;
      text-align: center;
      flex-shrink: 0;
      opacity: 0.9;
    }

    .detail-value {
      line-height: 1.3;
    }

    .cta-block {
      background: ${data.theme.accent};
      border-radius: ${20 * scale}px;
      padding: ${30 * scale}px ${40 * scale}px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${16 * scale}px;
      margin-top: auto;
    }

    .cta-block .cta-text {
      font-size: ${34 * scale}px;
      font-weight: 800;
      color: #FFFFFF;
    }

    .cta-block i {
      font-size: ${30 * scale}px;
      color: #FFFFFF;
    }

    .cta-subtext {
      text-align: center;
      font-size: ${22 * scale}px;
      color: rgba(255,255,255,0.7);
      margin-top: ${10 * scale}px;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="bg-deco">
    <i class="${escapeHtml(data.badge.icon)}"></i>
  </div>

  <div class="container">
    <div class="badge">
      <i class="${escapeHtml(data.badge.icon)}"></i>
      ${escapeHtml(data.badge.text)}
    </div>

    <div class="mega-title">${escapeHtml(data.titleHe)}</div>

    <div class="details-stack">
      ${detailRows}
    </div>

    <div>
      <div class="cta-block">
        <i class="${escapeHtml(data.cta.icon)}"></i>
        <span class="cta-text">${escapeHtml(data.cta.text)}</span>
      </div>
      <div class="cta-subtext">${escapeHtml(data.cta.subtext)}</div>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE: minimal-elegant
// ─────────────────────────────────────────────────────────────

function renderMinimalElegant(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isPost = data.format === "post";
  const isA4 = data.format === "a4";

  const detailItems = data.details
    .map((detail, i) => {
      const color = getIconColor(i);
      const [gradFrom] = ICON_GRADIENTS[color];
      const separator = i < data.details.length - 1
        ? `<div class="dot-separator">\u00B7</div>`
        : "";
      return `
        <div class="detail-minimal">
          <i class="${escapeHtml(detail.icon)}" style="color: ${gradFrom}; opacity: 0.6;"></i>
          <span class="detail-value">${highlightValue(detail.value, detail.highlight, data.theme.accent)}</span>
        </div>
        ${separator}
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Heebo', sans-serif;
      background: #FAFAF8;
      color: #2a2a2a;
      overflow: hidden;
      position: relative;
      direction: rtl;
    }

    /* Accent lines at top and bottom */
    .accent-line {
      position: absolute;
      left: 0;
      right: 0;
      height: ${2 * scale}px;
      background: ${data.theme.primary};
      z-index: 2;
    }
    .accent-line.top { top: 0; }
    .accent-line.bottom { bottom: 0; }

    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: ${isA4 ? 100 * scale : isPost ? 60 * scale : 80 * scale}px ${70 * scale}px;
      gap: ${isPost ? 24 * scale : 36 * scale}px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: ${8 * scale}px;
      border: ${1 * scale}px solid ${data.theme.primary}88;
      border-radius: ${50 * scale}px;
      padding: ${8 * scale}px ${24 * scale}px;
      font-size: ${20 * scale}px;
      font-weight: 500;
      color: ${data.theme.primary};
      background: transparent;
    }

    .badge i {
      font-size: ${16 * scale}px;
    }

    .refined-title {
      font-size: ${isPost ? 64 * scale : 76 * scale}px;
      font-weight: 500;
      line-height: 1.15;
      color: #2a2a2a;
      letter-spacing: 0.01em;
    }

    .title-en {
      font-size: ${isPost ? 30 * scale : 36 * scale}px;
      font-weight: 300;
      color: #888888;
      letter-spacing: 0.08em;
      margin-top: -${8 * scale}px;
    }

    .thin-line {
      width: ${100 * scale}px;
      height: ${1 * scale}px;
      background: ${data.theme.primary};
    }

    .details-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${isPost ? 12 * scale : 18 * scale}px;
    }

    .detail-minimal {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${14 * scale}px;
      font-size: ${26 * scale}px;
      font-weight: 400;
      color: #2a2a2a;
    }

    .detail-minimal i {
      font-size: ${22 * scale}px;
      width: ${28 * scale}px;
      text-align: center;
      flex-shrink: 0;
    }

    .detail-value {
      line-height: 1.3;
    }

    .dot-separator {
      font-size: ${28 * scale}px;
      color: #cccccc;
      line-height: 1;
    }

    .cta-section {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${12 * scale}px;
    }

    .thin-border-pill {
      display: inline-flex;
      align-items: center;
      gap: ${14 * scale}px;
      border: ${1.5 * scale}px solid ${data.theme.primary};
      border-radius: ${50 * scale}px;
      padding: ${18 * scale}px ${44 * scale}px;
      font-size: ${28 * scale}px;
      font-weight: 600;
      color: ${data.theme.primary};
      background: transparent;
    }

    .thin-border-pill i {
      font-size: ${24 * scale}px;
    }

    .cta-subtext {
      font-size: ${20 * scale}px;
      color: #888888;
      font-weight: 300;
    }
  </style>
</head>
<body>
  <div class="accent-line top"></div>
  <div class="accent-line bottom"></div>

  <div class="container">
    <div class="badge">
      <i class="${escapeHtml(data.badge.icon)}"></i>
      ${escapeHtml(data.badge.text)}
    </div>

    <div class="refined-title">${escapeHtml(data.titleHe)}</div>
    <div class="title-en">${escapeHtml(data.titleEn)}</div>

    <div class="thin-line"></div>

    <div class="details-stack">
      ${detailItems}
    </div>

    <div class="cta-section">
      <div class="thin-border-pill">
        <i class="${escapeHtml(data.cta.icon)}"></i>
        ${escapeHtml(data.cta.text)}
      </div>
      <div class="cta-subtext">${escapeHtml(data.cta.subtext)}</div>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE: gradient-wave
// ─────────────────────────────────────────────────────────────

function renderGradientWave(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isPost = data.format === "post";
  const isA4 = data.format === "a4";

  const photoHeight = isPost ? 38 : 42;

  const detailRows = data.details
    .map((detail, i) => {
      const color = getIconColor(i);
      const [gradFrom, gradTo] = ICON_GRADIENTS[color];
      return `
        <div class="detail-row">
          <div class="detail-border" style="background: linear-gradient(180deg, ${gradFrom}, ${gradTo});"></div>
          <div class="detail-icon" style="color: ${gradFrom};">
            <i class="${escapeHtml(detail.icon)}"></i>
          </div>
          <div class="detail-text">
            <div class="detail-label">${escapeHtml(detail.label)}</div>
            <div class="detail-value">${highlightValue(detail.value, detail.highlight, data.theme.accent)}</div>
          </div>
        </div>
      `;
    })
    .join("");

  const bgImage = data.backgroundUrl
    ? `url('${data.backgroundUrl}') center/cover no-repeat`
    : `linear-gradient(135deg, ${data.theme.primary} 0%, ${data.theme.accent} 100%)`;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Heebo', sans-serif;
      overflow: hidden;
      direction: rtl;
      background: ${data.theme.bgColor};
      color: #FFFFFF;
    }

    .photo-area {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: ${photoHeight}%;
      background: ${bgImage};
      z-index: 0;
    }

    .photo-area::after {
      content: '';
      position: absolute;
      inset: 0;
      background: ${data.backgroundUrl ? "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)" : "transparent"};
    }

    .wave-divider {
      position: absolute;
      top: calc(${photoHeight}% - ${60 * scale}px);
      left: 0;
      width: 100%;
      height: ${120 * scale}px;
      z-index: 2;
    }

    .wave-divider svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .badge {
      position: absolute;
      top: calc(${photoHeight}% - ${40 * scale}px);
      right: ${60 * scale}px;
      z-index: 3;
      display: inline-flex;
      align-items: center;
      gap: ${10 * scale}px;
      background: linear-gradient(135deg, ${data.theme.primary}, ${data.theme.accent});
      border-radius: ${50 * scale}px;
      padding: ${14 * scale}px ${30 * scale}px;
      font-size: ${24 * scale}px;
      font-weight: 700;
      color: #FFFFFF;
      box-shadow: 0 ${6 * scale}px ${24 * scale}px rgba(0,0,0,0.3);
    }

    .badge i {
      font-size: ${20 * scale}px;
    }

    .content-area {
      position: absolute;
      top: calc(${photoHeight}% + ${40 * scale}px);
      left: 0;
      right: 0;
      bottom: 0;
      background: ${data.theme.bgColor};
      z-index: 1;
      display: flex;
      flex-direction: column;
      padding: ${30 * scale}px ${60 * scale}px ${isPost ? 36 * scale : 50 * scale}px;
      gap: ${16 * scale}px;
    }

    .title-he {
      font-size: ${isPost ? 60 * scale : 70 * scale}px;
      font-weight: 800;
      line-height: 1.15;
      color: #FFFFFF;
    }

    .title-en {
      font-size: ${isPost ? 32 * scale : 38 * scale}px;
      font-weight: 300;
      color: ${data.theme.accent};
      letter-spacing: 0.08em;
      margin-top: ${2 * scale}px;
      opacity: 0.9;
    }

    .details {
      display: flex;
      flex-direction: column;
      gap: ${14 * scale}px;
      margin: ${isPost ? 8 * scale : 16 * scale}px 0;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: ${16 * scale}px;
      padding: ${14 * scale}px 0;
    }

    .detail-border {
      width: ${4 * scale}px;
      height: ${44 * scale}px;
      border-radius: ${2 * scale}px;
      flex-shrink: 0;
    }

    .detail-icon {
      font-size: ${24 * scale}px;
      flex-shrink: 0;
      width: ${32 * scale}px;
      text-align: center;
    }

    .detail-text {
      display: flex;
      flex-direction: column;
      gap: ${2 * scale}px;
    }

    .detail-label {
      font-size: ${20 * scale}px;
      font-weight: 400;
      color: rgba(255,255,255,0.5);
    }

    .detail-value {
      font-size: ${26 * scale}px;
      font-weight: 600;
      color: #FFFFFF;
      line-height: 1.3;
    }

    .cta-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${14 * scale}px;
      background: linear-gradient(135deg, ${data.theme.primary}, ${data.theme.accent});
      border-radius: ${60 * scale}px;
      padding: ${24 * scale}px ${48 * scale}px;
      font-size: ${28 * scale}px;
      font-weight: 700;
      color: #FFFFFF;
      width: fit-content;
      margin: ${isPost ? 8 * scale : 16 * scale}px auto 0;
      box-shadow: 0 ${6 * scale}px ${28 * scale}px ${data.theme.primary}55;
    }

    .cta-pill i {
      font-size: ${24 * scale}px;
    }

    .cta-subtext {
      text-align: center;
      font-size: ${20 * scale}px;
      color: rgba(255,255,255,0.4);
      margin-top: ${10 * scale}px;
      font-weight: 300;
    }

    /* Decorative faint wave at bottom */
    .wave-bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: ${60 * scale}px;
      z-index: 0;
      opacity: 0.06;
    }

    .wave-bottom svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>
  <div class="photo-area"></div>

  <div class="wave-divider">
    <svg viewBox="0 0 1080 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${data.theme.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${data.theme.accent};stop-opacity:1" />
        </linearGradient>
      </defs>
      <path d="M0,40 C270,120 810,0 1080,80 L1080,120 L0,120 Z" fill="${data.theme.bgColor}" />
      <path d="M0,44 C270,124 810,4 1080,84 L1080,84 C810,4 270,124 0,44 Z" fill="url(#waveGrad)" opacity="0.6" />
    </svg>
  </div>

  <div class="badge">
    <i class="${escapeHtml(data.badge.icon)}"></i>
    ${escapeHtml(data.badge.text)}
  </div>

  <div class="content-area">
    <div class="title-he">${escapeHtml(data.titleHe)}</div>
    <div class="title-en">${escapeHtml(data.titleEn)}</div>

    <div class="details">
      ${detailRows}
    </div>

    <div style="margin-top: auto;">
      <div class="cta-pill">
        <i class="${escapeHtml(data.cta.icon)}"></i>
        ${escapeHtml(data.cta.text)}
      </div>
      <div class="cta-subtext">${escapeHtml(data.cta.subtext)}</div>
    </div>
  </div>

  <div class="wave-bottom">
    <svg viewBox="0 0 1080 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,20 C270,60 810,0 1080,40 L1080,60 L0,60 Z" fill="${data.theme.primary}" />
    </svg>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE: clean-corporate
// ─────────────────────────────────────────────────────────────

function renderCleanCorporate(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isPost = data.format === "post";
  const isA4 = data.format === "a4";

  const detailItems = data.details
    .map((detail, i) => {
      const color = getIconColor(i);
      const [gradFrom] = ICON_GRADIENTS[color];
      return `
        <div class="detail-item">
          <div class="dot" style="background: ${gradFrom};"></div>
          <div class="detail-text">
            <div class="detail-label">${escapeHtml(detail.label)}</div>
            <div class="detail-value">${highlightValue(detail.value, detail.highlight, data.theme.accent)}</div>
          </div>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Heebo', sans-serif;
      overflow: hidden;
      direction: rtl;
      background: #F7F7FA;
      color: #1a1a2e;
      position: relative;
    }

    /* Faint grid pattern */
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(0,0,0,0.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.018) 1px, transparent 1px);
      background-size: ${50 * scale}px ${50 * scale}px;
      pointer-events: none;
      z-index: 0;
    }

    .header-bar {
      width: 100%;
      height: ${100 * scale}px;
      background: ${data.theme.primary};
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 0 ${60 * scale}px;
      position: relative;
      z-index: 1;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: ${10 * scale}px;
      background: rgba(255,255,255,0.18);
      border-radius: ${8 * scale}px;
      padding: ${10 * scale}px ${24 * scale}px;
      font-size: ${24 * scale}px;
      font-weight: 600;
      color: #FFFFFF;
    }

    .badge i {
      font-size: ${20 * scale}px;
    }

    .container {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      padding: ${isPost ? 36 * scale : 48 * scale}px ${60 * scale}px ${isPost ? 36 * scale : 50 * scale}px;
      gap: ${isPost ? 20 * scale : 28 * scale}px;
      height: calc(100% - ${100 * scale}px);
    }

    .title-he {
      font-size: ${isPost ? 58 * scale : 66 * scale}px;
      font-weight: 800;
      line-height: 1.15;
      color: #1a1a2e;
    }

    .title-en {
      font-size: ${isPost ? 30 * scale : 36 * scale}px;
      font-weight: 300;
      color: #888;
      letter-spacing: 0.06em;
      margin-top: ${2 * scale}px;
    }

    .thin-divider {
      width: ${100 * scale}px;
      height: ${2 * scale}px;
      background: ${data.theme.primary};
      border-radius: ${1 * scale}px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${isPost ? 16 * scale : 22 * scale}px ${32 * scale}px;
    }

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: ${14 * scale}px;
    }

    .dot {
      width: ${8 * scale}px;
      height: ${8 * scale}px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: ${10 * scale}px;
    }

    .detail-text {
      display: flex;
      flex-direction: column;
      gap: ${2 * scale}px;
    }

    .detail-label {
      font-size: ${20 * scale}px;
      font-weight: 400;
      color: #888;
    }

    .detail-value {
      font-size: ${24 * scale}px;
      font-weight: 600;
      color: #1a1a2e;
      line-height: 1.3;
    }

    .cta-section {
      margin-top: auto;
      text-align: center;
    }

    .cta-outline {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: ${14 * scale}px;
      border: ${2.5 * scale}px solid ${data.theme.primary};
      border-radius: ${12 * scale}px;
      padding: ${20 * scale}px ${44 * scale}px;
      font-size: ${28 * scale}px;
      font-weight: 700;
      color: ${data.theme.primary};
      background: transparent;
    }

    .cta-outline i {
      font-size: ${24 * scale}px;
    }

    .cta-subtext {
      text-align: center;
      font-size: ${20 * scale}px;
      color: #999;
      margin-top: ${12 * scale}px;
      font-weight: 300;
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="badge">
      <i class="${escapeHtml(data.badge.icon)}"></i>
      ${escapeHtml(data.badge.text)}
    </div>
  </div>

  <div class="container">
    <div class="title-he">${escapeHtml(data.titleHe)}</div>
    <div class="title-en">${escapeHtml(data.titleEn)}</div>

    <div class="thin-divider"></div>

    <div class="detail-grid">
      ${detailItems}
    </div>

    <div class="cta-section">
      <div class="cta-outline">
        <i class="${escapeHtml(data.cta.icon)}"></i>
        ${escapeHtml(data.cta.text)}
      </div>
      <div class="cta-subtext">${escapeHtml(data.cta.subtext)}</div>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

const TEMPLATE_RENDERERS: Record<string, (data: PosterData) => string> = {
  "dark-cards": renderDarkCards,
  "bold-photo": renderBoldPhoto,
  "split-color": renderSplitColor,
  "geometric": renderGeometric,
  "vibrant-pop": renderVibrantPop,
  "minimal-elegant": renderMinimalElegant,
  "gradient-wave": renderGradientWave,
  "clean-corporate": renderCleanCorporate,
};

export function generateTemplateHtml(data: PosterData): string {
  const renderer = TEMPLATE_RENDERERS[data.template];
  if (!renderer) {
    throw new Error(`Unknown template: ${data.template}`);
  }
  return renderer(data);
}
