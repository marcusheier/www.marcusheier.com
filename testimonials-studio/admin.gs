/* OWNER project: core.gs + admin.gs + generated studio.html ONLY. */
function owner_() {
  const p = config_(), owner = String(p.OWNER_EMAIL || '').toLowerCase();
  const active = Session.getActiveUser().getEmail().toLowerCase();
  const effective = Session.getEffectiveUser().getEmail().toLowerCase();
  if (!owner || !active || active !== owner || effective !== owner) throw new Error('Owner access required. Sign in using the deploying account.');
}
function doGet(e) {
  owner_();
  const t = HtmlService.createTemplateFromFile('studio');
  t.reviewId = JSON.stringify(String(e && e.parameter && e.parameter.id || '')).replace(/</g, '\\u003c');
  return t.evaluate().setTitle('Testimonial Studio');
}
function setupStudio() {
  owner_(); sheet_();
  table_(RECEIPTS_, ['Record ID', 'Received', 'Text permission', 'Portrait permission', 'Permission version', 'Notification'], true);
  table_(SETTINGS_, ['Record ID', 'Settings JSON'], true);
  return 'Ready. Original rows and formatting were not changed.';
}
function studioApi(request) {
  owner_(); // Every RPC invocation is authenticated, including read and image requests.
  if (!request || typeof request.action !== 'string') throw new Error('Invalid request');
  const p = request.payload || {};
  if (request.action === 'list') return { reviews: records_().map(r => { delete r.originalRow; return r; }), sheetUrl: 'https://docs.google.com/spreadsheets/d/' + config_().SPREADSHEET_ID + '/edit' };
  if (request.action === 'portrait') {
    const r = records_().find(r => r.id === p.id); if (!r) throw new Error('Review not found');
    return { portrait: portrait_(r) };
  }
  if (request.action === 'graphic') {
    const img = imageBytes_(p.imageData);
    if (img.mime !== 'image/png' || !config_().GRAPHICS_FOLDER_ID) throw new Error('Configure the existing graphics folder. PNG required.');
    const file = DriveApp.getFolderById(config_().GRAPHICS_FOLDER_ID).createFile(Utilities.newBlob(img.bytes, 'image/png', 'testimonial-' + Utilities.getUuid() + '.png'));
    return { url: file.getUrl() };
  }
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (request.action === 'create') { studioLink_('check'); const r = create_(p); return { id: r.id }; }
    if (request.action !== 'save') throw new Error('Unsupported action');
    const r = records_().find(r => r.id === p.id); if (!r) throw new Error('Review not found');
    if (p.revision !== r.revision) throw new Error('This review changed in another window. Reload before saving.');
    if (!['pending','published','hidden'].includes(p.state) || typeof p.selected !== 'boolean' || typeof p.showPortrait !== 'boolean') throw new Error('Invalid moderation settings');
    const order = Number(p.order);
    if (!Number.isInteger(order) || order < 0 || order > 100000) throw new Error('Order must be an integer from 0 to 100000');
    const note = text_(p.permissionNote || '', 1000, false);
    const verifiedPermission = p.verifiedPermission === true;
    const verifiedPortraitPermission = verifiedPermission;
    if ((verifiedPermission || verifiedPortraitPermission) && !note) throw new Error('Record the source of permission for an existing testimonial.');
    if (p.state === 'published' && !(r.permission || verifiedPermission)) throw new Error('Publication permission is required.');
    if (p.showPortrait && !(r.permission || verifiedPermission)) throw new Error('Publication permission is required for the portrait.');
    const m = { state: p.state, selected: p.selected, order, displayName: text_(p.displayName,80,true), excerpt: text_(p.excerpt || '',12000,false), category: text_(p.category || '',80,false), showPortrait: p.showPortrait,
      verifiedPermission, verifiedPortraitPermission, permissionNote: note, revision: Utilities.getUuid(), updatedAt: new Date().toISOString() };
    const s = settings_(), values = s.getDataRange().getValues(), index = values.findIndex(row => String(row[0]) === r.id);
    if (index < 0) s.appendRow([r.id, JSON.stringify(m)]); else s.getRange(index + 1, 2).setValue(JSON.stringify(m));
    return { ok: true };
  } finally { lock.releaseLock(); }
}
