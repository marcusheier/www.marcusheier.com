/* Shared private helpers. Copy into BOTH projects. Functions ending _ are not RPC endpoints. */
const RECEIPTS_ = 'Testimonial permissions v1';
const SETTINGS_ = 'Testimonial studio v1';
function config_() {
  const p = PropertiesService.getScriptProperties().getProperties();
  ['SPREADSHEET_ID', 'SHEET_NAME', 'PORTRAIT_FOLDER_ID'].forEach(k => { if (!p[k]) throw new Error('Missing configuration: ' + k); });
  return p;
}
function sheet_() {
  const c = config_();
  const sheet = SpreadsheetApp.openById(c.SPREADSHEET_ID).getSheetByName(c.SHEET_NAME);
  if (!sheet) throw new Error('Configured testimonial tab not found; no fallback is allowed.');
  return sheet;
}
function table_(name, headers, create) {
  const book = SpreadsheetApp.openById(config_().SPREADSHEET_ID);
  let s = book.getSheetByName(name);
  if (!s && create) { s = book.insertSheet(name); s.appendRow(headers); }
  if (!s || JSON.stringify(s.getRange(1, 1, 1, headers.length).getValues()[0]) !== JSON.stringify(headers)) throw new Error('Run owner setup; metadata tab is missing or conflicts: ' + name);
  return s;
}
function receipts_() { return table_(RECEIPTS_, ['Record ID', 'Received', 'Text permission', 'Portrait permission', 'Permission version', 'Notification']); }
function settings_() { return table_(SETTINGS_, ['Record ID', 'Settings JSON']); }
function text_(value, max, required) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('Invalid text or length.');
  return value.trim();
}
function literal_(s) { return /^[=+\-@\t\r\n]/.test(String(s)) ? "'" + s : s; }
function unliteral_(s) { return String(s || '').replace(/^'(?=[=+\-@\t\r\n])/, ''); }
function records_() {
  const originals = sheet_().getDataRange().getValues();
  const receipts = new Map(receipts_().getDataRange().getValues().slice(1).map(r => [String(r[0]), r]));
  const settings = new Map(settings_().getDataRange().getValues().slice(1).map(r => [String(r[0]), JSON.parse(r[1])]));
  const seen = new Set();
  return originals.filter(r => r[6] && !/^(record id|id)$/i.test(String(r[6]).trim())).map((r, index) => {
    const id = String(r[6]);
    if (seen.has(id)) throw new Error('Duplicate original record IDs; resolve before moderation.');
    seen.add(id);
    const receipt = receipts.get(id) || [];
    const m = settings.get(id) || {};
    return { id, name: unliteral_(r[1]), testimonial: unliteral_(r[2]), imageUrl: String(r[3] || ''), imageId: String(r[7] || ''),
      date: r[0] instanceof Date ? r[0].toISOString() : String(r[0] || ''),
      permission: receipt[2] === true || m.verifiedPermission === true,
      portraitPermission: receipt[3] === true || m.verifiedPortraitPermission === true,
      state: m.state || 'pending', selected: m.selected === true, order: Number(m.order) || 0,
      displayName: m.displayName === undefined ? unliteral_(r[1]) : m.displayName,
      excerpt: m.excerpt || '', category: m.category || '', showPortrait: m.showPortrait === true,
      verifiedPermission: m.verifiedPermission === true, verifiedPortraitPermission: m.verifiedPortraitPermission === true, permissionNote: m.permissionNote || '', revision: m.revision || '', originalRow: index + 2 };
  });
}
function imageBytes_(data) {
  if (typeof data !== 'string' || data.length > 7100000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data)) throw new Error('Use a JPEG, PNG or WebP image up to 5 MB.');
  const bytes = Utilities.base64Decode(data.split(',')[1]);
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new Error('Image too large.');
  const b = bytes.map(v => (v + 256) % 256);
  const mime = data.substring(5, data.indexOf(';'));
  const valid = mime === 'image/jpeg' ? b[0] === 255 && b[1] === 216 && b[2] === 255 : mime === 'image/png' ? [137,80,78,71,13,10,26,10].every((n,i) => n === b[i]) : String.fromCharCode(...b.slice(0,4)) === 'RIFF' && String.fromCharCode(...b.slice(8,12)) === 'WEBP';
  if (!valid) throw new Error('Image signature does not match its type.');
  return { bytes, mime };
}
function portrait_(r) {
  if (!r.imageId) return '';
  const file = DriveApp.getFileById(r.imageId);
  const parents = file.getParents(); let belongs = false;
  while (parents.hasNext()) if (parents.next().getId() === config_().PORTRAIT_FOLDER_ID) belongs = true;
  if (!belongs || !/^image\/(jpeg|png|webp)$/.test(file.getMimeType()) || file.getSize() > 5 * 1024 * 1024) throw new Error('Portrait is outside the configured folder or unsupported.');
  return 'data:' + file.getMimeType() + ';base64,' + Utilities.base64Encode(file.getBlob().getBytes());
}
function create_(p) {
  const name = text_(p.name, 80, true), testimonial = text_(p.testimonial, 12000, true);
  if (typeof p.permission !== 'boolean' || typeof p.portraitPermission !== 'boolean') throw new Error('Please choose publication permissions.');
  receipts_(); settings_();
  const id = Utilities.getUuid(), now = new Date();
  let file, imageId = '', imageUrl = '';
  if (p.imageData) {
    const img = imageBytes_(p.imageData);
    file = DriveApp.getFolderById(config_().PORTRAIT_FOLDER_ID).createFile(Utilities.newBlob(img.bytes, img.mime, id + '-original.' + img.mime.split('/')[1]));
    imageId = file.getId(); imageUrl = file.getUrl();
  }
  // Only append: never rewrite existing rows, links, statuses, or formatting.
  sheet_().appendRow([now, literal_(name), literal_(testimonial), imageUrl, studioLink_(id), 'Pending', id, imageId]);
  receipts_().appendRow([id, now, p.permission, p.portraitPermission, 'website-v1', 'not sent']);
  return { id, name, testimonial, now, imageUrl };
}
function studioLink_(id) {
  const url = config_().STUDIO_URL;
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url || '')) throw new Error('Configure the protected Studio deployment URL.');
  return url + '?id=' + encodeURIComponent(id);
}
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function publicRecord_(r) {
  return { name: r.displayName, testimonial: r.excerpt || r.testimonial, category: r.category,
    portrait: r.showPortrait && r.portraitPermission ? portrait_(r) : '' };
}
function eligible_(r) { return r.state === 'published' && r.selected && r.permission; }
