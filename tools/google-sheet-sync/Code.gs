/**
 * Đồng bộ danh sách sinh viên giữa Google Sheet và cổng thông tin (Firestore `members`).
 * Hướng dẫn cài đặt: tools/google-sheet-sync/README.md
 *
 * - Cột BCH quản lý (MSSV, Họ và tên, Khóa, Ghi chú): Sheet → Web. Ô trống giữ nguyên dữ liệu trên web.
 * - Cột sinh viên tự khai (Giới tính, Ngày sinh, Lớp/Chi đoàn, Email, Số điện thoại, Đoàn viên,
 *   Ngày vào Đoàn, Hội viên, Trạng thái):
 *     chưa tự bổ sung hồ sơ trên web → Sheet → Web (BCH điền trước được);
 *     đã tự bổ sung                 → Web → Sheet (sheet hiện thông tin sinh viên khai).
 * - Đồng bộ mọi tab có cột MSSV (K24, K25, K26...); tab đặt tên theo khóa thì ô Khóa trống lấy tên tab.
 * - Sinh viên chỉ có trên web được thêm dòng vào cuối tab cùng khóa. Xoá dòng trong sheet KHÔNG xoá trên web.
 *
 * Script chạy bằng tài khoản Google của người cài đặt; tài khoản đó phải là Owner/Editor
 * của project Firebase. Firestore Security Rules không áp dụng cho truy cập này.
 */

const PROJECT_ID = 'deeyu-hcmut';
const COLLECTION = 'members';
// Các tab cần đồng bộ, ví dụ ['K24', 'K25', 'K26']. Để trống [] thì đồng bộ mọi tab có cột MSSV ở dòng 1.
// Tab đặt tên theo khóa (K24, K25...) thì ô Khóa để trống sẽ tự lấy tên tab.
const SHEET_NAMES = [];
const SYNC_EVERY_MINUTES = 10;

const DOCS_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DOC_PREFIX = `projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/`;

// field: tên trường trên web; aliases: tiêu đề cột đã bỏ dấu, viết thường, bỏ ký tự đặc biệt
const COLUMNS = [
  { field: 'mssv', header: 'MSSV', aliases: ['mssv', 'masosinhvien', 'masv'], owner: 'admin' },
  { field: 'fullName', header: 'Họ và tên', aliases: ['hovaten', 'hoten'], owner: 'admin' },
  { field: 'gender', header: 'Giới tính', aliases: ['gioitinh'], owner: 'student', type: 'gender' },
  { field: 'dateOfBirth', header: 'Ngày sinh', aliases: ['ngaysinh'], owner: 'student', type: 'date' },
  { field: 'cohort', header: 'Khóa', aliases: ['khoa', 'khoahoc', 'nienkhoa'], owner: 'admin' },
  { field: 'classGroup', header: 'Lớp/Chi đoàn', aliases: ['lopchidoan', 'lop', 'chidoan'], owner: 'student', type: 'upper' },
  { field: 'email', header: 'Email', aliases: ['email'], owner: 'student' },
  { field: 'phone', header: 'Số điện thoại', aliases: ['sodienthoai', 'sdt', 'dienthoai'], owner: 'student', type: 'phone' },
  { field: 'isUnionMember', header: 'Đoàn viên', aliases: ['doanvien'], owner: 'student', type: 'bool' },
  { field: 'unionJoinDate', header: 'Ngày vào Đoàn', aliases: ['ngayvaodoan'], owner: 'student', type: 'date' },
  { field: 'isAssociationMember', header: 'Hội viên', aliases: ['hoivien'], owner: 'student', type: 'bool' },
  { field: 'status', header: 'Trạng thái', aliases: ['trangthai'], owner: 'student', type: 'status' },
  { field: 'note', header: 'Ghi chú', aliases: ['ghichu'], owner: 'admin' },
];

const GENDER_LABELS = { NAM: 'Nam', NU: 'Nữ', KHAC: 'Khác' };
const STATUS_LABELS = { STUDYING: 'Đang học', RESERVED: 'Bảo lưu', GRADUATED: 'Đã tốt nghiệp', DROPPED: 'Thôi học' };

// ---------------------------------------------------------------- menu & triggers

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Đồng bộ web')
    .addItem('Đồng bộ ngay', 'dongBoNgay')
    .addItem(`Bật tự động (mỗi ${SYNC_EVERY_MINUTES} phút)`, 'batTuDong')
    .addItem('Tắt tự động', 'tatTuDong')
    .addToUi();
}

function dongBoNgay() {
  const result = dongBo();
  SpreadsheetApp.getActive().toast(result, 'Đồng bộ web', 10);
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

function dongBo() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return 'Đang có một lần đồng bộ khác chạy, bỏ qua.';
  try {
    return syncOnce();
  } finally {
    lock.releaseLock();
  }
}

