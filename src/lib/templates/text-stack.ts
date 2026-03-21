import { PosterData, FORMAT_DIMENSIONS } from "../types";
import {
  sharedHead, baseStyles, escapeHtml, hexToRgba,
  renderBadge, renderBenefitChips, renderSalary,
  renderContactBar, renderCompanyFooter,
  getIconColor, ICON_GRADIENTS,
} from "./shared";

export function renderTextStack(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isSquare = data.format === "square";

  // Bold stacked detail rows
  const detailRows = data.details.map((detail, i) => {
    const color = getIconColor(i);
    const [gradFrom] = ICON_GRADIENTS[color];
    return `
      <div style="
        display: flex;
        align-items: center;
        gap: ${12 * scale}px;
        font-size: ${20 * scale}px;
        font-weight: 600;
        color: ${data.theme.textColor};
        padding: ${10 * scale}px 0;
        border-bottom: 1px solid ${hexToRgba(data.theme.textColor, 0.06)};
      ">
        <i class="${escapeHtml(detail.icon)}" style="font-size: ${18 * scale}px; color: ${gradFrom}; width: ${28 * scale}px; text-align: center; flex-shrink: 0;"></i>
        <span style="color: ${hexToRgba(data.theme.textColor, 0.5)}; font-weight: 400;">${escapeHtml(detail.label)}:</span>
        <span>${escapeHtml(detail.value)}</span>
      </div>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  ${sharedHead(data)}
  <style>
    ${baseStyles(data, width, height, scale)}

    body {
      background: ${data.theme.bgColor};
      color: ${data.theme.textColor};
    }

    .container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: ${isSquare ? 36 * scale : 48 * scale}px ${44 * scale}px;
      gap: ${isSquare ? 14 * scale : 20 * scale}px;
      justify-content: space-between;
    }

    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .company-name {
      font-size: ${18 * scale}px;
      font-weight: 600;
      color: ${data.theme.secondary};
    }

    .title-he {
      font-size: ${52 * scale}px;
      font-weight: 900;
      line-height: 1.1;
      color: ${data.theme.textColor};
    }

    .title-en {
      font-size: ${20 * scale}px;
      color: ${hexToRgba(data.theme.textColor, 0.4)};
      font-weight: 400;
      direction: ltr;
      text-align: right;
      margin-top: ${6 * scale}px;
    }

    .accent-line {
      width: ${80 * scale}px;
      height: ${3 * scale}px;
      background: ${data.theme.primary};
      border-radius: ${2 * scale}px;
    }

    .details-stack {
      display: flex;
      flex-direction: column;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="top-row">
      ${renderBadge(data, scale)}
      <div class="company-name">${escapeHtml(data.company.name)}</div>
    </div>

    <div>
      <div class="title-he">${escapeHtml(data.title.he)}</div>
      ${data.title.en ? `<div class="title-en">${escapeHtml(data.title.en)}</div>` : ""}
    </div>

    <div class="accent-line"></div>

    <div class="details-stack">
      ${detailRows}
    </div>

    ${renderBenefitChips(data, scale)}

    ${renderSalary(data, scale)}

    ${renderContactBar(data, scale)}

    ${renderCompanyFooter(data, scale)}
  </div>
</body>
</html>`;
}
