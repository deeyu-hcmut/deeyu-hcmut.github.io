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

// Gửi thử email xác nhận đăng ký mẫu tới chính bạn để xem giao diện mới (dữ liệu giả, không ghi gì vào Firestore)
function guiThuMau() {
  const me = Session.getActiveUser().getEmail();
  const reg = { fullName: 'Nguyễn Văn A', eventTitle: 'Sự kiện mẫu', ticketCode: 'MAU-123456', mssv: '2310000' };
  const event = { eventDate: '2027-03-31', startTime: '08:00', location: 'Sảnh BK.B6' };
  const qr = qrImages(reg.ticketCode);
  send(me, `[${SENDER_NAME}] Xác nhận đăng ký: ${reg.eventTitle}`, confirmationBody(reg, event, Boolean(qr.qr)), qr);
  console.log(`Đã gửi email mẫu tới ${me}.`);
}

// ---------------------------------------------------------------- run

function guiEmail() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    // One failing step must not stop the others (e.g. a reminder error would hold back every queued email)
    const results = [
      ['Xác nhận đăng ký', sendRegistrationConfirmations],
      ['Xếp nhắc 24h', queueReminders],
      ['Email chờ gửi', sendQueued],
    ].map(([label, step]) => {
      try {
        return `${label}: ${step()}`;
      } catch (err) {
        console.error(`${label} lỗi: ${err}`);
        return `${label}: LỖI`;
      }
    });
    console.log(`${results.join('. ')}. Còn ${MailApp.getRemainingDailyQuota()} email hôm nay.`);
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
      const qr = qrImages(r.ticketCode);
      const ok = trySend(contact.email, subject, confirmationBody(r, event, Boolean(qr.qr)), qr);
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
        mssv: reg.data.mssv,
        eventTitle: e.title,
        eventWhen: `${e.startTime || ''} Ngày ${formatDate(e.eventDate)}`.trim(),
        location: e.location || '',
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
    const qr = l.type === 'REMINDER_24H' ? qrImages(l.ticketCode) : {};
    const ok = trySend(l.recipientEmail, l.subject, queuedBody(l, Boolean(qr.qr)), qr);
    writes.push(updateWrite(`emailLogs/${log.id}`, { status: ok ? 'SENT' : 'FAILED', sentAt: new Date().toISOString() }));
    if (ok) sent++;
  }
  commitAll(writes);
  return sent;
}

// ---------------------------------------------------------------- email content

// Same look as the email preview in the admin page (Quản trị → Nhật ký Email), on a white card
const PURPLE = '#4e4ecc'; // the site's brand violet (blue-600 on dark surfaces)
const NAVY = '#180c5e'; // logo colour

function confirmationBody(r, event, withQr) {
  const when = event.eventDate ? `${event.startTime || ''} Ngày ${formatDate(event.eventDate)}`.trim() : '';
  return layout('XÁC NHẬN ĐĂNG KÝ SỰ KIỆN THÀNH CÔNG', r.fullName, r.mssv, `
    <p>Xác nhận đăng ký tham gia thành công sự kiện <b>${esc(r.eventTitle)}</b>.</p>
    ${ticketCard(r.ticketCode, when, event.location, withQr)}
    <p style="font-size:12px;color:#64748b">Vui lòng lưu lại email này hoặc xuất trình mã vé và mã QR tại cổng sự kiện để hoàn tất điểm danh.</p>`);
}

