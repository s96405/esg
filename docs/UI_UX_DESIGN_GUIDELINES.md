# UI/UX Design Guidelines

This project is an internal plant-care and watering control system. UI work must feel calm, consistent, operational, and easy to scan. Prefer the existing HTML/CSS structure and small scoped CSS changes over new frameworks or broad rewrites.

## Required Workflow

Before changing any UI, read this file and inspect the affected HTML/CSS. Keep changes aligned with the current `ui.css` token system unless the user explicitly asks for a redesign.

Do not change business logic while making visual updates. If a visual issue requires markup changes, keep them minimal and explain why.

## Visual Direction

- Use a quiet internal-tool style: clear hierarchy, readable controls, compact information density, and restrained decoration.
- Prefer low-saturation botanical and utility colors over neon, cyberpunk, or generic SaaS gradients.
- Make the interface look maintained and intentional, not generated from a template.
- Avoid excessive animation. Use short transitions only for hover, focus, drawer, or modal state changes.

## Color System

Use the shared tokens in `ui.css` first:

- Background: `--aw-bg`, `--aw-bg-2`
- Surface: `--aw-surface`, `--aw-surface-2`, `--aw-surface-3`
- Text: `--aw-text`, `--aw-text-strong`, `--aw-muted`, `--aw-muted-2`
- Border: `--aw-border`, `--aw-border-strong`
- Primary: `--aw-primary`, `--aw-primary-2`, `--aw-primary-3`
- Semantic: `--aw-success`, `--aw-warning`, `--aw-danger`, `--aw-info`
- Domain accent: `--aw-soil`

Guidance:

- Primary actions should use `--aw-primary` or `--aw-primary-3`.
- Success, warning, and danger states must use semantic tokens, not arbitrary bright colors.
- Borders should usually be visible but soft, using `--aw-border`.
- Avoid large full-page dark blue backgrounds unless the entire system is intentionally redesigned.
- Avoid introducing new blues, purples, pinks, or gradients unless they map to a documented token.

## Typography

Font family:

