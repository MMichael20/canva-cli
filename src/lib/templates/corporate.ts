import { PosterData, FORMAT_DIMENSIONS } from "../types";
import {
  sharedHead, baseStyles, escapeHtml,
  renderLogoZone, renderBadge, renderDetailsList,
  renderBenefitChips, renderSalary, renderContactBar,
  renderCompanyFooter,
} from "./shared";

export function renderCorporate(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isSquare = data.format === "square";

  const headerHeight = isSquare ? 140 * scale : 180 * scale;

  // Corporate uses a light background — the shared utilities use opacity-based
  // colors designed for dark backgrounds. We create a "light-adapted" data object
  // that passes colors the utilities will render correctly on #F7F7FA.
  //
  // Shared utils use:
  //   detail labels:  hexToRgba(textColor, 0.5)  → needs dark textColor so 50% is readable
  //   detail values:  textColor                   → needs dark
  //   benefit chips:  hexToRgba(primary, 0.15) bg + primary text → need strong primary
  //   salary:         primary                     → needs strong primary
  //   footer:         hexToRgba(textColor, 0.3)   → needs dark textColor
  const lightData: PosterData = {
    ...data,
    theme: {
      ...data.theme,
      textColor: "#0F172A",  // very dark text so 50% opacity = solid gray, 30% = visible
    },
  };

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    ${baseStyles(data, width, height, scale)}

    body {
      background: #F7F7FA;
      color: #1E293B;
    }

    .header-bar {
      background: ${data.theme.primary};
      height: ${headerHeight}px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 ${40 * scale}px;
      position: relative;
    }

    .header-bar::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${4 * scale}px;
      background: ${data.theme.secondary};
    }

    .content {
      padding: ${32 * scale}px ${40 * scale}px;
      display: flex;
      flex-direction: column;
      gap: ${20 * scale}px;
      height: calc(100% - ${headerHeight}px);
      justify-content: space-between;
    }

    .title-he {
      font-size: ${isSquare ? 42 * scale : 48 * scale}px;
      font-weight: 800;
      color: #1E293B;
      line-height: 1.2;
    }

    .title-en {
      font-size: ${20 * scale}px;
      color: #64748B;
      font-weight: 400;
      direction: ltr;
      text-align: right;
      margin-top: ${4 * scale}px;
    }

    .subtitle {
      font-size: ${18 * scale}px;
      color: #64748B;
      font-weight: 400;
    }

    .divider {
      height: 2px;
      background: ${data.theme.primary};
      opacity: 0.2;
      margin: ${8 * scale}px 0;
    }

    /* Faint grid background */
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
      background-size: ${40 * scale}px ${40 * scale}px;
      pointer-events: none;
      z-index: 0;
    }

    .content { position: relative; z-index: 1; }
  </style>
</head>
<body>
  <div class="header-bar">
    ${renderLogoZone({
      ...data,
      theme: { ...data.theme, textColor: "#FFFFFF", primary: "#FFFFFF" },
    }, scale)}
    ${renderBadge({
      ...data,
      badge: data.badge ? { ...data.badge, style: "default" } : undefined,
      theme: { ...data.theme, primary: "#FFFFFF" },
    }, scale)}
  </div>

  <div class="content">
    <div>
      ${data.subtitle ? `<div class="subtitle">${escapeHtml(data.subtitle)}</div>` : ""}
      <div class="title-he">${escapeHtml(data.title.he)}</div>
      ${data.title.en ? `<div class="title-en">${escapeHtml(data.title.en)}</div>` : ""}
    </div>

    <div class="divider"></div>

    ${renderDetailsList(lightData, scale, "grid")}

    ${renderSalary(lightData, scale)}

    ${renderBenefitChips(lightData, scale)}

    ${renderContactBar(data, scale)}

    ${renderCompanyFooter(lightData, scale)}
  </div>
</body>
</html>`;
}
