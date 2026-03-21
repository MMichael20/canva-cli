# Canva-CLI Overhaul — Final Design Document

**Date:** 2026-03-22
**Goal:** Full overhaul of the recruitment poster builder — templates, user control, AI generation
**Target Users:** Recruiters/HR people (non-designers), any industry
**Distribution:** Facebook groups, LinkedIn, WhatsApp, print

---

## 1. Approach: Curated Templates + Smart Defaults

Keep templates as HTML string generators (the current architecture) but redesign them based on Israeli recruitment research. Expand the data model. Make the AI culturally aware. Add a tiered editor UI.

**Why this approach:** The current Puppeteer + HTML string generator architecture works well. The problem isn't the architecture — it's that templates don't reflect Israeli recruitment reality, the data model is missing critical fields, and the AI prompt has no cultural awareness.

---

## 2. Template Strategy

### Remove (4 templates)

| Template | Reason |
|---|---|
| `dark-cards` | Glow orbs unreadable at thumbnail size. Doesn't survive WhatsApp compression. |
| `gradient-wave` | SVG wave creates compression artifacts. Decorative without function. |
| `minimal-elegant` | Off-white luxury is wrong tone for recruitment. Low contrast fails mobile. |
| `geometric` | Angular cuts waste space and fragment text zones. |

### Keep & Modify (4 templates)

| Old Name | New Name | Changes |
|---|---|---|
| `bold-photo` | `photo-banner` | Add logo zone. Flip to 40% image / 60% content. Add contact bar at bottom. |
| `split-color` | `classic-split` | Add logo zone. Replace circle icons with inline (better compression). Ensure works at 1080x1080. |
| `clean-corporate` | `corporate` | Add logo zone. Increase contrast. Add brand-color header bar. |
| `vibrant-pop` | `bold-urgent` | Make text even bolder. Add urgent badge option. Optimize for Hebrew-only. |

### Add (2 new templates)

| Name | Description | Target |
|---|---|---|
| `logo-centered` | Company logo dominates top 30%. Clean typography below. Minimal decoration. | Established companies, LinkedIn |
| `text-stack` | Pure typography. No image. Stacked text blocks with strong hierarchy. Maximum readability. | WhatsApp-first, any industry |

### Final roster: 6 templates

No variant system in v1. Ship one layout per template. Add variants only if users demonstrate demand.

---

## 3. Data Model

```typescript
// === NEW PosterData ===

interface PosterData {
  // Format & Template
  format: PosterFormat              // "square" | "story" | "a4"
  template: TemplateId              // 6 templates

  // Company Identity (NEW)
  company: {
    name: string                    // Company name (Hebrew)
    nameEn?: string                 // Company name (English, optional)
    logoUrl?: string                // Base64 data URI (processed client-side)
    logoBackground: "auto" | "white" | "dark" | "transparent"
  }

  // Job Content
  title: {
    he: string                      // Hebrew job title (required)
    en?: string                     // English job title (optional, common in tech)
  }
  subtitle?: string                 // Department, team, or tagline

  // Details
  details: PosterDetail[]           // Max 5 items enforced by editor
  benefits?: string[]               // Short tags: "היברידי", "קרן השתלמות". Max 3, max 20 chars each.
  salary?: {                        // NEW — optional salary range
    min?: number
    max?: number
    currency: "ILS" | "USD"
    period: "month" | "hour" | "year"
    display?: string                // Override: "לפי ניסיון", "שכר גבוה", etc.
  }

  // Contact & CTA (restructured)
  contact: {
    method: "whatsapp" | "email" | "phone" | "link"
    value: string                   // Validated per method type
    displayText?: string            // Override display text
  }
  cta?: {
    text: string                    // e.g., "הגישו מועמדות"
    urgent?: boolean                // Adds urgency styling
  }

  // Visual
  theme: PosterTheme
  background: PosterBackground
  badge?: {
    text: string                    // e.g., "משרה חדשה", "דחוף"
    style: "default" | "urgent" | "new"
  }

  // AI context (not rendered)
  meta?: {
    industry?: IndustryPreset       // Style preset for AI context
  }
}

interface PosterDetail {
  icon: string                      // Font Awesome class
  label: string                     // e.g., "מיקום"
  value: string                     // e.g., "תל אביב — ליד תחנת השלום"
}

interface PosterTheme {
  preset?: ThemePresetId
  primary: string
  secondary: string
  textColor: string                 // Auto-calculated if not set
  bgColor: string
  fontStack: FontStackId            // "modern" | "bold"
}

interface PosterBackground {
  type: "solid" | "image" | "pattern"
  color?: string
  imageUrl?: string
  imageQuery?: string               // Unsplash search
  overlay?: number                  // 0-1 opacity
  pattern?: "dots" | "grid" | "diagonal-lines"
}

type PosterFormat = "square" | "story" | "a4"
type TemplateId = "photo-banner" | "classic-split" | "corporate" | "bold-urgent" | "logo-centered" | "text-stack"
type FontStackId = "modern" | "bold"
type ThemePresetId = "tech-blue" | "corporate-navy" | "startup-purple" | "medical-teal" | "urgent-red" | "warm-orange" | "fresh-green" | "neutral-gray"
type IndustryPreset = "tech" | "blue-collar" | "retail" | "healthcare" | "finance" | "education" | "general"
```

