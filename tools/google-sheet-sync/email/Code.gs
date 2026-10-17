/**
 * Gửi email tự động cho cổng thông tin bằng Gmail của người cài đặt (miễn phí, không cần Firebase Blaze).
 * Hướng dẫn cài đặt: tools/google-sheet-sync/README.md (mục "Gửi email tự động")
 *
 * Mỗi lần chạy (mặc định mỗi 5 phút):
 *   1. Đăng ký mới trên web (`registrations`) → gửi email xác nhận kèm mã vé, ghi vào `emailLogs` (SENT).
 *   2. Sự kiện bắt đầu trong vòng 24 giờ tới → xếp email nhắc cho mọi người đã đăng ký (một lần cho mỗi
 *      ngày giờ bắt đầu; đổi giờ sự kiện thì nhắc lại).
 *   3. Email đang chờ trong `emailLogs` (status QUEUED: điểm danh thành công, nhắc lịch 24h) → gửi, đổi thành SENT.
 * Địa chỉ không gửi được thì đánh dấu FAILED, không thử lại (tránh tốn hạn mức gửi mỗi ngày).
 *
 * Script chạy bằng tài khoản Google của người cài đặt; tài khoản đó phải là Owner/Editor
 * của project Firebase. Firestore Security Rules không áp dụng cho truy cập này.
 */

const PROJECT_ID = 'deeyu-hcmut';
const SITE_URL = 'https://deeyu-hcmut.github.io/';
const SENDER_NAME = 'Đoàn - Hội Khoa Điện - Điện tử';
const RUN_EVERY_MINUTES = 5;
// Each run reads at most this many records per step; the rest wait for the next run
const BATCH = 50;

const DOCS_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DOC_PREFIX = `projects/${PROJECT_ID}/databases/(default)/documents/`;
const LAST_REGISTRATION_KEY = 'lastRegistrationAt';

// ---------------------------------------------------------------- triggers (chạy từ trình chỉnh sửa)

function batTuDong() {
  tatTuDong();
  // Start from now: registrations made before the script was installed get no email
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(LAST_REGISTRATION_KEY)) props.setProperty(LAST_REGISTRATION_KEY, new Date().toISOString());
  ScriptApp.newTrigger('guiEmail').timeBased().everyMinutes(RUN_EVERY_MINUTES).create();
  console.log(`Đã bật gửi email tự động mỗi ${RUN_EVERY_MINUTES} phút.`);
}

function tatTuDong() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'guiEmail')
    .forEach(t => ScriptApp.deleteTrigger(t));
}

// Gửi thử một email tới chính bạn để kiểm tra cài đặt
function guiThu() {
  const me = Session.getActiveUser().getEmail();
  send(me, 'Gửi thử email từ cổng thông tin', `<p>Nếu bạn nhận được email này thì script gửi email đã hoạt động.</p>`);
  console.log(`Đã gửi thử tới ${me}. Còn ${MailApp.getRemainingDailyQuota()} email được gửi hôm nay.`);
}

// ---------------------------------------------------------------- run

function guiEmail() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const confirmed = sendRegistrationConfirmations();
    const reminders = queueReminders();
    const queued = sendQueued();
    console.log(`Xác nhận đăng ký: ${confirmed}. Xếp nhắc 24h: ${reminders}. Email chờ gửi: ${queued}. Còn ${MailApp.getRemainingDailyQuota()} email hôm nay.`);
  } finally {
    lock.releaseLock();
  }
}

function sendRegistrationConfirmations() {
  const props = PropertiesService.getScriptProperties();
  const since = props.getProperty(LAST_REGISTRATION_KEY);
  if (!since) return 0; // batTuDong() has not been run yet

  const regs = runQuery({
    from: [{ collectionId: 'registrations' }],
    where: { fieldFilter: { field: { fieldPath: 'registeredAt' }, op: 'GREATER_THAN', value: { stringValue: since } } },
    orderBy: [{ field: { fieldPath: 'registeredAt' }, direction: 'ASCENDING' }],
    limit: BATCH,
  });

  const events = {};
  const logs = [];
  let sent = 0;
  for (const reg of regs) {
    if (MailApp.getRemainingDailyQuota() < 1) break; // stop before advancing, so the rest go out tomorrow
    const r = reg.data;
    const contact = getDoc(`registrationContacts/${reg.id}`);
    if (contact && contact.email) {
      const event = events[r.eventId] || (events[r.eventId] = getDoc(`events/${r.eventId}`) || {});
      const subject = `[${SENDER_NAME}] Xác nhận đăng ký: ${r.eventTitle}`;
      const ok = trySend(contact.email, subject, confirmationBody(r, event));
      logs.push(createWrite('emailLogs', {
        recipientEmail: contact.email,
        recipientName: r.fullName,
        subject: subject,
        type: 'REGISTRATION_CONFIRMATION',
        sentAt: new Date().toISOString(),
        status: ok ? 'SENT' : 'FAILED',
        ticketCode: r.ticketCode,
      }));
      if (ok) sent++;
    }
    props.setProperty(LAST_REGISTRATION_KEY, r.registeredAt);
  }
  commitAll(logs);
  return sent;
}

