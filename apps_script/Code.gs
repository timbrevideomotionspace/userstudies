/* Receives the answers of the study pages and writes them into the spreadsheet this script is bound to:
   one tab per study (named by the page's `study` field, one row per example), plus a "raw" tab with every submission as received.
   A submission id that is already in "raw" is acknowledged and not written again, so a page may safely resend.
   CAP (user 2026-11-11: "from this point on both user studies only take 42 more inputs"): each study takes CAP submissions received from CAP_FROM on;
   later ones are still kept in "raw" (marked over_cap) but not written to the study's tab, and the page is told the study is closed.
   GET ?count=<study> returns {count, cap, open} for that study; the pages ask on the intro and hide Start once it is full. */

const CAP = 42, CAP_FROM = new Date('2026-11-11T17:20:00Z');   // 10:20 AM Vancouver, Nov 11 2026

function used(raw, study) {               // submissions of `study` received since CAP_FROM
  if (raw.getLastRow() < 2) return 0;
  return raw.getRange(2, 1, raw.getLastRow() - 1, 2).getValues().filter(r => r[1] === study && new Date(r[0]) >= CAP_FROM).length;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const body = e.postData.contents, d = JSON.parse(body), ss = SpreadsheetApp.getActiveSpreadsheet(), now = new Date();
    const raw = ss.getSheetByName('raw') || ss.insertSheet('raw');
    if (raw.getLastRow() === 0) raw.appendRow(['received', 'study', 'submission', 'participant', 'payload']);
    if (raw.createTextFinder(String(d.submission)).matchEntireCell(true).findNext()) return out({ok: true, duplicate: true});
    const over = used(raw, d.study) >= CAP;
    raw.appendRow([now, d.study, d.submission, d.participant, body].concat(over ? ['over_cap'] : []));
    if (over) return out({ok: true, closed: true});
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

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.count) {
    const raw = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('raw'), n = raw ? used(raw, p.count) : 0;
    return out({ok: true, study: p.count, count: n, cap: CAP, open: n < CAP});
  }
  return out({ok: true, service: 'userstudies'});
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
