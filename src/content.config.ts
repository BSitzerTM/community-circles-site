/*
 * CONTENT SCHEMAS
 *
 * Every record is one file in src/content/<collection>/. This file says what
 * fields each record must have. If a file is missing a required field, or a
 * field has the wrong type, the build stops and reports the file and the
 * problem in plain English.
 *
 * Linked records (for example a role's circle) are written as the file name
 * without its extension, e.g. `circle: connectors-circle`. The
 * `reference()` helper checks that the linked record exists.
 */
import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// --- Small helpers used by the schemas below --------------------------------

/** A required piece of text that must not be blank. */
const requiredText = (label: string) =>
  z
    .string({ error: `${label} is required and must be text.` })
    .trim()
    .min(1, { error: `${label} must not be empty.` });

/** Optional text. It may be left blank (YAML reads an empty value as null). */
const optionalText = z.string().nullish();

/**
 * A date written as YYYY-MM-DD.
 * YAML can turn an unquoted date into a Date object, so convert it back to
 * the plain YYYY-MM-DD string first. Every date is then a string that can be
 * compared with other dates.
 */
const dateField = (label: string) =>
  z.preprocess(
    (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
    z.iso.date({ error: `${label} must be a date in the form YYYY-MM-DD.` }),
  );

/**
 * A link to another record, stored as that record's id (its file name).
 * Astro checks at build time that the linked record exists, and reports a
 * clear error if it does not. The transform turns Astro's { id, collection }
 * object into a plain id string, which is easier to compare and print.
 */
const link = (collection: 'people' | 'circles' | 'meetings') =>
  reference(collection).transform((ref) => ref.id);

/** Every meeting, decision and action has one of these. */
const visibility = z.enum(['public', 'members'], {
  error: 'visibility must be "public" or "members".',
});

// --- Collections -----------------------------------------------------------

const people = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/people' }),
  schema: z.object({
    name: requiredText('name'),
    bio: optionalText,
    // Path to a photo in public/uploads, e.g. /uploads/thandi.jpg
    photo: optionalText,
  }),
});

const circles = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/circles' }),
  schema: z.object({
    name: requiredText('name'),
    aim: requiredText('aim'),
    description: optionalText,
    parent: link('circles').nullish(),
    members: z.array(link('people')).default([]),
  }),
});

const roles = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/roles' }),
  schema: z
    .object({
      title: requiredText('title'),
      circle: link('circles'),
      // A role can be vacant, so the holder is optional.
      holder: link('people').nullish(),
      start_date: dateField('start_date'),
      term_end: dateField('term_end'),
      responsibilities: optionalText,
      status: z.enum(['active', 'ended'], {
        error: 'status must be "active" or "ended".',
      }),
    })
    .refine((role) => role.term_end >= role.start_date, {
      message: 'term_end must not be before start_date.',
    }),
});

const meetings = defineCollection({
  // The body of each Markdown file holds the minutes text.
  loader: glob({ pattern: '**/*.md', base: './src/content/meetings' }),
  schema: z.object({
    date: dateField('date'),
    circle: link('circles'),
    facilitator: link('people').nullish(),
    minute_taker: link('people').nullish(),
    attendees: z.array(link('people')).default([]),
    // One agenda item per line.
    agenda: optionalText,
    // One decision per line. Full decision records live in `decisions`.
    decisions: optionalText,
    visibility,
    status: z.enum(['draft', 'published'], {
      error: 'status must be "draft" or "published".',
    }),
  }),
});

const decisions = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/decisions' }),
  schema: z.object({
    title: requiredText('title'),
    date: dateField('date'),
    circle: link('circles'),
    proposal: requiredText('proposal'),
    // Blank while the outcome is still open.
    outcome: optionalText,
    review_date: dateField('review_date'),
    linked_meeting: link('meetings').nullish(),
    visibility,
  }),
});

const actions = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/actions' }),
  schema: z.object({
    title: requiredText('title'),
    description: optionalText,
    owner: link('people'),
    circle: link('circles'),
    created_date: dateField('created_date'),
    due_date: dateField('due_date'),
    status: z.enum(['open', 'in progress', 'done', 'dropped'], {
      error: 'status must be one of: open, in progress, done, dropped.',
    }),
    linked_meeting: link('meetings').nullish(),
    notes: optionalText,
    visibility,
  }),
});

export const collections = {
  people,
  circles,
  roles,
  meetings,
  decisions,
  actions,
};
