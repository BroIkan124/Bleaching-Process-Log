# Rayden UI — Screen Patterns

Pre-built layout shells for common screen types. Use these as starting
structures, then populate with Rayden components.

All measurements use resolved token values. See tokens.md for reference.

---

## How to Use These Patterns

1. Choose the screen type that matches the task
2. Copy the shell structure code
3. Replace placeholder comments with actual Rayden components
4. Apply Style Mode adjustments from SKILL.md
5. Run QA checklist from craft-rules.md

---

## 1. Dashboard / App Shell (Sidebar Layout)

Best for: SaaS dashboards, admin panels, product apps

```javascript
await loadFonts();

// ── Page frame (1440 × 900 desktop viewport) ──────────────────────────
const page = figma.createFrame();
page.name = "Dashboard / Shell";
page.resize(1440, 900);
page.layoutMode = "HORIZONTAL";
page.fills = [{ type:"SOLID", color:hexToRgb("#F9FAFB") }]; // grey-50
page.itemSpacing = 0;

// ── Sidebar (256px fixed) ─────────────────────────────────────────────
const sidebar = figma.createFrame();
sidebar.name = "Sidebar";
sidebar.layoutMode = "VERTICAL";
sidebar.resize(256, 900);
sidebar.layoutSizingHorizontal = "FIXED";
sidebar.layoutSizingVertical = "FILL";
sidebar.fills = [{ type:"SOLID", color:hexToRgb("#FFFFFF") }];
applyBorder(sidebar, "#EAECF0", 1); // right border only — set manually
sidebar.paddingTop = 24;
sidebar.paddingBottom = 24;
sidebar.itemSpacing = 4;
// → Add logo area (paddingLeft:24, paddingRight:24, paddingBottom:24)
// → Add SidebarMenu sections

// ── Main area (flex-1) ───────────────────────────────────────────────
const main = figma.createFrame();
main.name = "Main";
main.layoutMode = "VERTICAL";
main.layoutSizingHorizontal = "FILL";
main.layoutSizingVertical = "FILL";
main.fills = [];
main.itemSpacing = 0;

  // Header bar
  const header = figma.createFrame();
  header.name = "Header";
  header.layoutMode = "HORIZONTAL";
  header.layoutSizingHorizontal = "FILL";
  header.resize(1184, 64);
  header.counterAxisSizingMode = "FIXED";
  header.primaryAxisAlignItems = "SPACE_BETWEEN";
  header.counterAxisAlignItems = "CENTER";
  header.paddingLeft = 32;
  header.paddingRight = 32;
  header.fills = [{ type:"SOLID", color:hexToRgb("#FFFFFF") }];
  applyBorder(header, "#EAECF0", 1);
  // → Add Breadcrumb (left), actions + Avatar (right)

  // Content area
  const content = figma.createFrame();
  content.name = "Content";
  content.layoutMode = "VERTICAL";
  content.layoutSizingHorizontal = "FILL";
  content.layoutSizingVertical = "FILL";
  content.paddingTop = 32;
  content.paddingBottom = 32;
  content.paddingLeft = 32;
  content.paddingRight = 32;
  content.itemSpacing = 32;
  content.fills = [];
  // → Add page heading block
  // → Add KPI strip (grid 4-col MetricsCards)
  // → Add content sections

main.appendChild(header);
main.appendChild(content);
page.appendChild(sidebar);
page.appendChild(main);
figma.currentPage.appendChild(page);
```

---

## 2. Centered Content Page (Top Nav)

Best for: marketing pages, settings, forms, onboarding

