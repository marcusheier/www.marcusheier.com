# Exact changed files — local implementation

## Existing files changed

- `MASTERPLAN.md`
- `site/index.html`
- `site/testimonials/index.html`
- `site/testimonials-studio-432/index.html`
- `site/js/testimonials.js`
- `site/js/testimonial-studio.js`
- `site/google-apps-script/Code.gs`
- `site/google-apps-script/README.md`
- `testimonials-studio/graphics.js`
- `testimonials-studio/studio-shell.html`
- `testimonials-studio/studio.css`
- `testimonials-studio/studio.html`
- `testimonials-studio/preview.html`
- `testimonials-studio/tests/graphics.test.cjs`

## Latest local changes

- Deleted the retired `site/google-apps-script/Code.gs` stub; it was not a deployable backend.
- Added Prism glow, Aurora wash and Classic gradient background modes to the Studio graphics editor.
- Added eight editable color stops, softness, glow intensity and randomized prism palettes. Preview and PNG export use the same background settings.

## Files added

- `testimonials-studio/BUILD-STATUS.md`

- `site/js/testimonial-config.js`
- `site/js/testimonial-carousel.js`
- `site/css/testimonial-carousel.css`
- `testimonials-studio/README.md`
- `testimonials-studio/admin-appsscript.json`
- `testimonials-studio/admin.gs`
- `testimonials-studio/core.gs`
- `testimonials-studio/demo.js`
- `testimonials-studio/graphics.js`
- `testimonials-studio/preview.html`
- `testimonials-studio/public-appsscript.json`
- `testimonials-studio/public.gs`
- `testimonials-studio/studio-shell.html`
- `testimonials-studio/studio.css`
- `testimonials-studio/studio.html`
- `testimonials-studio/studio.js`
- `testimonials-studio/verification.md`
- `testimonials-studio/tools/build-testimonial-studio.py`
- `testimonials-studio/tools/package-testimonials.py`
- `testimonials-studio/tests/backend.test.cjs`
- `testimonials-studio/tests/carousel.test.cjs`
- `testimonials-studio/tests/graphics.test.cjs`
- `testimonials-studio/changed-files.md`
- `backups/testimonials-before-2026-10-18.tar.gz`

## Boundaries

`site/css/testimonials.css` was read and reused in the generated Studio bundle, but not edited. `AGENTS.md`, other website pages/assets, references, pre-existing backups, historical versions, `testimonial studio.rtf` and `Testimonials alias` were not edited. Google resources and live website were not changed. The backup archive stays local, outside the public package and GitHub upload.

Repository mapping: local `site/...` files map to repository root paths. Other listed source paths retain their project-root names. `MASTERPLAN.md`, detailed `README.md`, verification notes and this inventory stay local. Automatic approval review rejected publishing internal planning and the detailed operational guide to the public repository. Source changes go only to the `testimonial-studio` branch; no main merge or publishing.

## Follow-up: folder consolidation and graphics reset

- Moved `integrations/testimonials/` to `testimonials-studio/`, root `tools/` into `testimonials-studio/tools/`, and `tests/testimonials/` into `testimonials-studio/tests/`; removed the now-empty container folders.
- Moved the two loose reference images into `references/technical/` and `references/colors/`; moved the original Studio RTF and Finder alias into `testimonials-studio/references/`. These four files are byte-identical.
- Updated `AGENTS.md`, `MASTERPLAN.md`, Studio documentation, build/package script paths, test source paths and the two retired-source pointers in `site/google-apps-script/`.
- Fixed `testimonials-studio/graphics.js`; rebuilt `testimonials-studio/preview.html` and `testimonials-studio/studio.html`.
- No production URLs, Google resources, historical backups, or unrelated website content changed.
