---
name: Prism
colors:
  primary: "#0B1222"
  secondary: "#151D2E"
  tertiary: "#1E293B"
  surface: "#FFFFFF"
  accent: "#22D3EE"
  accent-warm: "#F59E0B"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#EF4444"
  info: "#3B82F6"
  muted: "#64748B"
  border: "#1E293B"
  border-light: "#E2E8F0"
  graph-api: "#3B82F6"
  graph-service: "#10B981"
  graph-database: "#8B5CF6"
  graph-queue: "#F59E0B"
  graph-cache: "#EF6C00"
  graph-repo: "#64748B"
  graph-secret: "#EC4899"
  graph-monitor: "#6366F1"
  graph-deploy: "#22C55E"
typography:
  display:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 600
    letterSpacing: "-0.03em"
    lineHeight: 1.1
  h1:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    letterSpacing: "-0.025em"
  h2:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    letterSpacing: "-0.015em"
  h3:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    color: "{colors.muted}"
  mono:
    fontFamily: "JetBrains Mono, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
shadows:
  card: "0 1px 3px rgba(0, 0, 0, 0.08)"
  elevated: "0 4px 12px rgba(0, 0, 0, 0.12)"
  glow-accent: "0 0 20px rgba(34, 211, 238, 0.15)"
components:
  sidebar:
    width: "240px"
    collapsedWidth: "56px"
    background: "{colors.primary}"
    borderRight: "1px solid {colors.border}"
  topbar:
    height: "52px"
    background: "{colors.surface}"
    borderBottom: "1px solid {colors.border-light}"
  card:
    background: "{colors.surface}"
    border: "1px solid {colors.border-light}"
    borderRadius: "{rounded.lg}"
    padding: "{spacing.lg}"
  metric-card:
    background: "{colors.tertiary}"
    borderRadius: "{rounded.md}"
    padding: "14px 16px"
  graph-node:
    radius: 16
    selectedRadius: 22
    strokeWidth: 2
  chat-panel:
    width: "320px"
    background: "{colors.surface}"
    borderLeft: "1px solid {colors.border-light}"
  button-primary:
    background: "{colors.accent}"
    color: "{colors.primary}"
    borderRadius: "{rounded.md}"
    fontWeight: 500
    fontSize: "0.8125rem"
  button-ghost:
    background: "transparent"
    color: "{colors.muted}"
    borderRadius: "{rounded.md}"
  badge:
    borderRadius: "{rounded.full}"
    fontSize: "0.6875rem"
    padding: "2px 8px"
  input:
    background: "{colors.secondary}"
    border: "1px solid {colors.border}"
    borderRadius: "{rounded.md}"
    fontSize: "0.8125rem"
    height: "36px"
---

## Overview

Prism is a platform intelligence product for enterprises. The interface must communicate precision, trust, and authority — a CTO should look at this and think "this is the Bloomberg Terminal for my infrastructure." The aesthetic is dark command-center for navigation, clean white for data, with cyan accents that suggest real-time connectivity. Every pixel must earn its place.

## Design principles

1. **Data density without clutter.** Show maximum information with minimum visual noise. Use hierarchy, not decoration, to organize.
2. **Graph-first thinking.** The topology graph is the hero of the product. Every view eventually connects back to the graph.
3. **Precision over polish.** Monospace for data values, tight spacing, exact alignment. Nothing should feel approximate.
4. **Persona-aware surfaces.** The same data appears differently for developers (technical detail), executives (summary metrics), and auditors (compliance evidence).
5. **Zero ambiguity.** Status indicators, health scores, and compliance states use a strict color vocabulary. Green means good. Amber means attention. Red means action required. No exceptions.

## Color system

The palette is bifurcated: dark navy surfaces for structural chrome (sidebar, navigation), clean white surfaces for content and data. Cyan is the signature accent — it communicates connectivity, intelligence, and real-time awareness.

