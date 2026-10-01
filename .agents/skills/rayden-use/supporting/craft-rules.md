# Rayden UI — Craft Rules & QA Checklist

Design quality is a first-class requirement. Every component and screen must
satisfy all rules in this file before it is considered complete.

---

## 1. Typography Craft

### Letter Spacing
- `text-h1`, `text-h2`: `letterSpacing = { unit:"PERCENT", value:-2 }`
- `text-h3`: `letterSpacing = { unit:"PERCENT", value:-1.5 }`
- `text-h4`: `letterSpacing = { unit:"PERCENT", value:-0.5 }`
- `text-h5`, `text-h6`: default (0%)
- Body text: default (0%) — never add tracking to body
- ALL-CAPS overlines: `letterSpacing = { unit:"PERCENT", value:8 }`

### Line Height
- Multi-line body/description text: `lineHeight = { unit:"PERCENT", value:160 }`
- Single-line labels, headings: use token line height from tokens.md
- Never apply `lineHeight: 160%` to headings — headings use their own token value

### Font Weight
- Regular (400): body, meta, secondary labels
- Medium (500): nav items, table headers, overlines, emphasis
- SemiBold (600): headings, CTAs, section titles — **MAX for headings**
- Bold (700): numeric KPI values in MetricsCard only
- **Never use ExtraBold or Black** — overweight, amateurish

### Heading Hierarchy Pattern
Every section should follow this stack:
1. Overline (optional): 11px Medium, UPPER, grey-400, tracking +8%
2. Heading: h3–h5 SemiBold grey-900, negative tracking
3. Subtitle: body-md Regular grey-500, lineHeight 160%

---

## 2. Concentric Border Radius

Inner elements must always use a smaller radius than their container.

| Outer | Inner |
|-------|-------|
| 16px (2xl) | 12px (xl) |
| 12px (xl) | 8px (lg) |
| 8px (lg) | 6px (md) |
| 6px (md) | 4px (sm) |

```javascript
// Card (rounded-2xl) containing a button
card.cornerRadius = 16;
button.cornerRadius = 12; // one step down, NOT 16

// Card with image at top — use clipsContent, no radius on image
card.clipsContent = true;  // clips the image to card's radius
image.cornerRadius = 0;    // image has no independent radius
```

---

## 3. Shadow + Border Discipline

**Pick one elevation strategy per section. Never both heavy.**

| Strategy | When to use |
|----------|-------------|
| Border only (`grey-200`, 1px) | Default flat cards, form inputs |
| Shadow only (`soft-xs`) | Featured cards, hero panels |
| Both (very light) | `grey-100` border + `soft-xs` shadow — barely-there |
| Heavy shadow (`soft-sm`+) | Modals, dropdowns, elevated panels |

**Hover state:** When a card lifts on hover:
- Soften border: `grey-200` → `grey-100`
- Strengthen shadow: none/`soft-xs` → `soft-xs`/`soft-sm`
- Never add a colored border on hover

---

## 4. Colour Restraint

- Page backgrounds: `grey-50` or `white` only
- Card backgrounds: `white` always
- Container backgrounds: **never** colored (no `primary-50` fills on cards)
- One `primary-500` action per section
- Secondary actions: white fill + `grey-200` border + `grey-700` text
- Status colors (success/error/warning) only for actual status — never decorative
- Max 2 accent colors in one view

### Text Colour Hierarchy
```
grey-900 → headings, primary labels        (darkest)
grey-700 → body primary
grey-500 → body secondary, subtitles
grey-400 → meta, overlines, placeholders   (lightest)
```

---

## 5. Spacing Rhythm

All spacing on the 4px grid. Token values only (see tokens.md).

- Page padding min: `spacing.6` (24px), preferred: `spacing.8`–`spacing.12`
- Card internal padding: `spacing.6` (24px) minimum
- Section gaps: `spacing.8`–`spacing.10` (32–40px)
- Form field gaps: `spacing.4`–`spacing.5` (16–20px)
- Inline element gaps (icon+text, button+button): `spacing.2`–`spacing.3`
- Content max-width: 1280px on desktop, always constrained

---

## 6. Icon + Text Alignment

```javascript
// Short single-line label — center align parent
parent.counterAxisAlignItems = "CENTER";

// Multi-line / potentially wrapping label — top align + offset icon
parent.counterAxisAlignItems = "MIN";       // items-start on parent
// Icon frame: paddingTop = 2 (aligns to first text line)
iconFrame.paddingTop = 2;
iconFrame.layoutSizingHorizontal = "FIXED"; // always fixed size, never hug
iconFrame.layoutSizingVertical = "FIXED";
iconFrame.resize(20, 20);
```

**Rule:** Any label that might wrap → use top alignment + `paddingTop:2` on icon.

---

## 7. Touch Targets

Icon-only interactive elements: minimum **44×44px** hit area.

```javascript
// Even if icon is 20px, button frame must be ≥44px
const iconButton = figma.createComponent();
iconButton.resize(44, 44);
iconButton.cornerRadius = 8;
iconButton.primaryAxisAlignItems = "CENTER";
iconButton.counterAxisAlignItems = "CENTER";
// Icon is 20px, centered inside 44px frame
```

The Rayden `Button` component handles this automatically for `icon-only` size.
Apply manually when building raw `<button>` elements or custom interactive areas.

---

## 8. Numeric Data Display

```javascript
// KPI values — Bold, tight tracking, always formatted
kpiValue.fontName = { family:"Inter", style:"Bold" };
kpiValue.fontSize = 36;  // or 48 for hero KPIs
kpiValue.letterSpacing = { unit:"PERCENT", value:-2 };
kpiValue.characters = "$45,231"; // always: thousands separator, currency symbol

// Trend indicators
// Positive: success-50 bg, success-700 text, "↑ 20.1%"
// Negative: error-50 bg, error-700 text, "↓ 3.2%"

// Table numeric cells — right-aligned
tableCell.textAlignHorizontal = "RIGHT";
tableCell.fontName = { family:"Inter", style:"Medium" };
```

---

## QA Checklist

Run before marking any task complete.

### Mechanical (correctness)
- [ ] All colors from resolved token values — no unexplained hex
- [ ] All spacing on 4px grid — no `6px`, `10px`, `14px`, `22px` gaps
- [ ] All frames use auto layout — no `node.x` / `node.y` for positioning
- [ ] Variant names follow `Property=Value, Property=Value` exactly
- [ ] Component properties added: Label (TEXT), Show Icon (BOOLEAN), Icon (INSTANCE_SWAP)
- [ ] `clipsContent = true` on any card with image at top edge
- [ ] Screenshot taken after each major step

### Visual (craft)
- [ ] Headings h3+ have negative letter-spacing
- [ ] Multi-line body text has `lineHeight 160%`
- [ ] Inner elements are one radius step smaller than their container
- [ ] Shadow and border are not both heavy on the same element
- [ ] One primary action per section; rest are outlined/text
- [ ] Container backgrounds are white or grey-50 — no colored fills
- [ ] No gradient text (no `bg-clip-text` equivalent in Figma)
- [ ] No centered hero with stacked CTAs
- [ ] No 3-col icon+heading+paragraph grid on white background
- [ ] Icon-only elements have ≥44×44px frame
- [ ] Icons next to wrapping text use top-alignment + paddingTop:2
- [ ] Numeric KPI values are Bold, tight tracking, thousands-formatted
- [ ] Content width is constrained (maxWidth set on page content frame)
