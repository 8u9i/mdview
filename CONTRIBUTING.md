# Contributing to MDView

Thank you for your interest in MDView. This document explains how to set up a development environment, run the test suite, and submit changes.

## Code of conduct

Be respectful. Assume good faith. Disagree on ideas, not on people.

## Development setup

### Prerequisites

- **Node.js 18+** and **npm**.
- **Rust 1.77+** with the `stable` toolchain. Install via [rustup](https://rustup.rs/).
- **Windows 10 or 11** with WebView2 (preinstalled on Win11; on Win10 install the [Evergreen runtime](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Tauri CLI 2.x** (installed automatically as a dev dependency).

### First run

```bash
git clone https://github.com/8u9i/mdview.git
cd mdview
npm install
npm run dev          # opens the Tauri window with HMR
```

The first build pulls and compiles Tauri + plugins (~2 minutes), then launches the dev window.

### Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Tauri dev window with hot reload. |
| `npm run dev:web` | Start only the frontend dev server (no Tauri window). |
| `npm run build` | Production build → MSI + NSIS installers in `src-tauri/target/release/bundle/`. |
| `npm run build:web` | Bundle the frontend to `dist/` only. |
| `npm run test:web` | Frontend smoke test (marked, DOMPurify, highlight.js). |
| `npm run icons` | Regenerate the app icon set. |

Backend tests are run via `cargo test` from `src-tauri/`.

### Project layout

```
.
├── index.html              App shell
├── src/
│   ├── main.js             Renderer (markdown, outline, drag/drop, zoom, IPC)
│   ├── sample.js           Inlined sample markdown (for the empty-state "Open sample")
│   └── styles.css          Design tokens + reader typography
├── scripts/
│   ├── dev-server.mjs      esbuild watcher + static server for `tauri dev`
│   ├── build-static.mjs    Production bundler
│   ├── gen-icons.mjs       Generates the icon set
│   ├── test-bundle.mjs     Frontend smoke test
│   └── test-runtime.mjs    Frontend runtime test (jsdom)
├── docs/                   Design audits, AGENTS notes
├── examples/
│   └── sample.md           Sample markdown used by tests + the empty-state button
├── register-file-association.reg   Optional .reg file for portable file association
├── LICENSE                 MIT
├── CHANGELOG.md
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    ├── capabilities/default.json
    ├── icons/              Generated PNG + ICO
    ├── src/
    │   ├── main.rs
    │   └── lib.rs          Tauri commands + plugins
    └── tests/
        ├── read_markdown.rs       Integration test for the read path
        └── file_association.rs    argv-extraction test for the file-association flow
```

## Running the tests

```bash
# Frontend smoke (no Tauri required)
npm run test:web

# Frontend runtime (uses jsdom to execute the actual bundled JS)
node scripts/test-runtime.mjs

# Backend integration tests
cd src-tauri && cargo test
```

The CI workflow (`.github/workflows/ci.yml`) runs all three.

## Pull request process

1. **Fork the repo** and create a branch from `main` (`git checkout -b fix/your-change`).
2. **Make your change.** Keep the diff focused. Match the surrounding code style:
   - JavaScript: ES modules, `const` by default, no semicolons optional but be consistent with the file.
   - Rust: 2021 edition, `cargo fmt` and `cargo clippy` clean.
   - CSS: design tokens via custom properties; avoid one-off hex codes.
3. **Run the tests** locally: `npm run test:web && node scripts/test-runtime.mjs && cd src-tauri && cargo test`.
4. **Update the changelog** if your change is user-visible.
5. **Open a pull request.** Describe what changed and why. Reference any related issue.

## Style guide

### Frontend

- Prefer system fonts and OKLCH colors over hardcoded RGB.
- Don't introduce a UI framework. The frontend is intentionally vanilla ES modules.
- New dependencies must be justified in the PR — every KB matters for a 3.6 MB binary.
- Sanitize any HTML rendered into the page (DOMPurify is already wired up).

### Backend

- New Tauri commands go in `lib.rs`. Keep `main.rs` thin.
- File I/O errors should be `Result<T, String>` with a human-readable message.
- All commands must be registered in `invoke_handler!`.

## Reporting issues

- **Bugs**: open an issue with reproduction steps, expected vs. actual, and OS / MDView version.
- **Security**: see `SECURITY.md`.

## License

By contributing, you agree that your contributions will be licensed under the MIT License. See `LICENSE`.
