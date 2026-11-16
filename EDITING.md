# Editing the Community Circles site

This guide is for editors. You do not need to know how to code. You fill in forms, and the site updates itself.

The public site is at `https://bsitzertm.github.io/community-circles-site/`. The editing page is at `https://bsitzertm.github.io/community-circles-site/admin/`.

---

## 1. Logging in

1. Open the editing page: `https://bsitzertm.github.io/community-circles-site/admin/`.
2. Click **Login with GitHub**.
3. If GitHub asks you to authorise the app, click **Authorize**.
4. You should see the list of sections on the left: People, Circles, Roles, Meetings, Decisions, Actions.

If you see an error after logging in, check that you have been added as a collaborator on the repository, and that you have accepted the invitation. Ask the person who looks after the site if you are not sure.

---

## 2. The rules that matter

- **Save** each form with **Publish** (the button at the top right). Each save is recorded in the site's history, with your name and the time.
- **Dates** are picked from a calendar. They are saved as `YYYY-MM-DD`.
- **Links** between records (for example a role's circle) are chosen from a list. Start typing a name to find it.
- **Visibility** can be **Public** or **Members only**. Members-only items are left off the public site completely. Use Public unless the item should be kept private.
- **Status** on meetings can be **Draft** or **Published**. Drafts are never shown on the public site. A meeting must be **Published** before anyone can see it.
- **Never delete** a role, a meeting or a decision to show that it has ended or been replaced. Change its status instead. The history is what makes the record useful.

---

## 3. Adding minutes for a meeting

1. Open **Meetings** and click **New Meetings**.
2. Fill in:
   - **Date**: the date of the meeting.
   - **Circle**: choose the circle from the list.
   - **Facilitator** and **Minute-taker**: choose from the list of people.
   - **Attendees**: choose everyone who was there.
   - **Agenda**: one item per line.
   - **Decisions taken**: one decision per line. This is a summary. For each decision that needs tracking, add a full record in **Decisions** as well.
   - **Visibility**: usually **Public**.
   - **Status**: choose **Draft** while you are writing, then **Published** when the minutes are ready to share.
3. Write the minutes in the **Minutes** box. You can use bold text and bullet points.
4. Click **Publish**.

The meeting now appears on the **Meetings** page. Published meetings also appear on the home page.

### Adding a decision

1. Open **Decisions** and click **New Decisions**.
2. Fill in the title, the decision date, the circle, and the **proposal** (what was proposed).
3. Add the **outcome** once it is known (for example "Adopted by consent"). Leave it empty while the outcome is still open.
4. Set the **review date**: the date by which the group should look at this decision again. Decisions with reviews due in the next 60 days are highlighted.
5. Choose the **linked meeting**, if there is one.
6. Click **Publish**.

---

## 4. Adding or updating an action

### Adding an action

1. Open **Actions** and click **New Actions**.
2. Fill in:
   - **Title**: a short description, such as "Book the community hall".
   - **Owner**: the person who will do it.
   - **Circle**: the circle it belongs to.
   - **Created date** and **Due date**.
   - **Status**: usually **Open**.
   - **Linked meeting**: the meeting where it was agreed, if there was one.
3. Click **Publish**.

### Updating an action

1. Open **Actions**, then click the action's name.
2. Change the **Status** to one of:
   - **Open**: not yet started.
   - **In progress**: someone is working on it.
   - **Done**: finished.
   - **Dropped**: no longer needed. Add a note explaining why.
3. Add a **Notes** line if something has changed, for example a new due date and the reason.
4. Click **Publish**.

If an action passes its due date while it is still open, it is marked **Overdue** on the site, and a GitHub issue is opened for it. The issue closes automatically once the action is done, dropped, or has a new due date.

---

## 5. Ending a role

Use this when someone's term finishes, or they step down.

1. Open **Roles** and click the role (for example "Facilitator, Coordinating Circle").
2. Change **Status** to **Ended**.
3. Check the **Term end date**. Correct it if the role ended early.
4. Click **Publish**.

The role stays on the site, with its dates, so you can see the history. It no longer appears in the list of current roles.

---

## 6. Starting a new role

Use this when someone takes on a role, or a role is renewed.

**To hand a role to someone new:** end the old role first (section 5), then create a new one:

1. Open **Roles** and click **New Roles**.
2. Fill in:
   - **Title**: for example "Facilitator".
   - **Circle**: the circle the role belongs to.
   - **Holder**: the new person. Leave this empty if the role is vacant.
   - **Start date** and **Term end date**.
   - **Responsibilities**: what the role is for.
   - **Status**: **Active**.
3. Click **Publish**.

**To renew the same person's role:** the simplest way is to change the **Term end date** on the existing active role, and keep the status as **Active**. This keeps one continuous record. If the person's term was ended and they start again, create a new role record.

---

## 7. Adding a person or a circle

- **People:** open **People**, click **New People**, enter the name (and an optional short bio and photo), then **Publish**.
- **Circles:** open **Circles**, click **New Circles**, enter the name and the aim in one sentence. Choose a **Parent circle** if this circle is part of another. Add the **Members**. Then **Publish**.

People must exist before you can choose them in other forms, so add people first.

---

## 8. Things to watch for

- **Overdue actions and ending roles** are checked every day. If you see a GitHub issue about one, deal with the item and the issue will close itself, or you can close it by hand.
- **Members-only items** are never shown on the public site and do not create public GitHub issues. Check them in the editing page.
- **If the site fails to update**, look at the Actions tab on GitHub. The build message says which record has a problem, for example a missing title, or a link to a circle that does not exist. Fix that item in the editor and publish again.
- **Photos** can be uploaded in a People form. Use a square photo if you can.

---

## 9. Where things are saved

Every change you publish is a commit in the Git repository. You can see the full history on GitHub under **Commits**, or by opening a file and choosing **History**. Nothing is ever lost, so an earlier version can always be recovered.

If you are not sure what to do, ask before you change something that others depend on, such as a role's holder or a decision's outcome.