### Key changes from current model
- `company` block — logo and company name are first-class
- `contact` replaces old `cta.subtext` hack — structured with type
- `benefits` as separate chip array — max 3, max 20 chars each
- `salary` — optional structured field for Israeli market
- `meta` simplified — only `industry` (removed toneNotes, targetAudience)
- `background` restructured — pattern backgrounds added (compression-friendly)
- `fontStack` reduced to 2 options: "modern" and "bold"
- Renamed `format: "post"` to `"square"`
- Removed `backgroundQuery`/`backgroundUrl` from top level

---

## 4. Font System

Two curated stacks. No individual font selection.

| Stack | Hebrew Headline | Hebrew Body | Character |
|---|---|---|---|
| `modern` | Heebo 700 | Heebo 400 | Clean, current. Default for most templates. |
| `bold` | Heebo 900 | Heebo 500 | High-impact. Blue-collar, urgent hires. |

**Font loading:** Heebo-Variable.ttf is already bundled in `/fonts`. Puppeteer loads it locally — no network dependency.

**Line height:** 1.35 for Hebrew text (15% above Latin default). Mixed bidi: 1.4.

---

## 5. Editor UI

### Step 1: Quick Start

- Style preset selection (tech / blue-collar / retail / healthcare / general)
- Company name + optional logo upload
- Job title (Hebrew, optional English)
- "Let AI fill everything" option with free-text box
- Preset pre-fills: theme colors, font stack, template suggestion, AI tone

### Step 2: Choose Look

- 6 template thumbnails in a grid
- Each rendered with user's actual content from Step 1
- Click to select → proceed to editor

### Step 3: Sidebar Editor

**Tier 1 (always visible):**
- Title (Hebrew + English)
- Company name + logo change
- Primary color picker (8 presets + custom hex)
- Template switcher

**Tier 2 (accordions):**
- Details (max 5 items, add/remove, icon+label+value)
- Benefits (chip input, max 3)
- Salary (optional, structured or display override)
- Contact (method dropdown + value + display text)
- Background (solid/image/pattern, Unsplash search, overlay slider)
- Font (2 options)

**Tier 3 (behind toggle):**
- Format selector (square default, story, A4)
- Badge (text + style)
- Export quality

**Additional features:**
- "Improve with AI" button — sends current data to AI, returns suggestions user can accept/reject individually
- Format tabs on preview — switch format, preview updates instantly
- Content overflow warning — yellow border + message when text too long

### Logo Upload Flow

