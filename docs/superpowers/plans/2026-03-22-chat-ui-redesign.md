# Personal Hire Chat UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the wizard+editor flow with a chat-style single-page app where users paste a job description, get 4-5 AI-generated poster variants, pick one, and download in any social media format.

**Architecture:** Single-page state machine (IDLE → LOADING → RESULTS → ERROR). One OpenAI call extracts content + picks category → backend fans out to 5 templates with different themes → Puppeteer renders thumbnails in parallel → user picks variant → chooses format → second API call renders full-res JPEG for download.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript, OpenAI (structured output via Zod), Puppeteer, Sharp

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/types.ts` | REWRITE — new TemplateCategory, TemplateId, FormatId, PosterData, PosterVariant types |
| `src/lib/templates/index.ts` | REWRITE — registry for 5 new templates |
| `src/lib/templates/shared.ts` | MODIFY — update for new types, remove background/pattern utils |
| `src/lib/templates/simple.ts` | CREATE — Simple/Clean template (light bg, minimal) |
| `src/lib/templates/bold.ts` | CREATE — Bold/Urgent template (primary color bg, huge text) |
| `src/lib/templates/corporate.ts` | REWRITE — Corporate template (header bar, light bg, structured) |
| `src/lib/templates/hitech.ts` | CREATE — Hi-Tech template (dark bg, gradients, glows) |
| `src/lib/templates/field.ts` | CREATE — Field/Blue-collar template (practical, high contrast) |
| `src/lib/renderer.ts` | MODIFY — accept explicit width/height, add parallel thumbnail rendering |
| `src/app/api/ai-generate/route.ts` | REWRITE — new schema, fan-out to 5 templates, return thumbnails |
| `src/app/api/generate/route.ts` | MODIFY — accept formatId instead of format from PosterData |
| `src/app/components/ChatInput.tsx` | CREATE — textarea + send button, bottom-fixed |
| `src/app/components/LoadingSequence.tsx` | CREATE — animated loading with rotating Hebrew labels |
| `src/app/components/PosterGrid.tsx` | CREATE — responsive grid of poster cards |
| `src/app/components/PosterCard.tsx` | CREATE — single poster thumbnail card |
| `src/app/components/FormatModal.tsx` | CREATE — format selection + download modal |
| `src/app/page.tsx` | REWRITE — chat UI state machine |
| `src/app/layout.tsx` | MODIFY — Personal Hire branding |
| `src/app/globals.css` | MODIFY — new color scheme, chat styles, remove editor styles |

### Files to Delete
| File | Reason |
|------|--------|
| `src/app/editor/page.tsx` | No more editor |
| `src/app/components/QuickStart.tsx` | No more wizard |
| `src/app/components/ChooseLook.tsx` | No more wizard |
| `src/app/components/preview/LivePreview.tsx` | No more live preview |
| `src/app/components/sidebar/*` | No more sidebar editors |
| `src/app/api/ai-improve/route.ts` | No more AI improve |
| `src/lib/templates/photo-banner.ts` | Replaced |
| `src/lib/templates/classic-split.ts` | Replaced |
| `src/lib/templates/bold-urgent.ts` | Replaced |
| `src/lib/templates/logo-centered.ts` | Replaced |
| `src/lib/templates/text-stack.ts` | Replaced |
| `src/lib/validation.ts` | Not needed |
| `src/lib/migration.ts` | Not needed |

---

## Task 1: Rewrite Types

**Files:**
- Rewrite: `src/lib/types.ts`

- [ ] **Step 1: Rewrite types.ts with new type system**

Replace all contents with:

```typescript
// === Template System ===
export type TemplateCategory = "simple" | "bold" | "corporate" | "hitech" | "field";
export type TemplateId = TemplateCategory; // One template per category for MVP
export type FontStackId = "modern" | "bold";

// === Social Media Formats ===
export type FormatId = "whatsapp-status" | "instagram-story" | "instagram-post" | "facebook-post" | "a4-print";

export const FORMAT_DIMENSIONS: Record<FormatId, { width: number; height: number; label: string; labelHe: string }> = {
  "whatsapp-status":  { width: 1080, height: 1920, label: "WhatsApp Status",  labelHe: "סטטוס וואטסאפ" },
  "instagram-story":  { width: 1080, height: 1920, label: "Instagram Story",  labelHe: "סטורי אינסטגרם" },
  "instagram-post":   { width: 1080, height: 1080, label: "Instagram Post",   labelHe: "פוסט אינסטגרם" },
  "facebook-post":    { width: 1200, height: 630,  label: "Facebook Post",    labelHe: "פוסט פייסבוק" },
  "a4-print":         { width: 2480, height: 3508, label: "A4 Print",         labelHe: "הדפסה A4" },
};

// === Core Interfaces ===
export interface PosterDetail {
  icon: string;
  label: string;
  value: string;
}

export interface PosterData {
  template: TemplateId;
  company: {
    name: string;       // Always "Personal Hire" for this client
    nameEn?: string;
  };
  title: {
    he: string;
    en?: string;
  };
  subtitle?: string;
  details: PosterDetail[];
  benefits?: string[];
  salary?: {
    display: string;    // Pre-formatted: "₪15,000-20,000/חודש"
  };
  contact: {
    method: "whatsapp" | "email" | "phone";
    value: string;
    displayText?: string;
  };
  cta: {
    text: string;
    urgent: boolean;
  };
  theme: {
    primary: string;
    secondary: string;
    textColor: string;
    bgColor: string;
    fontStack: FontStackId;
  };
  badge?: {
    text: string;
    style: "default" | "urgent" | "new";
  };
}

// === API Response Types ===
export interface PosterVariant {
  id: string;
  templateId: TemplateId;
  categoryLabel: string;     // Hebrew label
  posterData: PosterData;
  thumbnail: string;         // base64 data URI
}

// === Category Metadata ===
export const CATEGORY_META: Record<TemplateCategory, { label: string; labelHe: string }> = {
  simple:    { label: "Simple",     labelHe: "נקי ומינימלי" },
  bold:      { label: "Bold",       labelHe: "בולט ודחוף" },
  corporate: { label: "Corporate",  labelHe: "מקצועי" },
  hitech:    { label: "Hi-Tech",    labelHe: "הייטק" },
  field:     { label: "Field",      labelHe: "שטח ולוגיסטיקה" },
};

export const CATEGORY_THEMES: Record<TemplateCategory, {
  primary: string; secondary: string; bgColor: string; textColor: string; fontStack: FontStackId;
}> = {
  simple:    { primary: "#2563EB", secondary: "#38BDF8", bgColor: "#FAFAFA", textColor: "#1E293B", fontStack: "modern" },
  bold:      { primary: "#DC2626", secondary: "#F97316", bgColor: "#DC2626", textColor: "#FFFFFF", fontStack: "bold" },
  corporate: { primary: "#1E3A5F", secondary: "#4A90D9", bgColor: "#F7F7FA", textColor: "#1E293B", fontStack: "modern" },
  hitech:    { primary: "#6366F1", secondary: "#06B6D4", bgColor: "#0A0F1A", textColor: "#F0F0F5", fontStack: "modern" },
  field:     { primary: "#0D9488", secondary: "#F59E0B", bgColor: "#FFFFFF", textColor: "#1E293B", fontStack: "bold" },
};

// === Adjacency for variant selection ===
export const CATEGORY_ADJACENCY: Record<TemplateCategory, TemplateCategory[]> = {
  simple:    ["corporate", "hitech", "bold", "field"],
  bold:      ["field", "simple", "corporate", "hitech"],
  corporate: ["simple", "hitech", "bold", "field"],
  hitech:    ["corporate", "simple", "bold", "field"],
  field:     ["bold", "corporate", "simple", "hitech"],
};

export const ICON_COLORS = ["purple", "cyan", "pink", "amber", "green", "blue", "red", "emerald"] as const;
export type IconColor = (typeof ICON_COLORS)[number];
```

- [ ] **Step 2: Commit**
```bash
git add src/lib/types.ts
git commit -m "feat: rewrite types for chat UI redesign — new template categories and format system"
```

---

## Task 2: Update Shared Template Utilities

**Files:**
- Modify: `src/lib/templates/shared.ts`

- [ ] **Step 1: Update shared.ts for new types**

Key changes:
- Update imports to use new types (remove `FORMAT_DIMENSIONS` import since width/height passed explicitly)
- Remove `backgroundCss`, `patternOverlayCss`, `imageOverlayCss` functions
- Update `sharedHead` to accept no args (just returns static head content)
- Update `baseStyles` signature — `data` param uses new `PosterData` type
- All render functions (`renderLogoZone`, `renderBadge`, `renderDetailsList`, etc.) keep same signatures but use new `PosterData`
- Update `renderSalary` to use `data.salary?.display` directly instead of computing from min/max
- Keep all color utilities (`escapeHtml`, `adjustColor`, `hexToRgba`)
- Keep icon gradient system

- [ ] **Step 2: Commit**

---

## Task 3: Update Renderer for Explicit Dimensions

**Files:**
- Modify: `src/lib/renderer.ts`

- [ ] **Step 1: Update renderPoster signature**

Change `renderPoster(data: PosterData)` to `renderPoster(data: PosterData, width: number, height: number)`.
Remove the `FORMAT_DIMENSIONS` lookup — use passed width/height directly.
Update `generateTemplateHtml` call to pass width/height.

- [ ] **Step 2: Add renderThumbnail function**

Add a function that renders at half-resolution (540 wide) for thumbnails:

```typescript
export async function renderThumbnail(data: PosterData, width: number, height: number): Promise<string> {
  // Render at half-res for speed
  const thumbWidth = Math.round(width / 2);
  const thumbHeight = Math.round(height / 2);
  const buffer = await renderPoster(data, thumbWidth, thumbHeight);
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
```

- [ ] **Step 3: Add parallel rendering function**

```typescript
export async function renderThumbnails(
  variants: Array<{ data: PosterData; width: number; height: number }>
): Promise<string[]> {
  const browser = await getBrowser();
  // Render in parallel using Promise.all with separate pages
  return Promise.all(
    variants.map(async ({ data, width, height }) => {
      const thumbW = Math.round(width / 2);
      const thumbH = Math.round(height / 2);
      const html = generateTemplateHtml(data, thumbW, thumbH);
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: thumbW, height: thumbH });
        await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
        await page.evaluate(() => document.fonts.ready);
        await new Promise((r) => setTimeout(r, 300));
        const screenshot = await page.screenshot({ type: "png" }) as Buffer;
        const jpeg = await sharp(screenshot)
          .sharpen({ sigma: 0.5 })
          .jpeg({ quality: 70, mozjpeg: true })
          .toBuffer();
        return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
      } finally {
        await page.close();
      }
    })
  );
}
```

- [ ] **Step 4: Commit**

---

## Task 4: Update Template Registry

**Files:**
- Rewrite: `src/lib/templates/index.ts`

- [ ] **Step 1: Rewrite template registry for new system**

```typescript
import type { PosterData, TemplateId } from "../types";

type TemplateRenderer = (data: PosterData, width: number, height: number) => string;

// Import template renderers (will be created in subsequent tasks)
import { renderSimple } from "./simple";
import { renderBold } from "./bold";
import { renderCorporate } from "./corporate";
import { renderHitech } from "./hitech";
import { renderField } from "./field";

const TEMPLATE_RENDERERS: Record<TemplateId, TemplateRenderer> = {
  simple: renderSimple,
  bold: renderBold,
  corporate: renderCorporate,
  hitech: renderHitech,
  field: renderField,
};

export function generateTemplateHtml(data: PosterData, width: number, height: number): string {
  const renderer = TEMPLATE_RENDERERS[data.template];
  if (!renderer) {
    throw new Error(`Unknown template: ${data.template}. Available: ${Object.keys(TEMPLATE_RENDERERS).join(", ")}`);
  }
  return renderer(data, width, height);
}
```

- [ ] **Step 2: Commit**

---

## Task 5: Create 5 Templates

**Files:**
- Create: `src/lib/templates/simple.ts`
- Create: `src/lib/templates/bold.ts`
- Rewrite: `src/lib/templates/corporate.ts`
- Create: `src/lib/templates/hitech.ts`
- Create: `src/lib/templates/field.ts`

Each template is a function: `(data: PosterData, width: number, height: number) => string`
Each must handle landscape (Facebook Post 1200×630) by checking `const isLandscape = width > height`.

### Template Specifications:

**simple.ts — "White Minimal"**
- Background: white (#FAFAFA)
- Thin accent line (primary color) at top
- "Personal Hire" text logo top-right
- Title large, centered, dark text
- Details as simple list with colored dot indicators
- Benefits as light-bordered pills
- Green CTA button, rounded
- Very generous whitespace

**bold.ts — "Full Color Blast"**
- Background: solid primary color (entire poster)
- White text, 900-weight title
- Giant watermark icon at 8% opacity
- Details shown icon + value only (no labels)
- CTA: inverted (white bg, primary text)
- Badge at top-right
- "Personal Hire" in white at bottom

**corporate.ts — "Header Bar"** (evolution of current)
- Light background (#F7F7FA) with faint grid
- Colored header bar with "Personal Hire" in white
- Structured content below
- Details in 2-column grid
- Accent line under header (secondary color)
- Clean, formal layout

**hitech.ts — "Gradient Glow"**
- Background: dark (#0A0F1A)
- Gradient glow circle behind title area
- White title text
- Gradient icon boxes for details (using existing shared utility)
- Glass-effect benefit pills
- Gradient CTA button
- Subtle dot grid at 3% opacity

**field.ts — "Blue Collar Bold"**
- Background: navy (#1E3A5F)
- Title in white inside cyan/teal pill banner
- Details as white text, large and clear
- Salary in highlighted strip (amber/yellow)
- Green WhatsApp CTA button (large)
- Maximum readability, optimized for small WhatsApp display
- "Personal Hire" footer in white

- [ ] **Step 1-5: Create each template file**
- [ ] **Step 6: Delete old template files** (photo-banner.ts, classic-split.ts, bold-urgent.ts, logo-centered.ts, text-stack.ts)
- [ ] **Step 7: Commit**

---

## Task 6: Rewrite AI Generate API Route

**Files:**
- Rewrite: `src/app/api/ai-generate/route.ts`

- [ ] **Step 1: Rewrite with new schema and fan-out logic**

Key changes:
- Accept `{ description: string }` only (no format, template, industry)
- New Zod schema with `category` field (AI picks best category)
- Company name always "Personal Hire" / "פרסונל הייר"
- Fan-out: AI content → 5 variants (one per category, AI-picked category first)
- Pick best 4-5 using adjacency logic
- Render thumbnails in parallel via `renderThumbnails()`
- Return `{ variants: PosterVariant[] }`
- System prompt updated for Personal Hire branding

- [ ] **Step 2: Commit**

---

## Task 7: Update Generate (Download) API Route

**Files:**
- Modify: `src/app/api/generate/route.ts`

- [ ] **Step 1: Update to accept formatId**

Accept `{ posterData: PosterData, formatId: FormatId }`. Look up dimensions from `FORMAT_DIMENSIONS[formatId]`. Remove migration imports. Pass width/height to `renderPoster`.

- [ ] **Step 2: Delete old files** (`src/lib/migration.ts`, `src/lib/validation.ts`, `src/app/api/ai-improve/route.ts`)
- [ ] **Step 3: Commit**

---

## Task 8: Create Frontend Components

**Files:**
- Create: `src/app/components/ChatInput.tsx`
- Create: `src/app/components/LoadingSequence.tsx`
- Create: `src/app/components/PosterGrid.tsx`
- Create: `src/app/components/PosterCard.tsx`
- Create: `src/app/components/FormatModal.tsx`

### ChatInput.tsx
- Fixed to bottom of viewport in a glass card
- RTL textarea that auto-grows (max 4 lines)
- Send button with cyan gradient, disabled when < 20 chars
- Submits on Enter (Shift+Enter for newline)
- Placeholder: "הדביקו כאן תיאור משרה..."
- Props: `onSubmit: (text: string) => void; disabled: boolean`

### LoadingSequence.tsx
- Centered overlay with dark semi-transparent backdrop
- Pulsing cyan ring animation
- Rotating Hebrew labels every 2-3 seconds:
  1. "קוראים את תיאור המשרה..." (0-2s)
  2. "מנתחים את הדרישות..." (2-3.5s)
  3. "מעצבים את הפוסטרים..." (3.5-5s)
  4. "מוסיפים נגיעות אחרונות..." (5s+)
- Labels fade-transition between each other
- Calls `onComplete()` callback after 3 seconds minimum
- Props: `onComplete: () => void`

### PosterGrid.tsx
- Header text: "הנה הפוסטרים שלך — בחרו את המועדף"
- Responsive CSS grid: 2 cols on desktop, 1 on mobile
- Maps variants to PosterCard components
- Staggered entrance animation (CSS, no framer-motion for simplicity)
- "Try again" button at bottom
- Props: `variants: PosterVariant[]; onSelect: (v: PosterVariant) => void; onReset: () => void`

### PosterCard.tsx
- Glass card showing `<img>` from base64 thumbnail
- Category label chip (from `categoryLabel`)
- Hover: lift + cyan border glow
- Click → calls onSelect
- Props: `variant: PosterVariant; onClick: () => void; index: number` (index for stagger delay)

### FormatModal.tsx
- Fixed overlay with backdrop blur
- Large poster preview (img from thumbnail)
- 5 format buttons in a grid (each with icon + Hebrew label)
- Clicking format → fetches `/api/generate` with posterData + formatId → downloads JPEG blob
- Shows spinner on active button during download
- Close button (X) top corner
- Props: `variant: PosterVariant; onClose: () => void`

- [ ] **Step 1-5: Create each component**
- [ ] **Step 6: Delete old components** (QuickStart.tsx, ChooseLook.tsx, preview/LivePreview.tsx, sidebar/*)
- [ ] **Step 7: Commit**

---

## Task 9: Rewrite Main Page

**Files:**
- Rewrite: `src/app/page.tsx`

- [ ] **Step 1: Rewrite as chat UI with state machine**

State machine:
```
type Phase = "idle" | "loading" | "results" | "error";
```

- **IDLE:** Shows brand header ("Personal Hire AI" with luxury styling), greeting message, ChatInput at bottom
- **LOADING:** Shows user's pasted message as a chat bubble, LoadingSequence overlay. Fires API call + 3s timer concurrently. Transitions to RESULTS when both complete.
- **RESULTS:** Shows PosterGrid. User can click a card to open FormatModal. "Try again" button resets to IDLE.
- **ERROR:** Shows error message with retry button.

Brand header (shown in IDLE phase):
- Large "Personal Hire" text with gradient
- Subtitle: "AI Recruitment Posters" or "פוסטרים חכמים לגיוס"
- Luxury feel with glow effects

- [ ] **Step 2: Commit**

---

## Task 10: Update Layout and Styles

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update layout.tsx**

- Change metadata title to "Personal Hire | AI Recruitment Posters"
- Update nav: replace "פוסטר מייקר" with "Personal Hire"
- Change gradient from purple→cyan to cyan→blue (#00B4D8 → #2563EB)
- Simplify nav (remove subtitle text on right)

- [ ] **Step 2: Update globals.css**

- Change `--accent-purple` to `--accent-primary: #00B4D8` (cyan)
- Update `--accent-gradient` to cyan-to-blue
- Remove editor-specific styles (accordion, sidebar-scroll, json-editor, range inputs)
- Add chat-specific styles:
  - `.chat-bubble` — glass card with padding, max-width 80%
  - `.chat-input-container` — fixed bottom, glass card
  - `.poster-card` — glass card with hover glow
  - `.format-btn` — format selection button styling
  - Loading ring animation keyframes
  - Staggered entrance animation keyframes

- [ ] **Step 3: Delete editor page** (`src/app/editor/page.tsx`)
- [ ] **Step 4: Commit**

---

## Task 11: Final Cleanup and Testing

- [ ] **Step 1: Delete remaining old files**
  - `src/app/editor/` directory
  - Any remaining old component files

- [ ] **Step 2: Run `npm run build`** to verify no TypeScript/build errors

- [ ] **Step 3: Manual smoke test**
  - Start dev server (`npm run dev`)
  - Verify landing page renders with Personal Hire branding
  - Paste a job description, verify loading sequence
  - Verify poster variants appear
  - Click a variant, verify format modal
  - Download in at least one format

- [ ] **Step 4: Final commit**