### Dark surfaces (sidebar, navigation, overlays)
- `primary` (#0B1222) — deepest background, sidebar
- `secondary` (#151D2E) — elevated dark surfaces, dropdown menus
- `tertiary` (#1E293B) — borders on dark surfaces, subtle dividers

### Light surfaces (content area, cards, panels)
- `surface` (#FFFFFF) — card backgrounds, content area
- Use `border-light` (#E2E8F0) for borders on light surfaces
- Never use dark borders on light surfaces or light borders on dark surfaces

### Accent
- `accent` (#22D3EE) — primary interactive color, selected states, active indicators, the Prism "glow"
- Use accent sparingly. It should draw the eye to exactly one thing per viewport.
- Never use accent for large background fills. It is for text, icons, borders, and small indicators.

### Graph entity colors
Each entity type has a fixed color across the entire product. These colors are sacred — they create instant recognition:
- API = Blue (#3B82F6) — stability, structure
- Service = Green (#10B981) — alive, running
- Database = Purple (#8B5CF6) — storage, depth
- Queue = Amber (#F59E0B) — flowing, in-motion
- Cache = Orange (#EF6C00) — fast, temporary
- Repository = Gray (#64748B) — source, foundational
- Secret = Pink (#EC4899) — sensitive, protected
- Monitor = Indigo (#6366F1) — watching, observing
- Deploy = Green (#22C55E) — action, change

## Typography

Use Instrument Sans as the primary typeface — it is geometric, precise, and modern without being cold. Load from Google Fonts. JetBrains Mono for all data values, entity names, Cypher queries, and code. Monospace signals "this is exact data, not prose."

### Rules
- Display headings use -0.03em letter-spacing for tightness
- Body text never exceeds 0.875rem (14px) in the application UI
- All numeric values (metrics, counts, scores) render in JetBrains Mono
- Entity names (service names, API names) always render in monospace
- Labels and captions use 0.75rem (12px) in muted color
- Never use font sizes below 11px

## Layout

### Application shell
The shell is a fixed three-column layout:
1. **Left sidebar** (240px, collapsible to 56px) — dark background, module navigation
2. **Main content** (fluid) — white background, scrollable
3. **Right panel** (320px, toggleable) — AI copilot chat or detail panel

The topbar spans the full width above main content and right panel, but not over the sidebar.

### Sidebar
- Dark background (#0B1222)
- Prism logo at top with collapse toggle
- Tenant selector dropdown below logo
- 13 module navigation items with icons
- Active module: cyan text on subtle cyan/10 background
- Inactive module: muted text, no background
- Bottom section: platform connection summary
- Collapse to icon-only (56px) preserving tooltips

### Topology graph
- SVG with D3.js force-directed simulation
- White card container with 1px border
- Node circles: colored by entity type, sized by PageRank (connection count)
- Selected node: larger radius (22px), 2px accent stroke, connected edges highlighted
- Unrelated nodes: dim to 15% opacity when a node is selected
- Edge lines: 0.5px default, 1.5px when highlighted
- Pan + zoom with d3-zoom, bounded to prevent losing the graph
- Minimap in bottom-right corner for large graphs

### Metric cards
- Dark tertiary background (#1E293B) in dark mode, light gray in light mode
- Muted label (12px) above, large value (22px/500 weight) below
- Trend indicator below value: green arrow-up, red arrow-down
- Grid of 3-6 cards in a responsive auto-fit row
- No borders, no shadows — just the background fill creates the card

### Chat panel
- White background, full height
- Header: "Prism AI copilot" with green status dot and active model badge
- Messages: user right-aligned on blue-50 background, assistant left-aligned on gray-50
- Message text: 12px body, support markdown rendering
- Entity names in messages are clickable (navigate to entity)
- Input: pinned to bottom with send button
- Suggested queries: context-aware pills above input

## Interaction patterns

### Node selection
Click a graph node → node enlarges → connected edges brighten → unconnected elements dim → detail panel slides in from right (or populates the right panel if copilot is closed)

### Universal search
Cmd+K opens a command palette overlay (like Linear/Raycast). Type to search entities across all platforms. Results grouped by entity type with platform badges. Enter selects and navigates.

### Module transitions
No page transitions. Module switches swap the main content area instantly. The sidebar, topbar, and chat panel persist across module switches. This creates the feeling of a single, always-connected workspace.

## Component patterns

### Status indicators
- Synced/Healthy: 6px green circle (#10B981)
- Syncing/Warning: 6px amber circle (#F59E0B)
- Error/Critical: 6px red circle (#EF4444)
- Unknown/Offline: 6px gray circle (#64748B)
- Always use a circle, never a square or icon for status

### Badges and pills
- Platform badges: gray background, muted text, rounded-full
- Severity badges: colored background matching severity, dark text from same hue
- Count badges: small pill on nav items, muted background

### Tables
- No zebra striping. Use 0.5px bottom borders between rows.
- Header row: bold, muted color, uppercase 11px
- Sticky header on scroll
- Monospace for all data columns (IDs, names, counts, dates)

### Empty states
- Centered icon (32px, 30% opacity) + bold title + muted description
- Single call-to-action button below

## Don'ts

- Never use gradients, shadows, or glow effects (except the signature accent glow on the logo)
- Never use rounded corners larger than 16px
- Never put prose inside the topology graph SVG — labels only
- Never use more than 2 font weights on a single card (400 + 500)
- Never use colored backgrounds for large content areas — white only
- Never hardcode colors — always reference design tokens
- Never use generic icons — use purpose-built SVG icons or Lucide
- Never show loading spinners longer than 200ms without a skeleton
- Never truncate entity names — they are sacred data. Scroll or wrap.
- Never use dropdown menus for fewer than 4 options — use segmented controls or pills
