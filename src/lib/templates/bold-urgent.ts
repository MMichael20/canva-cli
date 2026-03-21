import { PosterData, FORMAT_DIMENSIONS } from "../types";
import {
  sharedHead, baseStyles, escapeHtml, hexToRgba,
  renderLogoZone, renderBadge, renderDetailsList,
  renderBenefitChips, renderContactBar,
} from "./shared";

export function renderBoldUrgent(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isSquare = data.format === "square";

  // Pick a decorative icon from the first detail, or default
  const decoIcon = data.details.length > 0 ? data.details[0].icon : "fa-solid fa-briefcase";

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    ${baseStyles(data, width, height, scale)}

    body {
      background: ${data.theme.primary};
      color: #FFFFFF;
    }

    .bg-deco {
      position: absolute;
      top: 15%;
      left: -5%;
      font-size: ${300 * scale}px;
      color: #FFFFFF;
      opacity: 0.08;
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
      padding: ${isSquare ? 40 * scale : 50 * scale}px ${50 * scale}px;
      gap: ${isSquare ? 16 * scale : 24 * scale}px;
    }

    .title-he {
      font-size: ${56 * scale}px;
      font-weight: 900;
      line-height: 1.1;
      color: #FFFFFF;
      margin-top: ${isSquare ? 8 * scale : 16 * scale}px;
    }

    .details-section .detail-item .detail-label-text {
      display: none !important;
    }

    /* Hide the label div in details — show icon + value only */
    .details-section [style*="font-size: ${14 * scale}px"] {
      display: none !important;
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
  <div class="bg-deco">
    <i class="${escapeHtml(decoIcon)}"></i>
  </div>

  <div class="container">
    ${renderLogoZone({
      ...data,
      theme: { ...data.theme, textColor: "#FFFFFF", primary: "#FFFFFF" },
    }, scale)}

    <div class="title-he">${escapeHtml(data.title.he)}</div>

    <div class="details-section" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
      ${renderDetailsList({ ...data, theme: { ...data.theme, textColor: "#FFFFFF" } }, scale, "list")}
    </div>

    ${renderBenefitChips({
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