1. File picker: PNG, JPG, SVG, WebP. Max 5MB.
2. Client-side: resize to max 400x200px, convert to base64 data URI
3. Auto-detect transparency → set logoBackground
4. Fallback: if logo fails to render, display company name as styled text
5. Logo embedded in poster HTML at render time — no external URL dependency

### Validation Rules

| Field | Validation |
|---|---|
| `contact.value` (whatsapp/phone) | Israeli format: starts with 05/+972, 10 digits |
| `contact.value` (email) | Standard email format |
| `contact.value` (link) | Valid URL |
| `benefits[]` items | Max 20 characters each |
| `details[]` | Max 5 items |
| Logo upload | Max 5MB, PNG/JPG/SVG/WebP only |
| `salary.display` | Max 30 characters |

---

## 6. AI Generation

### Operation 1: Content Generation

System prompt strategy:
```
Israeli recruitment content specialist persona.
Rules:
- Tech roles: English titles, Hebrew body
- Tone: Direct, informative. No "exciting opportunity" fluff.
- Benefits: Only differentiating ones. "Pension" alone is not a benefit.
- Location: Include city + landmark context for commute
- Contact: Prefer WhatsApp number
- Length: Max 5-7 words per detail. Headlines max 4 words Hebrew.
- Details: Pick 3-5 most relevant from: location, scope, experience,
  salary, key requirement, start date. No generic "great atmosphere".
```

Industry preset → AI context mapping informs tone, language mix, and emphasis.

### Operation 2: Content Improvement

Takes existing PosterData, returns `AISuggestion[]`:
```typescript
interface AISuggestion {
  field: string           // e.g., "title.he", "details[2].value"
  current: string
  suggested: string
  reason: string          // e.g., "Title too long for poster — shortened"
}
```

### Error Handling

- AI timeout (>15s): show error, let user retry or fill manually
- Malformed AI response: retry once with stricter prompt, then fallback to manual
- Unsplash rate limit: use curated fallback images (20 pre-vetted, stored in /assets)
- Unsplash query filter: no people-related search terms (users can still upload own photos)

---

## 7. Export Pipeline

- **Default**: JPEG 88% + Sharp `sharpen({ sigma: 0.5 })` for WhatsApp compression resilience
- **File size**: If >800KB, iteratively reduce quality (down to 80%)
- **Default format**: Square (1080x1080) — universal safe format
- **PNG option**: Behind Tier 3 settings for LinkedIn/print
- **Font loading**: Heebo-Variable.ttf bundled locally, loaded by Puppeteer before render
- **Logo rendering**: Pre-fetch and base64-encode logos before injecting into HTML string

---

## 8. File Structure

All paths relative to `/c/Learnings/canva-cli/src`.

### Template Rendering (HTML string generators — flat structure)

```
lib/
├── types.ts                    [MODIFY] — New PosterData model
├── templates/
│   ├── photo-banner.ts         [NEW] — Replaces bold-photo
│   ├── classic-split.ts        [NEW] — Replaces split-color
│   ├── corporate.ts            [NEW] — Replaces clean-corporate
│   ├── bold-urgent.ts          [NEW] — Replaces vibrant-pop
│   ├── logo-centered.ts        [NEW] — New template
│   ├── text-stack.ts           [NEW] — New template
│   ├── shared.ts               [NEW] — Shared HTML utilities (logo zone, contact bar, details list, benefit chips, badge)
│   └── index.ts                [NEW] — Template registry: ID → render function
├── template-html.ts            [DELETE] — Replaced by per-template files above
├── templates.ts                [DELETE] — Replaced by types.ts + templates/index.ts
├── renderer.ts                 [MODIFY] — Updated Sharp pipeline (sharpen, quality targeting)
├── validation.ts               [NEW] — Contact, logo, benefits validation
├── migration.ts                [NEW] — Old PosterData → new format converter
├── fonts.ts                    [NEW] — Font stack definitions + Puppeteer font loading
└── presets.ts                  [NEW] — Industry presets + theme presets
```

