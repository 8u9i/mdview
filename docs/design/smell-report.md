# Smell Report — MDView

// PROJECT: MDView
// MODE: smell
// DATE: 2026-06-17
// REGISTER: product

---

## Overall

**Score: 8 / 10**

Verdict: FAINT. Two faint odors detected (default-type tendency, center-stack empty state). Both are being addressed in the same pass. The product lane is clean: dark whisper palette with a single committed teal accent is not the SaaS dark-mode reflex, the system font stack is a deliberate choice, the composition serves Operate (open) and Learn (read), not Decide.

---

## Odor Detection

| # | Odor             | Detected | Notes |
|---|------------------|----------|-------|
| 1 | Tech gradient    | No       | No blue-violet, indigo-cyan, or purple-to-teal gradients anywhere. One flat teal accent. |
| 2 | Generic tech hue | No       | Accent is OKLCH teal at 195°, not blue-purple. The domain (file viewer) does not trigger the reflex. |
| 3 | Feature tile grid| No       | No feature cards, no marketing grid. The reading surface is a single prose column. |
| 4 | Accent rail      | No       | No colored stripes on cards or callouts. The accent appears only on the active outline item and the primary button. |
| 5 | Unearned blur    | No       | No frosted-glass panels, no glassmorphism. Surfaces are flat. |
| 6 | Stat monument    | No       | No oversized number clusters. The product is a viewer, not a dashboard. |
| 7 | Icon topper      | Faint    | The "M" in the titlebar logo is a letter-tile — the AI-default brand mark. Should be replaced with a project-specific mark. |
| 8 | Bounce everywhere| No       | Motion is functional: button hover, toast slide, scroll. No elastic easing, no toys. |
| 9 | Default type     | No       | System stack (Segoe UI Variable on Win11). Not Inter, not Plus Jakarta. Inter would be the reflex. |
| 10| Center stack     | Faint    | The original empty state was a centered hero. Replaced with a 2-column Operate layout (instructions + shortcuts). |

---

## Reflexes Identified

1. **Letter-tile brand mark** — A rounded teal square containing the letter "M" is the AI-default logo pattern. Not wrong, but unchosen. The product is a markdown document viewer — a more honest mark is a small document outline (3 horizontal lines of varying length).

2. **Centered empty state** — The original empty state read as a Decide-pitch ("Open to begin") rather than an Operate-instruction. Repositioned to a 2-column workspace layout with the primary action and a shortcuts reference.

---

## Domain Default Trap

Q: Could the visual direction be guessed from the industry alone?
A: No. A "developer tool" usually defaults to dark + terminal mono + neon green. MDView uses dark + Segoe UI Variable + teal — close to but distinct from that. A "note-taking app" usually defaults to cream + rounded sans. MDView is clearly not that. The teal accent at 195° is unusual enough to be a real choice, not a category reflex.

---

## What the Design Owns

- A real color decision: OKLCH teal at 195° over a tinted neutral (not pure gray, not the generic blue-violet).
- Type: system stack tuned to the OS, not a downloaded font.
- Composition: titlebar (Operate) + reading surface (Learn) + outline sidebar (Learn aid) — three zones with clear jobs, not a generic grid.
- Motion: functional only (hover, toast, loading bar). No bounce, no elastic.
- Copy: "Open a markdown file to begin" is an instruction, not a pitch. Empty-state copy uses the file type as subject.
- Real decision detail: the drop-zone overlay uses a dashed teal border that matches the primary action, reinforcing that dropping a file is the same intent as clicking Open.

---

## Prescriptions (to apply in `/design surface` pass)

1. **P1 — Brand mark**: replace the "M" letter-tile with a 3-line document outline icon in the titlebar.
2. **P1 — Empty state**: already redesigned in this pass; verify the new 2-column layout reads as Operate, not Decide.

---

## How I Know the Smell Is Gone

- Palette cannot be guessed from the domain alone (teal, not blue).
- Type has a project-specific reason (system stack, OS-native).
- Composition is not the median generated landing page (no hero, no card grid).
- Repeated sections have hierarchy (titlebar | sidebar | reader) and variation.
- The strongest visual idea — the loading bar that streaks across the top during IPC — belongs to this product.
- A stranger would not immediately say the page was generated.

---