// Queues REMINDER_24H emails (sent by sendQueued, within the daily quota) for events starting in the next 24h.
// `reminderFor` on the event holds the start it was sent for, so a rescheduled event is reminded again.
function queueReminders() {
  const now = new Date();
  const today = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  const tomorrow = Utilities.formatDate(new Date(now.getTime() + 86400000), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  const events = runQuery({
    from: [{ collectionId: 'events' }],
    where: { compositeFilter: { op: 'AND', filters: [
      { fieldFilter: { field: { fieldPath: 'eventDate' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: today } } },
      { fieldFilter: { field: { fieldPath: 'eventDate' }, op: 'LESS_THAN_OR_EQUAL', value: { stringValue: tomorrow } } },
    ] } },
  });

  let queued = 0;
  for (const evt of events) {
    const e = evt.data;
    const startKey = `${e.eventDate} ${e.startTime || '00:00'}`;
    const start = new Date(`${e.eventDate}T${e.startTime || '00:00'}:00+07:00`);
    if (e.reminderFor === startKey || start <= now || start - now > 86400000) continue;

    const regs = runQuery({
      from: [{ collectionId: 'registrations' }],
      where: { fieldFilter: { field: { fieldPath: 'eventId' }, op: 'EQUAL', value: { stringValue: evt.id } } },
    });
    const writes = [];
    regs.forEach(reg => {
      const contact = getDoc(`registrationContacts/${reg.id}`);
      if (!contact || !contact.email) return;
      writes.push(createWrite('emailLogs', {
        recipientEmail: contact.email,
        recipientName: reg.data.fullName,
        subject: `[Nhắc nhở 24h] Sự kiện "${e.title}" sắp diễn ra tại ${e.location}`,
        type: 'REMINDER_24H',
        sentAt: now.toISOString(),
        status: 'QUEUED',
        ticketCode: reg.data.ticketCode,
      }));
    });
    writes.push(updateWrite(`events/${evt.id}`, { reminderFor: startKey }));
    commitAll(writes);
    queued += writes.length - 1;
  }
  return queued;
}

function sendQueued() {
  const queued = runQuery({
    from: [{ collectionId: 'emailLogs' }],
    where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'QUEUED' } } },
    limit: BATCH,
  });

  const writes = [];
  let sent = 0;
  for (const log of queued) {
    if (MailApp.getRemainingDailyQuota() < 1) break;
    const l = log.data;
    const ok = trySend(l.recipientEmail, l.subject, queuedBody(l));
    writes.push(updateWrite(`emailLogs/${log.id}`, { status: ok ? 'SENT' : 'FAILED', sentAt: new Date().toISOString() }));
    if (ok) sent++;
  }
  commitAll(writes);
  return sent;
}

// ---------------------------------------------------------------- email content

function confirmationBody(r, event) {
  const when = event.eventDate ? `${event.startTime || ''} ngày ${formatDate(event.eventDate)}` : '';
  return `
    <p>Chào <b>${esc(r.fullName)}</b>,</p>
    <p>Bạn đã đăng ký thành công sự kiện <b>${esc(r.eventTitle)}</b>.</p>
    <table cellpadding="4" style="border-collapse:collapse">
      <tr><td>Mã vé</td><td><b style="font-family:monospace;font-size:16px">#${esc(r.ticketCode)}</b></td></tr>
      <tr><td>MSSV</td><td>${esc(r.mssv)}</td></tr>
      ${when ? `<tr><td>Thời gian</td><td>${esc(when)}</td></tr>` : ''}
      ${event.location ? `<tr><td>Địa điểm</td><td>${esc(event.location)}</td></tr>` : ''}
    </table>
    <p>Khi đến sự kiện, hãy mở vé QR trên <a href="${SITE_URL}">${SITE_URL}</a>
       (mục Tra cứu vé, nhập MSSV) để Ban Tổ chức quét điểm danh.</p>
    ${footer()}`;
}

