/*
 * ALERT ISSUES
 *
 * Opens a GitHub issue for each:
 *   - public action that is open (or in progress) and past its due date
 *   - active role whose term ends within 30 days (or has already ended)
 *
 * It never creates a second issue for the same alert, even if an older issue
 * for it was closed. Alerts that no longer apply are closed automatically.
 *
 * Only public items get issues, because issues on a public repository are
 * public. Members-only actions are left out on purpose.
 *
 * Needs the environment variables GITHUB_TOKEN (with issues: write) and
 * GITHUB_REPOSITORY (set automatically by GitHub Actions). Without a token,
 * the script just prints the alerts it would raise.
 */
import nodemailer from 'nodemailer';
import { loadCollection } from './lib/records.mjs';

const LABEL = 'site-alert';
const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY ?? 'BSITZERTM/community-circles-site';
const [owner] = repo.split('/');
const repoName = repo.split('/')[1];
const siteUrl = `https://${owner.toLowerCase()}.github.io/${repoName}/`;

// Email settings. Owners' addresses are kept in the OWNER_EMAILS secret, never
// in the repo, because the repo is public. The log never prints an address.
const ownerEmails = JSON.parse(process.env.OWNER_EMAILS || '{}');
const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

/** Builds the mail transport from the SMTP secrets. */
function mailTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

// TEST MODE: when the workflow is started by hand with "test email" ticked,
// send one test email to each stored owner address and stop. No issues are touched.
if (process.env.SEND_TEST_EMAIL === 'true') {
  if (!emailConfigured) {
    console.error('Test email not sent: the SMTP secrets are missing.');
    process.exit(1);
  }
  const recipients = Object.entries(ownerEmails);
  if (recipients.length === 0) {
    console.error('Test email not sent: OWNER_EMAILS is empty.');
    process.exit(1);
  }
  for (const [ownerId] of recipients) {
    try {
      await mailTransport().sendMail({
        from: process.env.ALERT_FROM || process.env.SMTP_USER,
        to: ownerEmails[ownerId],
        subject: 'Test: CCME site email alerts',
        text: 'This is a test of the CCME site email alerts. If you can read this, email alerts are working.',
      });
      console.log(`Test email sent to the owner (${ownerId}).`);
    } catch (error) {
      console.error(`Test email failed for the owner (${ownerId}): ${error.message}`);
      process.exitCode = 1;
    }
  }
  process.exit(process.exitCode ?? 0);
}

// Today's date in South African time, as YYYY-MM-DD.
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date());
const inThirtyDays = (() => {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString().slice(0, 10);
})();

// --- Work out which alerts apply today ------------------------------------------

const people = new Map((await loadCollection('people')).map((p) => [p.id, p.data.name]));
const circles = new Map((await loadCollection('circles')).map((c) => [c.id, c.data.name]));
const actions = (await loadCollection('actions')).filter((a) => a.data.visibility === 'public');
const roles = await loadCollection('roles');

/** @type {{ key: string, title: string, body: string }[]} */
const alerts = [];

for (const a of actions) {
  const open = a.data.status === 'open' || a.data.status === 'in progress';
  // Actions with no due date are never overdue, so they never raise an alert.
  if (!open || !a.data.due_date || a.data.due_date >= today) continue;
  alerts.push({
    key: `action-overdue-${a.id}`,
    owner: a.data.owner, // only action alerts are emailed, to this person
    title: `Overdue action: ${a.data.title}`,
    body: [
      `The action **${a.data.title}** was due on ${a.data.due_date} and is still ${a.data.status}.`,
      '',
      `- Owner: ${people.get(a.data.owner) ?? a.data.owner}`,
      `- Circle: ${circles.get(a.data.circle) ?? a.data.circle}`,
      `- Status: ${a.data.status}`,
      '',
      `Update the action in the editor, or mark it done or dropped. This issue closes itself once it no longer applies.`,
      '',
      `Actions page: ${siteUrl}actions/`,
    ].join('\n'),
  });
}

