import { PosterData, FORMAT_DIMENSIONS } from "../types";
import {
  sharedHead, baseStyles, escapeHtml, hexToRgba, backgroundCss,
  renderLogoZone, renderBadge, renderDetailsList,
  renderBenefitChips, renderSalary, renderContactBar,
  renderCompanyFooter,
} from "./shared";

export function renderPhotoBanner(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isSquare = data.format === "square";

  const photoHeight = isSquare ? 38 : 40;
  const contentTop = photoHeight;

  const bgImage = data.background.type === "image" && data.background.imageUrl
    ? `url('${data.background.imageUrl}') center/cover no-repeat`
    : `linear-gradient(135deg, ${data.theme.bgColor} 0%, ${data.theme.primary}44 50%, ${data.theme.bgColor} 100%)`;

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

    .logo-abs {
      position: absolute;
      top: ${20 * scale}px;
      right: ${30 * scale}px;
      z-index: 2;
    }

    .badge-abs {
      position: absolute;
      top: ${20 * scale}px;
      left: ${30 * scale}px;
      z-index: 2;
    }

    .content {
      position: absolute;
      top: ${contentTop}%;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${data.theme.bgColor};
      padding: ${24 * scale}px ${40 * scale}px;
      display: flex;
      flex-direction: column;
      gap: ${16 * scale}px;
      justify-content: space-between;
      z-index: 1;
    }

    .subtitle {
      font-size: ${16 * scale}px;
      color: rgba(255,255,255,0.6);
      font-weight: 400;
    }

    .title-he {
      font-size: ${isSquare ? 38 * scale : 44 * scale}px;
      font-weight: 800;
      color: #FFFFFF;
      line-height: 1.2;
    }

    .title-en {
      font-size: ${18 * scale}px;
      color: rgba(255,255,255,0.4);
      font-weight: 400;
      direction: ltr;
      text-align: right;
      margin-top: ${4 * scale}px;
    }

    .divider {
      height: ${2 * scale}px;
      background: ${hexToRgba(data.theme.primary, 0.3)};
      margin: ${4 * scale}px 0;
    }
  </style>
</head>
<body>
  <div class="photo-section"></div>

  <div class="logo-abs">
    ${renderLogoZone({
      ...data,
      theme: { ...data.theme, textColor: "#FFFFFF", primary: "#FFFFFF" },
    }, scale)}
  </div>

  <div class="badge-abs">
    ${renderBadge(data, scale)}
  </div>

  <div class="content">
    <div>
      ${data.subtitle ? `<div class="subtitle">${escapeHtml(data.subtitle)}</div>` : ""}
      <div class="title-he">${escapeHtml(data.title.he)}</div>
      ${data.title.en ? `<div class="title-en">${escapeHtml(data.title.en)}</div>` : ""}
    </div>

    <div class="divider"></div>

    ${renderDetailsList({ ...data, theme: { ...data.theme, textColor: "#FFFFFF" } }, scale, "grid")}

    ${renderBenefitChips(data, scale)}

    ${renderSalary(data, scale)}

    ${renderContactBar(data, scale)}

    ${renderCompanyFooter({ ...data, theme: { ...data.theme, textColor: "#FFFFFF" } }, scale)}
  </div>
</body>
</html>`;
}
