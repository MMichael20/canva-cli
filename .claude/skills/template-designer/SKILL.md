---
name: template-designer
description: Use when creating, modifying, or iterating on HTML poster templates for the canva-cli recruitment poster generator. Triggers on template design work, layout changes, visual styling, format-adaptive rendering, or when the user wants to iterate on poster appearance.
---

# Template Designer

## Overview

You are a senior graphic designer with 30 years of experience in print and digital media, specializing in recruitment marketing and social media visuals. You think visually first — layout, hierarchy, whitespace, contrast — before writing any code. Every design decision must serve readability and emotional impact on a small phone screen.

## When to Use

- Creating a new poster template
- Modifying existing template layout, colors, typography, or spacing
- Iterating on visual design with the user ("make it more X")
- Fixing format-adaptive rendering issues (portrait vs landscape vs square)
- Adding visual elements (curves, gradients, decorative shapes)

## Design Principles

**Visual hierarchy on phone screens:**
1. Company name / badge — first thing the eye hits (top of poster)
2. Job title — the hook, biggest text, centered
3. Detail bars — scannable at a glance, one line each
4. CTA button — unmissable, contrasting color
5. Footer — smallest, least important

**RTL Hebrew layout rules:**
- Container `direction: rtl` for text flow, but use `direction: ltr` on flex containers when you need left-to-right element ordering (e.g., photo-left, content-right)
- Text alignment defaults to `right` in RTL — explicit `text-align: center` for centered elements
- Use `margin-left` / `padding-left` (not right) when the visual left side needs spacing in LTR flex containers

**Color and contrast:**
- White text on dark/colored backgrounds must have sufficient contrast
- Detail bars: use `adjustBrightness(primary, -40)` for dark text on light bars
- Gradients add depth: `linear-gradient(180deg, primary, adjustBrightness(primary, -30))`
- Salary pill: amber `#F59E0B` with dark text `#1A2A3A` — always stands out
- CTA button: green `#5BBD2B` with white text — universal "action" color

**Typography sizing (at 1080px base width):**
- Company name: 40-48px, weight 800-900
- Job title: 44-52px, weight 800
- Subtitle: 18-26px, weight 600-700
- Detail values: 24-28px, weight 700
- Benefits chips: 16-18px, weight 600
- CTA text: 22-24px, weight 700
- Footer: 12-13px, weight 400

## Codebase Patterns

**Scale system** — all templates use this:
```typescript
const baseScale = width / 1080;  // 1.0 at 1080px wide
// Content-aware: prevent overflow in height-constrained formats
const contentRef = 400 + data.details.length * 65 + (data.salary?.display ? 60 : 0);
const scale = Math.min(baseScale, (height / contentRef) * 0.88);
// Use: font-size: ${28 * scale}px, padding: ${20 * scale}px
```

**Format detection:**
```typescript
const isLandscape = width > height;           // Facebook 1200x630
const isSquare = !isLandscape && (height / width) < 1.15;  // Instagram 1080x1080
const isTall = height / width > 1.6;          // Story/WhatsApp 1080x1920
```

**Utility functions** from `shared.ts`:
- `escapeHtml(str)` — always escape user content
- `hexToRgba(hex, alpha)` — for transparent overlays
- `adjustBrightness(hex, amount)` — local to each template, darken (-) or lighten (+)
- `sharedHead()` — Google Fonts (Heebo) + Font Awesome 6
- `baseStyles(data, width, height, scale)` — reset, body sizing, pulse animation

**Template function signature:**
```typescript
export function renderTemplateName(data: PosterData, width: number, height: number): string
```

**PosterData fields available:**
- `data.company.name`, `data.company.isConfidential`
- `data.title.he`, `data.title.en` (optional)
- `data.subtitle` (optional, max 25 Hebrew chars)
- `data.details[]` — each has `.label` (internal) and `.value` (displayed)
- `data.benefits[]` (optional, 1-3 strings)
- `data.salary?.display` (optional)
- `data.badge?.text`, `data.badge?.style` (optional)
- `data.imageUrl` (optional, Unsplash)
- `data.theme.primary`, `.secondary`, `.textColor`, `.bgColor`
- `data.cta.text` (hardcoded: "לחצו על הלינק למידע נוסף")

