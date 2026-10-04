import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  FileSpreadsheet,
  Upload,
  Download,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  BadgeCheck,
  GraduationCap,
} from 'lucide-react';
import { MemberGender, MemberRecord, MemberStatus } from '../types';
import { api } from '../services/api';
import type { MemberInput } from '../services/shared';

const STATUS_LABELS: Record<MemberStatus, string> = {
  STUDYING: 'Đang học',
  RESERVED: 'Bảo lưu',
  GRADUATED: 'Đã tốt nghiệp',
  DROPPED: 'Thôi học',
};

const GENDER_LABELS: Record<Exclude<MemberGender, ''>, string> = {
  NAM: 'Nam',
  NU: 'Nữ',
  KHAC: 'Khác',
};

type TypeFilter = 'ALL' | 'UNION' | 'NOT_UNION' | 'ASSOCIATION' | 'NOT_ASSOCIATION';

// Big lists stay responsive: search narrows what is rendered
const MAX_ROWS = 300;

const EMPTY_FORM: MemberInput = {
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
  unionCardNumber: '',
  isAssociationMember: false,
  status: 'STUDYING',
  note: '',
};

// ---------- Excel columns (export and import use the same headers) ----------

const COLUMNS: { field: keyof MemberInput; header: string; aliases: string[] }[] = [
  { field: 'mssv', header: 'MSSV', aliases: ['mssv', 'masosinhvien', 'masv'] },
  { field: 'fullName', header: 'Họ và tên', aliases: ['hovaten', 'hoten', 'ten'] },
  { field: 'gender', header: 'Giới tính', aliases: ['gioitinh'] },
  { field: 'dateOfBirth', header: 'Ngày sinh', aliases: ['ngaysinh'] },
  { field: 'cohort', header: 'Khóa', aliases: ['khoa', 'khoahoc', 'nienkhoa'] },
  { field: 'classGroup', header: 'Lớp / Chi đoàn', aliases: ['lopchidoan', 'lop', 'chidoan'] },
  { field: 'email', header: 'Email', aliases: ['email'] },
  { field: 'phone', header: 'Số điện thoại', aliases: ['sodienthoai', 'sdt', 'dienthoai'] },
  { field: 'isUnionMember', header: 'Đoàn viên', aliases: ['doanvien'] },
  { field: 'unionJoinDate', header: 'Ngày vào Đoàn', aliases: ['ngayvaodoan'] },
  { field: 'unionCardNumber', header: 'Số thẻ đoàn viên', aliases: ['sothedoanvien', 'sothedoan'] },
  { field: 'isAssociationMember', header: 'Hội viên', aliases: ['hoivien'] },
  { field: 'status', header: 'Trạng thái', aliases: ['trangthai'] },
  { field: 'note', header: 'Ghi chú', aliases: ['ghichu'] },
];

const DATE_FIELDS = new Set<keyof MemberInput>(['dateOfBirth', 'unionJoinDate']);
const BOOL_FIELDS = new Set<keyof MemberInput>(['isUnionMember', 'isAssociationMember']);

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// YYYY-MM-DD -> DD/MM/YYYY for display and export
function displayDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

type XlsxModule = typeof import('xlsx');

function parseDate(value: unknown, XLSX: XlsxModule): string | undefined {
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value);
    return d ? `${d.y}-${pad(d.m)}-${pad(d.d)}` : undefined;
  }
  const s = String(value).trim();
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (dmy) return `${dmy[3]}-${pad(+dmy[2])}-${pad(+dmy[1])}`;
  const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (ymd) return `${ymd[1]}-${pad(+ymd[2])}-${pad(+ymd[3])}`;
  return undefined;
}

function parseBool(value: unknown): boolean | undefined {
  const s = normalizeHeader(String(value));
  if (['x', 'co', 'yes', 'y', '1', 'true', 'doanvien', 'hoivien'].includes(s)) return true;
  if (['khong', 'no', 'n', '0', 'false'].includes(s)) return false;
  return undefined;
}

function parseGender(value: unknown): MemberGender | undefined {
  const s = normalizeHeader(String(value));
  if (s === 'nam') return 'NAM';
  if (s === 'nu') return 'NU';
  if (s === 'khac') return 'KHAC';
  return undefined;
}

function parseStatus(value: unknown): MemberStatus | undefined {
  const s = normalizeHeader(String(value));
  if (['danghoc', 'studying'].includes(s)) return 'STUDYING';
  if (['baoluu', 'reserved'].includes(s)) return 'RESERVED';
  if (['totnghiep', 'datotnghiep', 'graduated'].includes(s)) return 'GRADUATED';
  if (['thoihoc', 'dropped'].includes(s)) return 'DROPPED';
  return undefined;
}

