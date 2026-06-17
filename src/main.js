import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import markdown from "highlight.js/lib/languages/markdown";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { SAMPLE_MARKDOWN } from "./sample.js";

// ---- highlight.js: register a focused language set ----
[
  ["javascript", javascript],
  ["typescript", typescript],
  ["python", python],
  ["json", json],
  ["bash", bash],
  ["xml", xml],
  ["html", xml],
  ["css", css],
  ["markdown", markdown],
  ["md", markdown],
  ["rust", rust],
  ["go", go],
  ["sql", sql],
  ["yaml", yaml],
  ["yml", yaml],
].forEach(([name, lang]) => hljs.registerLanguage(name, lang));

// ---- marked configuration ----
const renderer = new marked.Renderer();
renderer.code = function (code, infostring) {
  if (typeof code === "object" && code !== null) {
    infostring = code.lang;
    code = code.text;
  }
  let lang = (infostring || "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (lang === "sh") lang = "bash";
  if (lang === "js") lang = "javascript";
  if (lang === "ts") lang = "typescript";
  if (lang === "py") lang = "python";
  if (lang === "rs") lang = "rust";
  let highlighted;
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    } catch {
      highlighted = escapeHtml(code);
    }
  } else {
    try {
      highlighted = hljs.highlightAuto(code).value;
    } catch {
      highlighted = escapeHtml(code);
    }
    lang = lang || "plaintext";
  }
  return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
};

marked.setOptions({ gfm: true, breaks: false, renderer });

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "section";
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// ---- DOM refs ----
const elContent = document.getElementById("content");
const elEmpty = document.getElementById("empty");
const elFileName = document.getElementById("fileName");
const elFileSub = document.getElementById("fileSub");
const elOutline = document.getElementById("outline");
const elOutlineList = document.getElementById("outlineList");
const elLayout = document.getElementById("layout");
const elReader = document.getElementById("reader");
const elDropzone = document.getElementById("dropzone");
const elToast = document.getElementById("toast");
const elZoomReadout = document.getElementById("zoomReadout");
const elProse = document.querySelector(".prose");
const elLoadingBar = document.getElementById("loadingBar");

const btnOpen = document.getElementById("openBtn");
const btnToggleOutline = document.getElementById("toggleOutline");
const btnZoomIn = document.getElementById("zoomIn");
const btnZoomOut = document.getElementById("zoomOut");
const btnEmptyOpen = document.getElementById("emptyOpen");
const btnEmptySample = document.getElementById("emptySample");

// ---- State ----
let zoom = 1;
let outlineVisible = true;
let currentFile = null;
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.1;

// ---- Toast ----
let toastTimer = null;
function toast(message, type = "info") {
  elToast.textContent = message;
  elToast.classList.toggle("error", type === "error");
  elToast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elToast.classList.remove("show"), 2400);
}

// ---- Loading bar ----
function showLoadingBar() {
  elLoadingBar.classList.remove("active");
  void elLoadingBar.offsetWidth; // force reflow to restart the keyframe
  elLoadingBar.classList.add("active");
}

// ---- File rendering ----
function renderMarkdown(markdownSrc) {
  const renderer2 = new marked.Renderer();
  renderer2.code = renderer.code;
  const slugs = new Set();
  renderer2.heading = function (text, level, raw) {
    if (typeof text === "object" && text !== null) {
      raw = text.text;
      level = text.depth;
      text = marked.parseInline(raw);
    }
    const base = slugify(raw);
    let id = base;
    let n = 2;
    while (slugs.has(id)) id = `${base}-${n++}`;
    slugs.add(id);
    return `<h${level} id="${id}">${text}</h${level}>`;
  };
  const html = marked.parse(markdownSrc, { renderer: renderer2 });
  const clean = DOMPurify.sanitize(html, { ADD_ATTR: ["id", "target", "rel"] });

  // Loading transition: dim → swap → fade in
  elProse.classList.add("loading");
  elContent.innerHTML = clean;
  elReader.scrollTo({ top: 0, behavior: "auto" });
  buildOutline();
  elContent.querySelectorAll("a[href^='http']").forEach((a) => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });
  requestAnimationFrame(() => {
    elProse.classList.remove("loading");
    elProse.classList.add("ready");
  });
}

