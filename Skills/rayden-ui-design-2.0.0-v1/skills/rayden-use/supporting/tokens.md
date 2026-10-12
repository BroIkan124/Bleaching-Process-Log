# Rayden UI — Token Reference

All resolved token values for use in `use_figma` code.
Source of truth: `tokens/tokens.dtcg.json`

---

## Colour Tokens

### Primary
| Token | Hex |
|-------|-----|
| `primary-50` | `#FEF6EE` |
| `primary-100` | `#FDEAD7` |
| `primary-200` | `#FAD0AF` |
| `primary-300` | `#F7B27A` |
| `primary-400` | `#F38744` |
| `primary-500` | `#EB5017` ← brand primary |
| `primary-600` | `#CC3D0E` |
| `primary-700` | `#A83009` |
| `primary-800` | `#872808` |
| `primary-900` | `#6E2209` |

### Grey (Neutral)
| Token | Hex | Usage |
|-------|-----|-------|
| `grey-50` | `#F9FAFB` | Page background |
| `grey-100` | `#F2F4F7` | Subtle bg, skeleton |
| `grey-200` | `#EAECF0` | Card border, dividers |
| `grey-300` | `#D0D5DD` | Input border default |
| `grey-400` | `#98A2B3` | Meta text, overlines, icons |
| `grey-500` | `#667085` | Body secondary |
| `grey-600` | `#475467` | Body mid |
| `grey-700` | `#344054` | Body primary |
| `grey-800` | `#1D2939` | Section headings |
| `grey-900` | `#101828` | Page titles, primary text |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `success-50` | `#ECFDF3` | Success bg |
| `success-500` | `#12B76A` | Success icon/border |
| `success-700` | `#027A48` | Success text |
| `error-50` | `#FEF3F2` | Error bg |
| `error-500` | `#F04438` | Error icon/border |
| `error-700` | `#B42318` | Error text |
| `warning-50` | `#FFFAEB` | Warning bg |
| `warning-500` | `#F79009` | Warning icon/border |
| `warning-700` | `#B54708` | Warning text |
| `info-400` | `#36BFFA` | Info icon |
| `info-500` | `#0BA5EC` | Info border/bg accent |

---

## Spacing Tokens

Base unit: 4px

| Token | Value | Common use |
|-------|-------|------------|
| `spacing.1` | 4px | Icon gap inside button |
| `spacing.2` | 8px | Component internal gap |
| `spacing.3` | 12px | Compact padding |
| `spacing.4` | 16px | Standard h-padding (button SM), form gap |
| `spacing.5` | 20px | Button LG h-padding |
| `spacing.6` | 24px | Card padding (min), inline section gap |
| `spacing.8` | 32px | Section gap (compact), page padding (min) |
| `spacing.10` | 40px | Section gap (default) |
| `spacing.12` | 48px | Page padding (preferred), hero spacing |
| `spacing.16` | 64px | Large section gap |

---

## Border Radius Tokens

| Token | Value | Figma property |
|-------|-------|----------------|
| `radius.sm` | 4px | `cornerRadius = 4` |
| `radius.md` | 6px | `cornerRadius = 6` |
| `radius.lg` | 8px | `cornerRadius = 8` |
| `radius.xl` | 12px | `cornerRadius = 12` |
| `radius.2xl` | 16px | `cornerRadius = 16` |
| `radius.full` | 9999px | `cornerRadius = 9999` (pill) |

### Concentric Radius Step-Down Table

| Outer container | Inner element |
|-----------------|---------------|
| `radius.2xl` (16px) | `radius.xl` (12px) |
| `radius.xl` (12px) | `radius.lg` (8px) |
| `radius.lg` (8px) | `radius.md` (6px) |
| `radius.md` (6px) | `radius.sm` (4px) |

---

## Shadow Tokens

| Token | Figma `effects` value |
|-------|----------------------|
| `shadow-soft-xs` | `{ type:"DROP_SHADOW", color:{r:0.063,g:0.094,b:0.157,a:0.05}, offset:{x:0,y:1}, radius:2, spread:0 }` |
| `shadow-soft-sm` | `{ type:"DROP_SHADOW", color:{r:0.063,g:0.094,b:0.157,a:0.10}, offset:{x:0,y:1}, radius:3, spread:0 }` |
| `shadow-soft-md` | `{ type:"DROP_SHADOW", color:{r:0.063,g:0.094,b:0.157,a:0.10}, offset:{x:0,y:4}, radius:8, spread:-2 }` |

Use `applyShadow(node, "soft-xs"|"soft-sm"|"soft-md")` from the helpers block.

---

## Typography Scale

| Token | fontSize | lineHeight | fontWeight | letterSpacing |
|-------|----------|------------|------------|---------------|
| `text-h1` | 48px | 60px | SemiBold | -2% |
| `text-h2` | 40px | 52px | SemiBold | -2% |
| `text-h3` | 32px | 44px | SemiBold | -1.5% |
| `text-h4` | 24px | 32px | SemiBold | -0.5% |
| `text-h5` | 20px | 28px | SemiBold | 0% |
| `text-h6` | 18px | 26px | SemiBold | 0% |
| `text-body-xl` | 20px | 32px | Regular | 0% |
| `text-body-lg` | 18px | 28px | Regular | 0% |
| `text-body-md` | 16px | 26px | Regular | 0% |
| `text-body-sm` | 14px | 22px | Regular | 0% |
| `text-body-xs` | 12px | 18px | Regular | 0% |
| `text-caption-sm` | 11px | 16px | Medium | +8% (uppercase) |

