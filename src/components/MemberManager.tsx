import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  FileSpreadsheet,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  BadgeCheck,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { MemberGender, MemberRecord, MemberStatus } from '../types';
import { api } from '../services/api';
import type { MemberInput } from '../services/shared';
import { writeWorkbook } from '../utils/excel';

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

type TypeFilter = 'ALL' | 'UNION' | 'NOT_UNION' | 'ASSOCIATION' | 'NOT_ASSOCIATION' | 'PROFILE_DONE' | 'PROFILE_MISSING';

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
  isAssociationMember: false,
  status: 'STUDYING',
  note: '',
};

// The list itself is kept in Google Sheet (tools/google-sheet-sync); Excel is export only,
// with the same columns as the sheet
const EXPORT_HEADERS = [
  'MSSV', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Khóa', 'Lớp/Chi đoàn', 'Email', 'Số điện thoại',
  'Đoàn viên', 'Ngày vào Đoàn', 'Hội viên', 'Trạng thái', 'Ghi chú',
];

// YYYY-MM-DD -> DD/MM/YYYY for display and export
function displayDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function toSheetRow(m: MemberRecord): Record<string, string> {
  return {
    'MSSV': m.mssv,
    'Họ và tên': m.fullName,
    'Giới tính': m.gender ? GENDER_LABELS[m.gender] : '',
    'Ngày sinh': displayDate(m.dateOfBirth),
    'Khóa': m.cohort,
    'Lớp/Chi đoàn': m.classGroup,
    'Email': m.email,
    'Số điện thoại': m.phone,
    'Đoàn viên': m.isUnionMember ? 'x' : '',
    'Ngày vào Đoàn': displayDate(m.unionJoinDate),
    'Hội viên': m.isAssociationMember ? 'x' : '',
    'Trạng thái': STATUS_LABELS[m.status],
    'Ghi chú': m.note,
  };
}

function cohortOf(m: MemberRecord): string {
  return m.cohort.trim();
}

