# AI Tech Lab UI Redesign

## Goal

Unify the AI application under an original dark technical-workstation design language that combines Linear-like restraint and hierarchy with VoltAgent-like emerald AI energy, without copying either brand.

The redesign must make the application feel like one coherent product while preserving all current routes, features, Chinese copy, and interaction behavior.

## Scope

### Phase 1

- Define the project design contract in `apps/ai/DESIGN.md`.
- Centralize design tokens and Ant Design theme configuration.
- Redesign the shared application shell in `MainLayout`.
- Redesign the application hub while preserving search, category filters, application status, and navigation.
- Apply the shared shell and foundational tokens to existing feature pages without rewriting their business logic.

### Out of Scope

- Route or API changes.
- Backend changes.
- New product features.
- Replacing existing icons with custom illustrations.
- Copying Linear or VoltAgent logos, proprietary fonts, or distinctive branded assets.
- A full rewrite of every feature page during the first implementation pass.

## Design Principles

1. **Quiet frame, expressive content.** Navigation and shared chrome stay restrained so application content remains primary.
2. **Hierarchy through surfaces.** Use stepped dark surfaces and hairline borders instead of glow, glassmorphism, or heavy shadows.
3. **Emerald is scarce.** Emerald identifies the brand, selected navigation, primary actions, focus, and live status. It is not a decorative fill.
4. **Dense but breathable.** The product should support information-heavy AI tools without feeling cramped.
5. **One product language.** Hub, skills, chat, knowledge, and data pages use the same spacing, typography, radius, and interaction states.
6. **Accessible by default.** Text contrast, visible focus, touch targets, reduced motion, and keyboard navigation are part of the visual system.

## Visual System

### Color Tokens

| Token | Value | Role |
| --- | --- | --- |
| `--ai-canvas` | `#07090D` | Root application background |
| `--ai-surface-1` | `#0D1117` | Sidebar, header, primary panels |
| `--ai-surface-2` | `#131922` | Cards and controls |
| `--ai-surface-3` | `#19212C` | Hovered and nested surfaces |
| `--ai-surface-4` | `#202A36` | Strong lifted state |
| `--ai-border` | `#232D39` | Default hairline border |
| `--ai-border-strong` | `#344150` | Hover and focused border |
| `--ai-text` | `#F3F6F8` | Primary text |
| `--ai-text-secondary` | `#AAB5C0` | Descriptions and metadata |
| `--ai-text-tertiary` | `#6F7C89` | Disabled and low-priority labels |
| `--ai-primary` | `#00C98D` | Brand, selected, primary action, focus |
| `--ai-primary-hover` | `#18D9A1` | Primary hover |
| `--ai-primary-muted` | `rgba(0, 201, 141, 0.12)` | Selected and subtle emphasis |
| `--ai-success` | `#35D07F` | Successful/live status |
| `--ai-warning` | `#E5B65C` | Warning status |
| `--ai-error` | `#F06B72` | Error and destructive state |

No atmospheric gradients are used in application chrome. Category colors may remain inside small semantic tags and data visualizations, but must not compete with the primary emerald.

### Typography

- UI family: `Inter`, `Plus Jakarta Sans`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, sans-serif.
- Technical family: `"JetBrains Mono"`, `"SFMono-Regular"`, Consolas, monospace.
- Page title: 24px, 650 weight, 1.25 line height, `-0.02em` tracking.
- Section title: 18px, 600 weight, 1.35 line height.
- Card title: 15px, 600 weight, 1.4 line height.
- Body: 14px, 400 weight, 1.55 line height.
- Secondary and navigation: 13px, 450–500 weight.
- Technical eyebrow and status: 11px, 500 weight, `0.08em` tracking.

Chinese text must remain readable at every level. Monospace is reserved for model names, provider names, statuses, IDs, and technical metadata.

### Spacing and Shape

- Base spacing unit: 4px.
- Standard scale: 4, 8, 12, 16, 20, 24, 32, 40, 48px.
- Control radius: 8px.
- Card and panel radius: 12px.
- Large feature panel radius: 16px.
- Pills are limited to filters, tags, and status indicators.
- Shared control height: 40px desktop, at least 44px on touch layouts.

### Depth and Motion

- Default surfaces use a 1px border and no shadow.
- Floating overlays may use `0 16px 48px rgba(0, 0, 0, 0.36)`.
- Hover transitions last 150ms; panel and route transitions last no more than 220ms.
- Motion changes opacity and small translations only. Cards do not tilt in 3D.
- Under `prefers-reduced-motion: reduce`, nonessential animation is disabled.

## Application Shell

### Header

- Fixed height: 56px.
- Background: `--ai-surface-1`.
- Bottom border: `--ai-border`.
- Brand block remains on the left with the text `AI Tech Lab`.
- The logo becomes a simple emerald-accented product mark using the existing icon library.
- `技能中心` and `体验中心` remain the primary tabs.
- Active tab uses primary text and a 2px emerald bottom indicator.
- Header chrome contains no gradient.

### Sidebar