function renderError(filePath, reason) {
  elContent.innerHTML = `
    <div class="error-state" role="alert">
      <h2>Could not open this file</h2>
      <div class="error-file">${escapeHtml(filePath)}</div>
      <p class="error-reason">${escapeHtml(reason)}</p>
      <p>The file may have been moved, renamed, or the path may be incorrect.</p>
      <div class="error-actions">
        <button class="btn primary" type="button" id="errorRetry">Try again</button>
        <button class="btn ghost"   type="button" id="errorClear">Dismiss</button>
      </div>
    </div>
  `;
  elProse.classList.remove("loading");
  elProse.classList.add("ready");
  elOutlineList.innerHTML = `<div style="padding:8px 12px;color:var(--ink-3);font-size:var(--fs-xs)">No outline available</div>`;
  document.getElementById("errorRetry")?.addEventListener("click", openFileDialog);
  document.getElementById("errorClear")?.addEventListener("click", () => {
    elContent.innerHTML = "";
    elContent.appendChild(elEmpty);
  });
}

function buildOutline() {
  const heads = elContent.querySelectorAll("h1, h2, h3, h4, h5, h6");
  elOutlineList.innerHTML = "";
  if (heads.length === 0) {
    const empty = document.createElement("div");
    empty.style.cssText = "padding:8px 12px;color:var(--ink-3);font-size:var(--fs-xs)";
    empty.textContent = "No headings found";
    elOutlineList.appendChild(empty);
    return;
  }
  heads.forEach((h) => {
    const depth = parseInt(h.tagName[1], 10);
    const a = document.createElement("a");
    a.className = "outline-item";
    a.dataset.depth = String(Math.min(depth, 6));
    a.textContent = h.textContent || "(untitled)";
    a.href = `#${h.id}`;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveOutline(h.id);
    });
    elOutlineList.appendChild(a);
  });
}

function setActiveOutline(id) {
  elOutlineList.querySelectorAll(".outline-item").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("href") === `#${id}`);
  });
}

// Scroll-spy
let spyRaf = 0;
elReader.addEventListener("scroll", () => {
  if (spyRaf) return;
  spyRaf = requestAnimationFrame(() => {
    spyRaf = 0;
    const heads = elContent.querySelectorAll("h1, h2, h3, h4, h5, h6");
    if (heads.length === 0) return;
    const top = elReader.scrollTop + 24;
    let active = heads[0];
    for (const h of heads) {
      if (h.offsetTop <= top) active = h;
      else break;
    }
    setActiveOutline(active.id);
  });
});

// ---- Open file ----
async function openFileDialog() {
  try {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        { name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "txt"] },
        { name: "All files", extensions: ["*"] },
      ],
    });
    if (typeof selected === "string") {
      await loadFile(selected);
    } else if (selected && selected.path) {
      await loadFile(selected.path);
    }
  } catch (err) {
    toast(`Could not open file picker: ${err}`, "error");
  }
}

async function loadFile(path) {
  showLoadingBar();
  try {
    const result = await invoke("read_markdown", { path });
    currentFile = result;
    elFileName.textContent = result.name;
    elFileSub.textContent = `${humanSize(result.size)} · ${result.path}`;
    renderMarkdown(result.content);
    toast(`Opened ${result.name}`);
  } catch (err) {
    const msg = typeof err === "string" ? err : (err?.message || JSON.stringify(err));
    renderError(path, msg);
    toast(`Failed to open: ${msg}`, "error");
  }
}

async function loadSample() {
  showLoadingBar();
  const text = SAMPLE_MARKDOWN;
  currentFile = { name: "sample.md", path: "bundled sample", size: text.length, content: text };
  elFileName.textContent = "sample.md";
  elFileSub.textContent = `${humanSize(text.length)} · bundled sample`;
  renderMarkdown(text);
  toast("Opened sample");
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ---- Zoom ----
function setZoom(z) {
  zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(z * 10) / 10));
  elProse.style.setProperty("--zoom", String(zoom));
  elZoomReadout.textContent = `${Math.round(zoom * 100)}%`;
}
btnZoomIn.addEventListener("click", () => setZoom(zoom + ZOOM_STEP));
btnZoomOut.addEventListener("click", () => setZoom(zoom - ZOOM_STEP));

