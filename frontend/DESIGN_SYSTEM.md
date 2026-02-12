# MigrationBox V5.0 — Design System

**Version**: 5.0.0  
**Last Updated**: February 12, 2026  
**Scope**: Desktop SaaS + iPhone Companion  
**Library**: shadcn/ui + Tailwind CSS + Custom Components

---

## 1. Design Principles

1. **Clarity over cleverness** — Complex migrations need simple interfaces. Every screen answers "what is happening?" and "what do I do next?"
2. **Progressive disclosure** — Show summary first, let users drill into detail. Do not overwhelm with 100+ variables on first view.
3. **Real-time confidence** — Live status indicators for migrations, agents, and I2I generation. Users should never wonder "is it still running?"
4. **Professional trust** — Enterprise customers need to trust this tool with production infrastructure. Clean, authoritative design. No playful aesthetics.
5. **Dark mode first** — Engineers work late. Dark mode is the default, light mode available.

---

## 2. Color System

### Brand Colors

| Name | Hex | Tailwind | Usage |
|------|-----|---------|-------|
| Primary | #2563EB | blue-600 | Primary actions, links, focus states |
| Primary Hover | #1D4ED8 | blue-700 | Hover states |
| Secondary | #7C3AED | violet-600 | AI/ML features, Extended Thinking |
| Accent | #059669 | emerald-600 | Success states, positive indicators |
| Warning | #D97706 | amber-600 | Warnings, medium risk |
| Danger | #DC2626 | red-600 | Errors, high risk, destructive actions |

### Semantic Colors (Dark Mode Default)

| Purpose | Background | Text | Border |
|---------|-----------|------|--------|
| Page Background | zinc-950 | — | — |
| Card Background | zinc-900 | — | zinc-800 |
| Input Background | zinc-800 | zinc-100 | zinc-700 |
| Sidebar | zinc-900 | zinc-300 | zinc-800 |
| Primary Text | — | zinc-100 | — |
| Secondary Text | — | zinc-400 | — |
| Muted Text | — | zinc-500 | — |
| Success | emerald-950 | emerald-400 | emerald-800 |
| Warning | amber-950 | amber-400 | amber-800 |
| Error | red-950 | red-400 | red-800 |
| Info | blue-950 | blue-400 | blue-800 |

### Agent Colors (Fixed, both modes)

| Agent | Color | Hex |
|-------|-------|-----|
| Discovery Agent | cyan-500 | #06B6D4 |
| Assessment Agent | violet-500 | #8B5CF6 |
| IaC Generation Agent | blue-500 | #3B82F6 |
| Validation Agent | emerald-500 | #10B981 |
| Optimization Agent | amber-500 | #F59E0B |
| Orchestration Agent | rose-500 | #F43F5E |

### Cloud Provider Colors

| Provider | Color | Usage |
|----------|-------|-------|
| AWS | #FF9900 | AWS resource badges, charts |
| Azure | #0078D4 | Azure resource badges, charts |
| GCP | #4285F4 | GCP resource badges, charts |

---

## 3. Typography

### Font Stack

Primary (UI text): Inter, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif

Monospace (Code, Terraform, IR schemas): JetBrains Mono, Fira Code, SF Mono, Cascadia Code, monospace

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 36px / 2.25rem | 700 | 1.2 | Page titles |
| H1 | 30px / 1.875rem | 700 | 1.3 | Section headers |
| H2 | 24px / 1.5rem | 600 | 1.35 | Card titles |
| H3 | 20px / 1.25rem | 600 | 1.4 | Subsection headers |
| H4 | 16px / 1rem | 600 | 1.5 | Minor headers |
| Body | 14px / 0.875rem | 400 | 1.5 | Default text |
| Body Small | 13px / 0.8125rem | 400 | 1.5 | Secondary info |
| Caption | 12px / 0.75rem | 400 | 1.4 | Labels, timestamps |
| Mono Body | 13px / 0.8125rem | 400 | 1.6 | Code blocks, Terraform |
| Mono Small | 11px / 0.6875rem | 400 | 1.5 | Inline code |

---

## 4. Spacing and Layout

### Spacing Scale (Tailwind defaults)

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Inline padding, icon gaps |
| space-2 | 8px | Tight padding, badge padding |
| space-3 | 12px | Input padding, small gaps |
| space-4 | 16px | Card padding, section gaps |
| space-6 | 24px | Large section gaps |
| space-8 | 32px | Page section dividers |
| space-12 | 48px | Major layout spacing |

### Layout Grid

- Sidebar: 256px fixed width (collapsible to 64px icons-only)
- Main Content: Fluid, max-width 1440px, centered
- Card Grid: CSS Grid, repeat(auto-fill, minmax(320px, 1fr))
- Form Max Width: 640px
- Table Max Width: Full container

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| rounded-sm | 4px | Badges, tags |
| rounded | 6px | Inputs, small cards |
| rounded-md | 8px | Cards, dropdowns |
| rounded-lg | 12px | Modals, large cards |
| rounded-full | 50% | Avatars, status dots |

---

## 5. Component Library

### Status Indicators

- Online / Active / Success: emerald-500, pulse animation
- Warning / Degraded: amber-500
- Error / Failed: red-500, pulse animation
- Offline / Idle: zinc-500
- In Progress: blue-500, spin animation

### Risk Badge

