/**
 * Renders the Trim app icon at every Android density.
 *
 * An approximation of the supplied mark: a flowing calligraphic stroke over the
 * brand blue. The curves are hand-built, so it will not match the original
 * drawing exactly. Replace this script's STROKES with the real artwork, or drop
 * a 512x512 source over the generated files, when the final mark is ready.
 *
 *   node scripts/generate-app-icon.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const RES = 'android/app/src/main/res';

/** Brand blue. Matches --trim-blue. */
const BLUE = [0, 52, 255];
const WHITE = [255, 255, 255];

/** Every density rendered directly at its own size. */
const DENSITIES = [
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192],
];

/**
 * The mark, in a 0-1 box so it scales to any density unchanged.
 *
 * Three strokes: a crossbar sweeping right with a slight sag, the loop that
 * folds back off it, and a long descender falling to the lower left. Drawn as
 * cubic beziers and rasterised by distance, which is what gives the round caps
 * and joins a single continuous stroke rather than a row of overlapping dots.
 */
const STROKES = [
  // Crossbar: hooks up at the left tip, then runs right and levels off. Long,
  // and flatter than the loop, which is what gives the mark its direction.
  [[0.12, 0.355], [0.34, 0.30], [0.56, 0.315], [0.86, 0.325]],
  // The loop, folding back off the crossbar. Kept small and sitting left of
  // centre; a bigger circle reads as a letter rather than a stroke.
  [[0.19, 0.36], [0.26, 0.46], [0.35, 0.43], [0.43, 0.335]],
  // Descender: the long diagonal to the lower left, the dominant gesture.
  [[0.45, 0.33], [0.34, 0.55], [0.23, 0.73], [0.10, 0.88]],
];

/** Stroke weight as a fraction of the canvas. */
const WEIGHT = 0.052;

// ── Geometry ──────────────────────────────────────────────────────────

/** Evaluates both axes, so a sample is a usable point rather than one number. */
const cubicAt = (p, t) => {
  const u = 1 - t;
  const b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [
    b[0] * p[0][0] + b[1] * p[1][0] + b[2] * p[2][0] + b[3] * p[3][0],
    b[0] * p[0][1] + b[1] * p[1][1] + b[2] * p[2][1] + b[3] * p[3][1],
  ];
};

/** Samples each stroke into a dense polyline, normalised to pixels. */
const sampleStrokes = (size, scale, offsetX, offsetY) => {
  const points = [];

  for (const stroke of STROKES) {
    const scaled = stroke.map(([x, y]) => [
      (x * scale + offsetX) * size,
      (y * scale + offsetY) * size,
    ]);
    const steps = 90;
    for (let i = 0; i <= steps; i += 1) points.push(cubicAt(scaled, i / steps));
  }

  return points;
};

const distanceToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const nearest = (px, py, points) => {
  let best = Infinity;
  for (let i = 1; i < points.length; i += 1) {
    const d = distanceToSegment(px, py, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
    if (d < best) best = d;
  }
  return best;
};

// ── Raster ─────────────────────────────────────────────────────────────

/**
 * @param transparent  Adaptive foregrounds need alpha outside the stroke.
 * @param scale        Scales the mark within the canvas.
 */
const render = (size, { transparent, scale = 1, offsetX = 0, offsetY = 0 } = {}) => {
  const pixels = Buffer.alloc(size * size * 4);
  const points = sampleStrokes(size, scale, offsetX, offsetY);
  const radius = (WEIGHT * scale * size) / 2;
  // One pixel of feather, so edges do not stair-step.
  const feather = 1;

  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;

      const distance = nearest(px, py, points);
      const coverage =
        1 - Math.max(0, Math.min(1, (distance - radius + feather) / (feather * 2)));

      const inside = coverage > 0;
      const r = inside ? BLUE[0] + (WHITE[0] - BLUE[0]) * coverage : BLUE[0];
      const g = inside ? BLUE[1] + (WHITE[1] - BLUE[1]) * coverage : BLUE[1];
      const b = inside ? BLUE[2] + (WHITE[2] - BLUE[2]) * coverage : BLUE[2];

      pixels[offset] = Math.round(r);
      pixels[offset + 1] = Math.round(g);
      pixels[offset + 2] = Math.round(b);
      // Foregrounds fade out rather than showing a hard blue square behind a
      // mask the launcher will crop anyway.
      pixels[offset + 3] = transparent ? Math.round(coverage * 255) : 255;
      offset += 4;
    }
  }

  return pixels;
};

/** Box filter. Only valid for integer ratios. */
const downsample = (source, from, to) => {
  const factor = from / to;
  if (!Number.isInteger(factor)) {
    throw new Error(`downsample needs an integer ratio, got ${from}->${to}`);
  }

  const out = Buffer.alloc(to * to * 4);
  for (let y = 0; y < to; y += 1) {
    for (let x = 0; x < to; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < factor; sy += 1) {
        for (let sx = 0; sx < factor; sx += 1) {
          const i = ((y * factor + sy) * from + (x * factor + sx)) * 4;
          r += source[i];
          g += source[i + 1];
          b += source[i + 2];
          a += source[i + 3];
        }
      }

      const n = factor * factor;
      const o = (y * to + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }

  return out;
};

// ── PNG writer ─────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

const encodePng = (rgba, size) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // truecolour with alpha: required for the adaptive foreground
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const write = (path, rgba, size) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(rgba, size));
};

// ── Emit ───────────────────────────────────────────────────────────────

let count = 0;
// Rendered per density rather than downsampled from the master: 512 is not an
// integer multiple of 192, 144, 96, 72 or 48, so a box filter would read
// fractional offsets and dither the whole image.
for (const [density, size] of DENSITIES) {
  const directory = join(RES, `mipmap-${density}`);

  // Legacy square and round launchers carry their own background.
  const opaque = render(size, {});
  write(join(directory, 'ic_launcher.png'), opaque, size);
  write(join(directory, 'ic_launcher_round.png'), opaque, size);

  // Adaptive foreground: the launcher masks and crops this, so the mark sits
  // inside the safe zone rather than filling the canvas.
  const foreground = render(size, { transparent: true, scale: 0.62, offsetX: 0.19, offsetY: 0.19 });
  write(join(directory, 'ic_launcher_foreground.png'), foreground, size);

  count += 3;
}

// Adaptive icons read their background from a colour resource.
mkdirSync(join(RES, 'values'), { recursive: true });
writeFileSync(
  join(RES, 'values', 'ic_launcher_background.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0034FF</color>\n</resources>\n',
);

console.log(`Wrote ${count} icon files plus ic_launcher_background.xml`);