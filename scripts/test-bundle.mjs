// Quick smoke test for the bundled frontend:
// 1. Imports the marked + DOMPurify + highlight.js stack via the bundle's source
// 2. Renders the sample.md markdown
// 3. Asserts key features render: headings, code blocks, tables, task lists, links
// 4. Verifies DOMPurify sanitization strips <script> from injected HTML

import { marked } from "marked";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import rust from "highlight.js/lib/languages/rust";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import go from "highlight.js/lib/languages/go";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";
import xml from "highlight.js/lib/languages/xml";
import typescript from "highlight.js/lib/languages/typescript";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

// Wire DOMPurify to a jsdom window (the renderer uses it via real DOM, so we mirror that here)
const dom = new JSDOM("");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const purify = DOMPurify(dom.window);

[ ["javascript", javascript], ["typescript", typescript], ["python", python],
  ["json", json], ["bash", bash], ["xml", xml], ["html", xml], ["css", css],
  ["markdown", markdown], ["md", markdown], ["rust", rust], ["go", go],
  ["sql", sql], ["yaml", yaml], ["yml", yaml] ].forEach(([n, l]) => hljs.registerLanguage(n, l));

const renderer = new marked.Renderer();
renderer.code = function (code, infostring) {
  if (typeof code === "object" && code !== null) { infostring = code.lang; code = code.text; }
  let lang = (infostring || "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (lang === "sh") lang = "bash";
  if (lang === "js") lang = "javascript";
  if (lang === "ts") lang = "typescript";
  if (lang === "py") lang = "python";
  if (lang === "rs") lang = "rust";
  let highlighted;
  if (lang && hljs.getLanguage(lang)) {
    highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  } else {
    highlighted = hljs.highlightAuto(code).value;
    lang = lang || "plaintext";
  }
  return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
};
marked.setOptions({ gfm: true, breaks: false, renderer });

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const sample = await readFile(join(ROOT, "examples", "sample.md"), "utf8");
const html = marked.parse(sample, { renderer });
const clean = purify.sanitize(html, { ADD_ATTR: ["id", "target", "rel"] });

// Assertions
assert.ok(clean.includes('<h1'), "should render h1");
assert.ok(clean.includes('<h2'), "should render h2");
assert.ok(clean.includes('<h3'), "should render h3");
assert.ok(clean.includes('<pre><code class="hljs language-javascript"'), "should highlight JS");
assert.ok(clean.includes('<pre><code class="hljs language-rust"'), "should highlight Rust");
assert.ok(clean.includes('<table'), "should render tables");
assert.ok(clean.includes('type="checkbox"'), "should render task lists");
assert.ok(clean.includes('<strong>'), "should render bold");
assert.ok(clean.includes('<em>'), "should render italic");
assert.ok(clean.includes('<blockquote'), "should render blockquotes");

// Render a focused snippet to verify link rendering
const linkHtml = purify.sanitize(marked.parse("See [Tauri](https://tauri.app) for the framework.", { renderer }));
assert.ok(linkHtml.includes('href="https://tauri.app"'), "should render links");
assert.ok(linkHtml.includes('>Tauri</a>'), "should render link text");

// Sanitization
const dirty = `<p>hi</p><script>alert(1)</script><img src=x onerror=alert(1)>`;
const safe = purify.sanitize(dirty);
assert.ok(!safe.includes("<script"), "DOMPurify must strip <script>");
assert.ok(!safe.includes("onerror"), "DOMPurify must strip onerror");

console.log("All frontend smoke checks passed.");
console.log(`Sample rendered to ${clean.length} chars of clean HTML.`);
