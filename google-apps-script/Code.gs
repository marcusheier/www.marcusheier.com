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
  studioUrl: 'https://www.marcusheier.com/testimonials-studio-432',
  notificationEmail: 'info@marcusheier.com'
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
    const studioRichText = SpreadsheetApp.newRichTextValue().setText('Open studio').setLinkUrl(studioLink).build();
    sheet.getRange(newRow, 5).setRichTextValue(studioRichText);
    formatSheetRow_(sheet, newRow);
    SpreadsheetApp.flush();
    try {
      sendNotification_(params.name, params.testimonial, now, studioLink, imageUrl);
    } catch (notificationError) {
      console.error(`Notification email failed: ${notificationError.message}`);
    }
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

function sendNotification_(name, testimonial, date, studioLink, imageUrl) {
  const safeName = escapeHtml_(name);
  const safeTestimonial = escapeHtml_(testimonial).replace(/\n/g, '<br>');
  const formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMMM d, yyyy, h:mm a');
  const safeDate = escapeHtml_(formattedDate);
  const safeStudioLink = escapeHtml_(studioLink);
  const safeImageLink = imageUrl ? `<p><a href="${escapeHtml_(imageUrl)}">View uploaded image</a></p>` : '';
  MailApp.sendEmail({
    to: CONFIG.notificationEmail,
    subject: `New testimonial from ${name}`,
    body: `New testimonial from ${name}\n\n${testimonial}\n\nReceived: ${formattedDate}\nStudio: ${studioLink}${imageUrl ? `\nImage: ${imageUrl}` : ''}`,
    htmlBody: `<p><strong>New testimonial from ${safeName}</strong></p><p>${safeTestimonial}</p><p>Received: ${safeDate}</p><p><a href="${safeStudioLink}">Open testimonial studio</a></p>${safeImageLink}`
  });
}

function testNotificationEmail() {
  MailApp.sendEmail({
    to: CONFIG.notificationEmail,
    subject: 'Testimonials email notification test',
    body: 'This is a test email from the Marcus Heier testimonial system.'
  });
}

function normalizeTestimonialRows() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(CONFIG.sheetName) || spreadsheet.getSheets()[0];
  formatSheetRows_(sheet);
}

function formatSheetRows_(sheet) {
  const rowCount = sheet.getLastRow();
  if (!rowCount) return;
  sheet.getRange(1, 1, rowCount, 8).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sheet.setRowHeights(1, rowCount, 21);
}

function formatSheetRow_(sheet, rowNumber) {
  sheet.getRange(rowNumber, 1, 1, 8).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sheet.setRowHeight(rowNumber, 21);
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function json_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
