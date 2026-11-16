/*
 * Reads the raw record files from src/content, for the build-time checks and
 * the alert script. (The site itself reads them through Astro's content
 * collections, which also validate them against the schemas in
 * src/content.config.ts.)
 *
 * Each record becomes { id, file, data }. The id is the file name without its
 * extension, which is also what linked records point to.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

export const CONTENT_DIR = path.resolve(import.meta.dirname, '../../src/content');

/** Turns a value into YYYY-MM-DD, in case the YAML parser returned a Date. */
function normaliseDates(data) {
  for (const key of Object.keys(data)) {
    if (data[key] instanceof Date) data[key] = data[key].toISOString().slice(0, 10);
  }
  return data;
}

/** Loads every record in one collection, e.g. loadCollection('actions'). */
export async function loadCollection(name) {
  const dir = path.join(CONTENT_DIR, name);
  const files = (await readdir(dir)).filter((f) => /\.(yml|md)$/.test(f));
  const records = [];
  for (const file of files) {
    const raw = await readFile(path.join(dir, file), 'utf8');
    const id = file.replace(/\.(yml|md)$/, '');
    let data;
    if (file.endsWith('.md')) {
      // Markdown records keep their fields in a YAML block at the top of the file.
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      data = match ? parseYaml(match[1]) : {};
    } else {
      data = parseYaml(raw);
    }
    records.push({ id, file, data: normaliseDates(data ?? {}) });
  }
  return records;
}

/**
 * Records that must never appear on the public site:
 * members-only meetings, decisions and actions, and draft meetings.
 */
export function isHidden(collection, record) {
  if (record.data.visibility === 'members') return true;
  if (collection === 'meetings' && record.data.status === 'draft') return true;
  return false;
}