function syncOnce() {
  const tabs = loadTabs();
  if (tabs.length === 0) throw new Error('Không tab nào có cột MSSV ở dòng tiêu đề.');

  const remote = loadMembers();
  const writes = [];
  const seen = {};
  const skipped = [];
  // Only the changed cells are written back, so formulas elsewhere in the sheet are untouched
  const cellUpdates = [];
  let created = 0;
  let updated = 0;

  tabs.forEach(tab => {
    const { values, colOf, name } = tab;
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const where = `${name} dòng ${r + 1}`;
      const mssv = String(row[colOf.mssv]).trim();
      if (!mssv) continue;
      const id = mssv.toLowerCase();
      if (!/^[a-z0-9]{1,20}$/.test(id)) {
        skipped.push(`${where} (MSSV "${mssv}")`);
        continue;
      }
      if (seen[id]) {
        skipped.push(`${where} (MSSV ${mssv} trùng với ${seen[id]})`);
        continue;
      }
      seen[id] = where;

      const existing = remote[id];
      const studentOwned = Boolean(existing && existing.profileCompletedAt);
      const changes = {};

      COLUMNS.forEach(c => {
        const col = colOf[c.field];
        if (c.field === 'mssv') return;
        if (col === undefined) {
          // Tabs named after a Khóa (K24, K25 ...) without a Khóa column
          if (c.field === 'cohort' && tab.cohort && (!existing || !existing.cohort)) changes.cohort = tab.cohort;
          return;
        }
        const cell = row[col];
        if (c.owner === 'student' && studentOwned) {
          // Web → Sheet: what the student declared replaces the cell
          const display = toCell(c, existing[c.field], cell);
          if (!sameCell(cell, display)) cellUpdates.push({ sheet: tab.sheet, row: r + 1, col: col + 1, value: display });
          return;
        }
        let value = fromCell(c, cell);
        if (value === undefined && c.field === 'cohort' && tab.cohort && (!existing || !existing.cohort)) value = tab.cohort;
        if (value === undefined) return; // empty cell keeps the web value
        if (!existing || existing[c.field] !== value) changes[c.field] = value;
      });

      if (!existing) {
        if (!changes.fullName) {
          skipped.push(`${where} (MSSV ${mssv} thiếu họ tên)`);
          continue;
        }
        writes.push(createWrite(id, Object.assign({ mssv: mssv }, changes)));
        created++;
      } else if (Object.keys(changes).length > 0) {
        if (changes.isUnionMember === false) changes.unionJoinDate = '';
        writes.push(updateWrite(id, changes));
        updated++;
      }
    }
  });

  // Students added on the website but missing from every tab: appended to the tab of their Khóa
  // (tab named like the Khóa, e.g. "K24"). With no Khóa-named tabs at all they go to the first tab.
  const byCohortTabs = tabs.some(t => t.cohort);
  const appendTo = new Map();
  const noTab = {};
  Object.keys(remote)
    .filter(id => !seen[id])
    .sort()
    .forEach(id => {
      const member = remote[id];
      const tab = byCohortTabs
        ? tabs.find(t => t.cohort && normalizeKey(t.cohort) === normalizeKey(member.cohort || ''))
        : tabs[0];
      if (!tab) {
        const key = member.cohort || 'chưa có khóa';
        noTab[key] = (noTab[key] || 0) + 1;
        return;
      }
      const row = new Array(tab.values[0].length).fill('');
      COLUMNS.forEach(c => {
        if (tab.colOf[c.field] !== undefined) row[tab.colOf[c.field]] = toCell(c, member[c.field], '');
      });
      if (!appendTo.has(tab)) appendTo.set(tab, []);
      appendTo.get(tab).push(row);
    });

  commitAll(writes);
  cellUpdates.forEach(u => u.sheet.getRange(u.row, u.col).setValue(u.value));
  let appended = 0;
  appendTo.forEach((rows, tab) => {
    tab.sheet.getRange(tab.sheet.getLastRow() + 1, 1, rows.length, tab.values[0].length).setValues(rows);
    appended += rows.length;
  });

  const parts = [
    `Tab: ${tabs.map(t => t.name).join(', ')}.`,
    `Web: thêm ${created}, cập nhật ${updated}.`,
    `Sheet: thêm ${appended} dòng, cập nhật ${cellUpdates.length} ô từ thông tin sinh viên tự khai.`,
  ];
  if (skipped.length > 0) parts.push(`Bỏ qua: ${skipped.slice(0, 5).join(', ')}${skipped.length > 5 ? '…' : ''}.`);
  const missingTabs = Object.keys(noTab).map(c => `${c} (${noTab[c]} SV)`);
  if (missingTabs.length > 0) parts.push(`Chưa có tab cho khóa: ${missingTabs.join(', ')} — tạo tab cùng tên để đưa các sinh viên này vào sheet.`);
  const summary = parts.join(' ');
  console.log(summary);
  return summary;
}