### Letter Spacing in Figma API

Figma uses `{ unit: "PERCENT", value: N }` where N is percentage.

```javascript
// Heading h1/h2/h3 — tighter
node.letterSpacing = { unit: "PERCENT", value: -2 };  // h1/h2
node.letterSpacing = { unit: "PERCENT", value: -1.5 }; // h3
node.letterSpacing = { unit: "PERCENT", value: -0.5 }; // h4

// Body — default (no letterSpacing set, or 0)
node.letterSpacing = { unit: "PERCENT", value: 0 };

// Overline — tracked out
node.letterSpacing = { unit: "PERCENT", value: 8 };
node.textCase = "UPPER";
```

---

## Component Size Reference

### Button
| Size | Height | H-Padding | V-Padding | Font | Gap |
|------|--------|-----------|-----------|------|-----|
| SM | 36px | 16px | 8px | 14px SemiBold | 8px |
| LG | 48px | 20px | 12px | 16px SemiBold | 8px |

Radius: `radius.lg` (8px) — always.

### Input
| Size | Height | H-Padding | V-Padding | Font |
|------|--------|-----------|-----------|------|
| SM | 40px | 14px | 10px | 14px Regular |
| LG | 48px | 16px | 12px | 16px Regular |

Radius: `radius.lg` (8px).

### Badge
| Size | V-Padding | H-Padding | Font |
|------|-----------|-----------|------|
| SM | 2px | 8px | 12px Medium |
| LG | 4px | 12px | 14px Medium |

Radius: `radius.full` (pill).

---

## Semantic Token Intent Guide

Tokens have values — this section explains **when to use which**.
Follow these decision trees to make the right choice every time.

### Colour Intent — When to Use What

**Text emphasis:**
```
Need maximum emphasis (page title, primary label)?
  → grey-900 (#101828) + SemiBold

Need standard emphasis (body text, descriptions)?
  → grey-700 (#344054) + Regular

Need reduced emphasis (secondary info, subtitles)?
  → grey-500 (#667085) + Regular

Need minimal emphasis (meta, timestamps, overlines)?
  → grey-400 (#98A2B3) + Regular or Medium

Need brand emphasis (one key word, link text, selected state)?
  → primary-600 (#CC3D0E) — NEVER primary-500 for text (low contrast)
```

**When to use primary-500 vs grey-900:**
- `primary-500` = interactive elements only (button fills, active tab indicators, links)
- `grey-900` = content emphasis (headings, primary labels, important values)
- Never use primary on headings. Never use grey-900 on buttons.

**When to use semantic colors:**
```
Is this indicating a positive outcome, active state, or completion?
  → success-500 (icon/border), success-700 (text), success-50 (background)

Is this indicating an error, failure, or destructive action?
  → error-500 (icon/border), error-700 (text), error-50 (background)

Is this indicating a warning, pending state, or caution?
  → warning-500 (icon/border), warning-700 (text), warning-50 (background)

Is this informational with no positive/negative connotation?
  → info-500 (icon/border), info-400 (lighter accent)

Is this a neutral state with no status meaning?
  → grey-200 (border), grey-100 (background), grey-500 (text)
```

**Rule:** Semantic colors are for status, never decoration. If a badge or
indicator doesn't represent an actual state, use `grey` (neutral).

### Background Intent

```
Full page background?
  → grey-50 (#F9FAFB) — default for app shells, dashboards
  → white (#FFFFFF) — for marketing/content pages, auth screens

Card / container background?
  → white (#FFFFFF) — always. Never primary-50 or other colored fills.

Subtle content grouping (inset area, code block, empty state)?
  → grey-50 (#F9FAFB) — one step lighter than surrounding card

Selected / active row or item?
  → grey-50 (#F9FAFB) — subtle highlight, not primary-50

Hover state background?
  → grey-50 (#F9FAFB) — for list items, table rows
  → grey-100 (#F2F4F7) — for icon buttons, compact interactive elements

Skeleton / loading placeholder?
  → grey-100 (#F2F4F7) + animate-pulse
```

### Shadow Level Intent

```
Default card (table, form section, content card)?
  → No shadow. Use border grey-200 only (flat strategy).

Featured or highlighted card (primary CTA card, pricing highlight)?
  → shadow-soft-xs — subtle lift, no border needed.

Modal, dropdown, popover (floating above content)?
  → shadow-soft-md — clear elevation.

Hover state lift (card becomes interactive)?
  → Resting: border grey-200, no shadow
  → Hover: border grey-100, shadow-soft-xs
  → Never jump from no shadow to shadow-soft-md — too dramatic.

When combining border + shadow:
  → Border must be lighter than usual: grey-100 (not grey-200)
  → Shadow must be softest level: soft-xs
  → Never both heavy (border grey-300 + shadow-soft-sm = banned)
```

### Spacing Intent

```
Tight inline gaps (icon to text inside a button, badge padding)?
  → spacing.1 (4px) or spacing.2 (8px)

Component internal gap (form field to label, list item gap)?
  → spacing.3 (12px) to spacing.4 (16px)

Card internal padding?
  → spacing.6 (24px) minimum. spacing.5 (20px) only for compact cards.

Section gap (between heading block and content, between card groups)?
  → spacing.8 (32px) to spacing.10 (40px)

Page-level padding (content area edges)?
  → spacing.8 (32px) minimum. spacing.12 (48px) preferred for spacious layouts.

Large visual breaks (between major page sections, hero to content)?
  → spacing.12 (48px) to spacing.16 (64px)
```