| Level | Color | Label |
|-------|-------|-------|
| Critical | red-600 bg, red-100 text | CRITICAL |
| High | amber-600 bg, amber-100 text | HIGH |
| Medium | yellow-500 bg, yellow-900 text | MEDIUM |
| Low | emerald-600 bg, emerald-100 text | LOW |
| None | zinc-600 bg, zinc-100 text | NONE |

### Cloud Badge

| Provider | Style |
|----------|-------|
| AWS | Orange border, AWS icon, #FF9900 |
| Azure | Blue border, Azure icon, #0078D4 |
| GCP | Blue border, GCP icon, #4285F4 |
| Multi-cloud | Gradient border (orange to blue) |

### Buttons

| Variant | Usage | Style |
|---------|-------|-------|
| Primary | Main actions (Create, Apply, Save) | blue-600 bg, white text |
| Secondary | Alternative actions | zinc-800 bg, zinc-100 text |
| Destructive | Rollback, Delete | red-600 bg, white text |
| Ghost | Tertiary actions, links | Transparent, blue-600 text |
| Outline | Filter toggles, secondary | zinc-700 border, zinc-300 text |

### Form Inputs

- Height: 40px (h-10)
- Border: 1px zinc-700 (dark) / zinc-300 (light)
- Focus: 2px blue-500 ring
- Error: red-500 border + error message below
- Disabled: 50% opacity, not-allowed cursor

---

## 6. Icons

### Icon Library: Lucide React

Consistent 24px icons from Lucide. Custom icons only for MigrationBox logo, agent type icons (6 agents), and cloud provider logos.

### Icon Categories

| Category | Icons |
|----------|-------|
| Navigation | LayoutDashboard, Search, Settings, Users |
| Actions | Plus, Play, Pause, RotateCcw (rollback), Check, X |
| Status | CheckCircle, AlertTriangle, XCircle, Loader2 (spinning) |
| Agents | Bot, Scan, FileCode, Shield, DollarSign, Workflow |
| Infrastructure | Server, Database, Globe, Lock, Cloud |
| I2I Pipeline | Wand2 (generate), ShieldCheck (policy), Hammer (build), RefreshCw (reconcile) |

---

## 7. Motion and Animation

### Principles
- Subtle, purposeful animations (not decorative)
- Duration: 150ms for micro (hover), 300ms for transitions, 500ms for page
- Easing: ease-out for enter, ease-in for exit

### Standard Animations

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Fade in | 200ms | ease-out | Cards appearing, modals |
| Slide in | 300ms | ease-out | Sidebar, panels |
| Scale up | 150ms | ease-out | Dropdown menus |
| Pulse | 2s loop | ease-in-out | Active status dots |
| Spin | 1s loop | linear | Loading indicators |
| Progress | 300ms | ease-out | Progress bar updates |

When prefers-reduced-motion: reduce is active, all animations are instant (0ms) except loading spinners.

---

## 8. Data Visualization

### Chart Colors (Ordered)

1. blue-500 (#3B82F6) - Primary series
2. violet-500 (#8B5CF6) - Secondary series
3. emerald-500 (#10B981) - Tertiary series
4. amber-500 (#F59E0B) - Fourth series
5. rose-500 (#F43F5E) - Fifth series
6. cyan-500 (#06B6D4) - Sixth series

### Chart Guidelines

- Always include labels and legends
- Use Recharts for standard charts (line, bar, area, pie)
- Use D3.js for custom visualizations (heatmaps, treemaps, Sankey)
- Use react-force-graph for Neo4j dependency graphs
- Dark backgrounds with light grid lines (zinc-800 grid)
- Tooltips on hover with precise values
- Export: PNG screenshot button on all charts

---

## 9. Mobile Design (iPhone Companion)

### iOS Design Alignment
- Follows Apple Human Interface Guidelines where applicable
- Native-feeling navigation (stack-based, swipe-back)
- Safe area insets respected
- Dynamic Type support (system font scaling)
- Haptic feedback on key actions (approval, voice start/stop)

### Mobile Typography

| Name | Size | Usage |
|------|------|-------|
| Title | 28pt | Screen titles |
| Headline | 22pt | Section headers |
| Body | 17pt | Default text |
| Subhead | 15pt | Secondary text |
| Caption | 13pt | Labels, timestamps |

### Voice UI Components

- Voice Button: 64x64pt, center bottom, pulsating ring when recording
- Transcript Bubble: Rounded, left-aligned (user), right-aligned (Claude response)
- Waveform: Real-time audio visualization during recording
- Confidence Badge: Small pill showing ASR confidence percentage

### Notification Design
- Push notification: Title + body + deep-link action
- In-app notification: Toast (top of screen, auto-dismiss 5s)
- Approval notification: Persistent banner until acted on

---

## 10. Theming

### Theme Toggle
- System preference auto-detect on first visit
- Manual toggle in header (Sun/Moon icon)
- Preference persisted to localStorage
- Smooth transition (200ms on background-color, color)

### Dark Mode (Default)
- Background: zinc-950
- Cards: zinc-900
- Borders: zinc-800
- Text: zinc-100 / zinc-400

### Light Mode
- Background: white
- Cards: zinc-50
- Borders: zinc-200
- Text: zinc-900 / zinc-600

---

*Last Updated: February 12, 2026*  
*Implements: ARCHITECTURE.md V5.0 Sections 13-14*
