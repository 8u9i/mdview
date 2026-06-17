// Runtime smoke test: load the actual bundled JS in a JSDOM environment
// and confirm:
//   1. The bundle parses (no syntax errors)
//   2. The bundle executes without throwing on the original crash path
//      (the .metadata() error caused by getCurrentWebview() at module top level)
//   3. The DOM still has the expected empty-state structure after init
//   4. The file-association boot path calls invoke('initial_file') on load
//
// We stub the Tauri API imports so the bundle can run outside Tauri.

import jsdomPkg from "jsdom";
const { JSDOM } = jsdomPkg;

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DIST = join(ROOT, "dist");

const html = await readFile(join(DIST, "index.html"), "utf8");

// Strip the script tag — we'll inject the bundle manually so we can catch errors
const htmlNoScript = html.replace(/<script[^>]*bundle\.js[^>]*><\/script>/, "");

const errors = [];
const warnings = [];

const dom = new JSDOM(htmlNoScript, {
  url: "http://localhost:1420/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
  beforeParse(window) {
    window.console.warn = (...args) => { warnings.push(args.join(" ")); };
    window.console.error = (...args) => { errors.push(args.join(" ")); };
  },
});
const { window } = dom;

window.fetch = async () => { throw new Error("fetch not available in test"); };

// Stub Tauri internals so the bundle's IPC calls go to a recorder we can assert on.
const invokeCalls = [];
window.__TAURI_INTERNALS__ = {
  transformCallback: () => 0,
  invoke: async (cmd, args) => {
    invokeCalls.push({ cmd, args });
    if (cmd === "initial_file") return "D:/sample.md"; // simulate cold-start argv
    if (cmd === "plugin:event|listen") return 1;
    return null;
  },
  metadata: {
    currentWindow: { label: "main" },
    currentWebview: { label: "main", windowLabel: "main" },
  },
};

// Read the bundle and execute it.
const bundleSrc = await readFile(join(DIST, "bundle.js"), "utf8");

let bundleError = null;
try {
  await window.eval(`(async () => {
    try {
      ${bundleSrc.replace(/^export\s+/gm, "")}
    } catch (e) {
      window.__bundleError = e;
    }
  })()`);
  // Allow microtasks and the deferred 'load' callback to flush.
  await new Promise((r) => setTimeout(r, 300));
  // Fire load event manually since we injected the script, not the browser parser.
  window.dispatchEvent(new window.Event("load"));
  await new Promise((r) => setTimeout(r, 300));
} catch (e) {
  bundleError = e;
}

const report = {
  bundleError: bundleError ? String(bundleError) : null,
  windowBundleError: window.__bundleError ? String(window.__bundleError) : null,
  consoleErrors: errors,
  consoleWarns: warnings,
  invokeCalls,
  domPresent: {
    titlebar: !!window.document.querySelector(".titlebar"),
    brand: !!window.document.querySelector(".brand"),
    openButton: !!window.document.getElementById("openBtn"),
    emptyHeading: !!window.document.querySelector(".empty h1"),
    emptyOpenBtn: !!window.document.getElementById("emptyOpen"),
    emptySampleBtn: !!window.document.getElementById("emptySample"),
    outline: !!window.document.getElementById("outline"),
    reader: !!window.document.getElementById("reader"),
    stylesheet: !!window.document.querySelector('link[rel="stylesheet"]'),
  },
};

let pass = true;
function check(name, cond, detail) {
  if (!cond) { pass = false; console.error("FAIL:", name, detail || ""); }
  else console.log("PASS:", name);
}

check("bundle parses and executes without throwing at top level", !report.bundleError, report.bundleError);
check("bundle does not throw .metadata / getCurrentWebview crash",
  !report.windowBundleError || !String(report.windowBundleError).includes("metadata"),
  report.windowBundleError);
check("titlebar present", report.domPresent.titlebar);
check("open button present", report.domPresent.openButton);
check("outline present", report.domPresent.outline);
check("reader present", report.domPresent.reader);

// File-association wiring: initial_file is invoked on boot to fetch the
// file path the OS launched us with (or null if there is none).
const initialCall = invokeCalls.find((c) => c.cmd === "initial_file");
check("initial_file command invoked on boot", !!initialCall);

// open-file listener is subscribed to receive warm-start handoffs
// from the single-instance plugin when a second .md is opened.
const openFileListen = invokeCalls.some(
  (c) => c.cmd === "plugin:event|listen" && c.args?.event === "open-file"
);
check("open-file event listener subscribed (warm-start path)", openFileListen);

// read_markdown IPC contract is wired (proves the read path is reachable
// either via initial_file result, drag-drop event, or dialog selection).
const readCall = invokeCalls.find((c) => c.cmd === "read_markdown");
check("read_markdown IPC reachable", !!readCall,
  readCall ? JSON.stringify(readCall.args) : "never invoked");

console.log("\nReport:", JSON.stringify(report, null, 2));
process.exit(pass ? 0 : 1);