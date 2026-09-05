# DESIGN.md — Kandypack

A plain-text design system for AI coding agents (Antigravity, Claude Code, Cursor, etc).
Drop this file in the project root and instruct the agent: *"Follow DESIGN.md for all UI."*

---

## 1. Visual Theme & Philosophy

Kandypack is a **light, premium, motion-rich logistics product** — the feeling of a modern
SaaS/consumer tech launch page (Apple / Linear / Stripe), not a legacy enterprise dashboard.

- **Mood**: airy, confident, calm — lots of whitespace, soft green light, glass floating over gradients
- **Metaphor**: cargo moving smoothly and predictably — motion should feel *fluid and continuous*,
  never jumpy or mechanical
- **Anti-pattern to avoid**: flat corporate blue-and-white logistics templates, boxy tables-everywhere
  admin-panel look, hard drop shadows, sharp corners
- Theme is **light mode only** — do not generate a dark mode variant unless explicitly asked

---

## 2. Color Palette & Roles

Define as CSS variables / Tailwind theme extension. Never hardcode hex values in components.

| Token | Value (approx) | Role |
|---|---|---|
| `--bg-base` | `#F5FAF7` | Page background — near-white, faint green tint |
| `--bg-base-alt` | `#EEF7F1` | Alternating section background |
| `--surface-glass` | `rgba(255,255,255,0.55)` | Glass panel fill (use with backdrop-blur) |
| `--surface-glass-border` | `rgba(255,255,255,0.35)` | Glass panel 1px border |
| `--green-50` … `--green-900` | scale around `#16A34A` | Primary brand green — full 10-step scale |
| `--green-600` | `#16A34A` | Primary actions, links, active states |
| `--green-400` | `#4ADE80` | Hover/lighter accents |
| `--mint-glow` | `#6EE7B4` | Gradient-blob glow color behind glass, low opacity |
| `--text-heading` | `#0F1A14` | Headings — near-black, not pure black |
| `--text-body` | `#4B5A52` | Body copy |
| `--text-muted` | `#7C8C84` | Captions, metadata, timestamps |
| `--status-pending` | `#F59E0B` (amber) | Order status: pending |
| `--status-transit` | `#3B82F6` (blue) | Order status: in transit / rail |
| `--status-delivered` | `#16A34A` (green) | Order status: delivered |
| `--status-issue` | `#EF4444` (red) | Order status: exception/damage |

**Rule**: green is the *only* saturated accent color. Status colors are the only exception
(used exclusively for order-status pills/badges, never for decoration).

---

## 3. Typography Rules

- **Typeface**: one geometric sans across the whole product — Inter, Geist, or Satoshi.
  Do not mix a serif or a second display face in.
- **Scale**: fluid/clamp-based sizing, not fixed breakpoint jumps.
  - Hero H1: `clamp(2.75rem, 6vw, 5rem)`, weight 600–700, tight letter-spacing (-0.02em)
  - Section H2: `clamp(1.75rem, 3.5vw, 2.75rem)`, weight 600
  - Body: `1rem–1.125rem`, weight 400, line-height 1.6–1.7
  - Captions/labels: `0.8125rem`, weight 500, uppercase + letter-spacing 0.05em (sparingly)
- Headings use `--text-heading`; body uses `--text-body`; never body-weight text in a heading slot.
- Numbers in stat counters get tabular-nums so digits don't jitter during count-up animation.

---

## 4. Component Styling

### Glass panel (`.glass`) — the signature primitive, used for nav, cards, modals, forms
```css
background: var(--surface-glass);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid var(--surface-glass-border);
border-radius: 20px; /* 24px for large cards, 16px for small chips */
box-shadow: 0 8px 32px rgba(22, 163, 74, 0.08), 0 1px 2px rgba(0,0,0,0.04);
```
Glass panels are **always** placed over a soft, blurred green/mint gradient-blob background —
never over flat white. The blob(s) drift slowly (Framer Motion, ~20–40s loop, low amplitude).

### Buttons
- Primary: solid `--green-600` fill, white text, `border-radius: 14px`, hover = lift `-2px` +
  scale `1.02` + soft green glow shadow, transition `200ms ease-out`
- Secondary: glass style (see above) with `--green-600` text
- Never flat/no-radius buttons; never a button without a hover state

