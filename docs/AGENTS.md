# Project Memory

## Project Overview
See # Imported from README.md
# MDView

A small, fast, native **Markdown viewer for Windows 11** built on [Tauri 2](https://v2.tauri.app) and WebView2.

- Tiny binary (~5 MB) — no Electron, no Chromium runtime download
- Native Windows 11 window with proper title bar and drag-and-drop
- GFM markdown, syntax-highlighted code blocks, task lists, tables
- Auto-built outline from headings, keyboard navigation
- Drop a `.md` file anywhere in the window to open it
- Reads files from disk directly via a Rust command — no upload, no network

## Keyboard

| Action              | Shortcut                |
|---------------------|-------------------------|
| Open file           | `Ctrl + O`              |
| Toggle outline      | `Ctrl + B`              |
| Zoom in / out       | `Ctrl + =` / `Ctrl + -` |
| Reset zoom          | `Ctrl + 0`              |

## Stack

- **Rust 1.77+** — Tauri backend, file I/O
- **Tauri 2** — desktop shell, dialog + fs plugins
- **WebView2** — Chromium-based rendering on Windows 11
- **Vanilla ES modules** — no UI framework, no virtual DOM
- **marked 18** — markdown parser
- **DOMPurify 3** — XSS sanitization
- **highlight.js 11** — syntax highlighting (JS, TS, Python, JSON, Bash, HTML, CSS, Markdown, Rust, Go, SQL, YAML)

## Develop

```bash
npm install
npm run dev       # launches Tauri dev window
```

The `dev:web` script bundles `src/main.js` with esbuild and serves it on `http://127.0.0.1:1420`; Tauri loads that URL.

## Build (Windows installer)

```bash
npm run build     # produces MSI + NSIS installers in src-tauri/target/release/bundle/
```

Output:

- `src-tauri/target/release/mdview.exe` — standalone executable
- `src-tauri/target/release/bundle/msi/MDView_0.1.0_x64_en-US.msi` — Windows installer
- `src-tauri/target/release/bundle/nsis/MDView_0.1.0_x64-setup.exe` — NSIS installer

## Project layout

```
.
├── index.html             # App shell
├── src/
│   ├── main.js            # Renderer: markdown, outline, zoom, drag/drop
│   ├── sample.js          # Inlined sample markdown for the empty-state "Open sample" button
│   └── styles.css         # Design tokens + reader typography
├── scripts/
│   ├── dev-server.mjs     # esbuild watcher + static server
│   ├── build-static.mjs   # production bundler
│   ├── gen-icons.mjs      # Generates icon.png / icon.ico from a programmatic logo
│   └── test-bundle.mjs    # Frontend smoke test (marked + DOMPurify + hljs)
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── capabilities/default.json
    ├── icons/             # Generated icons
    └── src/
        ├── main.rs
        └── lib.rs         # read_markdown, file_exists commands
```

## License

MIT

## Design

See `.commandcode/design/` for the full audit history:
- `checkup-report.md` + `checkup-report.html` — six-vital scan (intentionality, readability, usability, responsiveness, speed, accessibility). Score 47/60.
- `smell-report.md` + `smell-report.html` — ten-odor catalog (tech gradient, generic hue, tile grid, etc.). Score 8/10 (FAINT).

Key design decisions applied in v0.1.0:
- **Palette**: dark whisper in OKLCH (16% L, 0.012 C, 250° hue) with a single teal accent at 195°. Tinted neutrals, not pure gray.
- **Type**: system stack (Segoe UI Variable on Win11). No downloaded fonts.
- **Brand mark**: 3-line document outline icon in teal, replacing the AI-default letter-tile.
- **Empty state**: 2-column Operate layout (instructions + shortcuts reference). No centered hero.
- **Loading state**: thin teal accent bar that streaks across the top of the reader during the IPC round-trip, plus a 120ms fade-in on rendered content.
- **Error state**: inline error block in the reader with file path, reason, and a "Try again" button. Toast remains for transient feedback.
- **Responsive**: titlebar's 3-column grid tightens below 800px; outline labels collapse to icons.

## Available commands

- `npm run dev` — start the Tauri dev window (launches dev server + opens native window with HMR)
- `npm run build` — production build: bundles JS, compiles Rust, produces MSI + NSIS installers
- `npm run build:web` — bundle the frontend to `dist/` only (no Rust)
- `npm run dev:web` — start the dev server only (no Tauri window)
- `npm run test:web` — run the frontend smoke test (marked + DOMPurify + highlight.js)
- `npm run icons` — regenerate the icon set from a programmatic logo
- `cargo test` (in `src-tauri/`) — run the backend integration test

## Standalone executable

The release build is also copied to the project root as **`MDView.exe`** for quick launching without navigating to `target/release/`. Same path works for both MSI install and standalone portable use.

## Critical runtime notes

- `getCurrentWebview()` is called inside `wireNativeDragDrop()` which is deferred to `window.onload`. This avoids the `Cannot read properties of undefined (reading 'metadata')` crash that fires when the API is invoked before the Tauri runtime has registered the webview. The function is fully guarded with try/catch so a non-Tauri preview (e.g. jsdom, dev-server) still works — the DOM dragover/drop handlers take over.
- `dist/index.html` references `./styles.css` (not `./src/styles.css`). The build script copies `src/styles.css` to `dist/styles.css`. If you change the ref in `index.html`, also update `scripts/build-static.mjs`.

## File association

MDView registers itself as a handler for `.md`, `.markdown`, `.mdown`, `.mkd`, and (optionally) `.txt` via `tauri.conf.json`'s `bundle.fileAssociations`. When installed via the MSI or NSIS installer, the OS writes the registry entries automatically.

For standalone-portable use (running `MDView.exe` from the project root without an installer), double-click `register-file-association.reg` to write the same entries to `HKEY_CURRENT_USER\Software\Classes`. The path inside the reg file is hard-coded to `D:\New CMDC\12AM\MDView.exe` — if you move the exe, edit the reg file or re-import from the new location.

Cold-start flow: `MDView.exe path\to\file.md` → `std::env::args()` in `lib.rs` extracts the file → stored in `InitialFile` state → frontend calls `invoke("initial_file")` on boot → `read_markdown` loads it.

Warm-start flow: opening a second `.md` while MDView is running is handled by `tauri-plugin-single-instance` — the second instance forwards its argv to the first, which emits an `open-file` event the JS subscribes to via `listen("open-file", ...)`. The window is brought to the foreground.