- Width: 216px desktop.
- Background: `--ai-surface-1`.
- Right border: `--ai-border`.
- Group labels use technical eyebrow styling.
- Menu rows are 40px high with 8px radius and 8px horizontal inset.
- Selected menu uses `--ai-primary-muted`, primary text, and a narrow emerald indicator.
- Hover uses `--ai-surface-3`.
- At widths below 768px, the sidebar becomes an accessible drawer opened from the header.

### Content

- Background: `--ai-canvas`.
- Standard desktop padding: 28px.
- Maximum reading width is applied on form- and text-heavy pages; data and visualization pages may use full width.
- Existing page-managed scroll behavior remains intact.

## Application Hub

### Header Block

- Keep `AI TECH LAB / APPS`, `大模型应用体验中心`, the provider description, and live/total counts.
- Remove the particle canvas and decorative 3D depth.
- Use a restrained two-column header: title and description on the left, compact status summary on the right.

### Search and Filters

- Search uses a 40px surface-2 input with a search icon, visible focus ring, and responsive full-width behavior.
- Category filters remain compact pills.
- The active category uses primary-muted background, emerald text, and an emerald-tinted border.
- Filter buttons expose pressed state through `aria-pressed`.

### Application Cards

- Desktop: 3 columns.
- Tablet: 2 columns below 1100px.
- Mobile: 1 column below 700px.
- Cards use surface-2, a hairline border, 12px radius, and 20px padding.
- Card hover raises the border to border-strong and translates no more than 2px upward.
- Card hierarchy:
  1. icon and live/beta status;
  2. application title;
  3. concise Chinese description;
  4. technical tags;
  5. subtle launch affordance.
- Cards remain clickable and preserve their existing route destinations.
- Empty search results use a proper Ant Design empty state or existing icon component, never a decorative text symbol.

## Ant Design Integration

`ConfigProvider` is the single theme boundary. Its theme maps the project tokens to Ant Design aliases and component tokens:

- `colorPrimary`
- `colorBgBase`
- `colorBgContainer`
- `colorBgElevated`
- `colorBorder`
- `colorBorderSecondary`
- `colorText`
- `colorTextSecondary`
- `borderRadius`
- `controlHeight`
- component overrides for `Layout`, `Menu`, `Tabs`, `Button`, `Input`, `Card`, `Tag`, `Modal`, `Table`, and `Tooltip`.

Page-specific CSS consumes project tokens instead of introducing new hard-coded theme colors.

## Component Boundaries

- `src/theme/tokens.ts`: typed primitive and semantic token values.
- `src/theme/antdTheme.ts`: Ant Design `ThemeConfig` derived from project tokens.
- `src/main.tsx`: applies the shared theme through `ConfigProvider`.
- `src/layouts/MainLayout.tsx`: shell structure and navigation behavior only.
- `src/layouts/MainLayout.css`: responsive shell styling.
- `src/pages/AppHub.tsx`: hub data filtering and rendering behavior.
- `src/pages/AppHub.css`: hub layout, states, and responsive styling.
- `DESIGN.md`: human- and agent-readable design contract.

Business services, API calls, route configuration, and application data stay unchanged.

## Responsive Behavior

- `>= 1100px`: 216px sidebar and three-column hub grid.
- `768–1099px`: 200px sidebar and two-column hub grid.
- `< 768px`: sidebar drawer, compact header, content padding 16px.
- `< 700px`: one-column hub cards and full-width search.
- All interactive targets are at least 40px on desktop and 44px on touch layouts.
- No horizontal scrolling is introduced at 390px viewport width.

## Accessibility Requirements

- Primary and secondary text meet WCAG AA contrast against their intended surfaces.
- Keyboard focus is always visible with a 2px emerald outline and 2px offset.
- Icon-only controls include accessible names.
- Selected tabs and filters expose semantic state.
- The mobile drawer traps focus and returns focus to its trigger when closed.
- Reduced-motion preferences disable particle, tilt, and decorative entrance effects.
- Color is never the only indicator of live, selected, warning, or error state.

## Verification

### Automated

- Existing TypeScript build succeeds.
- Theme token tests verify the required semantic tokens and Ant Design mappings.
- Hub behavior tests verify category filtering, search filtering, empty state, and route activation.
- Layout tests verify active section and responsive navigation state where practical.

### Visual

Verify these viewports:

- Desktop: 1440 × 1024.
- Tablet: 1024 × 768.
- Mobile: 390 × 844.

At each viewport check:

- no overflow or clipped content;
- readable Chinese typography;
- correct active navigation;
- visible focus states;
- consistent surface and border hierarchy;
- hub cards use the expected column count;
- reduced-motion mode contains no particle or 3D card motion.

## Acceptance Criteria

- Shared shell and application hub visibly belong to the same design system.
- The global DeepSeek-blue theme and the hub's isolated teal/3D theme are replaced by the new token system.
- Existing routes, filters, search, and card navigation still work.
- No Linear or VoltAgent trademarked visual assets are included.
- No new runtime dependency is required solely for styling.
- `npm run build` passes.
- Automated UI tests pass.
- Desktop, tablet, and mobile visual checks pass with no critical accessibility issue.