```javascript
await loadFonts();

const page = figma.createFrame();
page.name = "Content Page / Shell";
page.resize(1440, 900);
page.layoutMode = "VERTICAL";
page.fills = [{ type:"SOLID", color:hexToRgb("#F9FAFB") }];
page.itemSpacing = 0;

// Top nav
const nav = figma.createFrame();
nav.name = "Nav";
nav.layoutMode = "HORIZONTAL";
nav.layoutSizingHorizontal = "FILL";
nav.resize(1440, 64);
nav.counterAxisSizingMode = "FIXED";
nav.primaryAxisAlignItems = "SPACE_BETWEEN";
nav.counterAxisAlignItems = "CENTER";
nav.paddingLeft = 48;
nav.paddingRight = 48;
nav.fills = [{ type:"SOLID", color:hexToRgb("#FFFFFF") }];
applyBorder(nav, "#EAECF0", 1);

// Content wrapper (constrained max-width)
const wrapper = figma.createFrame();
wrapper.name = "Content Wrapper";
wrapper.layoutMode = "VERTICAL";
wrapper.layoutSizingHorizontal = "FILL";
wrapper.layoutSizingVertical = "FILL";
wrapper.paddingTop = 48;
wrapper.paddingBottom = 64;
wrapper.paddingLeft = 48;
wrapper.paddingRight = 48;
wrapper.itemSpacing = 48;
wrapper.fills = [];
wrapper.maxWidth = 1280; // always constrain content
// → Add page heading block
// → Add content sections

page.appendChild(nav);
page.appendChild(wrapper);
figma.currentPage.appendChild(page);
```

---

## 3. Auth / Focused Form

Best for: login, signup, reset password, onboarding step

```javascript
await loadFonts();

const page = figma.createFrame();
page.name = "Auth / Shell";
page.resize(1440, 900);
page.layoutMode = "VERTICAL";
page.primaryAxisAlignItems = "CENTER";
page.counterAxisAlignItems = "CENTER";
page.fills = [{ type:"SOLID", color:hexToRgb("#F9FAFB") }];

// Form card (max 400px)
const card = figma.createFrame();
card.name = "Form Card";
card.layoutMode = "VERTICAL";
card.resize(400, 1); // height will hug
card.counterAxisSizingMode = "FIXED";
card.primaryAxisSizingMode = "AUTO";
card.paddingTop = 40;
card.paddingBottom = 40;
card.paddingLeft = 40;
card.paddingRight = 40;
card.itemSpacing = 24;
card.cornerRadius = 16; // rounded-2xl
card.fills = [{ type:"SOLID", color:hexToRgb("#FFFFFF") }];
applyShadow(card, "soft-sm");

// Heading block (centered, inside card)
const headingBlock = figma.createFrame();
headingBlock.name = "Heading Block";
headingBlock.layoutMode = "VERTICAL";
headingBlock.counterAxisAlignItems = "CENTER";
headingBlock.primaryAxisSizingMode = "AUTO";
headingBlock.counterAxisSizingMode = "FILL";
headingBlock.itemSpacing = 8;
headingBlock.fills = [];
// → Add heading (text-h4, grey-900, SemiBold, tracking -0.5%)
// → Add subtitle (text-body-md, grey-500, lineHeight 160%)

// Form fields area
const fields = figma.createFrame();
fields.name = "Fields";
fields.layoutMode = "VERTICAL";
fields.layoutSizingHorizontal = "FILL";
fields.primaryAxisSizingMode = "AUTO";
fields.itemSpacing = 16;
fields.fills = [];
// → Add Input components (inner radius = 8px — one step below card's 16px)

card.appendChild(headingBlock);
card.appendChild(fields);
page.appendChild(card);
figma.currentPage.appendChild(page);
```

---

## 4. Data Table Page

Best for: user lists, order history, admin records

