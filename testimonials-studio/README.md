# Testimonial Studio — implementation and deployment handoff

Status: local implementation, simulated backend tests and browser preview. **Not deployed to Google or production.** Never upload the project root. No real review was published, no notification was sent, and no Google data was changed during this build.

## Simplicity rule

Keep the simplest working architecture. Before adding a new service, deployment, project, or integration, ask: “What is the easiest way to achieve this?” Do not introduce parallel systems or extra Apps Script projects unless the existing working setup cannot meet the requirement and the trade-off is explicitly agreed first. The working production path is the original testimonial submission Apps Script, Google Sheet, Drive folder and notification flow; `Testimonials Public` and the newer `Testimonials Studio` projects are not required for that path and must not be activated or substituted without explicit agreement.

## Studio design update workflow

When changing only the private Studio appearance:

1. Edit `studio.html` in the **Testimonials Studio** Apps Script project. Its inline `<style>` block contains the Studio HTML/CSS.
2. Change only visual markup or CSS for design changes. Leave `core.gs`, `admin.gs`, the original `Testimonials` project, the Google Sheet, and the website untouched.
3. Click **Save**. Saving updates the source project but does not change the live Studio.
4. Open **Deploy → Manage deployments**, select the active Studio web-app deployment, click the pencil icon, choose **New version**, and deploy it. Keep the existing deployment URL.
5. Test a new **Open studio** link while signed in as `info@marcusheier.com`.

A new deployment version is required for HTML/CSS code changes. Script-property changes normally do not require a new version. GitHub is optional for making the live Studio change, but keep the source copy synchronized there when possible so future edits do not overwrite the work.

## Try the workspace

From the project root:

```sh
python3 testimonials-studio/tools/build-testimonial-studio.py
python3 -m http.server 8769 --bind 127.0.0.1
```

Open http://127.0.0.1:8769/testimonials-studio/preview.html . Fixtures are fictional, memory-only and make no Google calls. Reload resets them. `?count=0` and `?count=1` show empty and single-review cases; `?id=demo-pending` demonstrates deep linking. PNG downloads work; Drive saving deliberately explains that Google deployment is required.

Everyday workflow after setup: open the bookmarked Google Studio → choose review → check permission → Publish → select **Show in carousel** → Save settings. Change order with the numeric field, lower first. Hide removes a selected review too. Publication does not automatically select it. Opening an email or old Sheet link never publishes. Pending/Published/Hidden views, original submission, display excerpt, categories, portrait toggle, mobile preview, manual entry and social graphics are implemented. Social graphics include Classic, Prism glow and Aurora wash backgrounds, with eight editable color stops, softness, glow intensity and shuffle variations. Drag ordering was a proposal; this build uses explicit order numbers. No ratings are collected or generated. Autoplay remains undecided and is off.

## Verified resources and hosting

Read-only checks on 2026-10-18 confirmed the existing Sheet and configured Testimonials folder are private, owned by Marcus's existing account, and the actual tab is named `Testimonials`. **The original sheet has no header row**: row 1 is a submission. The reader supports both headerless data and a conventional ID header; it never inserts a header into the originals. One referenced legacy portrait returned not-found through the connector; check that file with the owner before enabling its display. No records or private image IDs are included in these sources.

Existing repository: https://github.com/marcusheier/www.marcusheier.com . Source there is at repository root, while this workspace uses `site/`. Production returned GitHub server headers; its homepage matched repository `main` commit `610a9762655f9be719a1b22a90df28377b803832` byte-for-byte. `CNAME` names the live domain. The unauthenticated Pages settings API returned 404, so the configured publishing branch/build mode still needs checking in **Settings → Pages**. Do not infer it from the CNAME alone. `testimonial-studio` is an isolated implementation branch, not a live cutover.

## Architecture and preservation

Two **separate Apps Script projects**, sharing the existing private Sheet and folders:

