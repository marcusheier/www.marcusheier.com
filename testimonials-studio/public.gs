/* PUBLIC project: core.gs + public.gs ONLY. Never install admin.gs here. */
function doGet(e) {
  try {
    if (!e || !e.parameter || e.parameter.action !== 'published') return json_({ ok: false, error: 'Unsupported action' });
    const reviews = records_().filter(eligible_).sort((a,b) => a.order - b.order || a.id.localeCompare(b.id));
    return json_({ ok: true, reviews: reviews.map(publicRecord_) });
  } catch (err) { console.error(err); return json_({ ok: false, error: 'Testimonials are temporarily unavailable.' }); }
}
function doPost(e) {
  try {
    if (!e || !e.postData || e.postData.contents.length > 7200000) throw new Error('Invalid request');
    const p = JSON.parse(e.postData.contents);
    if (p.action && p.action !== 'submit') throw new Error('Unsupported action');
    if (p.website) return json_({ ok: true });
    studioLink_('check'); // Fail before saving if setup is incomplete.
    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    let created;
    try {
      const key = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(p.name) + '\n' + String(p.testimonial)));
      const cache = CacheService.getScriptCache();
      if (cache.get(key)) return json_({ ok: true });
      created = create_(p);
      cache.put(key, created.id, 21600);
    } finally { lock.releaseLock(); }
    let notification = 'sent';
    try { notify_(created); } catch (err) { notification = 'failed'; console.error('Notification failed for ' + created.id); }
    const s = receipts_(); const rows = s.getDataRange().getValues();
    const i = rows.findIndex(r => String(r[0]) === created.id);
    if (i > 0) s.getRange(i + 1, 6).setValue(notification);
    return json_({ ok: true });
  } catch (err) { console.error(err); return json_({ ok: false, error: 'Unable to save. Check your name, text and image, then try again.' }); }
}
function notify_(r) {
  const to = config_().NOTIFICATION_EMAIL;
  if (!to) throw new Error('Missing notification recipient');
  MailApp.sendEmail({ to, subject: 'New testimonial for review',
    body: 'New testimonial from ' + r.name + '\n\n' + r.testimonial + '\n\nReview in Studio: ' + studioLink_(r.id) + '\n\nThis review is pending. Opening this link never publishes it.' });
}
