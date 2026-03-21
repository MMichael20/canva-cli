import { PosterData, FORMAT_DIMENSIONS } from "../types";
import {
  sharedHead, baseStyles, escapeHtml, hexToRgba,
  renderLogoZone, renderBadge, renderDetailsList,
  renderBenefitChips, renderSalary, renderContactBar,
  renderCompanyFooter,
} from "./shared";

export function renderLogoCentered(data: PosterData): string {
  const { width, height } = FORMAT_DIMENSIONS[data.format];
  const scale = width / 1080;
  const isSquare = data.format === "square";

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
      align-items: center;
      text-align: center;
      padding: ${isSquare ? 36 * scale : 48 * scale}px ${50 * scale}px;
      gap: ${isSquare ? 14 * scale : 20 * scale}px;
      justify-content: space-between;
    }

    .logo-container {
      max-width: 60%;
      background: #FFFFFF;
      border-radius: ${20 * scale}px;
      padding: ${20 * scale}px ${40 * scale}px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: ${80 * scale}px;
    }

    .logo-container img {
      max-width: ${280 * scale}px;
      max-height: ${80 * scale}px;
      object-fit: contain;
    }

    .company-name-hero {
      font-size: ${28 * scale}px;
      font-weight: 700;
      color: ${data.theme.primary};
    }

    .thin-divider {
      width: 60%;
      height: 1px;
      background: ${data.theme.secondary};
      margin: ${4 * scale}px auto;
    }

    .title-he {
      font-size: ${isSquare ? 36 * scale : 40 * scale}px;
      font-weight: 800;
      color: ${data.theme.textColor};
      line-height: 1.2;
    }

    .title-en {
      font-size: ${18 * scale}px;
      color: ${hexToRgba(data.theme.textColor, 0.5)};
      font-weight: 400;
      direction: ltr;
      margin-top: ${4 * scale}px;
    }

    .details-centered {
      width: 100%;
      text-align: right;
    }

    .salary-centered {
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="container">
    ${renderBadge(data, scale)}

    ${data.company.logoUrl ? `
      <div class="logo-container">
        <img src="${escapeHtml(data.company.logoUrl)}" alt="${escapeHtml(data.company.name)}"
          onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'company-name-hero\\'>${escapeHtml(data.company.name)}</div>';" />
      </div>
      ${data.company.name ? `<div class="company-name-hero">${escapeHtml(data.company.name)}</div>` : ""}
    ` : `
      <div class="company-name-hero">${escapeHtml(data.company.name)}</div>
    `}

    <div class="thin-divider"></div>

    <div>
      <div class="title-he">${escapeHtml(data.title.he)}</div>
      ${data.title.en ? `<div class="title-en">${escapeHtml(data.title.en)}</div>` : ""}
    </div>

    <div class="details-centered">
      ${renderDetailsList(data, scale, "list")}
    </div>

    ${renderBenefitChips(data, scale)}

    ${renderSalary(data, scale)}

    ${renderContactBar(data, scale)}

    ${renderCompanyFooter(data, scale)}
  </div>
</body>
</html>`;
}