// Empty cells are left out so an import never wipes stored values
function parseRow(raw: Record<string, unknown>, XLSX: XlsxModule): Partial<MemberInput> {
  const row: Partial<Record<keyof MemberInput, unknown>> = {};
  for (const [header, value] of Object.entries(raw)) {
    const key = normalizeHeader(header);
    const column = COLUMNS.find(c => c.aliases.includes(key));
    if (!column || value === null || value === undefined || String(value).trim() === '') continue;
    const { field } = column;
    const parsed = DATE_FIELDS.has(field)
      ? parseDate(value, XLSX)
      : BOOL_FIELDS.has(field)
        ? parseBool(value)
        : field === 'gender'
          ? parseGender(value)
          : field === 'status'
            ? parseStatus(value)
            : String(value).trim();
    if (parsed !== undefined) row[field] = parsed;
  }
  return row as Partial<MemberInput>;
}

function toSheetRow(m: MemberRecord): Record<string, string> {
  return {
    'MSSV': m.mssv,
    'Họ và tên': m.fullName,
    'Giới tính': m.gender ? GENDER_LABELS[m.gender] : '',
    'Ngày sinh': displayDate(m.dateOfBirth),
    'Khóa': m.cohort,
    'Lớp / Chi đoàn': m.classGroup,
    'Email': m.email,
    'Số điện thoại': m.phone,
    'Đoàn viên': m.isUnionMember ? 'x' : '',
    'Ngày vào Đoàn': displayDate(m.unionJoinDate),
    'Số thẻ đoàn viên': m.unionCardNumber,
    'Hội viên': m.isAssociationMember ? 'x' : '',
    'Trạng thái': STATUS_LABELS[m.status],
    'Ghi chú': m.note,
  };
}

const inputClass =
  'w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1';