// "K26" before "K25"; numbers compared as numbers; empty Khóa last
function compareCohorts(a: string, b: string): number {
  if (!a || !b) return a ? -1 : b ? 1 : 0;
  return b.localeCompare(a, 'vi', { numeric: true });
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
  // null = every Khóa; '' = records without a Khóa
  const [cohortFilter, setCohortFilter] = useState<string | null>(null);
  // Blocks the admin opened, and auto-opened blocks they closed again
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Form: editingId undefined = closed, null = adding, string = editing that record
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState<MemberInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemberRecord | null>(null);
  const [unlinkRequested, setUnlinkRequested] = useState(false);

  const [deleting, setDeleting] = useState<MemberRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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
      if (typeFilter === 'PROFILE_DONE' && !m.profileCompletedAt) return false;
      if (typeFilter === 'PROFILE_MISSING' && m.profileCompletedAt) return false;
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (cohortFilter !== null && cohortOf(m) !== cohortFilter) return false;
      if (!q) return true;
      return [m.mssv, m.fullName, m.classGroup, m.cohort, m.email, m.phone, m.accountEmail || '']
        .some(v => v.toLowerCase().includes(q));
    });
  }, [members, search, typeFilter, statusFilter, cohortFilter]);

  // Every Khóa in the list, newest first (K26, K25, K24 ...); records without one last
  const cohorts = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach(m => counts.set(cohortOf(m), (counts.get(cohortOf(m)) ?? 0) + 1));
    return [...counts.entries()].sort(([a], [b]) => compareCohorts(a, b)).map(([cohort, count]) => ({ cohort, count }));
  }, [members]);

  const groups = useMemo(() => {
    const byCohort = new Map<string, MemberRecord[]>();
    filtered.forEach(m => {
      const key = cohortOf(m);
      if (!byCohort.has(key)) byCohort.set(key, []);
      byCohort.get(key)!.push(m);
    });
    return [...byCohort.entries()].sort(([a], [b]) => compareCohorts(a, b)).map(([cohort, items]) => ({ cohort, items }));
  }, [filtered]);

  // Searching or picking one Khóa opens the matching blocks; otherwise they stay closed until clicked
  const autoOpen = search.trim() !== '' || cohortFilter !== null;
  const isGroupOpen = (cohort: string) => expanded.has(cohort) || (autoOpen && !collapsed.has(cohort));

  const toggleGroup = (cohort: string) => {
    const open = isGroupOpen(cohort);
    const without = (set: Set<string>) => new Set([...set].filter(c => c !== cohort));
    setExpanded(prev => (open ? without(prev) : new Set(prev).add(cohort)));
    setCollapsed(prev => (open ? new Set(prev).add(cohort) : without(prev)));
  };

  const stats = useMemo(() => ({
    total: members.length,
    union: members.filter(m => m.isUnionMember).length,
    association: members.filter(m => m.isAssociationMember).length,
    profileDone: members.filter(m => m.profileCompletedAt).length,
  }), [members]);

  const showNotice = (kind: 'success' | 'error', text: string) => {
    setNotice({ kind, text });
    if (kind === 'success') setTimeout(() => setNotice(null), 5000);
  };

  const openForm = (member?: MemberRecord) => {
    if (member) {
      const { id: _id, updatedAt: _updatedAt, accountEmail: _accountEmail, profileCompletedAt: _done, ...input } = member;
      setForm({ ...EMPTY_FORM, ...input });
      setEditingId(member.id);
    } else {
      setForm(EMPTY_FORM);
      setEditingId(null);
    }
    setEditingRecord(member ?? null);
    setUnlinkRequested(false);
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
      const saved = await api.saveMember(form, editingId ?? undefined, unlinkRequested);
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

  const handleExport = async () => {
    const fileName = `Danh_Sach_Sinh_Vien_Doan_Vien_Hoi_Vien_${Date.now()}.xlsx`;
    await writeWorkbook(EXPORT_HEADERS, filtered.map(toSheetRow), fileName);
    showNotice('success', `Đã xuất ${filtered.length} sinh viên ra file ${fileName}.`);
  };

  const renderRow = (m: MemberRecord) => (
    <tr key={m.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/40 transition-colors">
      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">{m.mssv}</td>
      <td className="px-4 py-3">
        <p className="font-bold text-slate-900 dark:text-slate-100">{m.fullName}</p>
        <p className="text-[10px] text-slate-400 font-mono">{m.email || m.phone}</p>
        {m.profileCompletedAt ? (
          <span className="mt-0.5 inline-block text-[10px] font-semibold text-emerald-700 dark:text-emerald-300" title={m.accountEmail}>
            ✓ Đã tự bổ sung hồ sơ
          </span>
        ) : (
          <span className="mt-0.5 inline-block text-[10px] text-slate-400">Chưa đăng nhập bổ sung</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="block font-medium">{m.classGroup || '—'}</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">{m.cohort}</span>
      </td>
      <td className="px-4 py-3">
        {m.isUnionMember ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-400/30">
            <Check className="w-3 h-3 mr-1" />
            Đoàn viên
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
  );

  const statCards = [
    { label: 'Tổng sinh viên', value: stats.total, icon: Users, tone: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40' },
    { label: 'Đoàn viên', value: stats.union, icon: BadgeCheck, tone: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/40' },
    { label: 'Hội viên', value: stats.association, icon: CheckCircle2, tone: 'text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/40' },
    { label: 'Đã bổ sung hồ sơ', value: stats.profileDone, icon: GraduationCap, tone: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40' },
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
            <option value="PROFILE_DONE">Đã tự bổ sung hồ sơ</option>
            <option value="PROFILE_MISSING">Chưa bổ sung hồ sơ</option>
          </select>
          <select
            value={cohortFilter ?? '__all__'}
            onChange={e => setCohortFilter(e.target.value === '__all__' ? null : e.target.value)}
            className={`${inputClass} sm:w-40`}
            aria-label="Lọc theo khóa"
          >
            <option value="__all__">Mọi khóa</option>
            {cohorts.map(({ cohort, count }) => (
              <option key={cohort || '__none__'} value={cohort}>
                {cohort ? `Khóa ${cohort}` : 'Chưa có khóa'} ({count})
              </option>
            ))}
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
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-3">
        Danh sách được đồng bộ tự động từ Google Sheet (các tab K24, K25, K26…). Thêm / sửa sinh viên nên làm trong sheet;
        sinh viên đăng nhập lần đầu bằng tài khoản @hcmut.edu.vn sẽ tự điền phần còn thiếu và thông tin đó cũng được đưa về sheet.
      </p>

      {/* One collapsible block per Khóa; closed by default so the page is not one huge list */}
      {loading ? (
        <p className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">Đang tải danh sách…</p>
      ) : loadError ? (
        <p className="px-4 py-8 text-center text-xs text-rose-600 dark:text-rose-300 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          {loadError}{' '}
          <button onClick={loadMembers} className="underline font-semibold">Thử lại</button>
        </p>
      ) : groups.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          {members.length === 0
            ? 'Chưa có sinh viên nào. Bấm "Thêm sinh viên" hoặc "Nhập Excel" để bắt đầu.'
            : 'Không có sinh viên nào phù hợp với bộ lọc.'}
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const open = isGroupOpen(group.cohort);
            return (
              <div key={group.cohort || '__none__'} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleGroup(group.cohort)}
                  aria-expanded={open}
                  className="w-full px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${open ? '' : '-rotate-90'}`} />
                  <span className="font-tech text-sm font-bold text-slate-900 dark:text-slate-100">
                    {group.cohort ? `Khóa ${group.cohort}` : 'Chưa có khóa'}
                  </span>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{group.items.length} sinh viên</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Đoàn viên {group.items.filter(m => m.isUnionMember).length} • Hội viên {group.items.filter(m => m.isAssociationMember).length} •
                    Đã bổ sung hồ sơ {group.items.filter(m => m.profileCompletedAt).length}
                  </span>
                </button>

                {open && (
                  <div className="border-t border-slate-200 dark:border-slate-700">
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
                          {group.items.slice(0, MAX_ROWS).map(renderRow)}
                        </tbody>
                      </table>
                    </div>
                    {group.items.length > MAX_ROWS && (
                      <p className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                        Đang hiển thị {MAX_ROWS}/{group.items.length} sinh viên của khóa này. Dùng ô tìm kiếm hoặc bộ lọc để thu hẹp; nút Xuất Excel vẫn xuất đủ.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Ghi chú</label>
                <textarea rows={2} maxLength={500} value={form.note} onChange={e => setField('note', e.target.value)} className={inputClass} />
              </div>

              {/* Account the student linked on first sign-in */}
              {editingRecord?.accountEmail && (
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    Tài khoản đã liên kết: <strong className="font-mono">{editingRecord.accountEmail}</strong>
                    {unlinkRequested && <span className="text-rose-600 dark:text-rose-300"> — sẽ gỡ khi lưu</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUnlinkRequested(v => !v)}
                    className="px-3 py-1.5 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-rose-700 dark:hover:text-rose-300"
                    title="Dùng khi sinh viên liên kết nhầm; lần đăng nhập sau họ sẽ được hỏi lại"
                  >
                    {unlinkRequested ? 'Giữ liên kết' : 'Gỡ liên kết'}
                  </button>
                </div>
              )}

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
