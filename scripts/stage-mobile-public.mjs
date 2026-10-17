/**
 * Stages only the public assets the native app actually uses.
 *
 * Vite copies public/ wholesale into the build, which for this repo is 207MB:
 * the Three.js hero models, the web hero background video and the Leaflet map
 * are all for the marketing site and none of them are ever requested by a
 * phone. It also drops the 01-textured-crop.png duplicates that
 * download-haircuts.mjs writes beside every 01.png, which are the same bytes
 * again and referenced by nothing.
 *
 * Run before the mobile build; vite.mobile.config.ts points publicDir at the
 * output.
 *
 *   node scripts/stage-mobile-public.mjs
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = 'public';
const TARGET = '.mobile-public';

/** Copied whole. Everything else has to be named, so new assets fail loudly. */
const INCLUDE = ['assets/fonts', 'assets/ui', 'assets/styles', 'assets/cursor'];

/** Dropped whole. All of these exist for the marketing site. */
const EXCLUDE = ['models', 'assets/video', 'assets/leaflet', 'assets/logo'];

const copyFile = (from, to) => {
  mkdirSync(join(to, '..'), { recursive: true });
  cpSync(from, to);
};

/** Returns false for files that should not ship to the app. */
const isWanted = (relative) => {
  if (EXCLUDE.some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`))) {
    return false;
  }
  // download-haircuts.mjs writes each photo twice: 01.png and
  // 01-textured-crop.png are the same bytes. Only the numbered one is
  // referenced, and the duplicate set is 60MB.
  return !/^\d{2}-.*\.png$/.test(relative.split('/').pop() ?? '');
};

const copyTree = (relative) => {
  const from = join(SOURCE, relative);
  if (!existsSync(from)) return 0;

  let bytes = 0;
  for (const entry of readdirSync(from)) {
    const child = `${relative}/${entry}`;
    if (!isWanted(child)) continue;

    const path = join(SOURCE, child);
    if (statSync(path).isDirectory()) bytes += copyTree(child);
    else {
      copyFile(path, join(TARGET, child));
      bytes += statSync(path).size;
    }
  }
  return bytes;
};

rmSync(TARGET, { recursive: true, force: true });
mkdirSync(TARGET, { recursive: true });

let total = copyTree('assets/faceshapes');

// Root files: the icon and anything else sitting directly in public/.
for (const entry of readdirSync(SOURCE)) {
  const path = join(SOURCE, entry);
  if (statSync(path).isDirectory()) continue;
  copyFile(path, join(TARGET, entry));
  total += statSync(path).size;
}

for (const relative of INCLUDE) total += copyTree(relative);

console.log(
  `Staged ${(total / 1024 / 1024).toFixed(1)} MB for the native app. ` +
    `Excluded: ${EXCLUDE.join(', ')}, and the duplicate faceshape images.`,
);