// Tabs to sync: SHEET_NAMES if set, otherwise every tab whose first row has an MSSV column
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
    if (colOf.mssv === undefined) {
      if (SHEET_NAMES.length > 0) throw new Error(`Tab "${sheet.getName()}" thiếu cột MSSV ở dòng tiêu đề.`);
      return;
    }
    const name = sheet.getName().trim();
    // "K24" / "K2024": the tab name is used as Khóa when the Khóa cell is empty
    const cohort = /^k\d{2,4}$/i.test(name) ? name.toUpperCase() : '';
    tabs.push({ sheet, name, values, colOf, cohort });
  });
  return tabs;
}

// ---------------------------------------------------------------- cell <-> web values

function fromCell(column, cell) {
  if (cell === '' || cell === null) return undefined;
  switch (column.type) {
    case 'date':
      return parseDate(cell);
    case 'bool': {
      if (cell === true || cell === false) return cell;
      const s = normalizeKey(String(cell));
      if (['x', 'co', 'yes', 'y', '1', 'true', 'doanvien', 'hoivien'].includes(s)) return true;
      if (['khong', 'no', 'n', '0', 'false'].includes(s)) return false;
      return undefined;
    }
    case 'gender': {
      const s = normalizeKey(String(cell));
      return s === 'nam' ? 'NAM' : s === 'nu' ? 'NU' : s === 'khac' ? 'KHAC' : undefined;
    }
    case 'status': {
      const s = normalizeKey(String(cell));
      if (s === 'danghoc') return 'STUDYING';
      if (s === 'baoluu') return 'RESERVED';
      if (s === 'totnghiep' || s === 'datotnghiep') return 'GRADUATED';
      if (s === 'thoihoc') return 'DROPPED';
      return undefined;
    }
    case 'upper':
      return String(cell).trim().toUpperCase();
    case 'phone': {
      // A phone typed into a number-formatted cell loses its leading 0 (0901234567 -> 901234567)
      const s = String(cell).trim();
      return typeof cell === 'number' && s.length === 9 ? `0${s}` : s;
    }
    default:
      return String(cell).trim();
  }
}

// `current` tells whether the column uses checkboxes (true/false) or text
function toCell(column, value, current) {
  switch (column.type) {
    case 'date': {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
      return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : '';
    }
    case 'bool':
      if (current === true || current === false) return Boolean(value);
      return value ? 'x' : '';
    case 'gender':
      return GENDER_LABELS[value] || '';
    case 'status':
      return STATUS_LABELS[value] || '';
    case 'phone':
      // Leading apostrophe keeps it as text so the 0 survives
      return value ? `'${value}` : '';
    default:
      return value === undefined || value === null ? '' : value;
  }
}

function sameCell(a, b) {
  if (isDate(a) && isDate(b)) return a.getTime() === b.getTime();
  const text = String(b).replace(/^'/, '');
  // Number-formatted phone cells drop the leading 0
  return String(a) === text || (typeof a === 'number' && `0${a}` === text);
}

function parseDate(cell) {
  if (isDate(cell)) {
    return Utilities.formatDate(cell, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  }
  const s = String(cell).trim();
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  return undefined;
}

function isDate(value) {
  return Object.prototype.toString.call(value) === '[object Date]';
}

function pad(n) {
  return String(Number(n)).padStart(2, '0');
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

function loadMembers() {
  const members = {};
  let pageToken = '';
  do {
    const url = `${DOCS_URL}/${COLLECTION}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const page = request('get', url);
    (page.documents || []).forEach(d => {
      members[d.name.split('/').pop()] = decodeFields(d.fields || {});
    });
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  return members;
}

// New record: same defaults as the website's buildMember
function createWrite(id, data) {
  const now = new Date().toISOString();
  const record = Object.assign(
    {
      mssv: '',
      fullName: '',
      gender: '',
      dateOfBirth: '',
      cohort: '',
      classGroup: '',
      email: '',
      phone: '',
      isUnionMember: false,
      unionJoinDate: '',
      isAssociationMember: false,
      status: 'STUDYING',
      note: '',
      accountEmail: '',
      profileCompletedAt: '',
    },
    data,
    { updatedAt: now }
  );
  return { update: { name: DOC_PREFIX + id, fields: encodeFields(record) }, currentDocument: { exists: false } };
}

function updateWrite(id, changes) {
  const data = Object.assign({}, changes, { updatedAt: new Date().toISOString() });
  return {
    update: { name: DOC_PREFIX + id, fields: encodeFields(data) },
    updateMask: { fieldPaths: Object.keys(data) },
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
    fields[key] = typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) };
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
