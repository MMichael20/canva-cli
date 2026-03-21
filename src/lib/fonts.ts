import type { FontStackId } from "./types";

export interface FontStack {
  name: string;
  headlineWeight: number;
  bodyWeight: number;
  family: string;
  lineHeight: number;
  lineHeightBidi: number;
}

export const FONT_STACKS: Record<FontStackId, FontStack> = {
  modern: {
    name: "מודרני",
    headlineWeight: 700,
    bodyWeight: 400,
    family: "'Heebo', sans-serif",
    lineHeight: 1.35,
    lineHeightBidi: 1.4,
  },
  bold: {
    name: "בולט",
    headlineWeight: 900,
    bodyWeight: 500,
    family: "'Heebo', sans-serif",
    lineHeight: 1.35,
    lineHeightBidi: 1.4,
  },
};

export function fontCss(stackId: FontStackId): string {
  const stack = FONT_STACKS[stackId];
  return `
    .headline { font-family: ${stack.family}; font-weight: ${stack.headlineWeight}; line-height: ${stack.lineHeight}; }
    .body-text { font-family: ${stack.family}; font-weight: ${stack.bodyWeight}; line-height: ${stack.lineHeight}; }
    .bidi-text { font-family: ${stack.family}; line-height: ${stack.lineHeightBidi}; }
  `;
}
