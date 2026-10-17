<!-- Hallmark · macrostructure: Workbench · H8 hero knobs: frame=minimal-hairline, tilt=0°, shots=1
 * nav=N1b canonical SaaS · footer=Ft5 statement over Ft3 index columns
 * theme: studied-DNA (source: url https://www.agno.com/) · paper #ffffff / band #111113 · accent #ff4017
 * display: Inter Variable 500 · body: Inter Variable · label: DM Mono (buttons/eyebrows) + Geist Mono (code/meta)
 * studied: yes · DNA-source: url https://www.agno.com/ (public reference for the user's own brand) · extracted 2026-10-17
-->

# Design — Settle

Locked design system, seeded from a studied DNA (agno.com). Future runs read this
file first; pages defer to it. Amend intentionally — the file is the rule.

## System
- Genre · modern-minimal (developer tool)
- Macrostructure · Workbench — hero leads with a full app mock; the page is a guided tour (steps → split feature articles → ownership grid → proof marquee → live-demo preview). The ownership grid leans Bento.
- Theme · studied-DNA (source: https://www.agno.com/)
- Axes · white paper / Inter-500 grotesque display with tight tracking / signal-orange #FF4017 accent / hairline rules / 12px mono micro-labels · dark = per-band `.dark` opt-in (never an OS theme)

## Provenance
Extracted from https://www.agno.com/ as a public reference for the user's brand on
2026-10-17. The DNA is structural; specific tokens may need to be regenerated to match
the user's brand identity rather than the source's. Attestation (b) — carried from the
requesting turn ("I need to build it like this"). Tokens are exact (extracted from
source CSS). Fonts are exact (source font declarations — Inter, Geist Mono and DM Mono
are all open-licensed builds). Rhythm is inferred from layout values (132px section
rhythm, 1728px frame), not from a visual pass — the known URL-mode blind spot.

## Tokens (canonical)
```css
/* Light — the page floor is white in every OS setting. */
:root, .light {
  --background: #ffffff; --foreground: #18181b;
  --primary: #18181b; --primary-foreground: #ffffff;
  --secondary: #f4f4f5; --secondary-2: #e0e0e0; --accent: #ffffff; --card: #ffffff;
  --muted: #71717a; --border: #18181b1a; --border-selected: #18181b80;
  --input: #18181b1a; --ring: #18181b;
  --destructive: #e53935; --destructive-foreground: #ffffff; --positive: #22c55e;
  --brand: #ff4017; --brand-foreground: #ffffff; --brand-accent: #eb6e52;
  --brand-secondary: #b357dd; --brand-secondary-accent: #b39bbe;
  --brand-tertiary: #46ad8c; --brand-tertiary-accent: #afc4b3;
  --brand-quaternary: #21cef6; --brand-quaternary-accent: #a7cad2;
}
/* Dark — applied per band (a section or the footer carries `.dark`), not by OS preference. */
.dark {
  --background: #111113; --foreground: #fafafa;
  --primary: #fafafa; --primary-foreground: #18181b;
  --secondary: #27272a; --secondary-2: #3f3f46; --accent: #18181b; --card: #111113;
  --muted: #a1a1aa; --border: #fafafa26; --border-selected: #fafafa99;
  --input: #fafafa26; --ring: #d8d8dc;
  --brand-quaternary: #39d4f7; /* every other brand/status value unchanged from light */
}
/* Type roles (load via next/font — all three faces are open-licensed) */
:root {
  --font-family-body: "Inter Variable", sans-serif;     /* body + headings */
  --font-family-heading: "Inter Variable", sans-serif;
  --font-family-mono: "Geist Mono Variable", monospace; /* code, meta chips */
  --font-family-dm-mono: "DM Mono", monospace;          /* buttons, eyebrows, stat labels */
}
/* Scale — H1 clamp(2.5rem,1.5rem+2.5vw,3.75rem) · H2 clamp(2.125rem,1.425rem+1.75vw,3rem) · H3 clamp(1.25rem,1.05rem+0.5vw,1.5rem);
   all weight 500, leading 1.2, tracking -0.02em. Body 1rem/1.5 · lede 1.125rem/1.5 muted · small 0.875rem/1.5 · label 12px/16px mono uppercase 0.02em */
/* Shape — --spacing-section: 8.25rem (adjacent sections open at 3rem) · --container-frame: 108rem · gutters 16→24→32→96→128px
   Radius sm 8 / md 10 / lg 12 / xl 16 / 3xl 24 · shadow-sm 0 1px 3px #0000001a, 0 1px 2px -1px #0000001a · hairline = 1px var(--border) */
```

## CTA voice
- Primary · solid #FF4017, white label · 36px tall, 16px x-padding · radius 10px · shadow-sm · DM Mono 12px uppercase, tracking .02em
- Secondary · zinc-100 fill, ink label · identical metrics
- Outline · 1px hairline, transparent, ink label · identical metrics
- Micro chip · hairline, radius 8px, 8px/4px padding, Geist Mono 12px uppercase — the "Try live demo" size
- Links · ink → ink/70 on hover · muted for footer and legal
- Feedback · hover ≈ +5% ink overlay · active scale .96 · focus-visible ring 1px (brand/50 or ink/50) · transition color/background/border/transform/opacity .2s ease-out

## Motion stance
- CSS-only; no motion library. Entrances: `rule-in` (fade + 40px slide + .985 scale, .56s cubic-bezier(.16,1,.3,1)) and `terminal-line-in` (.22s ease-out, 2px rise). Sweeps: `tile-shine` 6s, `status-pulse` 2s, `board-out` .13s exit.
- Marquees · translate 0→−50% linear infinite; logos 110s, proof cards 70s; pause on hover; edges fade into the background.
- Hover · chips fade to .8 opacity · preview panels lift −8px (.3s ease-out) · nav links ink/70.
- Reduced motion · every animation `none`, nothing left hidden; transitions collapse to the immediate state.

## Component recipes
- Nav · sticky, 68px tall, hairline bottom, frosts on scroll; wordmark left; 16px ink links (hover ink/70) with chevron dropdown triggers; Login (secondary) + Sign Up (brand) right.
- Hero · ~600px text column (H1 + lede + two CTAs) beside a full app mock; oversized brand-glyph watermark clipped inside the frame; generous vertical space.
- Cards and articles · `--card` fill + 1px hairline + radius 10px; "double-frame" feature articles: outer border, p-2, two halves at calc((100% − .5rem)/2); dark bands carry their own panels with grain beneath.
- Sections · alternating full-bleed bands divided by hairlines; content locked to the 108rem frame with the 16→128px gutter scale; heading + lede in a ≤620px column above the content.
- Proof · logo marquee in bordered 152px cells at 60% opacity; quote card on `--accent`, min-height 308px, H3-size quote, staggered lines.
- Footer · dark band + grain + brand-glow ellipse (#FF4017 at 10%, blurred 135px, half-dipped below the fold); statement headline at H1 scale; two CTAs; four index columns (14px links, muted 14px headings); legal row.
- Gate chain (home trust strip) · full-bleed ink band `#111113` with a self-scoped `.dark`; four stations strung on a 1px `foreground/20` rail — horizontal at ≥sm, vertical ledger rows on mobile; node = 28px solid brand-family disc in system order (primary → quaternary) with the ink glyph knocked out and a 2px `#111113` ring; figures near-white, weight 500, tabular; labels Geist Mono 12px uppercase, 0.16em tracked; one ambient motion — `verify-ping` sweeping the chain in order (6.4s cycle, 0.55s stagger per station; the global reduced-motion rule settles it).
- Icons · Lucide, 16px, stroke 1.5–2, muted or ink. No emoji.

## Notes (do NOT carry over)
- The ornament layer — glyph watermark, brand glow, film grain, marquee strips — is a homepage device. Keep it out of working app surfaces (dashboards, checkout, audit views); at most one such moment per page.
- No JS motion library; port the CSS primitives instead of adding Framer/GSAP.
- Don't reproduce the source's bespoke illustration hacks (px-scaling mocks, inline-styled demo visuals); rebuild visuals as plain components.
- Assets, logos, copy and imagery are never copied — structure only; replace with own/demo content.
- 12px mono uppercase is for labels, buttons and meta only — never body copy.
- #FF4017 is the source's signature accent. Keep it for the demo; repoint `--brand*` before any real-brand use.

## Exports
This repo runs Tailwind v4 + shadcn CSS variables, and the names above are
shadcn-compatible (`--background`, `--foreground`, `--primary`, `--secondary`,
`--muted`, `--border`, `--ring`, `--destructive`, …). They port directly into
`app/globals.css` (`:root`, `.dark`, `@theme inline`). Ask to *"extend design.md
with Tailwind exports"* and the mapping gets appended.
