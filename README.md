# MDView

A small, fast, native **Markdown viewer for Windows 11** — ~3.6 MB, no Electron, no bundled Chromium. Built on [Tauri 2](https://v2.tauri.app) and WebView2.

[![CI](https://github.com/8u9i/mdview/actions/workflows/ci.yml/badge.svg)](https://github.com/8u9i/mdview/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.x-blueviolet)](https://v2.tauri.app)
[![Rust 1.77+](https://img.shields.io/badge/rust-1.77%2B-orange)](https://www.rust-lang.org)
[![Node 18+](https://img.shields.io/badge/node-18%2B-339933)](https://nodejs.org)

## Features

| | |
|---|---|
| **Tiny footprint** | ~3.6 MB standalone binary. No Electron, no bundled Chromium. |
| **GFM markdown** | Tables, task lists, fenced code, strikethrough, autolinks. |
| **Syntax highlighting** | 14+ languages — JS, TS, Python, Rust, Go, SQL, YAML, and more. |
| **Auto outline** | Heading-based table of contents with scroll-spy and click-to-scroll. |
| **XSS-safe** | All rendered output sanitized via DOMPurify. |
| **File association** | `.md`, `.markdown`, `.mdown`, `.mkd`, `.txt` — registered by the installer; `.reg` file included for portable use. |
| **Single instance** | Opening a second file focuses the existing window and loads the new file. |
| **Keyboard-first** | `Ctrl+O` open, `Ctrl+B` toggle outline, `Ctrl+=` / `Ctrl+-` / `Ctrl+0` zoom. |
| **Accessible** | Focus rings, ARIA labels, `aria-live` toast, `prefers-reduced-motion` honored. |
| **Zero network** | All I/O is local. No telemetry, no phone-home. |

## Quick start

```bash
git clone https://github.com/8u9i/mdview.git
cd mdview
npm install
npm run dev
```

Opens a Tauri window with hot reload. See [Development](#development) for more options.

## Screenshots

| Empty state | Rendered sample |
|---|---|
| ![Empty](docs/design/screenshot-empty-state.png) | ![Rendered](docs/design/screenshot-rendered.png) |

## Installation

### From the installer (recommended)

1. Download the latest release from [GitHub Releases](https://github.com/8u9i/mdview/releases).
2. Run `MDView_0.1.0_x64-setup.exe` (NSIS) or `MDView_0.1.0_x64_en-US.msi` (Windows Installer).
3. Right-click any `.md` file → **Open with** → MDView.

### Portable (single executable)

1. Download `mdview.exe` from [GitHub Releases](https://github.com/8u9i/mdview/releases).
2. Place it anywhere on your `PATH`.
3. *(Optional)* Import `register-file-association.reg` to wire up `.md` file association.
4. Launch: `mdview.exe path\to\file.md` or double-click any `.md` after importing the reg.

### From source

```bash
git clone https://github.com/8u9i/mdview.git
cd mdview
npm install
npm run build
```

Output installers land in `src-tauri/target/release/bundle/`.

## Usage

| Action | Shortcut |
|---|---|
| Open file | `Ctrl + O` |
| Toggle outline | `Ctrl + B` |
| Zoom in / out | `Ctrl + =` / `Ctrl + -` |
| Reset zoom | `Ctrl + 0` |

You can also drag and drop a `.md` file anywhere into the window, or use **Right-click → Open with → MDView** from Explorer.

## Development

```bash
npm install          # install Node + Rust dependencies
npm run dev          # Tauri window with HMR
```

Frontend only (no Tauri window):

```bash
npm run dev:web      # http://127.0.0.1:1420
```

### Testing

```bash
npm run test:web                    # marked + DOMPurify + hljs (12 checks)
node scripts/test-runtime.mjs       # bundle executes without runtime crash (9 checks)
cd src-tauri && cargo test          # backend integration tests (3)
```

All three run in CI on every push — see `.github/workflows/ci.yml`.

### Building installers

```bash
npm run build
```

| File | Size |
|---|---|
| `src-tauri/target/release/mdview.exe` | ~3.6 MB |
| `src-tauri/target/release/bundle/msi/MDView_0.1.0_x64_en-US.msi` | ~1.8 MB |
| `src-tauri/target/release/bundle/nsis/MDView_0.1.0_x64-setup.exe` | ~1.3 MB |

## Tech stack

| Layer | Choice |
|---|---|
| Shell | [Tauri 2](https://v2.tauri.app) |
| Frontend | Vanilla ES modules (~167 KB JS) |
| Bundler | [esbuild](https://esbuild.github.io) |
| Markdown | [marked](https://marked.js.org) 18 |
| Sanitizer | [DOMPurify](https://github.com/cure53/DOMPurify) 3 |
| Highlighting | [highlight.js](https://highlightjs.org) 11 |
| Single instance | [tauri-plugin-single-instance](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/single-instance) 2 |

Design audit history is available in [`docs/design/`](docs/design/).

## Project layout

```
.
├── index.html              App shell
├── src/
│   ├── main.js             Renderer: markdown, outline, zoom, drag/drop, IPC
│   ├── sample.js           Inlined sample markdown for the empty state
│   └── styles.css          Design tokens + reader typography
├── scripts/
│   ├── dev-server.mjs      esbuild watcher + static server
│   ├── build-static.mjs    Production bundler
│   ├── gen-icons.mjs       Icon set generator
│   ├── test-bundle.mjs     Frontend smoke test
│   └── test-runtime.mjs    Frontend runtime test (jsdom)
├── docs/                   Design audits
├── examples/sample.md      Sample markdown used by tests + empty-state button
├── register-file-association.reg   Portable .reg for file association
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE                 MIT
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    ├── capabilities/default.json
    ├── icons/
    ├── src/
    │   ├── main.rs
    │   └── lib.rs          Tauri commands + plugins
    └── tests/              Backend integration tests
```

## Troubleshooting

**"App didn't start" / blank window** — WebView2 runtime is missing. Install it from [Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/) (preinstalled on Windows 11).

**Right-click → "Open with" doesn't show MDView** — Run the installer (registers association automatically) or import `register-file-association.reg`. If you moved `mdview.exe`, edit the reg file's path before importing.

**Drag-and-drop doesn't work** — Make sure the file is on a local drive. UNC paths and some network shares are blocked by Tauri by default.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome.

## Security

See [SECURITY.md](SECURITY.md). Report vulnerabilities via private advisory — not as a public issue.

## License

[MIT](LICENSE)
