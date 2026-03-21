import type { PosterData, TemplateId } from "../types";
import { renderCorporate } from "./corporate";
import { renderPhotoBanner } from "./photo-banner";
import { renderClassicSplit } from "./classic-split";
import { renderBoldUrgent } from "./bold-urgent";
import { renderLogoCentered } from "./logo-centered";
import { renderTextStack } from "./text-stack";

const TEMPLATE_RENDERERS: Record<TemplateId, (data: PosterData) => string> = {
  corporate: renderCorporate,
  "photo-banner": renderPhotoBanner,
  "classic-split": renderClassicSplit,
  "bold-urgent": renderBoldUrgent,
  "logo-centered": renderLogoCentered,
  "text-stack": renderTextStack,
};

export function generateTemplateHtml(data: PosterData): string {
  const renderer = TEMPLATE_RENDERERS[data.template];
  if (!renderer) {
    throw new Error(`Unknown template: ${data.template}. Available: ${Object.keys(TEMPLATE_RENDERERS).join(", ")}`);
  }
  return renderer(data);
}

export function getAvailableTemplates(): TemplateId[] {
  return Object.keys(TEMPLATE_RENDERERS) as TemplateId[];
}
