/*
 * PRIVACY BUILD CHECK
 *
 * Runs after `astro build` and `pagefind`. It fails the build (exit code 1)
 * if any members-only item, or any draft meeting, appears anywhere in dist/.
 *
 * How it works: it finds every hidden record, then looks for its id (the file
 * name) and its title in every file in dist/. It also checks that no page
 * folder was created for it. Matches are reported with the file they were
 * found in.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadCollection, isHidden } from './lib/records.mjs';

const DIST = path.resolve(import.meta.dirname, '../dist');
const COLLECTIONS = ['meetings', 'decisions', 'actions'];

if (!existsSync(DIST)) {
  console.error('Privacy check: dist/ was not found. Run the build first.');
  process.exit(1);
}

/** Lists every file under a folder, recursively. */
async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(full)));
    else files.push(full);
  }
  return files;
}

// 1. Collect the hidden items and the words that would reveal them.
const hidden = [];
for (const collection of COLLECTIONS) {
  for (const record of await loadCollection(collection)) {
    if (!isHidden(collection, record)) continue;
    const needles = [record.id];
    if (record.data.title) needles.push(String(record.data.title));
    hidden.push({ collection, id: record.id, needles });
  }
}

// 2. Look for each hidden item in the built files.
const files = await listFiles(DIST);
const problems = [];

for (const item of hidden) {
  // A page folder named after the item, such as dist/meetings/<id>/.
  for (const file of files) {
    const relative = path.relative(DIST, file).split(path.sep);
    if (relative.includes(item.id)) {
      problems.push(`${item.collection}/${item.id}: a file or folder was built for it (${relative.join('/')})`);
    }
  }

  // The item's id or title in the text of any built file.
  for (const file of files) {
    const text = await readFile(file, 'utf8').catch(() => '');
    for (const needle of item.needles) {
      if (needle && text.includes(needle)) {
        problems.push(`${item.collection}/${item.id}: "${needle}" found in ${path.relative(DIST, file)}`);
        break;
      }
    }
  }
}

if (problems.length > 0) {
  console.error('\nPRIVACY CHECK FAILED: hidden content was found in the built site.\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    '\nMembers-only items and draft meetings must not be built. Check that the page uses the public* readers in src/lib/records.ts.\n',
  );
  process.exit(1);
}

console.log(`Privacy check passed: ${hidden.length} hidden record(s) checked, none found in dist/.`);
