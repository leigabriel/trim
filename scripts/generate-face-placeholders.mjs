/**
 * Generates 1:1 placeholder art for the face shape galleries.
 *
 * These are stand-ins, not content: each one draws the actual face shape
 * silhouette over the brand blue, so the gallery reads as a considered system
 * rather than as broken images. Replace them by overwriting the files in
 * public/assets/faceshapes/<shape>/ with real photographs of the same names and
 * nothing in the app changes.
 *
 * Pure Node, no dependency. The PNG writer below is the minimum needed to emit
 * a truecolour PNG, which is less machinery than pulling in sharp for a
 * one-off asset pass.
 *
 *   node scripts/generate-face-placeholders.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SIZE = 800;
const PER_SHAPE = 10;
const ROOT = 'public/assets/faceshapes';

const BLUE = [0, 52, 255];
const WHITE = [255, 255, 255];

/** Signed distance from a point to a shape's outline. Negative inside. */
const outlineDistance = (shape, x, y) => {
  switch (shape) {
    case 'oval':
    case 'long': {
      // Ellipse. "long" is the same oval stretched vertically, which is the
      // point being illustrated.
      const rx = shape === 'long' ? SIZE * 0.19 : SIZE * 0.23;
      const ry = shape === 'long' ? SIZE * 0.34 : SIZE * 0.29;
      const cx = SIZE / 2;
      const cy = SIZE / 2;
      return Math.hypot((x - cx) / rx, (y - cy) / ry) - 1;
    }
    case 'round': {
      const r = SIZE * 0.27;
      return Math.hypot(x - SIZE / 2, y - SIZE / 2) - r;
    }
    case 'square': {
      // Rounded rectangle.
      const half = SIZE * 0.24;
      const radius = SIZE * 0.09;
      const dx = Math.abs(x - SIZE / 2) - (half - radius);
      const dy = Math.abs(y - SIZE / 2) - (half - radius);
      const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
      return outside + Math.min(Math.max(dx, dy), 0) - radius;
    }
    case 'diamond': {
      // Manhattan's distance to a rhombus.
      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const ax = SIZE * 0.26;
      const ay = SIZE * 0.32;
      return Math.abs(x - cx) / ax + Math.abs(y - cy) / ay - 1;
    }
    case 'triangle': {
      // Half-plane intersection giving an isoceles triangle.
      const cx = SIZE / 2;
      const cy = SIZE * 0.54;
      const halfWidth = SIZE * 0.3;
      const height = SIZE * 0.44;
      const apex = cy - height;
      const left = ((cy - y) * halfWidth) / height + (x - cx);
      const right = ((cy - y) * halfWidth) / height - (x - cx);
      return Math.max(left, right, y - cy);
    }
    case 'heart': {
      // Two lobes above a point.
      const cx = SIZE / 2;
      const cy = SIZE * 0.56;
      const lobe = SIZE * 0.17;
      const top = cy - SIZE * 0.22;
      const left = Math.hypot(x - (cx - lobe * 0.85), y - top) - lobe;
      const right = Math.hypot(x - (cx + lobe * 0.85), y - top) - lobe;
      const tip = ((y - top) * (SIZE * 0.26)) / (cy - top) + Math.abs(x - cx);
      return Math.min(Math.max(left, right), tip);
    }
    default:
      return 1;
  }
};

const mix = (a, b, t) => a.map((value, i) => value + (b[i] - value) * t);

/** Renders one placeholder. `index` shifts the hue band so a gallery of ten
 *  does not read as ten identical tiles. */
const render = (shape, index) => {
  const pixels = Buffer.alloc(SIZE * SIZE * 3);
  // Two blues, banded by index: same family, visibly different images.
  const top = mix(BLUE, [10, 120, 255], index / PER_SHAPE);
  const bottom = mix(BLUE, [0, 20, 190], index / PER_SHAPE);
  const strokeWidth = 5;
  // Edges are smoothed over a pixel's worth of distance, so the outline is not
  // a staircase.
  const feather = 1.5;

  let offset = 0;
  for (let y = 0; y < SIZE; y += 1) {
    const depth = y / (SIZE - 1);
    for (let x = 0; x < SIZE; x += 1) {
      const distance = outlineDistance(shape, x, y) * SIZE;
      // Outline band straddles the edge.
      const onEdge =
        1 -
        Math.min(
          1,
          Math.max(0, (Math.abs(distance + strokeWidth / 2) - strokeWidth / 2) / feather),
        );

      let colour = mix(top, bottom, depth);
      if (onEdge > 0) colour = mix(colour, WHITE, onEdge * 0.92);

      pixels[offset] = Math.round(colour[0]);
      pixels[offset + 1] = Math.round(colour[1]);
      pixels[offset + 2] = Math.round(colour[2]);
      offset += 3;
    }
  }

  return pixels;
};

// --- Minimal PNG writer (truecolour, 8-bit, no interlace) ---

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

const encodePng = (rgb) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(SIZE, 0);
  header.writeUInt32BE(SIZE, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: truecolour
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  // Each scanline is prefixed with its filter byte. Filter 0 (none) keeps the
  // writer honest; deflate does the work.
  const stride = SIZE * 3;
  const raw = Buffer.alloc(SIZE * (stride + 1));
  for (let y = 0; y < SIZE; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

// --- Write the sets ---

const SHAPES = [
  'oval', 'round', 'square', 'heart', 'diamond', 'long', 'triangle',
];

let written = 0;
for (const shape of [...SHAPES, 'trending']) {
  const directory = join(ROOT, shape);
  mkdirSync(directory, { recursive: true });

  for (let index = 0; index < PER_SHAPE; index += 1) {
    const name = `${String(index + 1).padStart(2, '0')}.png`;
    writeFileSync(join(directory, name), encodePng(render(shape, index)));
    written += 1;
  }
}

console.log(`Wrote ${written} placeholder images at ${SIZE}x${SIZE} into ${ROOT}/`);