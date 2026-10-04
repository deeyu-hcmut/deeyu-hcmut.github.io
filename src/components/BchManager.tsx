import React, { useEffect, useRef, useState } from 'react';
import {
  UserPlus,
  FileSpreadsheet,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ImagePlus,
  UserRound,
} from 'lucide-react';
import { BCHMember, BchOrganization } from '../types';
import { api } from '../services/api';
import type { BchInput } from '../services/shared';
import { imageFileToDataUrl } from '../utils/image';
import { writeWorkbook } from '../utils/excel';

export const ORGANIZATION_LABELS: Record<BchOrganization, string> = {
  DOAN_KHOA: 'Đoàn Thanh niên',
  HOI_SINH_VIEN: 'Hội Sinh viên',
  DOI_CTV: 'Đội CTV Đoàn - Hội',
};

const ORGANIZATIONS = Object.keys(ORGANIZATION_LABELS) as BchOrganization[];

const EMPTY_FORM: BchInput = {
  name: '',
  position: '',
  organization: 'DOAN_KHOA',
  email: '',
  classGroup: '',
  avatarUrl: '',
  bio: '',
  department: '',
};

// The list itself is kept in Google Sheet (tools/google-sheet-sync/bch); Excel is export only,
// with the sheet's columns plus the two that only live on the website
const EXPORT_HEADERS = ['Tổ chức', 'Họ và tên', 'Chức vụ', 'Ban/Bộ phận', 'Email', 'Giới thiệu', 'Chi đoàn', 'Ảnh (link)'];

const inputClass =
  'w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1';

interface BchManagerProps {
  // Refreshes the public "Cơ cấu Tổ chức" cards after a change
  onChange: () => void;
}

