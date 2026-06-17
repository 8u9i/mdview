// Builds the static frontend into ./dist/ for `tauri build`.
// - Bundles src/main.js with esbuild (resolves bare imports from node_modules)
// - Copies index.html and src/styles.css
// - Emits a single JS file at dist/bundle.js

import { cp, mkdir, rm } from "node:fs/promises";
import { build } from "esbuild";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DIST = join(ROOT, "dist");

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

await build({
  entryPoints: [join(ROOT, "src", "main.js")],
  bundle: true,
  format: "esm",
  target: ["es2022"],
  minify: true,
  sourcemap: false,
  outfile: join(DIST, "bundle.js"),
  logLevel: "info",
});

await cp(join(ROOT, "index.html"), join(DIST, "index.html"));
await cp(join(ROOT, "src", "styles.css"), join(DIST, "styles.css"));
console.log("Static assets bundled to dist/");
// Sanity: ensure the HTML's stylesheet ref resolves under dist/
import { readFile } from "node:fs/promises";
const html = await readFile(join(DIST, "index.html"), "utf8");
const cssRef = html.match(/href="(\.\/styles\.css)"/);
if (!cssRef) {
  console.warn("Warning: dist/index.html does not reference ./styles.css; bundled app will render unstyled.");
}
