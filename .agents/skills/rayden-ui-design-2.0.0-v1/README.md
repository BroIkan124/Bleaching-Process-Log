# Rayden UI Design Skill

A Claude Code skill for building with [Rayden UI](https://www.raynaui.com/) — in code and in Figma. Two skills in one package:

- **`/rayden-code`** — Vibe code production-quality React interfaces using Rayden UI's 34 components with correct props, design tokens, and premium layout patterns
- **`/rayden-use`** — Build and maintain Rayden UI components and screens directly in Figma via the Figma MCP

Both skills enforce the Rayna UI design system: documented components only, token-only colors, spacing on the 4px grid, and visual craft rules that prevent generic AI output.

---

## Table of Contents

- [Getting Started](#getting-started)
  - [For Vibecoders (React Code)](#for-vibecoders-react-code)
  - [For Designers (Figma)](#for-designers-figma)
- [Install the Skill](#install-the-skill)
- [Usage Guide](#usage-guide)
  - [/rayden-code — Vibe Code with Rayden UI](#rayden-code--vibe-code-with-rayden-ui)
  - [/rayden-use — Design in Figma](#rayden-use--design-in-figma)
- [What's Included](#whats-included)
- [Design System](#design-system)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### For Vibecoders (React Code)

Generate React + Tailwind CSS code using all 34 Rayden UI components. The skill knows every component, every prop, and every design token — so you get correct, production-quality output instead of hallucinated components.

#### Step 1 — Set up a Rayden UI project

If you don't have a project yet, scaffold one with the CLI:

```bash
npx create-rayden-app my-app
cd my-app
```

This gives you a fully configured project with Rayden UI, Tailwind CSS, and all design tokens ready to go.

Or add Rayden UI to an existing React project:

```bash
npm install @raydenui/ui
```

Then import the styles in your app entry point (e.g. `main.tsx` or `layout.tsx`):

```tsx
import '@raydenui/ui/styles.css';
```

#### Step 2 — Install the skill in Claude Code

Choose one of the install methods below (Plugin Marketplace, skills.sh, or manual).

#### Step 3 — Start vibe coding

Open Claude Code in your project directory and use the skill:

```
/rayden-code a dashboard with KPI cards, a recent orders table, and an activity feed
```

Claude will read the full Rayden UI component reference, plan the layout, and generate React code using only documented components and props with proper Tailwind token classes.

#### More examples

```
/rayden-code auth page with email login and social sign-in buttons
/rayden-code settings page with profile section, notification toggles, and danger zone
/rayden-code e-commerce product grid with filters and sorting
/rayden-code onboarding wizard with 4 steps
/rayden-code pricing page with 3 tiers and a comparison table
```

#### What you get

- Correct imports from `@raydenui/ui`
- Only real components and props (no hallucinated APIs)
- Tailwind token classes (`bg-primary-500`, `text-grey-900`) instead of hex values
- Responsive layouts with `sm:`, `md:`, `lg:` breakpoints
- Premium design patterns: generous whitespace, clear visual hierarchy, color restraint
- Accessibility: `aria-label` on icon-only buttons, keyboard-navigable compound components

---

### For Designers (Figma)

Build Rayden UI components and screens directly in Figma using the Figma MCP. Every output uses auto layout, resolved design token values, and passes a visual validation checklist.

#### Step 1 — Connect Figma MCP

The skill uses the [Figma MCP server](https://modelcontextprotocol.io/) to write to Figma files. Make sure it's enabled in Claude Code's tool settings.

Verify the connection by running:

```
/rayden-use whoami
```

If this fails, check that:
- The Figma MCP server is connected in Claude Code
- You have a **Dev** or **Full** Figma seat (Viewer seats don't have write access)

#### Step 2 — Get Rayden component data

The skill needs access to Rayden component specs and tokens. Set up one of these:

**Option A — Rayden AI MCP server (recommended):**

Add to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "rayden-ai": {
      "command": "npx",
      "args": ["@raydenui/ai"]
    }
  }
}
```

This gives the skill access to component props, anatomy, tokens, and layout recipes via MCP tools.

**Option B — Package installed in your project:**

```bash
npm install @raydenui/ui
```

The skill will read component data from `node_modules/@raydenui/ai/`.

#### Step 3 — Install the skill in Claude Code

Choose one of the install methods below.

#### Step 4 — Start designing

Open a Figma file and pass the URL:

```
/rayden-use Button https://figma.com/file/your-file-key/your-file-name
```

The skill will build the component with all variants using auto layout, design tokens, and Figma Plugin API best practices.

#### More examples

```
/rayden-use dashboard-screen balanced https://figma.com/file/...
/rayden-use landing expressive https://figma.com/file/...
/rayden-use auth conservative https://figma.com/file/...
/rayden-compose settings balanced https://figma.com/file/...
```

#### Style modes

Every Figma build accepts a style mode that controls the aesthetic output:

| Mode | Spacing | Shadows | Typography | Best for |
|------|---------|---------|------------|----------|
| `conservative` | Tight (16px padding) | None (border only) | h4/h5 max | Dense admin UIs, data-heavy screens |
| `balanced` | Standard (24px padding) | `soft-xs` on cards | Full scale | Most use cases (default) |
| `expressive` | Generous (48px padding) | `soft-sm` resting | h2/h3 titles | Marketing pages, hero sections |

#### What you get

- Auto layout on every frame (no absolute positioning)
- All colors from resolved token hex values
- Concentric border radius (inner elements one step smaller than container)
- Visual validation after each build stage (screenshots + 8-point checklist)
- One primary action per section maximum
- 4px spacing grid enforced

---

## Install the Skill

### Claude Code Plugin Marketplace

```bash
claude plugin add rayden-ui-design-skill
```

### skills.sh

```bash
claude skill add playbookTV/rayden-ui-design-skill
```

### Manual install

Clone the repo and point Claude Code at it:

```bash
git clone https://github.com/playbookTV/rayden-ui-design-skill.git
claude --plugin-dir ./rayden-ui-design-skill
```

To verify the skill loaded, run `/rayden-code` or `/rayden-use` in Claude Code — both should be available.

---

## Usage Guide

### `/rayden-code` — Vibe Code with Rayden UI

Generate React + Tailwind CSS code using Rayden UI's 34 components.

**Syntax:**

```
/rayden-code [description of what you want to build]
```

**How it works:**

1. Reads the full Rayden UI component reference (RAYDEN_RULES.md) — every component, prop, token, and design pattern
2. Plans the layout: page structure, component selection, spacing, color, and elevation strategy
3. Generates React code with correct imports, props, and Tailwind token classes
4. Self-validates against a 16-point checklist (correctness + design quality)

**Available components (34):**

| Category | Components |
|----------|------------|
| **Forms & Inputs** | Button, ButtonGroup, Input, Select, Checkbox, Radio, Toggle, Chip, FileUpload, Counter, NumberCounter, Slider, RangeSlider, DatePicker |
| **Navigation** | Tabs, Breadcrumb, Pagination, SidebarMenu, DropdownMenu, Stepper, LinearStepper, SegmentedStepper |
| **Data Display** | Table, Avatar, AvatarGroup, ActivityFeed, MetricsCard, Icon, EmptyStateIllustration, RaydenChart |
| **Feedback** | Alert, Badge, Banner, ProgressBar, ProgressCircle, Spinner, Tooltip |
| **Layout** | Accordion, Card, Divider, Modal |

---

### `/rayden-use` — Design in Figma

Build Rayden UI components and screens directly in Figma via MCP.

**Syntax:**

```
/rayden-use [component-or-screen] [style-mode] [figma-file-url]
```

**How it works:**

1. Verifies Figma MCP connection and write access
2. Loads component specs, design tokens, craft rules, and anti-patterns
3. Identifies task type (single component, full screen, audit, or add variants)
4. Builds using Figma Plugin API with auto layout, helper functions, and token values
5. Takes screenshots after each stage and validates against 8 acceptance criteria
6. Runs a self-validation checklist before reporting completion

**Subagent — `/rayden-compose`:**

For full-page screen builds (dashboards, landing pages, auth, settings, data tables), the skill can delegate to a specialized subagent:

```
/rayden-compose dashboard balanced https://figma.com/file/...
```

This runs in an isolated context with all supporting files pre-loaded.

---

## What's Included

```
skills/
├── rayden-code/
│   ├── SKILL.md              # Vibe coding skill definition
│   └── RAYDEN_RULES.md       # Full component API (34 components), design patterns,
│                              # tokens, anti-patterns, accessibility rules, checklist
└── rayden-use/
    ├── SKILL.md              # Figma design skill definition
    ├── rayden-compose/
    │   └── SKILL.md          # Subagent for full-page Figma screen builds
    └── supporting/
        ├── tokens.md         # Resolved token values (colors, spacing, radius, shadows, typography)
        ├── craft-rules.md    # Typography, radius, spacing, color craft rules + QA checklist
        ├── anti-patterns.md  # Banned AI-generated design patterns with alternatives
        └── screen-patterns.md # Pre-built layout shells for 5 screen types
```

---

## Design System

Built on the [Rayna UI](https://www.raynaui.com/) design system. Both skills enforce these rules:

- **Only documented components and props** — no hallucinated APIs
- **Token-only colors** — `bg-primary-500` / `#EB5017`, never arbitrary hex values
- **4px spacing grid** — all spacing uses token values (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- **Concentric border radius** — inner elements one step smaller than container
- **One primary action per section** — secondary actions use outlined or text variants
- **No gradient text** — headings use `grey-900`, emphasis uses `primary-600`
- **No colored containers** — cards are always `bg-white`, page backgrounds are `grey-50`
- **Content width always constrained** — `max-w-7xl` for pages, `max-w-sm`–`max-w-2xl` for forms
- **Consistent elevation** — shadow OR border per section, never both heavy

---

## Troubleshooting

### Vibe Coding (`/rayden-code`)

| Problem | Solution |
|---------|----------|
| Components not rendering | Make sure `@raydenui/ui/styles.css` is imported in your app entry point |
| "Component doesn't exist" in output | The skill only uses documented components — check if what you're asking for is in the 34-component list above |
| Colors look wrong | Ensure the Rayden CSS is loaded. Use Tailwind token classes, not hex values |
| Layout not responsive | Check your HTML has `<meta name="viewport" content="width=device-width, initial-scale=1">` |
| Skill not loading | Run `claude --plugin-dir ./rayden-ui-design-skill` to verify, or check that the plugin is installed |

### Figma Design (`/rayden-use`)

| Problem | Solution |
|---------|----------|
| "Font not found" error | The skill falls back to Roboto — load Inter in your Figma file for best results |
| Figma permission denied | Verify your seat is Dev or Full (not Viewer) and the file isn't view-only |
| Components don't combine as variants | All components must share the same parent frame for `combineAsVariants` |
| MCP not connected | Check Figma MCP is enabled in Claude Code's tool settings. Run `mcp__claude_ai_Figma__whoami` to verify |
| Colors look wrong | The skill uses resolved hex values from tokens.md — double-check against the token reference |

---

## License

MIT
