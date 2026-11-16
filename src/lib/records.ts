/*
 * SHARED HELPERS
 *
 * PRIVACY RULE: pages must read meetings, decisions and actions through the
 * `public*` functions below. They drop members-only items and draft meetings
 * before any page is generated, so those items never reach the built site.
 * Do not call getCollection() directly for these three collections in a page.
 */
import { getCollection } from 'astro:content';

export const REPO_URL = 'https://github.com/BSITZERTM/community-circles-site';

// --- Dates -------------------------------------------------------------------
// Dates are YYYY-MM-DD strings, so they sort and compare correctly as text.

/** Today's date (YYYY-MM-DD) in South African time, the group's time zone. */
export function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date());
}

/** Adds a number of days to a YYYY-MM-DD date. */
export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Whole days from one YYYY-MM-DD date to another (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Turns 2026-11-16 into "16 November 2026". */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// --- Links and assets ----------------------------------------------------------

/** Builds a link inside the site, adding the GitHub Pages base path. Pass a path without a leading slash. */
export function url(path = ''): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

/** Builds a link to a file in /public (for example a photo), adding the base path. */
export function assetUrl(path: string): string {
  return url(path.replace(/^\//, ''));
}

// --- Actions -------------------------------------------------------------------

/** Statuses that mean an action is still being worked on. */
export function isOpenStatus(status: string): boolean {
  return status === 'open' || status === 'in progress';
}

/** An action is overdue when it is still open and its due date has passed. */
export function isOverdue(action: { status: string; due_date: string }, now: string): boolean {
  return isOpenStatus(action.status) && action.due_date < now;
}

// --- Content readers -----------------------------------------------------------
// The public* readers are the only way pages see members-only items and drafts.

export const publicMeetings = () =>
  getCollection('meetings', (m) => m.data.visibility === 'public' && m.data.status === 'published');

export const publicDecisions = () =>
  getCollection('decisions', (d) => d.data.visibility === 'public');

export const publicActions = () =>
  getCollection('actions', (a) => a.data.visibility === 'public');

export const allPeople = () => getCollection('people');
export const allCircles = () => getCollection('circles');
export const allRoles = () => getCollection('roles');

/**
 * Looks up names from ids, so pages can show "Jane Doe" instead of
 * "thandi-mokoena". Also returns the full people and circles lists.
 */
export async function directory() {
  const [circles, people] = await Promise.all([allCircles(), allPeople()]);
  const circleNames = new Map(circles.map((c) => [c.id, c.data.name]));
  const personNames = new Map(people.map((p) => [p.id, p.data.name]));
  return {
    circles,
    people,
    circleName: (id: string) => circleNames.get(id) ?? id,
    /** Empty string when there is no person (for example a vacant role). */
    personName: (id: string | null | undefined) => (id ? (personNames.get(id) ?? id) : ''),
  };
}

/** Sorts entries by a date field. Newest first by default. */
export function byDate<T extends { data: { date: string } }>(items: T[], newestFirst = true): T[] {
  return [...items].sort((a, b) =>
    newestFirst ? b.data.date.localeCompare(a.data.date) : a.data.date.localeCompare(b.data.date),
  );
}
