// Dev server for `tauri dev`:
// 1. Bundles src/main.js with esbuild on startup
// 2. Serves dist/ over http://127.0.0.1:1420
// 3. Rebuilds automatically when src/* changes

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build, context } from "esbuild";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DIST = join(ROOT, "dist");
const PORT = 1420;
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".mjs":  "text/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
  ".map":  "application/json; charset=utf-8",
};

const ctx = await context({
  entryPoints: [join(ROOT, "src", "main.js")],
  bundle: true,
  format: "esm",
  target: ["es2022"],
  sourcemap: true,
  outdir: DIST,
  outbase: DIST,
  logLevel: "info",
});

await ctx.rebuild();
console.log(`Bundled frontend into ${DIST}`);
await ctx.watch();
console.log("Watching src/ for changes…");

// Copy index.html and styles.css into dist/ on startup
const { copyFile, mkdir } = await import("node:fs/promises");
await mkdir(DIST, { recursive: true });
await copyFile(join(ROOT, "index.html"), join(DIST, "index.html"));
await copyFile(join(ROOT, "src", "styles.css"), join(DIST, "styles.css"));

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (urlPath === "/") urlPath = "/index.html";
    let abs = normalize(join(DIST, urlPath));
    let st;
    try { st = await stat(abs); } catch {
      // fallback: serve index.html
      abs = join(DIST, "index.html");
    }
    if (st && st.isDirectory()) abs = join(abs, "index.html");
    const data = await readFile(abs);
    const type = MIME[extname(abs).toLowerCase()] || "application/octet-stream";
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "no-store");
    res.end(data);
  } catch (e) {
    res.statusCode = 500;
    res.end(`Server error: ${e.message}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`MDView dev server: http://${HOST}:${PORT}`);
});
