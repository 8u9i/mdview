# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x   | yes       |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email `security@your-org.example` with:

- A description of the vulnerability and its impact.
- Reproduction steps (or a proof-of-concept).
- The commit hash or release version affected.

You should receive an acknowledgment within 3 business days. We aim to ship a fix within 30 days for critical issues.

## Scope

The following are in scope:

- The Rust backend (`src-tauri/src/`).
- The renderer (`src/`, `index.html`).
- Build configuration (`src-tauri/tauri.conf.json`, `src-tauri/capabilities/`).
- Dependency vulnerabilities (we audit via `cargo audit` and `npm audit` in CI).

## Out of scope

- Vulnerabilities in the upstream Tauri framework (please report to https://github.com/tauri-apps/tauri/security).
- Vulnerabilities in `marked`, `dompurify`, or `highlight.js` (report upstream).
- Issues requiring physical access to the user's machine.

## Hardening notes

- The renderer renders markdown as HTML and sanitizes via DOMPurify with the default profile (no script, no `onclick`, no `javascript:` URLs).
- File I/O is restricted to whatever path the user (or the OS, via file association) passes in. We do not crawl directories or read files speculatively.
- Tauri capabilities are minimal: `dialog:default`, `fs:allow-read-text-file`, `fs:allow-exists`, and event listen/emit. There is no `shell`, no `http`, no `os` access.
- The `tauri-plugin-single-instance` callback receives argv from the OS but only extracts a file path from it (the first argument that points at an existing file). It does not eval or execute anything from argv.
