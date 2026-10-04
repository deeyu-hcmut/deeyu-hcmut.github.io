/**
 * Đồng bộ danh sách BCH Đoàn, BCH Hội và Trưởng, phó ban Đội CTV giữa Google Sheet và
 * trang "Cơ cấu Tổ chức" của cổng thông tin (Firestore `bch`).
 * Hướng dẫn cài đặt: tools/google-sheet-sync/README.md (mục "Danh sách BCH")
 *
 * - Sheet → Web cho mọi cột (Tổ chức, Họ và tên, Chức vụ, Ban/Bộ phận, Email, Giới thiệu).
 *   Ô trống giữ nguyên dữ liệu trên web; ảnh đại diện và chi đoàn nhập trên web không bị đụng tới.
 * - Mỗi người được ghép theo Tổ chức + Họ và tên (không phân biệt hoa thường).
 * - Thứ tự hiển thị trên web = thứ tự tab, rồi thứ tự dòng trong sheet.
 * - Đọc mọi tab có cột "Họ và tên" ở dòng 1. Ô Tổ chức trống thì lấy theo tên tab
 *   (tab có chữ "Đoàn", "Hội" hoặc "CTV").
 * - Chạy tự động chỉ đọc Firestore khi sheet có thay đổi (gói miễn phí giới hạn 50.000 lượt đọc/ngày).
 * - Người chỉ có trên web được thêm dòng vào tab cùng tổ chức. Xoá dòng trong sheet KHÔNG xoá trên web,
 *   trừ khi bật XOA_NGUOI_KHONG_CO_TRONG_SHEET (dùng khi đổi nhiệm kỳ).
 */

const PROJECT_ID = 'deeyu-hcmut';
const COLLECTION = 'bch';
// Các tab cần đồng bộ; để trống [] thì đồng bộ mọi tab có cột "Họ và tên" ở dòng 1
const SHEET_NAMES = [];
// true: người có trên web nhưng không còn trong sheet sẽ bị XOÁ khỏi web (thay vì được thêm vào sheet)
const XOA_NGUOI_KHONG_CO_TRONG_SHEET = false;
const SYNC_EVERY_MINUTES = 15;

const DOCS_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DOC_PREFIX = `projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/`;

const COLUMNS = [
  { field: 'organization', aliases: ['tochuc', 'donvi'] },
  { field: 'name', aliases: ['hovaten', 'hoten'] },
  { field: 'position', aliases: ['chucvu'] },
  { field: 'department', aliases: ['banbophan', 'ban', 'bophan'] },
  { field: 'email', aliases: ['email'] },
  { field: 'bio', aliases: ['gioithieu', 'mota'] },
];

const ORGANIZATION_LABELS = { DOAN_KHOA: 'Đoàn Thanh niên', HOI_SINH_VIEN: 'Hội Sinh viên', DOI_CTV: 'Trưởng, phó ban Đội CTV' };

// ---------------------------------------------------------------- menu & triggers

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Đồng bộ web')
    .addItem('Đồng bộ ngay', 'dongBoNgay')
    .addItem(`Bật tự động (mỗi ${SYNC_EVERY_MINUTES} phút)`, 'batTuDong')
    .addItem('Tắt tự động', 'tatTuDong')
    .addToUi();
}

// Manual run: always syncs, even when the sheet looks unchanged
function dongBoNgay() {
  SpreadsheetApp.getActive().toast(runLocked(true), 'Đồng bộ web', 10);
}

function batTuDong() {
  tatTuDong();
  ScriptApp.newTrigger('dongBo').timeBased().everyMinutes(SYNC_EVERY_MINUTES).create();
  SpreadsheetApp.getActive().toast(`Đã bật đồng bộ tự động mỗi ${SYNC_EVERY_MINUTES} phút.`, 'Đồng bộ web', 10);
}

function tatTuDong() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dongBo')
    .forEach(t => ScriptApp.deleteTrigger(t));
}