export const MemberManager: React.FC = () => {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');

  // Form: editingId undefined = closed, null = adding, string = editing that record
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState<MemberInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<MemberRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setMembers(await api.getMembers());
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter(m => {
      if (typeFilter === 'UNION' && !m.isUnionMember) return false;
      if (typeFilter === 'NOT_UNION' && m.isUnionMember) return false;
      if (typeFilter === 'ASSOCIATION' && !m.isAssociationMember) return false;
      if (typeFilter === 'NOT_ASSOCIATION' && m.isAssociationMember) return false;
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (!q) return true;
      return [m.mssv, m.fullName, m.classGroup, m.cohort, m.email, m.phone, m.unionCardNumber]
        .some(v => v.toLowerCase().includes(q));
    });
  }, [members, search, typeFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: members.length,
    union: members.filter(m => m.isUnionMember).length,
    association: members.filter(m => m.isAssociationMember).length,
    studying: members.filter(m => m.status === 'STUDYING').length,
  }), [members]);

  const showNotice = (kind: 'success' | 'error', text: string) => {
    setNotice({ kind, text });
    if (kind === 'success') setTimeout(() => setNotice(null), 5000);
  };

  const openForm = (member?: MemberRecord) => {
    if (member) {
      const { id: _id, updatedAt: _updatedAt, ...input } = member;
      setForm(input);
      setEditingId(member.id);
    } else {
      setForm(EMPTY_FORM);
      setEditingId(null);
    }
    setFormError(null);
  };

  const closeForm = () => {
    if (!saving) setEditingId(undefined);
  };

  const setField = <K extends keyof MemberInput>(key: K, value: MemberInput[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const saved = await api.saveMember(form, editingId ?? undefined);
      setMembers(prev =>
        [saved, ...prev.filter(m => m.id !== saved.id && m.id !== editingId)].sort((a, b) => a.mssv.localeCompare(b.mssv))
      );
      showNotice('success', editingId ? `Đã cập nhật ${saved.fullName} (${saved.mssv}).` : `Đã thêm ${saved.fullName} (${saved.mssv}).`);
      setEditingId(undefined);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.deleteMember(deleting.id);
      setMembers(prev => prev.filter(m => m.id !== deleting.id));
      showNotice('success', `Đã xoá ${deleting.fullName} (${deleting.mssv}) khỏi danh sách.`);
      setDeleting(null);
    } catch (err: any) {
      showNotice('error', err.message);
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const writeWorkbook = async (rows: Record<string, string>[], fileName: string) => {
    // xlsx is ~400KB: load it only when a file is actually needed
    const XLSX = await import('xlsx');
    const sheet = XLSX.utils.json_to_sheet(rows, { header: COLUMNS.map(c => c.header) });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Danh_Sach');
    XLSX.writeFile(workbook, fileName);
  };

  const handleExport = async () => {
    const fileName = `Danh_Sach_Sinh_Vien_Doan_Vien_Hoi_Vien_${Date.now()}.xlsx`;
    await writeWorkbook(filtered.map(toSheetRow), fileName);
    showNotice('success', `Đã xuất ${filtered.length} sinh viên ra file ${fileName}.`);
  };

  const handleDownloadTemplate = () => writeWorkbook([], 'Mau_Nhap_Danh_Sach_Sinh_Vien.xlsx');

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer());
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      const rows: Partial<MemberInput>[] = [];
      const errors: string[] = [];
      rawRows.forEach((raw, index) => {
        const row = parseRow(raw, XLSX);
        if (!row.mssv && !row.fullName) return; // blank line
        const line = index + 2; // header is row 1
        if (!row.mssv) errors.push(`Dòng ${line}: thiếu MSSV.`);
        else if (!/^[a-z0-9]{1,20}$/i.test(row.mssv)) errors.push(`Dòng ${line}: MSSV "${row.mssv}" không hợp lệ.`);
        else if (!row.fullName && !members.some(m => m.id === row.mssv!.toLowerCase())) errors.push(`Dòng ${line}: thiếu họ tên.`);
        else rows.push(row);
      });

      if (errors.length > 0) {
        const more = errors.length > 5 ? ` (và ${errors.length - 5} lỗi khác)` : '';
        showNotice('error', `Chưa nhập file vì có lỗi: ${errors.slice(0, 5).join(' ')}${more}`);
        return;
      }
      if (rows.length === 0) {
        showNotice('error', 'Không tìm thấy dòng dữ liệu nào. Hãy dùng đúng tiêu đề cột như file mẫu.');
        return;
      }

      const { created, updated } = await api.importMembers(rows);
      await loadMembers();
      showNotice('success', `Đã nhập ${rows.length} dòng: thêm mới ${created}, cập nhật ${updated}.`);
    } catch (err: any) {
      showNotice('error', `Nhập file thất bại: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const statCards = [
    { label: 'Tổng sinh viên', value: stats.total, icon: Users, tone: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40' },
    { label: 'Đoàn viên', value: stats.union, icon: BadgeCheck, tone: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/40' },
    { label: 'Hội viên', value: stats.association, icon: CheckCircle2, tone: 'text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/40' },
    { label: 'Đang học', value: stats.studying, icon: GraduationCap, tone: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40' },
  ];

  return (
    <div className="mt-6 space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center space-x-3">
              <span className={`p-2.5 rounded-xl ${card.tone}`}>
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="font-tech text-xl font-extrabold text-slate-900 dark:text-slate-100">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {notice && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-start justify-between gap-3 ${
            notice.kind === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-400/30 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-400/30 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start space-x-2.5">
            {notice.kind === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="font-semibold">{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-bold flex-shrink-0" aria-label="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm MSSV, họ tên, lớp, email..."
              className={`${inputClass} pl-9`}
            />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TypeFilter)} className={`${inputClass} sm:w-48`}>
            <option value="ALL">Tất cả sinh viên</option>
            <option value="UNION">Là đoàn viên</option>
            <option value="NOT_UNION">Chưa là đoàn viên</option>
            <option value="ASSOCIATION">Là hội viên</option>
            <option value="NOT_ASSOCIATION">Chưa là hội viên</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as MemberStatus | 'ALL')} className={`${inputClass} sm:w-40`}>
            <option value="ALL">Mọi trạng thái</option>
            {(Object.keys(STATUS_LABELS) as MemberStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            onClick={() => openForm()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm sinh viên</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 hover:bg-blue-50 dark:hover:bg-blue-950/40 disabled:opacity-60"
          >
            {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{importing ? 'Đang nhập…' : 'Nhập Excel'}</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            title="File Excel trống với đúng các cột để nhập danh sách"
          >
            <Download className="w-4 h-4" />
            <span>File mẫu</span>
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-3">
        Nhập Excel: mỗi dòng một sinh viên, khớp theo MSSV (đã có thì cập nhật, chưa có thì thêm mới). Ô để trống giữ nguyên dữ liệu cũ.
        Cột Đoàn viên / Hội viên ghi "x" hoặc "Có"; ngày theo dạng dd/mm/yyyy.
      </p>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">MSSV</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Lớp / Khóa</th>
                <th className="px-4 py-3">Đoàn viên</th>
                <th className="px-4 py-3">Hội viên</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">Đang tải danh sách…</td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-rose-600 dark:text-rose-300">
                    {loadError}{' '}
                    <button onClick={loadMembers} className="underline font-semibold">Thử lại</button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    {members.length === 0
                      ? 'Chưa có sinh viên nào. Bấm "Thêm sinh viên" hoặc "Nhập Excel" để bắt đầu.'
                      : 'Không có sinh viên nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                filtered.slice(0, MAX_ROWS).map(m => (
                  <tr key={m.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">{m.mssv}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{m.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{m.email || m.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium">{m.classGroup || '—'}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{m.cohort}</span>
                    </td>
                    <td className="px-4 py-3">
                      {m.isUnionMember ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-400/30">
                          <Check className="w-3 h-3 mr-1" />
                          {m.unionCardNumber || 'Đoàn viên'}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {m.isAssociationMember ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-400/30">
                          <Check className="w-3 h-3 mr-1" />
                          Hội viên
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px]">{STATUS_LABELS[m.status]}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openForm(m)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          aria-label={`Sửa ${m.fullName}`}
                          title="Sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(m)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          aria-label={`Xoá ${m.fullName}`}
                          title="Xoá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > MAX_ROWS && (
          <p className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            Đang hiển thị {MAX_ROWS}/{filtered.length} sinh viên. Dùng ô tìm kiếm hoặc bộ lọc để thu hẹp; nút Xuất Excel vẫn xuất đủ {filtered.length} dòng.
          </p>
        )}
      </div>

      {/* Modal: add / edit */}
      {editingId !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center space-x-2">
              {editingId ? <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-300" /> : <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-300" />}
              <span>{editingId ? 'Sửa thông tin sinh viên' : 'Thêm sinh viên'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>MSSV *</label>
                  <input required maxLength={20} value={form.mssv} onChange={e => setField('mssv', e.target.value)} className={`${inputClass} font-mono`} />
                </div>
                <div>
                  <label className={labelClass}>Họ và tên *</label>
                  <input required maxLength={100} value={form.fullName} onChange={e => setField('fullName', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Giới tính</label>
                  <select value={form.gender} onChange={e => setField('gender', e.target.value as MemberGender)} className={inputClass}>
                    <option value="">—</option>
                    {(Object.keys(GENDER_LABELS) as Exclude<MemberGender, ''>[]).map(g => (
                      <option key={g} value={g}>{GENDER_LABELS[g]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Ngày sinh</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Khóa</label>
                  <input maxLength={20} value={form.cohort} onChange={e => setField('cohort', e.target.value)} placeholder="VD: K2023" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Lớp / Chi đoàn</label>
                  <input maxLength={50} value={form.classGroup} onChange={e => setField('classGroup', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" maxLength={100} value={form.email} onChange={e => setField('email', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Số điện thoại</label>
                  <input type="tel" maxLength={20} value={form.phone} onChange={e => setField('phone', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Trạng thái</label>
                  <select value={form.status} onChange={e => setField('status', e.target.value as MemberStatus)} className={inputClass}>
                    {(Object.keys(STATUS_LABELS) as MemberStatus[]).map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input type="checkbox" checked={form.isUnionMember} onChange={e => setField('isUnionMember', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                    <span>Là đoàn viên</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input type="checkbox" checked={form.isAssociationMember} onChange={e => setField('isAssociationMember', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                    <span>Là hội viên</span>
                  </label>
                </div>
                {form.isUnionMember && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Ngày vào Đoàn</label>
                      <input type="date" value={form.unionJoinDate} onChange={e => setField('unionJoinDate', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Số thẻ đoàn viên</label>
                      <input maxLength={30} value={form.unionCardNumber} onChange={e => setField('unionCardNumber', e.target.value)} className={`${inputClass} font-mono`} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Ghi chú</label>
                <textarea rows={2} maxLength={500} value={form.note} onChange={e => setField('note', e.target.value)} className={inputClass} />
              </div>

              {formError && (
                <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-400/30 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center space-x-1.5"
                >
                  {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{saving ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Thêm sinh viên'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: confirm delete */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => !deleteBusy && setDeleting(null)}>
          <div
            role="alertdialog"
            aria-labelledby="delete-member-title"
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 id="delete-member-title" className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100">
                  Xoá sinh viên khỏi danh sách?
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200 break-words">
                  {deleting.fullName} ({deleting.mssv})
                </p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Hồ sơ đoàn viên / hội viên của sinh viên này bị xoá. Lịch sử đăng ký sự kiện không bị ảnh hưởng. Không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteBusy}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 flex items-center space-x-1.5"
              >
                {deleteBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{deleteBusy ? 'Đang xoá…' : 'Xoá'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