// ---- Outline toggle ----
function setOutlineVisible(v) {
  outlineVisible = v;
  elLayout.classList.toggle("no-outline", !v);
  btnToggleOutline.classList.toggle("active", v);
}
btnToggleOutline.addEventListener("click", () => setOutlineVisible(!outlineVisible));
setOutlineVisible(true);

// ---- Open button + empty-state buttons ----
btnOpen.addEventListener("click", openFileDialog);
btnEmptyOpen?.addEventListener("click", openFileDialog);
btnEmptySample?.addEventListener("click", loadSample);

// ---- Keyboard shortcuts ----
window.addEventListener("keydown", (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && (e.key === "o" || e.key === "O")) {
    e.preventDefault();
    openFileDialog();
  } else if (mod && (e.key === "=" || e.key === "+")) {
    e.preventDefault();
    setZoom(zoom + ZOOM_STEP);
  } else if (mod && e.key === "-") {
    e.preventDefault();
    setZoom(zoom - ZOOM_STEP);
  } else if (mod && e.key === "0") {
    e.preventDefault();
    setZoom(1);
  } else if (mod && (e.key === "b" || e.key === "B")) {
    e.preventDefault();
    setOutlineVisible(!outlineVisible);
  } else if (e.key === "Escape" && currentFile) {
    elReader.focus();
  }
});

// ---- Drag and drop ----
let dragDepth = 0;
function showDrop(show) { elDropzone.classList.toggle("show", show); }
window.addEventListener("dragenter", (e) => {
  e.preventDefault();
  dragDepth++;
  showDrop(true);
});
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("dragleave", (e) => {
  e.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) showDrop(false);
});
window.addEventListener("drop", async (e) => {
  e.preventDefault();
  dragDepth = 0;
  showDrop(false);
  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length === 0) return;
  const file = files[0];
  const path = file.path;
  if (path) {
    await loadFile(path);
  } else {
    try {
      const text = await file.text();
      currentFile = { name: file.name, path: file.name, size: file.size, content: text };
      elFileName.textContent = file.name;
      elFileSub.textContent = `${humanSize(file.size)} · ${file.name}`;
      renderMarkdown(text);
      toast(`Opened ${file.name}`);
    } catch (err) {
      toast(`Failed to read dropped file: ${err}`, "error");
    }
  }
});

// Defer the native drag-drop subscription until after the page has loaded,
// and guard against environments where getCurrentWebview() isn't ready
// (e.g. some dev-server preview modes).
function wireNativeDragDrop() {
  try {
    const wv = getCurrentWebview();
    if (!wv || typeof wv.onDragDropEvent !== "function") return;
    wv.onDragDropEvent((event) => {
      const p = event?.payload;
      if (!p) return;
      if (p.type === "enter" || p.type === "over") {
        showDrop(true);
      } else if (p.type === "leave") {
        showDrop(false);
      } else if (p.type === "drop") {
        showDrop(false);
        const paths = p.paths || [];
        if (paths.length > 0) {
          loadFile(paths[0]);
        }
      }
    }).catch(() => { /* ignore — DOM dragover fallback covers it */ });
  } catch (err) {
    // Non-Tauri environment (dev preview, test). DOM handlers above still work.
    console.warn("Native drag-drop not available:", err?.message || err);
  }
}
if (document.readyState === "complete") wireNativeDragDrop();
else window.addEventListener("load", wireNativeDragDrop);

// ---- File-association open: cold start + warm start ----
// Cold start: the Rust side captured the argv at startup. Ask for it.
async function loadInitialFile() {
  try {
    const path = await invoke("initial_file");
    if (path) {
      await loadFile(path);
      return true;
    }
  } catch (err) {
    console.warn("initial_file invoke failed:", err?.message || err);
  }
  return false;
}

// Warm start: when the user opens another .md with MDView (file association),
// single-instance forwards the new path here.
async function wireOpenFileListener() {
  try {
    await listen("open-file", (event) => {
      const path = event?.payload;
      if (typeof path === "string" && path) {
        loadFile(path);
      }
    });
  } catch (err) {
    console.warn("open-file listener unavailable:", err?.message || err);
  }
}

// Kick off both once the page is ready (the Tauri IPC must be live).
async function bootFileOpen() {
  await loadInitialFile();
  await wireOpenFileListener();
}
if (document.readyState === "complete") bootFileOpen();
else window.addEventListener("load", bootFileOpen);

setZoom(1);