- Public project: `core.gs` + `public.gs`. Anonymous POST intake and GET `?action=published` only. There is no submission/image-by-ID lookup or graphics/admin RPC.
- Owner project: `core.gs` + `admin.gs` + generated `studio.html`. Google-hosted HTML and `google.script.run` RPC; no cross-origin admin fetch or embedded password. Every read/write RPC checks the active and effective Google account against `OWNER_EMAIL`, and fails closed for missing identity. Deployment must also be **Only myself**. Google may require reauthentication. Existing Google sessions can be reused; two-step verification is managed by the owner in Google account security.

Apps Script executes on Google, not GitHub Pages. Initial deployment and later code changes need new Google versions. Testimonial edits after setup need no deployment or website upload.

Original columns A–H are read and new submissions append the existing date/name/text/image/link/status/ID/image-ID layout. Existing text, links, statuses, IDs, images, row heights, wrap, rich links and manual formatting are never rewritten. Original moderation status remains historical; the new settings tab is authoritative. The new append uses plain text for formula-like client input.

Owner setup creates two extra tabs **in the same document**: `Testimonial permissions v1` (permission receipts and notification delivery result) and `Testimonial studio v1` (settings keyed by the original ID). Existing reviews default to pending, no permission, no carousel selection. Document already-received permission with its source/date in Studio; never infer consent from an old status. Metadata names/headers must match exactly or setup fails instead of repurposing an existing tab. Concurrent owner edits use a script lock and revision check. Public intake has its own lock and six-hour duplicate suppression. Manual entries begin pending and do not send email.

Public output includes only permitted, published, selected display text/name/category/approved portrait bytes. No original IDs, original text when excerpted, private Drive URLs, or private originals. Portraits must belong to the configured folder and have explicit portrait permission. Drive sharing never becomes public. Portrait data is returned inline as a data URL, avoiding unrestricted image endpoints; this is suitable for a small curated carousel, and becomes heavy if many large portraits are selected. File limits are 5 MB with MIME/signature checks; browser intake downsizes to 1200px JPEG. Portrait errors currently fail the feed closed; disable a missing portrait in Studio to restore text delivery. No cached public snapshot is written to GitHub.

## Before Google changes

1. In the owner account, make a private backup copy of the existing Sheet, preserving formatting and links, and back up the existing Apps Script project/deployment version and folder contents. Keep originals in place. This live backup has **not** been performed. Do not run old normalization helpers.
2. Inventory all existing deployments (including old versions with anonymous submission/image/graphics lookup). Keep their IDs privately for retirement. Preserve current URL mappings for old email links.
3. Confirm the existing Sheet ID, exact `Testimonials` tab, original portrait folder, graphics folder and recipient account in Google. Recover IDs from the existing Google project or resource URLs; do not paste private exports into this repository. The inspected legacy source used the same folder for portraits and graphics; retain that unless the owner identifies another existing folder.

## Owner project setup

1. Create a separate standalone Apps Script project owned by Marcus. Add `core.gs`, `admin.gs` and generated `studio.html` (an HTML file named `studio`). **Do not add public.gs.** Enable manifest editing and copy `admin-appsscript.json` into `appsscript.json`.
2. In **Project Settings → Script properties**, set:

| Property | Value |
| --- | --- |
| `SPREADSHEET_ID` | Existing Testimonials document ID |
| `SHEET_NAME` | `Testimonials` |
| `PORTRAIT_FOLDER_ID` | Existing originals folder ID |
| `GRAPHICS_FOLDER_ID` | Existing graphics folder ID; same folder if that is the current setup |
| `OWNER_EMAIL` | Deploying owner account, confirmed as `info@marcusheier.com` |
| `STUDIO_URL` | Add the owner `/exec` URL after deployment |

