import type { PosterData, TemplateId } from "../types";
import { renderStandard } from "./standard";
import { renderOverlay } from "./overlay";
import { renderSplit } from "./split";
import { renderNeonDark } from "./neon-dark";
import { renderSpotlight } from "./spotlight";

type TemplateRenderer = (data: PosterData, width: number, height: number) => string;

const TEMPLATE_RENDERERS: Record<TemplateId, TemplateRenderer> = {
  standard: renderStandard,
  overlay: renderOverlay,
  split: renderSplit,
  "neon-dark": renderNeonDark,
  spotlight: renderSpotlight,
};

export function generateTemplateHtml(data: PosterData, width: number, height: number): string {
  const renderer = TEMPLATE_RENDERERS[data.template];
  if (!renderer) {
    throw new Error(`Unknown template: ${data.template}. Available: ${Object.keys(TEMPLATE_RENDERERS).join(", ")}`);
  }
  return renderer(data, width, height);
}