// ---------------------------------------------------------------- sync

// Timed trigger: skipped (no Firestore read at all) while the sheet is unchanged
function dongBo() {
  return runLocked(false);
}

function runLocked(force) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return 'Đang có một lần đồng bộ khác chạy, bỏ qua.';
  try {
    return syncOnce(force);
  } finally {
    lock.releaseLock();
  }
}

const SHEET_HASH_KEY = 'sheetHash';

function syncOnce(force) {
  const tabs = loadTabs();
  if (tabs.length === 0) throw new Error('Không tab nào có cột "Họ và tên" ở dòng tiêu đề.');

  // Firestore's free plan allows 50,000 reads a day: read the cards only when the sheet changed
  const props = PropertiesService.getScriptProperties();
  const text = JSON.stringify(tabs.map(t => [t.name, t.values]));
  const sheetHash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, text, Utilities.Charset.UTF_8));
  if (!force && props.getProperty(SHEET_HASH_KEY) === sheetHash) return 'Sheet không thay đổi, bỏ qua.';

  const remote = loadCards();
  const remoteByKey = {};
  Object.keys(remote).forEach(id => {
    remoteByKey[cardKey(remote[id].organization, remote[id].name)] = id;
  });

  const writes = [];
  const seen = {};
  const skipped = [];
  let order = 0;
  let created = 0;
  let updated = 0;

  tabs.forEach(tab => {
    const { values, colOf, name } = tab;
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const where = `${name} dòng ${r + 1}`;
      const cell = field => (colOf[field] === undefined ? '' : String(row[colOf[field]]).trim());

      const personName = cell('name');
      if (!personName) continue;
      const organization = parseOrganization(cell('organization')) || tab.organization;
      if (!organization) {
        skipped.push(`${where} (không rõ Tổ chức)`);
        continue;
      }
      const key = cardKey(organization, personName);
      if (seen[key]) {
        skipped.push(`${where} (trùng ${personName} ở ${seen[key]})`);
        continue;
      }
      seen[key] = where;

      const id = remoteByKey[key];
      const existing = id ? remote[id] : null;
      const sheetValues = {
        organization,
        name: personName,
        position: cell('position'),
        department: cell('department'),
        email: cell('email'),
        bio: cell('bio'),
      };
      const rowOrder = order++;

      if (!existing) {
        writes.push(createWrite(newId(), Object.assign({ classGroup: '', avatarUrl: '' }, sheetValues), rowOrder));
        created++;
        continue;
      }
      const changes = {};
      Object.keys(sheetValues).forEach(f => {
        // Empty cell keeps what is on the web
        if (sheetValues[f] !== '' && existing[f] !== sheetValues[f]) changes[f] = sheetValues[f];
      });
      if (existing.order !== rowOrder) changes.order = rowOrder;
      if (Object.keys(changes).length > 0) {
        writes.push(updateWrite(id, changes));
        updated++;
      }
    }
  });

  // Cards only on the website
  const webOnly = Object.keys(remote).filter(id => !seen[cardKey(remote[id].organization, remote[id].name)]);
  let removed = 0;
  const appendTo = new Map();
  if (XOA_NGUOI_KHONG_CO_TRONG_SHEET) {
    webOnly.forEach(id => writes.push({ delete: DOC_PREFIX + id }));
    removed = webOnly.length;
  } else {
    webOnly
      .sort((a, b) => (remote[a].order || 0) - (remote[b].order || 0))
      .forEach(id => {
        const card = remote[id];
        const tab = tabs.find(t => t.organization === card.organization) || tabs[0];
        const row = new Array(tab.values[0].length).fill('');
        const put = (field, value) => {
          if (tab.colOf[field] !== undefined) row[tab.colOf[field]] = value || '';
        };
        put('organization', ORGANIZATION_LABELS[card.organization]);
        put('name', card.name);
        put('position', card.position);
        put('department', card.department);
        put('email', card.email);
        put('bio', card.bio);
        // Keep them after the sheet rows, in their current web order
        writes.push(updateWrite(id, { order: order++ }));
        if (!appendTo.has(tab)) appendTo.set(tab, []);
        appendTo.get(tab).push(row);
      });
  }

  commitAll(writes);
  let appended = 0;
  appendTo.forEach((rows, tab) => {
    tab.sheet.getRange(tab.sheet.getLastRow() + 1, 1, rows.length, tab.values[0].length).setValues(rows);
    appended += rows.length;
  });
  // Rows appended above change the sheet, so the next timed run reads once more and then settles
  props.setProperty(SHEET_HASH_KEY, appended > 0 ? '' : sheetHash);

  const parts = [
    `Tab: ${tabs.map(t => t.name).join(', ')}.`,
    `Web: thêm ${created}, cập nhật ${updated}${XOA_NGUOI_KHONG_CO_TRONG_SHEET ? `, xoá ${removed}` : ''}.`,
    `Sheet: thêm ${appended} dòng.`,
  ];
  if (skipped.length > 0) parts.push(`Bỏ qua: ${skipped.slice(0, 5).join(', ')}${skipped.length > 5 ? '…' : ''}.`);
  const summary = parts.join(' ');
  console.log(summary);
  return summary;
}

