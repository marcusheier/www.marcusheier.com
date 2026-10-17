# Testimonial Studio implementation branch

This branch contains the testimonial application source, local preview, packaging tools and automated tests. It is **not a Google deployment or live website cutover**.

Local preview: serve the repository on a loopback HTTP server and open `integrations/testimonials/preview.html`. All examples are fictional and session-only. Rebuild generated HTML with `python3 tools/build-testimonial-studio.py`. Run `node --test tests/testimonials/*.test.cjs`.

Account-specific setup instructions, verification notes and the project masterplan remain in the local project. They are intentionally excluded from this public branch. No private review records, portraits or credentials are included.

Do not merge or publish this branch until Google setup and acceptance checks pass and the hosting artifact is restricted to public website files. Local public configuration is intentionally empty. The production site is unchanged.