3. Run `setupStudio` in the owner editor. Authorize only the intended owner account. This adds metadata tabs, without editing originals. Deployment identity should be **user accessing the web app**, with access **Only myself** (manifest `USER_ACCESSING`, `MYSELF`). If this combination is not offered, do not broaden access; resolve deployment settings first. The server identity check remains required in addition to the deployment access setting.
4. Deploy the web app, record its `/exec` URL, and set `STUDIO_URL` in script properties. Property changes need no new version. Bookmark this URL. Use `?id=RECORD_ID` for direct review links. IDs are read on GET; no mutation occurs.
5. Test the signed-in owner; test a signed-out browser and another account. Both unauthorized cases must fail before any private data loads. Do not use a public deployment to work around a blank identity error.

## Public project setup

1. Keep the existing public project's identity/URL if appropriate so existing intake links stay valid. Replace its source with **only** `core.gs` and `public.gs`, and copy `public-appsscript.json` to its manifest. Never place `admin.gs`, `studio.html`, or old public Studio methods in this project.
2. Configure `SPREADSHEET_ID`, `SHEET_NAME`, `PORTRAIT_FOLDER_ID`, `STUDIO_URL` as above. Add `NOTIFICATION_EMAIL` with Marcus's confirmed recipient address. No access tokens go in code or website files.
3. Deploy **execute as deploying owner / Anyone**, recording the separate public `/exec` URL. Update the existing deployment to a new version if retaining its URL. Saving source alone does not update the deployed app. Archive every other unsafe legacy deployment at cutover; old version URLs can otherwise retain insecure code. Do not archive the active intake until the replacement is ready.
4. Verify anonymous POST/redirect/CORS and GET using the actual static website origin. Intake uses `text/plain` JSON to avoid a preflight; do not assume browser delivery from mocked tests. GET rejects legacy `submission`/`image`; POST rejects `saveGraphic`, moderation and unknown actions. Notification is plain text with a clear **Review in Studio** deep link and an explicit pending statement. Notification failures are recorded in the receipts tab and Apps Script logs; saving a review is not rolled back if email fails.

