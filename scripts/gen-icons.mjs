// Generate a simple icon set (PNG + ICO) for Tauri bundling.
// Produces a teal "M" tile on a dark background to match the in-app logo.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import zlib from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const ICON_DIR = join(ROOT, "src-tauri", "icons");
await mkdir(ICON_DIR, { recursive: true });

// --- Color helpers ---
function srgbToLinear(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function linearToSrgb(c) { c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.round(c * 255); }

// OKLCH (Björn Ottosson) -> linear sRGB
function oklchToLinearRgb(L, C, h) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

// Pre-compute a teal accent (OKLCH 74% 0.115 195) and dark surface (OKLCH 16% 0.012 250)
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function oklchRgb(L, C, h) {
  const [r, g, b] = oklchToLinearRgb(L, C, h).map(clamp01);
  return [linearToSrgb(r), linearToSrgb(g), linearToSrgb(b)];
}
const ACCENT = oklchRgb(0.74, 0.115, 195);
const SURFACE = oklchRgb(0.18, 0.014, 250);

// --- Render an icon to a raw RGBA buffer at given size ---
function renderIcon(size) {
  const data = new Uint8Array(size * size * 4);
  const corner = Math.max(2, Math.floor(size * 0.18));
  const innerPad = Math.max(1, Math.floor(size * 0.10));
  const tileStart = innerPad;
  const tileEnd = size - innerPad;
  const tileColor = ACCENT;
  const bgColor = SURFACE;

  // Center the M within a rounded inner tile
  const cx = size / 2;
  const cy = size / 2;
  // M geometry
  const mH = size * 0.50;
  const mW = size * 0.42;
  const strokeW = size * 0.105;
  const top = cy - mH / 2;
  const bottom = cy + mH / 2;
  const left = cx - mW / 2;
  const right = cx + mW / 2;

  // Distance from a point to a line segment
  function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const nx = ax + t * dx, ny = ay + t * dy;
    const ex = px - nx, ey = py - ny;
    return Math.sqrt(ex * ex + ey * ey);
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r, g, b, a = 255;
      // Rounded square background
      const inX = x >= tileStart && x < tileEnd;
      const inY = y >= tileStart && y < tileEnd;
      let inside = inX && inY;
      if (inside) {
        // Round corners
        const dx = Math.max(tileStart + corner - x, x - (tileEnd - 1 - corner), 0);
        const dy = Math.max(tileStart + corner - y, y - (tileEnd - 1 - corner), 0);
        if (dx * dx + dy * dy > corner * corner) inside = false;
      }
      if (!inside) { r = 0; g = 0; b = 0; a = 0; }
      else {
        // The M is drawn in the accent color; the surrounding area is the surface.
        // The M consists of 4 strokes:
        //  - left vertical  (left,bottom) -> (left,top)
        //  - left diagonal  (left,top)    -> (cx, top + mH*0.55)
        //  - right diagonal (cx, top + mH*0.55) -> (right, top)
        //  - right vertical (right, top) -> (right, bottom)
        const d1 = distToSegment(x, y, left, bottom, left, top);
        const d2 = distToSegment(x, y, left, top, cx, top + mH * 0.55);
        const d3 = distToSegment(x, y, cx, top + mH * 0.55, right, top);
        const d4 = distToSegment(x, y, right, top, right, bottom);
        const dM = Math.min(d1, d2, d3, d4);
        // AA the stroke edge
        const half = strokeW / 2;
        const t = Math.max(0, Math.min(1, (half + 0.5 - (dM - half)) / 1.0));
        // Blend between surface (background) and accent (foreground)
        if (dM < half) {
          // accent
          r = tileColor[0]; g = tileColor[1]; b = tileColor[2];
        } else if (dM < half + 1) {
          // AA edge
          r = Math.round(bgColor[0] * (1 - t) + tileColor[0] * t);
          g = Math.round(bgColor[1] * (1 - t) + tileColor[1] * t);
          b = Math.round(bgColor[2] * (1 - t) + tileColor[2] * t);
        } else {
          r = bgColor[0]; g = bgColor[1]; b = bgColor[2];
        }
      }
      const idx = (y * size + x) * 4;
      data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = a;
    }
  }
  return data;
}

// --- PNG encoder (RGBA, 8-bit) ---
function crc32(buf) {
  let c;
  if (!crc32.table) {
    crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      crc32.table[n] = c >>> 0;
    }
  }
  c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crc32.table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crcBuf]);
}
function encodePng(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type: RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace
  // Add a filter byte (0) at the start of each row
  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0;
    rgba.subarray(y * size * 4, (y + 1) * size * 4).forEach((v, i) => {
      rows[y * (size * 4 + 1) + 1 + i] = v;
    });
  }
  const idatData = zlib.deflateSync(rows, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idatData), chunk("IEND", Buffer.alloc(0))]);
}

// --- ICO encoder (Vista+ format: PNG inside ICO) ---
function encodeIco(sizes) {
  // sizes: [{ size, data: Buffer(png) }]
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // ICO
  header.writeUInt16LE(sizes.length, 4);
  const dirEntries = [];
  let offset = 6 + 16 * sizes.length;
  for (const s of sizes) {
    const e = Buffer.alloc(16);
    e[0] = s.size === 256 ? 0 : s.size; // width
    e[1] = s.size === 256 ? 0 : s.size; // height
    e[2] = 0; // palette
    e[3] = 0; // reserved
    e.writeUInt16LE(1, 4);   // planes
    e.writeUInt16LE(32, 6);  // bpp
    e.writeUInt32LE(s.data.length, 8);
    e.writeUInt32LE(offset, 12);
    dirEntries.push(e);
    offset += s.data.length;
  }
  return Buffer.concat([header, ...dirEntries, ...sizes.map((s) => s.data)]);
}

const pngSizes = [32, 128, 256];
const pngs = [];
for (const s of pngSizes) {
  const data = renderIcon(s);
  const buf = encodePng(data, s);
  pngs.push({ size: s, buf });
}

// Write standard files
await writeFile(join(ICON_DIR, "32x32.png"), pngs.find((p) => p.size === 32).buf);
await writeFile(join(ICON_DIR, "128x128.png"), pngs.find((p) => p.size === 128).buf);
await writeFile(join(ICON_DIR, "128x128@2x.png"), pngs.find((p) => p.size === 256).buf);
await writeFile(join(ICON_DIR, "icon.png"), pngs.find((p) => p.size === 256).buf);

// Write a multi-resolution .ico (PNG-in-ICO entries at 32, 64, 128, 256)
const icoSizes = [32, 64, 128, 256].map((s) => ({ size: s, data: encodePng(renderIcon(s), s) }));
await writeFile(join(ICON_DIR, "icon.ico"), encodeIco(icoSizes));

console.log(`Wrote ${pngSizes.length} PNGs + 1 ICO into ${ICON_DIR}`);
