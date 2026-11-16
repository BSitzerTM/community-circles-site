/*
 * LINK CHECK
 *
 * Records link to each other by id: a role's circle, a meeting's facilitator,
 * an action's owner, and so on. This check runs before the build and fails
 * (with the file name, field and missing id) if any link points at a record
 * that does not exist. Without it, a typo would silently leave a broken link.
 */
import { loadCollection } from './lib/records.mjs';

// For each collection: which fields link to which collection.
// `[]` after a field name means the field holds a list of ids.
const LINKS = {
  circles: { parent: 'circles', members: ['people'] },
  roles: { circle: 'circles', holder: 'people' },
  meetings: { circle: 'circles', facilitator: 'people', minute_taker: 'people', attendees: ['people'] },
  decisions: { circle: 'circles', linked_meeting: 'meetings' },
  actions: { circle: 'circles', owner: 'people', linked_meeting: 'meetings' },
};

// Load every collection's ids once.
const ids = {};
for (const name of ['people', 'circles', 'roles', 'meetings', 'decisions', 'actions']) {
  ids[name] = new Set((await loadCollection(name)).map((r) => r.id));
}

const problems = [];
for (const [collection, fields] of Object.entries(LINKS)) {
  for (const record of await loadCollection(collection)) {
    for (const [field, target] of Object.entries(fields)) {
      const isList = Array.isArray(target);
      const targetCollection = isList ? target[0] : target;
      const value = record.data[field];
      const values = isList ? (value ?? []) : value ? [value] : [];
      for (const id of values) {
        if (!ids[targetCollection].has(id)) {
          problems.push(`${collection}/${record.file}: "${field}" points at "${id}", which is not in ${targetCollection}/`);
        }
      }
    }
  }
}

if (problems.length > 0) {
  console.error('\nLINK CHECK FAILED: some records point at records that do not exist.\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('\nCheck the spelling of the id (the file name without its extension).\n');
  process.exit(1);
}
console.log('Link check passed: every link points at an existing record.');