function loadTabs() {
  const spreadsheet = SpreadsheetApp.getActive();
  const sheets = SHEET_NAMES.length > 0
    ? SHEET_NAMES.map(name => {
        const sheet = spreadsheet.getSheetByName(name);
        if (!sheet) throw new Error(`Không tìm thấy tab "${name}".`);
        return sheet;
      })
    : spreadsheet.getSheets();

  const tabs = [];
  sheets.forEach(sheet => {
    if (sheet.getLastRow() === 0) return;
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(h => normalizeKey(String(h)));
    const colOf = {};
    COLUMNS.forEach(c => {
      const index = headers.findIndex(h => c.aliases.includes(h));
      if (index >= 0) colOf[c.field] = index;
    });
    if (colOf.name === undefined) {
      if (SHEET_NAMES.length > 0) throw new Error(`Tab "${sheet.getName()}" thiếu cột "Họ và tên" ở dòng tiêu đề.`);
      return;
    }
    const name = sheet.getName().trim();
    tabs.push({ sheet, name, values, colOf, organization: parseOrganization(name) });
  });
  return tabs;
}

// "Đoàn Thanh niên", "BCH Hội Sinh viên", "Trưởng phó ban CTV" ...
function parseOrganization(value) {
  const s = normalizeKey(String(value || ''));
  if (!s) return '';
  if (s.includes('ctv') || s.includes('congtacvien') || s.includes('truongphoban')) return 'DOI_CTV';
  if (s.includes('hoi') || s.includes('hsv')) return 'HOI_SINH_VIEN';
  if (s.includes('doan')) return 'DOAN_KHOA';
  return '';
}

// Same matching as the website's Excel import (src/services/shared.ts bchKeyOf)
function cardKey(organization, name) {
  return `${organization}|${String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

function newId() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 20);
}

function normalizeKey(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
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
  if (code >= 300) {
    throw new Error(`Firestore trả lỗi ${code}: ${response.getContentText().slice(0, 500)}`);
  }
  return JSON.parse(response.getContentText() || '{}');
}

function loadCards() {
  const cards = {};
  let pageToken = '';
  do {
    const url = `${DOCS_URL}/${COLLECTION}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const page = request('get', url);
    (page.documents || []).forEach(d => {
      cards[d.name.split('/').pop()] = decodeFields(d.fields || {});
    });
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  return cards;
}

function createWrite(id, data, order) {
  const record = Object.assign({}, data, { order: order });
  return { update: { name: DOC_PREFIX + id, fields: encodeFields(record) }, currentDocument: { exists: false } };
}

function updateWrite(id, changes) {
  return {
    update: { name: DOC_PREFIX + id, fields: encodeFields(changes) },
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
