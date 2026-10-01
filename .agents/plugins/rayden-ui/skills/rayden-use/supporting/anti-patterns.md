# Rayden UI — Anti-Patterns (Banned)

These patterns immediately signal "AI-generated." Every item on this list is
explicitly banned. If a design task would naturally produce one of these, stop
and use the alternative instead.

---

## Layout Anti-Patterns

| Banned | Why | Build This Instead |
|--------|-----|--------------------|
| Centered full-width hero: headline → subtitle → two buttons stacked vertically | The universal AI default — every generated landing page looks identical | Asymmetric: 6-col text left + 6-col visual/card right; or full-bleed image with text overlay |
| 3-column grid of icon + heading + short paragraph on white background | Monotonous, no focal point, every SaaS landing page | Numbered list with large type, alternating image+text rows, or one large featured callout |
| Full-width layout with no max-width constraint | Content stretches to edge, unreadable on wide screens | Always `maxWidth = 1280` on page content frame |
| Every section in the same grid layout | No rhythm, no visual hierarchy between sections | Mix: full-width feature callout, then 2-col grid, then single column — vary deliberately |

---

## Typography Anti-Patterns

| Banned | Why | Use Instead |
|--------|-----|-------------|
| Gradient text (`bg-clip-text text-transparent bg-gradient-to-r`) | #1 AI headline cliché | `grey-900` for headings, `primary-600` for emphasis — no gradients on text |
| `fontStyle: "ExtraBold"` or `"Black"` weight on headings | Overweight, heavy-handed, low craft signal | Max `SemiBold` on headings, `Bold` only on numeric KPI values |
| ALL-CAPS headings with `primary-500` color | Overused, especially with brand color | Overlines are `grey-400` + `UPPER` + tracked, never primary-colored |
| Same font size for heading and body with only color difference | Weak hierarchy, confusing reading order | Use full 4-level size + weight + color hierarchy (see craft-rules.md) |

---

## Colour Anti-Patterns

| Banned | Why | Use Instead |
|--------|-----|-------------|
| Colored container backgrounds (`primary-50` fill on cards) | Looks dated, cluttered, 2018-era SaaS | `white` cards always, `grey-50` page background |
| Gradient hero/section background (`primary-50` → `white`) | Every SaaS template from 2022 | `grey-50` bg with a decorative element (image, border) as the accent |
| Multiple `primary-500` buttons in one section | Confuses the user's focus — no clear primary action | One `primary-500` button per section, rest are outlined or text |
| Rainbow badges with no semantic meaning | Decorative noise, not information | Badges are semantic: `success` = positive, `error` = problem, `warning` = caution |
| Colored left-border on hover (`border-l-4 primary-500`) | Cheap interactivity signal, looks like an error state | Shadow lift: `soft-xs` → `soft-sm` on hover, soften border color |

---

## Interaction + Motion Anti-Patterns

| Banned | Why | Use Instead |
|--------|-----|-------------|
| `animate-bounce` on CTA buttons | Desperate, distracting, low trust signal | No animation on primary CTAs — let the copy and layout do the work |
| Emoji used as icons in UI (🚀 ✅ 💡) | Inconsistent rendering across platforms, unprofessional | Always use `<Icon name="..." />` from the Rayden icon system |
| Hover effects on every element | Visual noise, fatiguing | Reserve hover states for interactive elements only |

---

## Structure Anti-Patterns

| Banned | Why | Use Instead |
|--------|-----|-------------|
| Heavy border AND heavy shadow on the same card | Two competing elevation signals — looks wrong | Pick one: `border grey-200` OR `shadow-soft-xs` — not both at full weight |
| Absolute positioning for layout | Breaks auto layout, won't scale, not responsive | Auto layout always (`layoutMode: "HORIZONTAL"` or `"VERTICAL"`) |
| Inconsistent radius within a section | Looks like different components stitched together | One radius strategy per section; use concentric step-down for nesting |

---

## The Gut-Check Test

Before finalising any layout, ask: "Would I see this exact composition on
three other AI-generated landing pages this week?"

If yes — change the layout. Asymmetry, hierarchy, and restraint are the
signals of craft. Symmetry, gradients, and uniformity are the signals of
AI default behaviour.
