# Google connection setup

1. Open the `Testimonials` Sheet and choose **Extensions → Apps Script**.
2. Replace the starter code with `Code.gs`.
3. Save, choose **Deploy → New deployment → Web app**.
4. Run as the Google account that owns the Sheet and Drive folder. Set access to **Anyone**.
5. Authorize the requested Sheets and Drive permissions.
6. Copy the deployment URL into `TESTIMONIALS_ENDPOINT` in `js/testimonials.js`.

The Sheet should have a tab named `Testimonials`, or the script will use the first tab. New rows preserve the visible layout of date, name, testimonial, original image URL, studio link, and status, with the private record ID and image ID stored in columns G and H. The studio link is displayed as a clickable `Open studio` link and uses only the short ID, so testimonials are not limited by URL length. Uploaded images and carousel PNGs are stored in the configured Drive folder. The studio uses the Apps Script endpoint to load the private portrait by file ID, so the Drive file does not need to be made public.

The front end includes free built-in spam controls: a honeypot field, minimum completion time, required-field validation, a five-megabyte image limit, and duplicate protection in Apps Script.