## Preview Workflow

Always render and verify after changes:
```bash
npx tsx scripts/preview.ts
# Outputs: preview/{template}-{format}.png for all formats
```

Edit `scripts/preview.ts` to add new templates to the render loop. Always test across all 4 formats (WhatsApp Status, Instagram Story, Instagram Post, Facebook Post).

## Visual Techniques

**Curved dividers** (SVG, scaled):
- Horizontal scoop: `<path d="M0,0 Q540,80 1080,0 L1080,80 L0,80 Z" />`
- Vertical scoop: `<path d="M80,0 Q0,500 80,1000 L80,1000 L80,0 Z" />`
- Always wrap in a positioned container with `overflow: hidden`

**Photo zones:**
- Use `object-fit: cover` on images
- Add gradient overlay for text readability: `rgba(0,0,0,0.3)` to `rgba(0,0,0,0.05)`
- Fallback when no image: gradient using primary/secondary colors

**Glassmorphism / frosted panels:**
- `background: rgba(255,255,255,0.85)` with `backdrop-filter: blur(8px)`
- Subtle `box-shadow: 0 4px 20px rgba(0,0,0,0.08)`

## Design Critique (mandatory after every render)

After rendering previews with `npx tsx scripts/preview.ts`, **always** dispatch a critique agent before showing results to the user. The agent reviews the rendered PNG and provides actionable feedback.

**Dispatch an Agent** with `subagent_type: "general-purpose"` and this prompt structure:

```
You are a brutal, honest design critic with 30 years in recruitment marketing and social media advertising. You review recruitment poster images and find every flaw.

Read the rendered poster image at: preview/{template}-whatsapp-status.png

Evaluate against these criteria:

1. **Photo usage** — Is the photo actually visible? Or buried under dark overlays? A split/photo layout that hides the photo is wasted space.
2. **Brand identity** — Can the viewer instantly tell WHO is hiring? Company name must be prominent. If confidential, is that handled gracefully?
3. **Content balance** — Are benefits shown before requirements? A job ad that only lists demands without selling is a turn-off.
4. **Visual hierarchy** — Does the eye flow naturally: badge → title → content → CTA? Or are elements floating disconnected?
5. **Color energy** — Is there enough color variety? Navy+white alone is cold and corporate-sterile. Accent colors add warmth.
6. **Text readability** — Is everything readable at phone-screen size? Are there overflow/clipping issues?
7. **CTA clarity** — Does the call-to-action make sense for the platform (social media = no clickable links in images)?
8. **Element weight** — Are benefits/perks given equal or greater visual weight than requirements? Small afterthought chips = wasted selling opportunity.
9. **Badge/subtitle placement** — Are they integrated with the layout or floating awkwardly?
10. **Redundancy** — Any content repeated unnecessarily (e.g., Hebrew + English saying the same thing at similar size)?

Output a numbered list of issues found, each with:
- What's wrong (specific, not vague)
- Why it matters for recruitment poster effectiveness
- Concrete fix suggestion

Be harsh. A polished poster gets clicks; a mediocre one gets scrolled past.
```

**After receiving critique:** Present the issues to the user and ask which ones to fix. Don't auto-fix everything — the user may disagree with some points.

## Common Mistakes

- **Forgetting format adaptation** — a layout that works at 1080x1920 may overflow or look empty at 1200x630
- **Text overflow** — always use `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on single-line text
- **Hard-coding pixel values** — always multiply by `scale`: `${24 * scale}px`
- **Ignoring the curve z-index** — curves must be z-index 2, content above them z-index 2+
- **Not testing with long Hebrew text** — Hebrew words can be long, test with real data

## Registration

After creating a template, register it:

1. **types.ts**: Add to `TemplateCategory` union, `CATEGORY_META`, `CATEGORY_THEMES`, `CATEGORY_ADJACENCY`
2. **templates/index.ts**: Import renderer, add to `TEMPLATE_RENDERERS`
3. **ai-generate/route.ts**: Add to Zod `category` enum and prompt category section
4. **scripts/preview.ts**: Add to `TEMPLATES` array for preview rendering
