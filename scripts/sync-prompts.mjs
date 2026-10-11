import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// The prompts are authored inside the dashboard that reads them, then mirrored
// into the function that composes them. Copying rather than importing across
// the repo means `supabase deploy` cannot fail on bundling a path outside the
// function directory.
const source = join(root, 'src', 'dashboards', 'customer-dashboard', 'prompts');
const target = join(root, 'supabase', 'functions', 'chat', 'prompts');

if (!existsSync(source)) {
  console.error(`No prompts folder at ${source}`);
  process.exit(1);
}

mkdirSync(target, { recursive: true });

const files = readdirSync(source).filter((name) => name.endsWith('.md'));

if (files.length === 0) {
  console.error(`No .md files in ${source}`);
  process.exit(1);
}

for (const name of files) {
  copyFileSync(join(source, name), join(target, name));
  console.log(`synced ${name}`);
}

console.log(`\n${files.length} prompt file(s) mirrored into ${target}`);