import { PosterData, FORMAT_DIMENSIONS } from "../types";
import {
  sharedHead, baseStyles, escapeHtml, hexToRgba, backgroundCss, adjustColor,
  renderLogoZone, renderBadge, renderDetailsList,
  renderBenefitChips, renderSalary, renderContactBar,
  renderCompanyFooter,
} from "./shared";

export function renderClassicSplit(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isSquare = data.format === "square";

  const photoPercent = isSquare ? 40 : 45;
  const panelPercent = 100 - photoPercent;

  const bgImage = data.background.type === "image" && data.background.imageUrl
    ? `url('${data.background.imageUrl}') center/cover no-repeat`
    : `linear-gradient(135deg, ${data.theme.bgColor} 0%, ${adjustColor(data.theme.bgColor, 30)} 50%, ${data.theme.bgColor} 100%)`;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    ${baseStyles(data, width, height, scale)}

    body {
      background: ${data.theme.bgColor};
      color: #FFFFFF;
    }

    .photo-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: ${photoPercent}%;
      background: ${bgImage};
      clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
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

    .logo-center {
      position: absolute;
      top: ${photoPercent - 5}%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 3;
      background: white;
      border-radius: ${16 * scale}px;
      padding: ${10 * scale}px ${20 * scale}px;
      box-shadow: 0 ${4 * scale}px ${20 * scale}px rgba(0,0,0,0.2);
    }

    .color-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${panelPercent}%;
      background: ${data.theme.primary};
      z-index: 1;
      display: flex;
      flex-direction: column;
      padding: ${isSquare ? 24 * scale : 32 * scale}px ${40 * scale}px ${isSquare ? 20 * scale : 30 * scale}px;
      gap: ${isSquare ? 12 * scale : 16 * scale}px;
      justify-content: space-between;
    }

    .subtitle {
      font-size: ${16 * scale}px;
      color: rgba(255,255,255,0.7);
      font-weight: 400;
    }

    .title-he {
      font-size: ${isSquare ? 36 * scale : 42 * scale}px;
      font-weight: 800;
      color: #FFFFFF;
      line-height: 1.2;
    }

    .title-en {
      font-size: ${18 * scale}px;
      color: rgba(255,255,255,0.5);
      font-weight: 400;
      direction: ltr;
      text-align: right;
      margin-top: ${4 * scale}px;
    }

    .contact-bar-inverted {
      background: #FFFFFF !important;
      color: ${data.theme.primary} !important;
    }

    .contact-bar-inverted div {
      color: ${data.theme.primary} !important;
    }
  </style>
</head>
<body>
  <div class="photo-top"></div>

  <div class="logo-center">
    ${renderLogoZone({
      ...data,
      theme: { ...data.theme, textColor: data.theme.primary, primary: data.theme.primary },
    }, scale)}
  </div>

  <div class="color-panel">
    <div>
      ${renderBadge({
        ...data,
        badge: data.badge ? { ...data.badge, style: "default" } : undefined,
        theme: { ...data.theme, primary: "#FFFFFF" },
      }, scale)}

      ${data.subtitle ? `<div class="subtitle">${escapeHtml(data.subtitle)}</div>` : ""}
      <div class="title-he">${escapeHtml(data.title.he)}</div>
      ${data.title.en ? `<div class="title-en">${escapeHtml(data.title.en)}</div>` : ""}
    </div>

    ${renderDetailsList({ ...data, theme: { ...data.theme, textColor: "#FFFFFF" } }, scale, "list")}

    ${renderBenefitChips({
      ...data,
      theme: { ...data.theme, primary: "#FFFFFF" },
    }, scale)}

    ${renderSalary({
      ...data,
      theme: { ...data.theme, primary: "#FFFFFF" },
    }, scale)}

    <div class="contact-bar-inverted">
      ${renderContactBar({
        ...data,
        theme: { ...data.theme, primary: "#FFFFFF" },
      }, scale)}
    </div>
  </div>
</body>
</html>`;
}
