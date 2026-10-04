import React, { useState } from 'react';
import { GraduationCap, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { MemberGender, MemberRecord, MemberStatus } from '../types';
import { api } from '../services/api';
import { CLASS_GROUP_PATTERN } from '../services/shared';

const STATUS_OPTIONS: { value: MemberStatus; label: string }[] = [
  { value: 'STUDYING', label: 'Đang học' },
  { value: 'RESERVED', label: 'Bảo lưu' },
  { value: 'GRADUATED', label: 'Đã tốt nghiệp' },
  { value: 'DROPPED', label: 'Thôi học' },
];

const inputClass =
  'w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1';

interface StudentProfileModalProps {
  accountEmail: string;
  displayName: string | null;
  // The record already linked to this account, or null to ask for MSSV first
  linked: MemberRecord | null;
  onSaved: (record: MemberRecord) => void;
  onLater: () => void;
}

function YesNo({ name, value, onChange }: { name: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[true, false].map(option => (
        <label
          key={String(option)}
          className={`flex-1 text-center px-3 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${
            value === option
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-blue-400'
          }`}
        >
          <input type="radio" name={name} className="sr-only" checked={value === option} onChange={() => onChange(option)} />
          {option ? 'Có' : 'Không'}
        </label>
      ))}
    </div>
  );
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ accountEmail, displayName, linked, onSaved, onLater }) => {
  const [record, setRecord] = useState<MemberRecord | null>(linked);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Step 1: which student is this account?
  const [mssv, setMssv] = useState('');
  const [fullName, setFullName] = useState(displayName ?? '');

  // Step 2: the missing details. Yes/No answers start unset until the student has answered once.
  const answered = Boolean(linked?.profileCompletedAt);
  const [gender, setGender] = useState<MemberGender>(linked?.gender ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(linked?.dateOfBirth ?? '');
  const [classGroup, setClassGroup] = useState(linked?.classGroup ?? '');
  const [phone, setPhone] = useState(linked?.phone ?? '');
  const [email, setEmail] = useState(linked?.email || accountEmail);
  const [isUnionMember, setIsUnionMember] = useState<boolean | null>(answered ? linked!.isUnionMember : null);
  const [unionJoinDate, setUnionJoinDate] = useState(linked?.unionJoinDate ?? '');
  const [isAssociationMember, setIsAssociationMember] = useState<boolean | null>(answered ? linked!.isAssociationMember : null);
  // Imported records default to "Đang học"; the student confirms it on the first form
  const [status, setStatus] = useState<MemberStatus | ''>(answered ? linked!.status : '');
  const [saved, setSaved] = useState(false);

  const startForm = (member: MemberRecord) => {
    setRecord(member);
    setGender(member.gender);
    setDateOfBirth(member.dateOfBirth);
    setClassGroup(member.classGroup);
    setPhone(member.phone);
    setEmail(member.email || accountEmail);
    setUnionJoinDate(member.unionJoinDate);
    if (member.profileCompletedAt) {
      setIsUnionMember(member.isUnionMember);
      setIsAssociationMember(member.isAssociationMember);
      setStatus(member.status);
    }
  };

  const handleFind = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      startForm(await api.findMemberForLink(mssv, fullName, accountEmail));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    if (isUnionMember === null || isAssociationMember === null) {
      setError('Vui lòng trả lời bạn có phải Đoàn viên / Hội viên không.');
      return;
    }
    if (!status) {
      setError('Vui lòng chọn trạng thái học tập.');
      return;
    }
    setBusy(true);
    setError(null);
    const patch = {
      gender,
      dateOfBirth,
      classGroup: classGroup.trim().toUpperCase(),
      email,
      phone,
      isUnionMember,
      unionJoinDate,
      isAssociationMember,
      status,
    };
    try {
      await api.saveMyProfile(record.id, patch, accountEmail);
      setSaved(true);
      const now = new Date().toISOString();
      onSaved({ ...record, ...patch, unionJoinDate: isUnionMember ? unionJoinDate : '', accountEmail, profileCompletedAt: now, updatedAt: now });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start space-x-3 mb-5">
          <span className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex-shrink-0">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100">Hoàn tất hồ sơ sinh viên</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {saved
                ? 'Cảm ơn bạn!'
                : record
                  ? 'Bổ sung các thông tin còn thiếu để Đoàn - Hội khoa cập nhật hồ sơ của bạn.'
                  : 'Lần đầu đăng nhập: xác nhận MSSV để liên kết tài khoản với hồ sơ sinh viên của khoa.'}
            </p>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-400/30 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {saved ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Đã lưu hồ sơ của bạn.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Bạn có thể cập nhật lại trong menu tài khoản (góc phải trên cùng).</p>
            <button onClick={onLater} className="mt-5 px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700">
              Đóng
            </button>
          </div>
        ) : !record ? (
          /* Step 1: link the account */
          <form onSubmit={handleFind} className="space-y-4">
            <div>
              <label className={labelClass}>MSSV *</label>
              <input required value={mssv} onChange={e => setMssv(e.target.value)} inputMode="numeric" autoFocus className={`${inputClass} font-mono`} />
            </div>
            <div>
              <label className={labelClass}>Họ và tên (có dấu) *</label>
              <input required value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tài khoản <strong>{accountEmail}</strong> sẽ được liên kết với MSSV này và không thể dùng cho MSSV khác.
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onLater} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                Để sau
              </button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5">
                {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Tiếp tục</span>
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: fill in the missing details */
          <form onSubmit={handleSave} className="space-y-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm">
              <p className="font-bold text-slate-900 dark:text-slate-100">{record.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                MSSV {record.mssv}{record.cohort && ` • Khóa ${record.cohort}`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Giới tính *</label>
                <select required value={gender} onChange={e => setGender(e.target.value as MemberGender)} className={inputClass}>
                  <option value="">— Chọn —</option>
                  <option value="NAM">Nam</option>
                  <option value="NU">Nữ</option>
                  <option value="KHAC">Khác</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Ngày sinh *</label>
                <input required type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Lớp / Chi đoàn *</label>
                <input
                  required
                  maxLength={8}
                  value={classGroup}
                  onChange={e => setClassGroup(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="VD: DD23KSTN"
                  pattern={CLASS_GROUP_PATTERN.source}
                  title="Đúng 8 ký tự chữ hoặc số, ví dụ DD23KSTN"
                  className={`${inputClass} font-mono uppercase`}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Đúng 8 ký tự, ví dụ DD23KSTN</p>
              </div>
              <div>
                <label className={labelClass}>Số điện thoại *</label>
                <input required type="tel" maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email liên hệ *</label>
              <input required type="email" maxLength={100} value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Bạn là Đoàn viên? *</label>
                <YesNo name="union" value={isUnionMember} onChange={setIsUnionMember} />
              </div>
              <div>
                <label className={labelClass}>Bạn là Hội viên? *</label>
                <YesNo name="association" value={isAssociationMember} onChange={setIsAssociationMember} />
              </div>
            </div>

            {isUnionMember && (
              <div>
                <label className={labelClass}>Ngày vào Đoàn *</label>
                <input required type="date" value={unionJoinDate} onChange={e => setUnionJoinDate(e.target.value)} className={inputClass} />
              </div>
            )}

            <div>
              <label className={labelClass}>Trạng thái học tập *</label>
              <select required value={status} onChange={e => setStatus(e.target.value as MemberStatus)} className={inputClass}>
                <option value="">— Chọn —</option>
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onLater} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-50">
                Để sau
              </button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5">
                {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Lưu hồ sơ</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
