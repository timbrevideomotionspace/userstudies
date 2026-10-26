/* Receives the answers of the study pages and writes them into the spreadsheet this script is bound to:
   one tab per study (named by the page's `study` field, one row per example), plus a "raw" tab with every submission as received.
   A submission id that is already in "raw" is acknowledged and not written again, so a page may safely resend. */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const body = e.postData.contents, d = JSON.parse(body), ss = SpreadsheetApp.getActiveSpreadsheet(), now = new Date();
    const raw = ss.getSheetByName('raw') || ss.insertSheet('raw');
    if (raw.getLastRow() === 0) raw.appendRow(['received', 'study', 'submission', 'participant', 'payload']);
    if (raw.createTextFinder(String(d.submission)).matchEntireCell(true).findNext()) return out({ok: true, duplicate: true});
    raw.appendRow([now, d.study, d.submission, d.participant, body]);
    const name = String(d.study || 'unknown').replace(/[^\w-]/g, '_').slice(0, 90);
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(['received'].concat(d.columns));
    if (d.rows && d.rows.length)
      sh.getRange(sh.getLastRow() + 1, 1, d.rows.length, d.columns.length + 1).setValues(d.rows.map(r => [now].concat(r)));
    return out({ok: true});
  } catch (err) {
    return out({ok: false, error: String(err)});
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return out({ok: true, service: 'userstudies'});
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