```javascript
await loadFonts();

// Table container card
const tableCard = figma.createFrame();
tableCard.name = "Table Card";
tableCard.layoutMode = "VERTICAL";
tableCard.resize(1200, 1); // hug height
tableCard.counterAxisSizingMode = "FIXED";
tableCard.primaryAxisSizingMode = "AUTO";
tableCard.cornerRadius = 12; // rounded-xl
tableCard.fills = [{ type:"SOLID", color:hexToRgb("#FFFFFF") }];
applyBorder(tableCard, "#EAECF0", 1);
tableCard.clipsContent = true;

  // Table header bar
  const tableHeader = figma.createFrame();
  tableHeader.name = "Table Header";
  tableHeader.layoutMode = "HORIZONTAL";
  tableHeader.layoutSizingHorizontal = "FILL";
  tableHeader.primaryAxisAlignItems = "SPACE_BETWEEN";
  tableHeader.counterAxisAlignItems = "CENTER";
  tableHeader.paddingLeft = 24;
  tableHeader.paddingRight = 24;
  tableHeader.paddingTop = 20;
  tableHeader.paddingBottom = 20;
  tableHeader.fills = [];
  applyBorder(tableHeader, "#F2F4F7", 1); // bottom border grey-100
  // → Left: title (h6 grey-800 SemiBold) + subtitle (body-xs grey-400)
  // → Right: Search Input (sm) + primary action Button (sm)

  // Filter bar (optional)
  const filterBar = figma.createFrame();
  filterBar.name = "Filter Bar";
  filterBar.layoutMode = "HORIZONTAL";
  filterBar.layoutSizingHorizontal = "FILL";
  filterBar.paddingLeft = 24;
  filterBar.paddingRight = 24;
  filterBar.paddingTop = 12;
  filterBar.paddingBottom = 12;
  filterBar.itemSpacing = 8;
  filterBar.fills = [];
  applyBorder(filterBar, "#F2F4F7", 1);
  // → Add Chip components (variant="filter")

  // Table body — use Table compound component
  // → TableHeader → TableRow → TableHead (sortable where needed)
  // → TableBody → TableRow × n → TableCell

  // Pagination footer
  const footer = figma.createFrame();
  footer.name = "Pagination Footer";
  footer.layoutMode = "HORIZONTAL";
  footer.layoutSizingHorizontal = "FILL";
  footer.primaryAxisAlignItems = "SPACE_BETWEEN";
  footer.counterAxisAlignItems = "CENTER";
  footer.paddingLeft = 24;
  footer.paddingRight = 24;
  footer.paddingTop = 16;
  footer.paddingBottom = 16;
  footer.fills = [];
  applyBorder(footer, "#F2F4F7", 1);
  // → Left: "Showing 1-10 of 48" (body-xs grey-400)
  // → Right: Pagination component

tableCard.appendChild(tableHeader);
tableCard.appendChild(filterBar);
// → append table body frame
tableCard.appendChild(footer);
figma.currentPage.appendChild(tableCard);
```

---

## Standard Heading Block (Reusable)

Use this pattern at the top of every page section:

```javascript
async function createHeadingBlock(title, subtitle, overlineText = null) {
  await loadFonts();

  const block = figma.createFrame();
  block.name = "Heading Block";
  block.layoutMode = "VERTICAL";
  block.primaryAxisSizingMode = "AUTO";
  block.counterAxisSizingMode = "AUTO";
  block.itemSpacing = 4;
  block.fills = [];

  if (overlineText) {
    const overline = figma.createText();
    overline.characters = overlineText;
    overline.fontSize = 11;
    overline.fontName = { family:"Inter", style:"Medium" };
    overline.textCase = "UPPER";
    overline.letterSpacing = { unit:"PERCENT", value:8 };
    overline.fills = [{ type:"SOLID", color:hexToRgb("#98A2B3") }]; // grey-400
    block.appendChild(overline);
  }

  const heading = figma.createText();
  heading.characters = title;
  heading.fontSize = 30; // text-h3
  heading.fontName = { family:"Inter", style:"SemiBold" };
  heading.letterSpacing = { unit:"PERCENT", value:-1.5 };
  heading.lineHeight = { unit:"PIXELS", value:44 };
  heading.fills = [{ type:"SOLID", color:hexToRgb("#101828") }]; // grey-900
  block.appendChild(heading);

  if (subtitle) {
    const sub = figma.createText();
    sub.characters = subtitle;
    sub.fontSize = 16; // text-body-md
    sub.fontName = { family:"Inter", style:"Regular" };
    sub.lineHeight = { unit:"PERCENT", value:160 };
    sub.fills = [{ type:"SOLID", color:hexToRgb("#667085") }]; // grey-500
    block.appendChild(sub);
  }

  return block;
}
```

---

## 5. Layout Variety — Breaking the AI Grid

AI agents default to monotonous, symmetric layouts. These heuristics produce
varied, interesting compositions that feel designed, not generated.

