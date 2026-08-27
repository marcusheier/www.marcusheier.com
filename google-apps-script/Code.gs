/**
 * Marcus Heier testimonial bridge.
 *
 * Paste this file into a Google Apps Script project owned by info@marcusheier.com.
 * Deploy as a web app, execute as you, and allow anyone with the link to submit.
 * Then place the deployment URL in js/testimonials.js.
 */
const CONFIG = {
  spreadsheetId: '1hY_VAKohwLQyVjSy_LIFeAGmyR27fTMyRfo7gh0v5jA',
  sheetName: 'Testimonials',
  driveFolderId: '1u34p69AiW5bQG0qB9grBVoNPCvmVtkO6',
  studioUrl: 'https://www.marcusheier.com/testimonials-studio-432'
};

function doPost(e) {
  try {
    const params = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : (e.parameter || {});
    if (params.action === 'saveGraphic') return saveGraphic_(params);
    if (params.website || !params.name || !params.testimonial) return json_({ ok: true });
    const now = new Date();
    const recordId = Utilities.getUuid();
    const cache = CacheService.getScriptCache();
    const fingerprint = Utilities.base64EncodeWebSafe(`${params.name}|${params.testimonial}`).slice(0, 80);
    if (cache.get(`testimonial:${fingerprint}`)) return json_({ ok: true });
    cache.put(`testimonial:${fingerprint}`, '1', 86400);
    const folder = DriveApp.getFolderById(CONFIG.driveFolderId);
    let imageUrl = '';
    let imageId = '';
    if (params.imageData) {
      const imageBytes = Utilities.base64Decode(params.imageData.split(',').pop());
      const firstName = firstName_(params.name);
      const imageBlob = Utilities.newBlob(imageBytes, params.imageMimeType || 'image/jpeg', `${firstName}-original-${now.getTime()}.jpg`);
      const imageFile = folder.createFile(imageBlob);
      imageId = imageFile.getId();
      imageUrl = imageFile.getUrl();
    }
    const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheetName) || SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheets()[0];
    const studioLink = `${CONFIG.studioUrl}?id=${encodeURIComponent(recordId)}`;
    sheet.appendRow([now, params.name, params.testimonial, imageUrl, '', 'Received', recordId, imageId]);
    const newRow = sheet.getLastRow();
    sheet.getRange(newRow, 1, 1, 8).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    sheet.setRowHeight(newRow, 42);
    const studioRichText = SpreadsheetApp.newRichTextValue().setText('Open studio').setLinkUrl(studioLink).build();
    sheet.getRange(newRow, 5).setRichTextValue(studioRichText);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'submission' && e.parameter.id) {
    const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheetName) || SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheets()[0];
    const rows = sheet.getDataRange().getValues();
    const row = rows.find((item) => String(item[6]) === String(e.parameter.id));
    if (!row) return json_({ ok: false, error: 'Submission not found' });
    const date = row[0] instanceof Date ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'MMMM d, yyyy') : String(row[0] || '');
    return json_({ ok: true, name: row[1] || '', testimonial: row[2] || '', date, imageId: row[7] || '' });
  }
  if (e && e.parameter && e.parameter.action === 'image' && e.parameter.id) {
    const file = DriveApp.getFileById(e.parameter.id);
    return json_({ ok: true, mimeType: file.getMimeType(), imageData: Utilities.base64Encode(file.getBlob().getBytes()) });
  }
  return json_({ ok: true, service: 'Marcus Heier testimonials' });
}
function saveGraphic_(params) {
  const images = Array.isArray(params.images) ? params.images : (params.imageData ? [params.imageData] : []);
  if (!images.length) return json_({ ok: false, error: 'Missing image data' });
  const folder = DriveApp.getFolderById(CONFIG.driveFolderId);
  const safeName = firstName_(params.name);
  const urls = images.map((imageData, index) => {
    const bytes = Utilities.base64Decode(imageData.split(',').pop());
    const slideNumber = params.slideNumber || (index + 1);
    const suffix = (params.slideCount > 1 || images.length > 1) ? `-slide-${slideNumber}` : '';
    const file = folder.createFile(Utilities.newBlob(bytes, 'image/png', `${safeName}-testimonial${suffix}.png`));
    return file.getUrl();
  });
  return json_({ ok: true, urls });
}

function firstName_(name) {
  const firstName = String(name || 'testimonial').trim().split(/\s+/)[0];
  return firstName.replace(/[^a-z0-9-_]/gi, '').slice(0, 40) || 'testimonial';
}
function json_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