function queuedBody(l) {
  const intro = {
    ATTENDANCE_SUCCESS: 'Ban Tổ chức đã ghi nhận bạn <b>điểm danh thành công</b>. Cảm ơn bạn đã tham gia!',
    REMINDER_24H: 'Sự kiện bạn đã đăng ký sẽ diễn ra trong vòng 24 giờ tới. Nhớ mang theo vé QR để điểm danh nhé!',
  }[l.type] || esc(l.subject);
  return `
    <p>Chào <b>${esc(l.recipientName)}</b>,</p>
    <p>${intro}</p>
    ${l.ticketCode ? `<p>Mã vé: <b style="font-family:monospace">#${esc(l.ticketCode)}</b></p>` : ''}
    <p>Xem lại vé tại <a href="${SITE_URL}">${SITE_URL}</a>.</p>
    ${footer()}`;
}

function footer() {
  return `<p style="color:#64748b;font-size:12px">Email tự động từ cổng thông tin ${SENDER_NAME} (HCMUT). Vui lòng không trả lời email này.</p>`;
}

function trySend(to, subject, html) {
  try {
    send(to, subject, html);
    return true;
  } catch (err) {
    console.warn(`Không gửi được tới ${to}: ${err}`);
    return false;
  }
}

function send(to, subject, html) {
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: html, name: SENDER_NAME });
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// YYYY-MM-DD → dd/mm/yyyy
function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

// ---------------------------------------------------------------- Firestore REST

function request(method, url, body) {
  const response = UrlFetchApp.fetch(url, {
    method: method,
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
      // Bill the API quota to the Firebase project, not the hidden Apps Script project
      'X-Goog-User-Project': PROJECT_ID,
    },
    payload: body ? JSON.stringify(body) : undefined,
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code === 404 && method === 'get') return null;
  if (code >= 300) {
    throw new Error(`Firestore trả lỗi ${code}: ${response.getContentText().slice(0, 500)}`);
  }
  return JSON.parse(response.getContentText() || '{}');
}

function getDoc(path) {
  const d = request('get', `${DOCS_URL}/${path}`);
  return d ? decodeFields(d.fields || {}) : null;
}

function runQuery(structuredQuery) {
  const rows = request('post', `${DOCS_URL}:runQuery`, { structuredQuery: structuredQuery });
  return rows.filter(row => row.document).map(row => ({
    id: row.document.name.split('/').pop(),
    data: decodeFields(row.document.fields || {}),
  }));
}

function createWrite(collection, data) {
  return { update: { name: `${DOC_PREFIX}${collection}/${Utilities.getUuid().replace(/-/g, '')}`, fields: encodeFields(data) } };
}

function updateWrite(path, changes) {
  return {
    update: { name: DOC_PREFIX + path, fields: encodeFields(changes) },
    updateMask: { fieldPaths: Object.keys(changes) },
    currentDocument: { exists: true },
  };
}

function commitAll(writes) {
  for (let i = 0; i < writes.length; i += 400) {
    request('post', `${DOCS_URL}:commit`, { writes: writes.slice(i, i + 400) });
  }
}

function encodeFields(data) {
  const fields = {};
  Object.keys(data).forEach(key => {
    const v = data[key];
    if (typeof v === 'number') fields[key] = { integerValue: String(Math.round(v)) };
    else if (typeof v === 'boolean') fields[key] = { booleanValue: v };
    else fields[key] = { stringValue: String(v) };
  });
  return fields;
}

function decodeFields(fields) {
  const out = {};
  Object.keys(fields).forEach(key => {
    const v = fields[key];
    if ('stringValue' in v) out[key] = v.stringValue;
    else if ('booleanValue' in v) out[key] = v.booleanValue;
    else if ('integerValue' in v) out[key] = Number(v.integerValue);
    else if ('doubleValue' in v) out[key] = v.doubleValue;
    else out[key] = '';
  });
  return out;
}
