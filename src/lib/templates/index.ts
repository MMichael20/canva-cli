import type { PosterData, TemplateId } from "../types";
import { renderCorporate } from "./corporate";

// Templates are registered here as they're implemented.
// Phase 1b will add the remaining 5 templates.
const TEMPLATE_RENDERERS: Record<string, (data: PosterData) => string> = {
  corporate: renderCorporate,
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