### Cards
- Base: `.glass`, padding `24–32px`, icon in a small rounded `--green-50` chip at top
- Hover: lift `-4px`, shadow deepens, border tints slightly greener — spring physics, not linear

### Status pills (order tracking)
- Pill shape (`border-radius: 999px`), colored dot + label, background = status color at 10% opacity,
  text = status color at full saturation

### Forms
- Inputs sit inside glass containers, `border-radius: 12px`, focus state = `--green-600` ring
  (`box-shadow: 0 0 0 3px rgba(22,163,74,0.25)`), never a harsh blue browser-default focus ring

---

## 5. Layout Principles

- **Grid**: 12-column, max content width `1280px`, generous side gutters (min `24px` mobile, `64px+` desktop)
- **Vertical rhythm**: sections separated by `96–160px` of whitespace, alternating `--bg-base` /
  `--bg-base-alt` bands to create gentle visual separation without hard borders
- **Asymmetry welcome**: hero and feature sections may break the grid slightly for visual interest
  (offset images, overlapping glass cards) — but forms/tables stay strictly grid-aligned
- Sticky/fixed nav is transparent at scroll-top, becomes `.glass` once scrolled past ~50px

---

## 6. Depth & Elevation

Three elevation levels only — do not invent more:

1. **Flat** — page background, no shadow
2. **Glass** — floating panels (nav, cards, modals) — blur + soft green-tinted shadow (see §4)
3. **Lifted** — the *active/hovered* state of a Glass element — shadow deepens, element moves
   toward viewer (`translateY(-2px to -4px)`, shadow blur increases ~1.5x)

Never stack more than one glass layer directly on top of another without a visible gap/gradient
between them — it reads as muddy, not deep.

---

## 7. Signature Interaction — Scroll-Scrubbed Photo Sequence Hero

A unique motion pattern for this product (Apple-style scroll-scrubbing):

- Hero section pins via `position: sticky` while a `<canvas>` renders a sequence of photos,
  one frame per scroll-progress increment (GSAP ScrollTrigger, `scrub: 1`)
- Headline text fades in/out at specific frame ranges, overlaid on the canvas
- Once the sequence completes, the page releases and resumes normal scroll — no jump cut
- `prefers-reduced-motion` and mobile/low-memory devices get a static first-frame hero instead
  (see full technical spec already agreed for this build — do not simplify silently, ask first)

This is the *only* place full-bleed photography appears without a glass overlay. Everywhere
else, imagery sits behind or beside glass, never as an unfiltered full-bleed background.

---

## 8. Do's and Don'ts

**Do:**
- Use glass + soft shadow for every floating surface
- Animate section entrances with scroll-triggered fade+slide, staggered per child
- Keep green as the single hero accent color; let whitespace do the rest of the work
- Use spring-based easing for hover/press states (not linear `ease`)
- Keep copy short and confident — one clear idea per section

**Don't:**
- Don't use pure white (`#FFFFFF`) as a background — always the tinted `--bg-base`
- Don't use sharp 0–4px border-radius anywhere — minimum `12px`
- Don't add a second accent color "for variety" — status colors are the only exception, and only
  inside status pills
- Don't animate more than one large element simultaneously on page load (stagger, don't swarm)
- Don't use hard, dark drop-shadows (`rgba(0,0,0,0.5)`+) — shadows are soft and green-tinted

---

## 9. Responsive Behavior

- **Mobile (< 768px)**: scroll-sequence hero replaced with static hero image + fade-in;
  glass blur radius reduced (12px instead of 20px) for GPU performance; stat/feature grids
  collapse to single column; nav collapses to a glass slide-down sheet
- **Tablet (768–1024px)**: 2-column feature grids; sequence hero may run at reduced frame count
- **Desktop (1024px+)**: full experience as specified above
- Touch targets minimum `44x44px` regardless of breakpoint

---

## 10. Agent Prompt Guide

When asked to build a new page or component for Kandypack, an agent should:

1. Default every floating surface to `.glass` (§4) unless explicitly told otherwise
2. Pull all colors from the token table in §2 — never invent a new hex value
3. Apply scroll-reveal motion (§1, §8) to any new section added to a long-scroll page
4. Ask before deviating from the single-accent-green rule or the light-mode-only rule
5. Match existing component patterns (buttons, cards, pills, forms) rather than inventing new
   visual variants for the same purpose
6. For status displays (order tracking, etc.), always use the status-color pills defined in §2 —
   never a generic gray badge
