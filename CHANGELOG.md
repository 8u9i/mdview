# Changelog

All notable changes to MDView are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Nothing yet.

### Changed
- Nothing yet.

### Fixed
- Nothing yet.

## [0.1.0] — 2026-06-17

### Added
- Initial release.
- Native Windows 11 markdown viewer built on Tauri 2 + WebView2.
- GFM markdown rendering via `marked` 18.
- Syntax highlighting for 14 languages via `highlight.js` 11.
- XSS sanitization via `DOMPurify` 3.
- Auto-built outline sidebar with scroll-spy and keyboard navigation.
- Drag-and-drop file open (DOM + native Tauri webview event).
- File-association support: `.md`, `.markdown`, `.mdown`, `.mkd`, `.txt` registered via the MSI/NSIS installer; a portable `.reg` file ships for standalone use.
- Cold-start argv handling: `MDView.exe path\to\file.md` opens the file directly.
- Warm-start handoff via `tauri-plugin-single-instance`: opening a second file while MDView is running focuses the existing window and loads the new file.
- Keyboard shortcuts: `Ctrl+O` open, `Ctrl+B` toggle outline, `Ctrl+=`/`Ctrl+-`/`Ctrl+0` zoom.
- System-font typography (Segoe UI Variable on Win11), OKLCH-tuned dark theme, single teal accent.
- Loading bar during IPC, inline error state with retry, and an empty-state surface with sample document.
- Accessibility: focus-visible rings, ARIA labels on icon buttons, `aria-live` toast, scroll-spy throttled with `requestAnimationFrame`, `prefers-reduced-motion` respected.
- Standalone ~3.6 MB executable.

[Unreleased]: https://github.com/8u9i/mdview/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/8u9i/mdview/releases/tag/v0.1.0
