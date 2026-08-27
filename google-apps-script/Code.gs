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
    const cache = CacheService.getScriptCache();
    const fingerprint = Utilities.base64EncodeWebSafe(`${params.name}|${params.testimonial}`).slice(0, 80);
    if (cache.get(`testimonial:${fingerprint}`)) return json_({ ok: true });
    cache.put(`testimonial:${fingerprint}`, '1', 86400);
    const folder = DriveApp.getFolderById(CONFIG.driveFolderId);
    let imageUrl = '';
    if (params.imageData) {
      const imageBytes = Utilities.base64Decode(params.imageData.split(',').pop());
      const firstName = firstName_(params.name);
      const imageBlob = Utilities.newBlob(imageBytes, params.imageMimeType || 'image/jpeg', `${firstName}-original-${now.getTime()}`);
      imageUrl = folder.createFile(imageBlob).getUrl();
    }
    const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheetName) || SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheets()[0];
    const studioLink = `${CONFIG.studioUrl}?name=${encodeURIComponent(params.name)}&testimonial=${encodeURIComponent(params.testimonial)}&date=${encodeURIComponent(Utilities.formatDate(now, Session.getScriptTimeZone(), 'MMMM d, yyyy'))}&image=${encodeURIComponent(imageUrl)}`;
    sheet.appendRow([now, params.name, params.testimonial, imageUrl, studioLink, 'Received']);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doGet() { return json_({ ok: true, service: 'Marcus Heier testimonials' }); }
function saveGraphic_(params) {
  if (!params.imageData) return json_({ ok: false, error: 'Missing image data' });
  const folder = DriveApp.getFolderById(CONFIG.driveFolderId);
  const safeName = firstName_(params.name);
  const bytes = Utilities.base64Decode(params.imageData.split(',').pop());
  const file = folder.createFile(Utilities.newBlob(bytes, 'image/png', `${safeName}-testimonial.png`));
  return json_({ ok: true, url: file.getUrl() });
}

function firstName_(name) {
  const firstName = String(name || 'testimonial').trim().split(/\s+/)[0];
  return firstName.replace(/[^a-z0-9-_]/gi, '').slice(0, 40) || 'testimonial';
}
function json_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
