# Verification record — 2026-10-18

## Passed locally

- 14 automated tests (`node --test testimonials-studio/tests/*.test.cjs`), using simulated Google services and minimal DOM. Covers append-only storage, headerless row 1, consent, formula-like inputs, duplicate suppression, notification deep-link construction, read-only GET, all admin identity guards, public private-route rejection, excerpt/original separation, approval/selection/order/hide, revision conflicts, image limits/signatures/folder checks, zero/one/many, keyboard/swipe logic and safe text rendering.
- Node syntax checks for backend, intake, forwarder, graphics and moderation scripts.
- Real browser: publish a fictional pending review with separate carousel selection; hide it and confirm removal; previous wraps first-to-last and next wraps last-to-first; mobile drag advances carousel.
- Real browser empty and one-review carousel states: appropriate message/card, no navigation buttons.
- Desktop 1440px and mobile 390px: no horizontal overflow in the review workspace; mobile graphics also measured 390px scroll width.
- All four PNG formats downloaded through the actual controls; file headers confirmed 1080×1350, 1080×1080, 1080×1920 and 1200×627. A graphics regression test verifies that every word of a 2500-word fixture is retained across exported slides for all four sizes, without stars.

## Read-only external checks

- Existing repository and source root verified. Live homepage matched repository main at `610a9762655f9be719a1b22a90df28377b803832`; GitHub response headers and CNAME confirmed. Pages build-source settings were not readable through the unauthenticated API.
- Existing private Google Sheet/folder metadata verified; tab is `Testimonials`. Bounded row-1 inspection revealed a headerless Sheet and prompted the regression fix. No original content copied into source or fixtures.
- One referenced original portrait returned not-found through the Drive connector. No records/IDs/files were altered to address it.

## Not verified live

No Apps Script source was uploaded or deployed; no metadata tabs were initialized; no Google data or sharing settings changed. No email was sent and no real/test review was published. Google deployment account restrictions, actual email delivery, cross-origin intake/feed, Drive graphic saving and end-to-end storage still require the README checklist. Local identity tests do not prove Google deployment settings.

The live homepage still uses the previous Senja widget. Only the local/branch replacement removes it. The replacement must not cut over until configured and verified.

- Final GitHub readback: all 28 uploaded source/test/tool files matched local bytes. Rebuilt both HTML bundles and reran all 14 tests from a clean export of the repository branch; both bundles reproduced exactly. Detailed setup/verification documents and masterplan remain local following automatic approval review.

## Folder/reset follow-up

All 14 tests passed after moving the Studio source, tools and tests together. Real-browser checks selected Square, Story and LinkedIn landscape in turn, then pressed Reset design: each returned to 1080×1350 with exactly Instagram portrait highlighted. Original moved reference images/RTF/Finder alias matched their pre-move SHA-256 hashes. The preview is now `/testimonials-studio/preview.html`.