function queuedBody(l, withQr) {
  const code = l.ticketCode ? ` (#${esc(l.ticketCode)})` : '';
  if (l.type === 'REMINDER_24H') {
    return layout('NHẮC NHỞ: SỰ KIỆN SẮP DIỄN RA TRONG 24H', l.recipientName, l.mssv, `
      <p>Nhắc nhở tham gia sự kiện <b>${esc(l.eventTitle || 'bạn đã đăng ký')}</b> sẽ diễn ra trong vòng <b>24 giờ tới</b>${l.eventWhen ? `, vào <b>${esc(l.eventWhen)}</b>` : ''}${l.location ? ` tại <b>${esc(l.location)}</b>` : ''}.</p>
      ${ticketCard(l.ticketCode, l.eventWhen, l.location, withQr)}
      ${notice('#fffbeb', '#fde68a', '#78350f', `⚡ <b>Lưu ý:</b> Vui lòng mặc trang phục lịch sự / Áo Đoàn và mang theo thẻ sinh viên kèm vé QR${code}.`)}`);
  }
  if (l.type === 'ATTENDANCE_SUCCESS') {
    return layout('XÁC NHẬN ĐIỂM DANH THAM DỰ SỰ KIỆN', l.recipientName, l.mssv, `
      <p>Xác nhận điểm danh tham dự thành công${l.eventTitle ? ` sự kiện <b>${esc(l.eventTitle)}</b>` : ''}.</p>
      ${ticketCard(l.ticketCode)}
      ${notice('#ecfdf5', '#a7f3d0', '#064e3b', '🎉 <b>Ban Tổ chức đã ghi nhận bạn tham gia đầy đủ chương trình.</b>', 'center')}`);
  }
  return layout(esc(l.subject), l.recipientName, l.mssv, '');
}

// ---- shared HTML pieces (inline styles only: mail clients ignore <style> blocks)

function layout(title, name, mssv, content) {
  const who = mssv ? `${name} - ${mssv}` : name;
  return `
  <div style="background:#f1f5f9;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#334155;font-size:14px;line-height:1.6">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:24px">
      <div style="text-align:center;border-bottom:1px solid #cbd5e1;padding-bottom:16px">
        <div style="display:inline-block;background:${PURPLE};color:#ffffff;font-weight:bold;font-size:12px;letter-spacing:1px;padding:5px 14px;border-radius:999px">ĐOÀN - HỘI KHOA ĐIỆN - ĐIỆN TỬ</div>
        <h2 style="margin:10px 0 0;font-size:20px;color:${NAVY}">${title}</h2>
      </div>
      <div style="padding:20px 0 8px">
        <p style="margin:0 0 12px"><i><u>Thân gửi:</u></i> <b>${esc(who)}</b>;</p>
        ${content}
      </div>
      <div style="border-top:1px solid #cbd5e1;margin-top:12px;padding-top:12px;text-align:center;font-size:11px;color:#94a3b8">
        Đoàn - Hội Khoa Điện - Điện tử • Email: dtn-ddt@hcmut.edu.vn
      </div>
    </div>
  </div>`;
}

function ticketCard(code, when, location, withQr) {
  const line = [when ? `Thời gian: ${esc(when)}` : '', location ? esc(location) : ''].filter(Boolean).join(' • ');
  return `
    <div style="margin:16px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;text-align:center">
      <div style="font-size:12px;font-weight:bold;color:#64748b">MÃ VÉ ĐIỆN TỬ CỦA BẠN</div>
      <div style="font-family:'Courier New',monospace;font-size:26px;font-weight:bold;color:${PURPLE};margin:4px 0">${code ? `#${esc(code)}` : ''}</div>
      ${line ? `<div style="font-size:12px;color:#475569">${line}</div>` : ''}
      ${withQr ? '<img src="cid:qr" width="180" height="180" alt="Mã QR của vé" style="display:block;margin:12px auto 0;border-radius:8px;background:#ffffff">' : ''}
    </div>`;
}

function notice(background, border, color, html, align) {
  return `<div style="margin:16px 0;padding:12px 14px;background:${background};border:1px solid ${border};border-radius:10px;color:${color};font-size:13px;text-align:${align || 'left'}">${html}</div>`;
}

// QR of the ticket code (what the check-in scanner reads, same as the ticket on the website) as an
// inline image, so it shows without "load images". Rendered by a public QR service; if that is
// unreachable the email still goes out with the ticket code and no image.
function qrImages(code) {
  if (!code) return {};
  try {
    const res = UrlFetchApp.fetch(`https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(code)}`, { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) return { qr: res.getBlob().setName('qr.png') };
  } catch (err) {
    console.warn(`Không tạo được QR cho ${code}: ${err}`);
  }
  return {};
}

function trySend(to, subject, html, inlineImages) {
  try {
    send(to, subject, html, inlineImages);
    return true;
  } catch (err) {
    console.warn(`Không gửi được tới ${to}: ${err}`);
    return false;
  }
}

function send(to, subject, html, inlineImages) {
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: html, name: SENDER_NAME, inlineImages: inlineImages || {} });
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