### Editor (React components)

```
app/
├── page.tsx                    [MODIFY] — Wizard flow: QuickStart → ChooseLook → Editor
├── editor/
│   └── page.tsx                [MODIFY] — Sidebar editor with tiered controls
├── components/
│   ├── QuickStart.tsx          [NEW] — Step 1: preset + company + title
│   ├── ChooseLook.tsx          [NEW] — Step 2: template grid with real content
│   ├── sidebar/
│   │   ├── TitleEditor.tsx     [NEW]
│   │   ├── CompanyEditor.tsx   [NEW] — Company name + logo upload
│   │   ├── ThemePicker.tsx     [NEW] — 8 presets + custom
│   │   ├── DetailsEditor.tsx   [NEW] — Max 5, overflow warning
│   │   ├── BenefitsEditor.tsx  [NEW] — Chip input, max 3
│   │   ├── SalaryEditor.tsx    [NEW] — Optional salary range
│   │   ├── ContactEditor.tsx   [NEW] — Method + value + validation
│   │   ├── BackgroundEditor.tsx [NEW] — Solid/image/pattern + overlay
│   │   ├── FontPicker.tsx      [NEW] — 2 stack options
│   │   └── ExportSettings.tsx  [NEW] — Quality, format, PNG toggle
│   └── preview/
│       └── LivePreview.tsx     [NEW] — iframe preview + format tabs
├── api/
│   ├── generate/route.ts       [MODIFY] — Updated render pipeline
│   ├── ai-generate/route.ts    [MODIFY] — New prompt architecture
│   └── ai-improve/route.ts     [NEW] — Content improvement endpoint
```

### Assets

```
assets/
└── fallback-backgrounds/       [NEW] — 20 curated images
    ├── office-01.jpg ... abstract-20.jpg
```

---

## 9. Migration

`lib/migration.ts` converts old PosterData to new format:

| Old | New |
|---|---|
| `template: "bold-photo"` | `template: "photo-banner"` |
| `template: "split-color"` | `template: "classic-split"` |
| `template: "clean-corporate"` | `template: "corporate"` |
| `template: "vibrant-pop"` | `template: "bold-urgent"` |
| Deleted templates | `template: "corporate"` (safe default) |
| `format: "post"` | `format: "square"` |
| `cta.subtext` with phone/email | Extract to `contact` field |
| `backgroundQuery`/`backgroundUrl` | Move into `background` object |
| `theme.accent` | `theme.secondary` |

JSON input mode accepts both old and new formats, auto-migrating.

---

## 10. Implementation Phases

### Phase 1a: Foundation (data model + migration + 1 template POC)
- New `PosterData` type definitions
- Migration utility (old → new format)
- One template as proof of concept (`corporate` — simplest to modify)
- Updated renderer with new Sharp pipeline
- Font loading utility
- Validation utilities

### Phase 1b: Templates + Core Features
- Remaining 3 modified templates (photo-banner, classic-split, bold-urgent)
- 2 new templates (logo-centered, text-stack)
- Shared HTML utilities (logo zone, contact bar, etc.)
- Template registry
- Delete old template-html.ts

### Phase 2: Editor UI
- Quick Start wizard step
- Choose Look template grid
- Sidebar editor with all tiers
- Logo upload flow
- Live preview with format tabs
- Theme/preset system

### Phase 3: AI + Polish
- Updated AI content generation prompt
- AI content improvement endpoint
- Industry preset → AI context mapping
- Unsplash filtering + fallback images
- Export optimization (file size targeting)

---

## 11. YAGNI — Intentionally Omitted

- Drag-and-drop positioning
- Custom font upload
- Template variants (v1 ships one layout per template)
- Multi-page posters
- Animation/video export
- Collaboration features
- A/B testing
- CRM/ATS integration
- WhatsApp compression preview simulator
- `meta.toneNotes` / `meta.targetAudience` fields