### Composition Techniques

Use these deliberately to break visual monotony. Every multi-section screen
should use at least 2 different techniques.

| Technique | When to use | Structure |
|-----------|-------------|-----------|
| **Asymmetric split** | Hero sections, feature callouts | 7-col text + 5-col visual (or reverse). Never 6/6 — that's the AI default |
| **Zigzag alternation** | Feature sections, case studies | Row 1: image left + text right. Row 2: text left + image right. Repeat |
| **Featured + grid** | Product cards, blog posts, team pages | One large featured card spanning full width, then 2–3 smaller cards in a row below |
| **Full-bleed break** | Testimonials, stats strips, CTAs | A section that breaks out of the content max-width to span the full viewport — creates visual rhythm by interrupting the grid |
| **Stacked emphasis** | Settings pages, form flows | Single column, max-width 640px. Sections separated by dividers. No grid — focus on reading flow |
| **Sidebar + main** | Dashboards, settings, documentation | Fixed 256px sidebar + fluid main. Main content has its own internal grid |
| **Card mosaic** | Dashboards, analytics | Mix card sizes: 1 large (span-2) + 2 small in a row, then 3 equal, then 1 full-width |

### Visual Rhythm Rules

Rhythm is the pattern of tension and release across a page. Without it,
every section feels the same weight and the user's eye has no resting points.

1. **Vary section heights.** Not every section should be the same height.
   A KPI strip (120px) followed by a tall data table (400px) followed by a
   compact action bar (64px) creates rhythm. Three 300px sections do not.

2. **Alternate dense and spacious.** Follow a content-heavy section (table,
   form) with a spacious one (stats strip with large type, empty-state
   illustration). The contrast makes both sections stronger.

3. **One hero moment per page.** Every page gets one section that's visually
   dominant — larger type, more whitespace, or a visual element. Everything
   else defers to it. If everything is a hero, nothing is.

4. **Use horizontal rules as rhythm marks.** A `Divider` between sections
   isn't just separation — it's a visual beat. Use them between major sections,
   skip them between related subsections.

5. **Break the column count.** If the page uses a 3-column grid for cards,
   break it with a full-width section (testimonial, CTA banner, stats strip)
   before resuming. This prevents the "wall of cards" effect.

### Column Count Decision Tree

Use this to choose the right column layout for content type:

```
Is the content primarily text (articles, settings, forms)?
  → 1 column, max-width 640–720px

Is the content a list of items (cards, products, team members)?
  → How many items?
    1–2:  → 2 columns (or 1 featured + 1 standard)
    3–6:  → 3 columns (or 1 featured spanning 2 + 2 standard)
    7+:   → 3–4 columns with pagination, or a table view

Is the content a comparison or side-by-side (hero, feature callout)?
  → 2 columns, asymmetric (7/5 or 5/7 split)

Is the content metrics/KPIs?
  → 3–4 columns of equal-width MetricsCards in a single strip

Is the content a data table?
  → 1 column, full content width. Table handles its own internal columns
```

### Section Ordering for Pages

When composing a full page, follow this general ordering to create
natural reading flow:

**Dashboard pages:**
1. Page heading block (title + subtitle)
2. KPI strip (3–4 MetricsCards, single row)
3. Primary content (chart or featured data)
4. Secondary content (table, activity feed)
5. Supporting content (quick actions, recent items)

**Landing/marketing pages:**
1. Hero section (asymmetric split, NOT centered stacked)
2. Social proof strip (logos, metrics, or testimonial — full-bleed break)
3. Primary features (zigzag alternation or featured + grid)
4. Secondary features or use cases
5. Testimonial or case study (full-bleed break)
6. CTA section (simple, restrained)

**Settings/form pages:**
1. Page heading block
2. Section groups (each with its own sub-heading)
3. Form fields (stacked, single column, 640px max)
4. Action bar (sticky or at bottom: Save + Cancel)

**Data table pages:**
1. Page heading block with primary action
2. Filter/search bar
3. Table card (header → filters → rows → pagination footer)
4. Bulk action bar (appears on selection)