Google references: [web apps and deployment](https://developers.google.com/apps-script/guides/web), [session identity restrictions](https://developers.google.com/apps-script/reference/base/session), [HTML-service RPC](https://developers.google.com/apps-script/guides/html/communication).

## Acceptance checks before cutover

Use a **private staging Sheet copy and existing-layout staging folders** first. Then confirm the final production property IDs with the owner. No production test publication is authorized. Do not email clients. A notification test may go only to Marcus's confirmed address after explicit test authorization.

- [ ] Backups complete; original record IDs, row 1, original text, rich links, image IDs and manual formatting unchanged after metadata initialization.
- [ ] Anonymous new submission with/without image and both permission choices stores in the configured staging Sheet/folder, pending and excluded.
- [ ] Recipient authorizes notification test; received email deep-links to the correct review; simply opening it does not change metadata.
- [ ] Owner can open Studio; signed out, other account, public admin calls, arbitrary image IDs and legacy anonymous routes cannot read/moderate private data.
- [ ] Approval without selection stays out; selection without approval stays out; both require actual permission. Excerpt preserves original. No ratings appear.
- [ ] Preview and public GET show selected reviews in numeric order; hiding/excluding removes them on the next successful refresh.
- [ ] Actual browser cross-origin delivery, redirects and portrait data work. No unrestricted Drive fetch endpoint exists. Unsupported/outside-folder/missing images fail safely.
- [ ] Desktop and 390px: zero, one, multiple; forward/back loop, keyboard buttons/arrows, touch swipe; vertical scroll still works. No autoplay.
- [ ] All four graphics sizes download correct PNG dimensions; multi-slide export preserves full text; Drive saves use owner-only RPC and intended existing graphics folder.
- [ ] Final production mapping checked. Never point a public staging carousel at production to test with real reviews. Do not publish a test review.

Website fetches at load and every 60 seconds, also on return to a visible tab. Requests time out after 20 seconds and clear stale output on failure. Changes appear on the next successful refresh (network time applies). Already-viewed or downloaded public content cannot be recalled. Keep the website integration disabled until real permitted reviews are selected deliberately, or approve the intentional empty state at cutover.

## Public website package and cutover

Local `site/index.html` contains the Senja-free replacement. Live production still has Senja. Local config URLs are intentionally empty. **Do not upload these unconfigured files to production.** The original homepage is preserved in the rollback archive and existing repository `main`.

Once the Google checks pass, prepare an explicit package:

```sh
python3 testimonials-studio/tools/package-testimonials.py \
  --public-url 'https://script.google.com/macros/s/PUBLIC_DEPLOYMENT/exec' \
  --studio-url 'https://script.google.com/macros/s/OWNER_DEPLOYMENT/exec' \
  --google-checks-passed \
  --output /private/tmp/testimonial-upload
```

The tool creates a new directory, never uploads, excludes Google source/docs, and injects only public deployment URLs. It refuses missing setup attestation or identical public/admin URLs. This is a packaging guard, not proof of successful Google tests.

Exact changed public files required for cutover:

- `index.html`
- `testimonials/index.html`
- `testimonials-studio-432/index.html`
- `js/testimonials.js`
- `js/testimonial-studio.js` (legacy-link forwarding only)
- `js/testimonial-config.js`
- `js/testimonial-carousel.js`
- `css/testimonial-carousel.css`

Other website assets remain as currently hosted. Do not deploy root planning files, references, backups, integration source, tests or tools. Do not upload the retired `site/google-apps-script/` directory.

The existing GitHub repository uses root public files. In the implementation branch, `site/...` changes map to those root paths; integration source, tests and tools are separately versioned. Before merging, verify **Settings → Pages** and set up an allowlisted Pages artifact workflow if it currently publishes the entire repository root. The Pages artifact must contain only the prepared website files; a root-branch Pages publish could otherwise serve integration source/docs as website files. No hosting settings or deployment workflow were changed in this build.

Keep the original public paths: `/testimonials/` for intake and `/testimonials-studio-432/` as a forwarder to protected Google Studio. Existing `?id=` links are forwarded without embedding review text; Google still checks access. Replace the homepage and integration files together only after the approved feed works. Then retire the legacy anonymous deployments and remove the old uploaded Google source directory from the hosting artifact. No live cutover is part of this build.

## Rollback

Local archive: `backups/testimonials-before-2026-10-18.tar.gz`; original public homepage matches repository main baseline. Restore only scoped public files from the verified production snapshot if cutover fails. Keep private Sheet/Drive originals and new metadata tabs; metadata can be ignored while investigating. Never delete original records/folders. Avoid restoring the unsafe old anonymous image/submission/graphics handlers: disable the intake temporarily if backend rollback cannot retain safe routes. Restoring old code can re-expose private data. The pre-change archive is outside the public upload tree and is not uploaded to GitHub in this build.

## Repeatable local verification

```sh
node --test testimonials-studio/tests/*.test.cjs
python3 testimonials-studio/tools/build-testimonial-studio.py
```

These tests use simulated Apps Script services and a minimal DOM, not Google. Browser QA checks the real rendered local UI. Google account restrictions, scopes, storage, email, Drive saves and website-origin delivery must still pass the checklist above. Current limitations: no live deployment, no drag ordering, no email retry UI (delivery state is in receipts), and no automatic import/recovery of missing legacy portraits.


## Simple Studio editing workflow

Keep the local preview and the Google Apps Script version in sync.

When changing the Testimonial Studio:

1. Update the local Studio source files first (studio.css, studio.js, graphics.js, demo.js, or the related HTML).
2. Update **preview.html at the same time**. It is the local offline test entry point and must reflect the current Studio design and behavior.
3. Open preview.html locally and test with fictional testimonials. Local testing must not contact Google Sheets, Drive, email, or production.
4. Only after the local preview is correct, update the Apps Script copy (studio.html, plus core.gs or admin.gs only when backend behavior changed).
5. Save and deploy a new Apps Script version only when the approved change is ready for the live Studio.

Never update the live Apps Script first and discover the design problems there. The simplest path is: source files -> preview.html -> local test -> Apps Script -> deployment.

If a generated or bundled studio.html is rebuilt from the local source, verify that preview.html was updated before considering the change complete.