```css
font-family: "Microsoft JhengHei", "Noto Sans TC", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Recommended sizes:

- Page title: `22px` to `24px`, weight `900` to `950`
- Section title: `16px` to `18px`, weight `800` to `900`
- Body text: `14px` to `15px`, weight `400` to `600`
- Table text: `13px` to `14px`
- Hints and metadata: `11px` to `12px`

Rules:

- Keep `letter-spacing: 0`.
- Do not scale font size with viewport width.
- Avoid hero-sized typography inside dashboards, panels, tables, sidebars, and modals.
- Text must not overflow buttons, cards, table cells, or form fields.

## Spacing

Use an 8px spacing rhythm:

- Tiny gaps: `4px`
- Small gaps: `8px`
- Component inner padding: `12px` to `16px`
- Panel/card padding: `14px` to `18px`
- Section spacing: `20px` to `24px`
- Page horizontal padding: `16px` mobile, `22px` desktop

Rules:

- Keep dense operational screens compact but not cramped.
- Align controls and labels to a consistent grid.
- Avoid large decorative blank areas.
- Avoid nesting cards inside cards.

## Buttons

Base style:

- Height: at least `38px`
- Border radius: use `--aw-radius` or `--aw-radius-sm`
- Border: `1px solid var(--aw-border)`
- Font weight: `700` to `800`
- Hover: subtle border/background change; avoid dramatic glow.
- Disabled: reduce opacity and remove transform/shadow.

Button types:

- Primary: filled or softly tinted `--aw-primary`
- Secondary: neutral surface with border
- Danger: use `--aw-danger`, but keep the background restrained
- Toggle active: clear active state with semantic or primary token

Rules:

- Avoid pill buttons everywhere. Reserve full pills for badges, user chips, and compact status controls.
- Avoid blue-purple gradient primary buttons.
- Avoid hover effects that shift layout or make repeated controls jump.

## Tables

Tables are for scanning and comparison.

- Header background should be slightly different from body rows.
- Use `13px` to `14px` table text.
- Use soft row dividers with `--aw-border`.
- Align numbers and sensor values consistently.
- Preserve readable row height, usually `40px` to `48px`.
- Use semantic color sparingly for status, not entire rows unless critical.
- On mobile, allow horizontal scroll or convert to stacked rows only when necessary.

Avoid:

- Cardifying every row when a table is easier to scan.
- Heavy shadows around table containers.
- Center-aligning all text.

## Forms

Form controls:

- Height: `38px` to `42px`
- Radius: `--aw-radius-sm` or `--aw-radius`
- Border: `1px solid var(--aw-border)`
- Background: light neutral surface
- Focus: visible outline or border using `--aw-primary`

Labels:

- Place labels close to fields.
- Use `13px` to `14px`, weight `700` to `800`.
- Use muted helper text for constraints or examples.

Validation:

- Use semantic tokens for errors and warnings.
- Show errors near the field that caused them.
- Do not rely on color alone.

## Modals

Modal style:

- Use a simple overlay with moderate opacity.
- Modal panel radius should be `8px` or less unless existing component style requires otherwise.
- Header, body, and footer spacing should be predictable.
- Primary and cancel actions belong in the footer.
- Keep destructive actions visually distinct but not oversized.

Rules:

- Trap attention visually, not theatrically.
- Avoid large decorative illustrations or gradient headers.
- Avoid putting a card inside the modal panel unless it is a repeated item list.

## Dashboards And Cards

Dashboard screens should prioritize the user's job: monitoring plant status, water status, device connectivity, history, and actions.

Cards/panels:

- Use cards for distinct repeated items, KPI blocks, devices, or bounded editing surfaces.
- Keep radius at `8px` or less unless matching existing `--aw-radius`.
- Use soft borders first, shadows second.
- Keep KPI labels, values, units, and timestamps aligned.
- Maintain stable dimensions for KPI tiles and control blocks to prevent layout shift.

Avoid:

- Filling pages with decorative cards when a table or compact panel is clearer.
- Nested card stacks.
- Oversized KPI cards that hide useful operational controls.
- Card grids with inconsistent heights unless content requires it.

## RWD Rules

Breakpoints:

- Mobile: up to `560px`
- Tablet: `561px` to `900px`
- Desktop: `901px` and above

Rules:

- Mobile layout must avoid horizontal page overflow.
- Sidebars may collapse into drawers, but content width must remain stable.
- Buttons in toolbars may wrap, but should keep clear tap targets.
- Tables may scroll horizontally when preserving columns is more useful than stacking.
- Use CSS grid/flex with explicit min/max behavior for dashboards and KPI panels.
- Test at narrow mobile width before finishing UI work.

## Accessibility And Usability

- Preserve keyboard focus visibility.
- Do not remove native form semantics.
- Keep contrast readable for body text, muted text, borders, and disabled states.
- Status labels should include text, not only color.
- Click/tap targets should be at least `38px` high where practical.

## Prohibited AI-Generated Look

Do not introduce:

- Dominant blue-purple, cyan-pink, or rainbow gradients.
- Neon glow shadows around common cards and buttons.
- Glassmorphism everywhere.
- Huge hero sections for internal tools.
- Decorative orb, blob, bokeh, or abstract SVG backgrounds.
- Random emoji/icon mixes that do not match the system.
- Card-heavy layouts where tables or simple panels are better.
- Multiple unrelated border radii, shadows, and color palettes on the same screen.
- Marketing landing-page composition for operational screens.
- Text explaining UI features inside the app instead of making controls clear.

## Before Finishing A UI Change

Check:

- The change uses existing tokens or adds a clearly justified token.
- The screen still matches the rest of the system.
- No text overlaps, overflows, or becomes unreadable on mobile.
- Buttons, tables, forms, modals, and cards follow this guide.
- No feature logic changed unless the user explicitly requested it.
