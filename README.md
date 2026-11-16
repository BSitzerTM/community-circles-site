# CCME: Connected Community Marine Estate, public record site

This is the public record for the Connected Community Marine Estate (CCME), a Muizenberg network of neighbours that works by sociocracy. It shows:

- the **circles** and what each one is for
- **who holds which role**, and when each term ends (ended roles stay on the site, so you can see the history)
- **meetings**, with their minutes
- **decisions**, with a date to review each one
- **actions**: who is doing what, by when, and whether it is done
- **people**, with their current roles and open actions

Everything is stored as plain files in this Git repository. Every change is a commit, so the full history of who decided what, and when, is kept automatically. The site is built with [Astro](https://astro.build), searched with [Pagefind](https://pagefind.app), and hosted for free on GitHub Pages. There is no database, no server and no tracking.

Editors use a forms-based editing page (Decap CMS) at `/admin`. See [EDITING.md](EDITING.md) for how to use it.

---

## Project structure

```
community-circles-site/
├── .github/
│   └── workflows/
│       └── deploy.yml            Builds and deploys the site. Runs daily, and opens alert issues.
├── public/
│   ├── admin/
│   │   ├── config.yml            Decap CMS settings: which forms exist and which repo they save to.
│   │   └── index.html            The /admin page that loads Decap CMS.
│   └── uploads/                  Photos uploaded through the editor.
├── scripts/
│   ├── lib/
│   │   └── records.mjs           Reads the raw record files for the checks below.
│   ├── check-links.mjs           Fails the build if a record links to one that does not exist.
│   ├── check-privacy.mjs         Fails the build if a members-only item or draft appears in dist/.
│   └── check-alerts.mjs          Opens and closes GitHub issues for overdue actions and ending roles.
├── src/
│   ├── content/                  THE DATA. One file per record.
│   │   ├── people/               Name, short bio, photo.
│   │   ├── circles/              Name, aim, description, parent circle, members.
│   │   ├── roles/                Title, circle, holder, term dates, status.
│   │   ├── meetings/             Date, circle, attendees, agenda, decisions, minutes (Markdown body).
│   │   ├── decisions/            Title, proposal, outcome, review date, linked meeting.
│   │   └── actions/              Title, owner, circle, due date, status, linked meeting, notes.
│   ├── components/
│   │   └── Badge.astro           A labelled status tag, such as "Overdue".
│   ├── layouts/
│   │   └── Base.astro            The page frame: header, menu, main area, footer.
│   ├── lib/
│   │   └── records.ts            Shared helpers. The only route to meetings, decisions and actions for pages.
│   ├── pages/                    One file per page of the site. Folders with [id] make one page per record.
│   │   ├── index.astro           Home: role terms ending soon, overdue actions, latest meetings.
│   │   ├── about.astro           How the site works and how to edit it.
│   │   ├── search.astro          Site-wide search.
│   │   ├── 404.astro             Page not found.
│   │   ├── circles/              Circle list and one page per circle.
│   │   ├── roles/                "Who holds what" table and one page per role (with its history).
│   │   ├── meetings/             Searchable meeting list and one page per meeting.
│   │   ├── decisions/index.astro Decisions, with reviews due soon highlighted.
│   │   ├── actions/index.astro   Action table with filters and overdue marking.
│   │   └── people/               People list and one page per person.
│   ├── scripts/
│   │   └── filter.ts             Small script that makes the tables and lists filterable.
│   ├── styles/
│   │   └── global.css            All the styling. Plain CSS.
│   └── content.config.ts         THE RULES. Says which fields each record must have.
├── .gitignore
├── astro.config.mjs              Site address and base path for GitHub Pages.
├── EDITING.md                    Guide for editors.
├── LICENSE                       MIT licence.
├── package.json                  Scripts and dependencies.
├── README.md                     This file.
└── tsconfig.json
```

---

## Setting up the site for the first time

You need a GitHub account and Node.js 22 or newer on your own computer (only if you want to run the site locally). The steps below are done once.

### 1. Create the repository

1. On GitHub, create a new **public** repository called `community-circles-site` under the owner `BSITZERTM`.
2. Upload these files (or push this folder with Git). The repository must be public so that GitHub Pages is free and the history is open.
3. Do not add a README or licence on GitHub if you are uploading this project, to avoid a conflict.

### 2. Turn on GitHub Pages

1. Open the repository on GitHub, then go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Nothing else is needed. The next push to `main` builds and publishes the site.
4. The site will be at `https://bsitzertm.github.io/community-circles-site/`.

If you later use your own domain, change `site` and `base` in [astro.config.mjs](astro.config.mjs) to match.

### 3. Check that the first build works

1. Go to the **Actions** tab. You should see a run called "Build, deploy and checks".
2. Wait for it to turn green. If it fails, open the run and read the message: it names the file and the field that is wrong.

### 4. Allow the daily alerts to create issues

The workflow uses GitHub's built-in token. In most repositories this already works. If the alert job fails with a permissions error:

1. Go to **Settings → Actions → General → Workflow permissions**.
2. Choose **Read and write permissions**, then save.

Issues are on by default for public repositories. Check that **Settings → General → Features → Issues** is ticked.

### 5. Replace the sample people and roles

The repository has the CCME's circles, plus sample people, roles, meetings, decisions and actions so you can see how the site and alerts work. The sample records are all under the Connectors Circle.

The sample deliberately raises three alerts on the first scheduled run: the overdue action "Publish October minutes", and the roles "Facilitator" and "Events Lead", whose terms end within 30 days. Those issues are public on this repo. Close them, or delete or edit the sample records, before you rely on the site.

To replace the sample, delete or edit the files in `src/content/people`, `roles`, `meetings`, `decisions` and `actions`, or use the editor in `/admin`.

---

## Setting up editor login (Decap CMS)

The editing page at `/admin` needs to log editors in with GitHub, and then save their changes into the repository. Decap CMS can do this with GitHub, but it needs a small **OAuth proxy**: a tiny free service that holds the GitHub app's secret so the secret never reaches the browser. This is the only part of the project that is not on GitHub Pages itself.

You need a free [Cloudflare](https://www.cloudflare.com) account (the free plan is enough) for the proxy. Other hosts work too; see the links at the end of this section.

### 5a. Create a GitHub OAuth App

1. On GitHub, go to **Settings → Developer settings → OAuth Apps → New OAuth App**. (Use the account that owns the repository.)
2. Fill in:
   - **Application name:** CCME site editor
   - **Homepage URL:** `https://bsitzertm.github.io/community-circles-site/`
   - **Authorization callback URL:** `https://YOUR-PROXY-ADDRESS/callback`. Leave a placeholder for now; you will update it in step 5c.
3. Click **Register application**.
4. Note the **Client ID**. Click **Generate a new client secret** and note it too. Keep the secret private.

### 5b. Deploy the proxy

The most widely used open source option is [sterlingwes/decap-proxy](https://github.com/sterlingwes/decap-proxy), a Cloudflare Worker. Its own README has the current commands; the outline is:

1. Get a copy of the proxy project and install its dependencies (you need Node.js on your computer for this step).
2. Store the GitHub Client ID and Client secret as secrets, using the names the proxy's README asks for (usually `GITHUB_OAUTH_ID` and `GITHUB_OAUTH_SECRET`). Use `npx wrangler secret put NAME` for each one.
3. If the proxy asks for an allowed origin, give it `https://bsitzertm.github.io`.
4. Run `npx wrangler deploy`. Wrangler prints the proxy's address, for example `https://community-circles-auth.yourname.workers.dev`.

You can also use the Cloudflare Worker template from the [Decap backends overview](https://decapcms.org/docs/backends-overview/), or a hosted option such as Decap Turbo. Check that any free tier still applies before you rely on it.

### 5c. Connect the proxy to the site

1. Set the callback URL in the GitHub OAuth App to `https://YOUR-PROXY-ADDRESS/callback`. Then click **Add URI** under **Redirect URIs** and add a second entry: `https://YOUR-PROXY-ADDRESS/callback?provider=github`. Keep both.

   The second entry is needed. The proxy adds `?provider=github` to the redirect, and GitHub only accepts a redirect that matches a registered URI exactly. Without it, you get the error "The redirect_uri is not associated with this application".
2. Open [public/admin/config.yml](public/admin/config.yml). Replace `https://YOUR-OAUTH-PROXY.example.workers.dev` under `backend:` with your proxy's address. Do not add `/auth` to it; the config already has `auth_endpoint: auth`.
3. Commit and push. The site rebuilds.
4. Open `https://bsitzertm.github.io/community-circles-site/admin/` and click **Login with GitHub**.

### 5d. Give editors access

Only people with **write access** to the repository can save changes. Go to **Settings → Collaborators** and add each editor. They must accept the invitation. Anyone who is not a collaborator will be able to log in but will get an error when saving.

---

## Checks that run on every build

Before the site is published, the build runs three checks, in this order:

1. **Link check** (`scripts/check-links.mjs`): every link between records must point at a record that exists. A typo in a role's circle, for example, stops the build and names the file.
2. **Schema check** (Astro, using the rules in `src/content.config.ts`): every record must have its required fields in the right format. A missing title, or a date not written as YYYY-MM-DD, stops the build and names the file and the field.
3. **Privacy check** (`scripts/check-privacy.mjs`): runs after the site and search index are built. It fails if any members-only item, or any draft meeting, appears in the built files.

Members-only items and drafts are also left out when the pages are generated, so the privacy check is a second safety net, not the only one. Hiding items with CSS is not used anywhere.

---

## Daily rebuild and alerts

The workflow in `.github/workflows/deploy.yml` runs:

- **On every push to `main`**: build, check, and publish to GitHub Pages.
- **Every day at 05:15 in South Africa** (03:15 UTC): rebuild, so "overdue" and "ending soon" stay correct even when nobody has edited anything. It then runs `scripts/check-alerts.mjs`.

The alert script opens one GitHub issue for:

- each **public** action that is still open or in progress after its due date
- each **active** role whose term ends within 30 days (or has already passed)

It does not open a second issue for an alert that already has one, even a closed one, and it closes issues whose alert no longer applies. Members-only actions do not get issues, because issues on a public repository are visible to everyone.

### Email alerts to action owners

When an overdue-action issue is first created, its owner is also emailed. Role alerts are not emailed. Nothing is emailed until these repository secrets are set (**Settings → Secrets and variables → Actions → New repository secret**):

| Secret | What to put in it |
|---|---|
| `OWNER_EMAILS` | A JSON map from person id to email, e.g. `{"brad":"brad@grace2learn.co.za"}`. The person id is the file name in `src/content/people/`. |
| `SMTP_HOST` | The outgoing mail server for the sending mailbox. |
| `SMTP_PORT` | Usually `587` (or `465` for SSL). |
| `SMTP_USER` | The sending mailbox's login. |
| `SMTP_PASSWORD` | The mailbox password, or an app password if the provider requires one. |
| `ALERT_FROM` | Optional. The "from" address. Defaults to `SMTP_USER`. |

Addresses are kept in secrets, not in the content files, because the repo is public. Do not add email addresses to the people records.

To run the alerts by hand: **Actions → Build, deploy and checks → Run workflow**.

---

## Working on the site on your computer

```bash
npm install          # first time only
npm run dev          # preview at http://localhost:4321/community-circles-site/
npm run build        # full build, including all the checks
npm run check        # type-check the TypeScript and Astro files
npm run alerts       # print the alerts that apply today (no issues are created without a token)
```

Search only works on the built site, so use `npm run build` followed by `npm run preview` to try it.

---

## Brand and design

The look comes from the Connected Community logo: charcoal ink (`#35342f`), a hand-made wave, and chunky outlines. The images are in [public/brand/](public/brand/):

| File | Used for |
|---|---|
| `lockup.png`, `lockup-sm.png` | The "connected community / marine estate" logo: the home page heading and the header. |
| `wordmark.png`, `wordmark-sm.png` | The plain "connected community" logo: the About page. |
| `mark.png`, `mark-sm.png` | The arch mark: the menu, the 404 page and the favicon. |
| `*-white.png` | White versions of each logo, for the dark footer. |
| `favicon.png` | The browser tab icon, and the editor's login page. |

All are transparent PNGs made from the original logo files. To change the logo, replace these files and keep the same names. The page frame (header, menu and footer) is in [src/layouts/Base.astro](src/layouts/Base.astro), and the colours and wave are at the top of [src/styles/global.css](src/styles/global.css).

Logo images used as the page heading carry the words as their alternative text. Decorative copies have empty alternative text, so screen readers do not read the name twice.

## Notes for maintainers

- **Schemas** live in [src/content.config.ts](src/content.config.ts). To add a field, add it there, then add it to the form in [public/admin/config.yml](public/admin/config.yml).
- **Privacy rule:** pages must read meetings, decisions and actions through the `public*` functions in [src/lib/records.ts](src/lib/records.ts). Do not call `getCollection` for those three directly.
- **Dates** are stored as `YYYY-MM-DD`. "Today" is the date in South Africa, so the overdue and ending-soon lists match the group's calendar.
- **Decisions and actions** have no draft status, only a visibility setting. Meetings have both.
- **Decisions in a meeting** are a short list, one per line. The full decision record is a separate item on the Decisions page, linked to the meeting.
- **Sample content** is dated 2026 and is there to show the site working. Delete it before you rely on the site.

## Licence

MIT. See [LICENSE](LICENSE).
