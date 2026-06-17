# Checkup Report — MDView

// PROJECT: MDView
// MODE: checkup
// DATE: 2026-06-17
// REGISTER: product (markdown viewer instrument)

---

## Overall

**Score: 47 / 60**

Verdict: HEALTHY-WITH-WATCHES. The surface is a real, working product: native window, dark theme tuned for reading, primary action obvious, keyboard path complete, focus rings present. Three watches remain: the empty state leans center-stacked without committed composition, the brand "M" mark is a generic tile, and there is no visible loading state between file-pick and render.

---

## TL;DR

MDView looks like a chosen instrument, not a template. The dark whisper palette with a single teal accent resists the SaaS dark-mode reflex. The reader is tuned correctly — 72ch measure, 1.7 line-height, restrained scale. The main risks are: (1) empty state is a centered text block, which the smell detector flags as center-stack reflex; (2) no loading state during the brief IPC round-trip; (3) the M logo is a rounded-square letter tile, which has AI-tell energy. All three are easy fixes.

---

## Heuristic Scores

| # | Vital             | Score | Status | Finding |
|---|-------------------|------:|--------|---------|
| 1 | Intentionality    |  8/10 | Healthy | Whisper palette + single teal accent is a real decision, not a Tailwind preset. Title bar structure (brand | file-meta | actions) is a deliberate 3-column grid. |
| 2 | Readability       |  9/10 | Healthy | 72ch measure, 1.7 line-height, ink-1/ink-2 contrast exceeds 7:1, code blocks have their own surface. |
| 3 | Usability         |  8/10 | Healthy  | Open button is the only primary action, dialog filters to .md/.markdown, drag-drop is wired twice (DOM + Tauri webview event). |
| 4 | Responsiveness    |  6/10 | Watch   | Reader column shrinks at 900px, but outline has no mobile treatment, and the titlebar's 3-column grid can wrap awkwardly below 700px. |
| 5 | Speed             |  8/10 | Healthy  | 163 KB JS bundle, no network requests at runtime, opens files directly from disk. No layout shift observed. |
| 6 | Accessibility     |  8/10 | Healthy  | Focus-visible rings on all buttons, ARIA labels on icon buttons, aria-live toast, scroll-spy is throttled with rAF, prefers-reduced-motion honored. |

---

## Cognitive Load / Risk

Level: LOW.

- PASS: One primary action on screen at rest. Drop zone only appears on dragenter. Toast auto-dismisses.
- WATCH: Loading is invisible — between picking a file and rendering, the user gets no feedback. Add a 120ms fade-in or spinner.
- FAIL: None.

Next modes: `/design smell` (verify against the 10-odor catalog), `/design surface` (harden loading/empty/error states).

---

## What's Working

- **Reading measure**: 72ch at 16px is the right zone for prose. Code blocks escape that to 0.9em on a darker surface — clear visual separation.
- **Single accent**: teal is used only for the primary button, the active outline item, the brand mark, and inline code. That's 60-30-10 done correctly.
- **System stack**: Segoe UI Variable on Windows 11 is a real choice, not a fallback. Avoids the Inter reflex.
- **Scroll-spy**: outline updates via rAF, not on every scroll event. Smooth, jank-free.
- **Keyboard**: Ctrl+O, Ctrl+B, Ctrl+=, Ctrl+-, Ctrl+0 are all wired with preventDefault.
- **Drag-drop fallback chain**: Tauri webview event → DOM dragover → FileReader text fallback.

---

## Priority Issues

### P0 — None.

### P1 — Add a visible loading state
The file-pick → read_markdown IPC round-trip is fast but not instant. A user clicking "Open" sees the button react but the reader stay empty for 80-200ms. Add a brief fade-in on the rendered content, or pulse the file-meta line.

FIX: Wrap the `elContent.innerHTML = clean` in a `requestAnimationFrame` and toggle a `.loading` class on `.prose` with a 200ms ease-out fade-in. Alternatively, show a thin progress bar across the top of the reader.

### P1 — Empty state composition
The empty state is a centered text block — the smell catalog's "center stack" reflex. The brief is "open a markdown file," which is an Operate pattern, not a Decide pattern. The empty state should look like the work, not a welcome screen.

FIX: Replace the giant "MD" mark with a more functional composition. Try a 2-column layout: instructions on the left, a "Recent files" or "Recent sample" affordance on the right. Or, if you want to keep it minimal, just a single line of copy + the primary action, no hero.

### P2 — M logo mark
The "M" in a rounded teal tile is the generic "letter in a square" pattern. It works, but it does not commit. A more deliberate mark would be a stack of three lines (representing a markdown document outline) in the brand color.

FIX: Replace the inner `M` glyph with a 3-line stack: `┃` `┃` `┃` rendered as a thin SVG or as `▌` characters. Or keep the M but tighten the visual — drop the rounded square, place the M in a sharper container.

### P2 — Mobile layout
The outline sidebar has no mobile treatment. At < 700px, the titlebar's 3-column grid also risks overlapping.

FIX: Below 800px, force the outline closed by default and make the "Outline" button the only way to summon it. Reduce the titlebar's `gap` and let `file-meta` ellipsis-shrink first.

### P2 — No error affordance in the reader on failure
If `read_markdown` throws, the toast appears but the reader shows the previous content (or the empty state) with no indication that the requested file failed.

FIX: On error, replace the reader content with an inline error block that names the file and the reason, plus a "Try again" button. Keep the toast for transient feedback.

---

## Composition Vital Sign

The work pattern is **Learn** (read a markdown document) crossed with **Operate** (open, zoom, navigate). The current composition serves both: the titlebar is a stable Operate strip, the reader is a generous Learn surface, the outline is a Learn aid. The shape matches the work.

One small drift: the empty state reads more like a **Decide** pitch (centered "Open to begin" hero) than an **Operate** instruction. That's the P1 issue above.

---

## Prompt Fidelity Vital Sign

- Name: MDView — used as given, in the title bar, the brand mark, and the install metadata.
- Category: markdown viewer — visible via the syntax-highlighted code blocks, the file-meta line, the outline sidebar.
- User: someone who reads markdown on Windows 11. Pressed by long documents, wants speed.
- Job: open a file, read it, navigate. All three are achievable without instructions.
- Artifact: a markdown document. Honored by the 72ch measure, the prose styles, the outline.
- Evidence: opening the file in < 1 second is the proof. Drag-drop reinforces it.
- Drift to refuse: the SaaS dark-mode "everything in a card" reflex. Resisted — no cards, no modals, no marketing hero.

Verdict: prompt fidelity is strong.

---

## How to Proceed

Run `/design smell` to verify against the 10-odor catalog, then apply the P1 fixes in this report. The product is shippable as-is; the fixes are for becoming memorable.