for (const r of roles) {
  if (r.data.status !== 'active' || r.data.term_end > inThirtyDays) continue;
  const ended = r.data.term_end < today;
  alerts.push({
    key: `role-term-${r.id}-${r.data.term_end}`,
    title: `${ended ? 'Role term has passed' : 'Role term ends soon'}: ${r.data.title} (${circles.get(r.data.circle) ?? r.data.circle})`,
    body: [
      `The role **${r.data.title}** in ${circles.get(r.data.circle) ?? r.data.circle} has its term ending on ${r.data.term_end}.`,
      '',
      ended
        ? 'The term has passed but the role is still marked active. Either renew it (update the term end date) or mark it ended and start a new role.'
        : 'Check whether the role will be renewed or passed on. Set the new term end date, or change the status to ended and add the next holder.',
      '',
      `Roles page: ${siteUrl}roles/`,
    ].join('\n'),
  });
}

console.log(`${alerts.length} alert(s) apply today (${today}).`);

if (!token) {
  for (const alert of alerts) {
    console.log(`- ${alert.title}`);
    if (alert.owner) console.log(`  would email the owner (${alert.owner}) if they have an address`);
  }
  console.log('No GITHUB_TOKEN set, so no issues were created or closed.');
  process.exit(0);
}

// --- Talk to the GitHub API -----------------------------------------------------

async function github(method, endpoint, body) {
  const response = await fetch(`https://api.github.com/repos/${repo}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'community-circles-site-alerts',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${method} ${endpoint} failed: ${response.status} ${text}`);
  }
  return response.status === 204 ? null : response.json();
}

/**
 * Emails an action's owner about a new overdue-action issue.
 * A failed email is logged but does not stop the job, and the issue still exists.
 */
async function emailOwner(alert, issueUrl) {
  const to = ownerEmails[alert.owner];
  if (!to) {
    console.log(`No email address stored for ${alert.owner}, so no email was sent for: ${alert.title}`);
    return;
  }
  if (!emailConfigured) {
    console.log(`Email is not configured (SMTP secrets are missing), so no email was sent for: ${alert.title}`);
    return;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  try {
    await transport.sendMail({
      from: process.env.ALERT_FROM || process.env.SMTP_USER,
      to,
      subject: alert.title,
      text: [
        `Hello,`,
        ``,
        alert.body.replace(/\*\*/g, ''),
        ``,
        `Issue with the details: ${issueUrl}`,
        ``,
        `You are receiving this because you own this action on the CCME site.`,
      ].join('\n'),
    });
    console.log(`Emailed the owner (${alert.owner}) about: ${alert.title}`);
  } catch (error) {
    console.warn(`Could not email the owner (${alert.owner}): ${error.message}`);
  }
}

// Make sure the label exists. If it already does, GitHub returns an error, which is fine to ignore.
await github('POST', '/labels', {
  name: LABEL,
  color: 'b60205',
  description: 'Raised automatically by the site checks',
}).catch(() => {});

// Fetch every issue with the label, open or closed, so we can see which alerts already have one.
const existing = [];
for (let page = 1; ; page += 1) {
  const batch = await github('GET', `/issues?labels=${LABEL}&state=all&per_page=100&page=${page}`);
  existing.push(...batch);
  if (batch.length < 100) break;
}

// Each issue carries a hidden marker with its alert key, e.g. <!-- alert-key: action-overdue-x -->.
const keyOf = (issue) => issue.body?.match(/<!-- alert-key: (.+?) -->/)?.[1];
const existingByKey = new Map(existing.filter((i) => keyOf(i)).map((i) => [keyOf(i), i]));
const wantedKeys = new Set(alerts.map((a) => a.key));

// Open an issue for each alert that does not already have one.
let created = 0;
for (const alert of alerts) {
  if (existingByKey.has(alert.key)) continue;
  const issue = await github('POST', '/issues', {
    title: alert.title,
    body: `${alert.body}\n\n<!-- alert-key: ${alert.key} -->`,
    labels: [LABEL],
  });
  created += 1;
  // Email only when the issue is new, so each alert is emailed once.
  if (alert.owner) await emailOwner(alert, issue.html_url);
}

// Close open issues whose alert no longer applies.
let closed = 0;
for (const issue of existing) {
  const key = keyOf(issue);
  if (!key || issue.state !== 'open' || wantedKeys.has(key)) continue;
  await github('POST', `/issues/${issue.number}/comments`, {
    body: 'This no longer applies, so the issue has been closed automatically.',
  });
  await github('PATCH', `/issues/${issue.number}`, { state: 'closed' });
  closed += 1;
}

console.log(`Created ${created} issue(s), closed ${closed} resolved issue(s).`);