export const BchManager: React.FC<BchManagerProps> = ({ onChange }) => {
  const [members, setMembers] = useState<BCHMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [orgFilter, setOrgFilter] = useState<BchOrganization | 'ALL'>('ALL');

  // editingId undefined = form closed, null = adding, string = editing that card
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState<BchInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<BCHMember | null>(null);
  const [busy, setBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setMembers(await api.getBCH());
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showNotice = (kind: 'success' | 'error', text: string) => {
    setNotice({ kind, text });
    if (kind === 'success') setTimeout(() => setNotice(null), 5000);
  };

  const afterChange = async (message: string) => {
    await load();
    onChange();
    showNotice('success', message);
  };

  const visible = orgFilter === 'ALL' ? members : members.filter(m => m.organization === orgFilter);

  const openForm = (member?: BCHMember) => {
    if (member) {
      const { id: _id, ...input } = member;
      setForm({ ...EMPTY_FORM, ...input });
      setEditingId(member.id);
    } else {
      setForm({ ...EMPTY_FORM, organization: orgFilter === 'ALL' ? 'DOAN_KHOA' : orgFilter });
      setEditingId(null);
    }
    setFormError(null);
  };

  const setField = <K extends keyof BchInput>(key: K, value: BchInput[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setField('avatarUrl', await imageFileToDataUrl(file));
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const saved = await api.saveBchMember(form, editingId ?? undefined);
      setEditingId(undefined);
      await afterChange(editingId ? `Đã cập nhật ${saved.name}.` : `Đã thêm ${saved.name}.`);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteBchMember(deleting.id);
      const name = deleting.name;
      setDeleting(null);
      await afterChange(`Đã xoá ${name}.`);
    } catch (err: any) {
      setDeleting(null);
      showNotice('error', err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    const rows = visible.map(m => ({
      'Tổ chức': ORGANIZATION_LABELS[m.organization],
      'Họ và tên': m.name,
      'Chức vụ': m.position,
      'Ban/Bộ phận': m.department,
      'Email': m.email,
      'Giới thiệu': m.bio,
      'Chi đoàn': m.classGroup,
      // Uploaded photos are too long for an Excel cell; only links are exported
      'Ảnh (link)': m.avatarUrl.startsWith('https://') ? m.avatarUrl : '',
    }));
    const fileName = `Danh_Sach_BCH_${Date.now()}.xlsx`;
    await writeWorkbook(EXPORT_HEADERS, rows, fileName);
    showNotice('success', `Đã xuất ${rows.length} người ra file ${fileName}.`);
  };

  return (
    <div className="mt-6 space-y-6">
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
          <button onClick={() => setNotice(null)} className="flex-shrink-0" aria-label="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', ...ORGANIZATIONS] as const).map(org => (
            <button
              key={org}
              onClick={() => setOrgFilter(org)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                orgFilter === org
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-300'
              }`}
            >
              {org === 'ALL' ? `Tất cả (${members.length})` : `${ORGANIZATION_LABELS[org]} (${members.filter(m => m.organization === org).length})`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            onClick={() => openForm()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm người</span>
          </button>
          <button
            onClick={handleExport}
            disabled={visible.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-3">
        Danh sách hiện công khai ở trang Cơ cấu Tổ chức, đồng bộ tự động từ Google Sheet BCH (thứ tự hiển thị = thứ tự dòng trong sheet).
        Sửa tên, chức vụ, ban, email, giới thiệu trong sheet; ảnh đại diện và chi đoàn thì sửa ở đây (nút Sửa).
      </p>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <p className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400">Đang tải danh sách…</p>
        ) : visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Chưa có ai. Bấm "Thêm người" hoặc "Nhập Excel" để bắt đầu.
          </p>
        ) : (
          visible.map(m => (
            <div key={m.id} className="px-4 py-3 flex items-center gap-3 hover:bg-blue-50/40 dark:hover:bg-blue-950/40">
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
              ) : (
                <span className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                  <UserRound className="w-5 h-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{m.name}</p>
                <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold truncate">{m.position || '—'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {ORGANIZATION_LABELS[m.organization]}
                  {m.department && ` • ${m.department}`}
                  {m.classGroup && ` • ${m.classGroup}`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openForm(m)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40" aria-label={`Sửa ${m.name}`} title="Sửa">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleting(m)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40" aria-label={`Xoá ${m.name}`} title="Xoá">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: add / edit */}
      {editingId !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center space-x-2">
              {editingId ? <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-300" /> : <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-300" />}
              <span>{editingId ? 'Sửa thông tin' : 'Thêm người vào BCH / Trưởng, phó ban Đội CTV'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="" referrerPolicy="no-referrer" className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-200 dark:border-blue-400/30" />
                ) : (
                  <span className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                    <UserRound className="w-8 h-8" />
                  </span>
                )}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30"
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span>Tải ảnh lên</span>
                    </button>
                    {form.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setField('avatarUrl', '')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        Bỏ ảnh
                      </button>
                    )}
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Ảnh được cắt vuông và thu nhỏ tự động.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tổ chức *</label>
                  <select value={form.organization} onChange={e => setField('organization', e.target.value as BchOrganization)} className={inputClass}>
                    {ORGANIZATIONS.map(org => (
                      <option key={org} value={org}>{ORGANIZATION_LABELS[org]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Họ và tên *</label>
                  <input required maxLength={100} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="VD: Đ/c Nguyễn Văn A" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Chức vụ</label>
                  <input maxLength={100} value={form.position} onChange={e => setField('position', e.target.value)} placeholder="VD: Bí thư Đoàn khoa, Trưởng ban..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ban / Bộ phận</label>
                  <input maxLength={100} value={form.department} onChange={e => setField('department', e.target.value)} placeholder="VD: Ban Thường vụ, Ban TT-SK..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Chi đoàn</label>
                  <input maxLength={50} value={form.classGroup} onChange={e => setField('classGroup', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email (hiện công khai)</label>
                  <input type="email" maxLength={100} value={form.email} onChange={e => setField('email', e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Giới thiệu ngắn</label>
                <textarea rows={3} maxLength={1000} value={form.bio} onChange={e => setField('bio', e.target.value)} className={inputClass} />
              </div>

              {formError && (
                <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-400/30 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !saving && setEditingId(undefined)}
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
                  <span>{saving ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Thêm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: confirm delete */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => !busy && setDeleting(null)}>
          <div
            role="alertdialog"
            aria-labelledby="delete-bch-title"
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 id="delete-bch-title" className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100">Xoá khỏi trang Cơ cấu Tổ chức?</h3>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200 break-words">
                  {deleting.name} — {deleting.position || ORGANIZATION_LABELS[deleting.organization]}
                </p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Không thể hoàn tác.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                disabled={busy}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={busy}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 flex items-center space-x-1.5"
              >
                {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{busy ? 'Đang xoá…' : 'Xoá'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
