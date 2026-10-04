import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, RefreshCw, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { Role, StaffAccount } from '../types';
import { api } from '../services/api';
import { ROLE_LABELS, STAFF_ROLES } from '../utils/roles';

const inputClass =
  'w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

interface StaffAccountsManagerProps {
  // The signed-in Super Admin: their own row is read-only so they cannot lock themselves out
  currentEmail?: string;
}

export const StaffAccountsManager: React.FC<StaffAccountsManagerProps> = ({ currentEmail }) => {
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('HC_TV');
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [removing, setRemoving] = useState<StaffAccount | null>(null);

  const self = currentEmail?.toLowerCase();

  const showNotice = (kind: 'success' | 'error', text: string) => {
    setNotice({ kind, text });
    if (kind === 'success') setTimeout(() => setNotice(null), 5000);
  };

  const load = async () => {
    setLoading(true);
    try {
      setAccounts(await api.getStaffAccounts());
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upsert = (account: StaffAccount) =>
    setAccounts(prev => [...prev.filter(a => a.email !== account.email), account].sort((a, b) => a.email.localeCompare(b.email)));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (email === self) {
      showNotice('error', 'Không thể tự đổi quyền của chính mình.');
      return;
    }
    const existing = accounts.find(a => a.email === email);
    setBusyEmail('__new__');
    try {
      const saved = await api.setStaffRole(newEmail, newRole);
      upsert(saved);
      setNewEmail('');
      showNotice(
        'success',
        existing
          ? `${saved.email} đã có trong danh sách, đã đổi quyền thành ${ROLE_LABELS[saved.role]}.`
          : `Đã cấp quyền ${ROLE_LABELS[saved.role]} cho ${saved.email}.`
      );
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setBusyEmail(null);
    }
  };

  const handleChangeRole = async (account: StaffAccount, role: Role) => {
    setBusyEmail(account.email);
    try {
      upsert(await api.setStaffRole(account.email, role));
      showNotice('success', `Đã đổi quyền của ${account.email} thành ${ROLE_LABELS[role]}.`);
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setBusyEmail(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removing) return;
    const { email } = removing;
    setBusyEmail(email);
    try {
      await api.removeStaffAccount(email);
      setAccounts(prev => prev.filter(a => a.email !== email));
      showNotice('success', `Đã thu hồi quyền của ${email}. Tài khoản này giờ là sinh viên.`);
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setRemoving(null);
      setBusyEmail(null);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
      <div>
        <h3 className="font-tech text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          <span>Tài khoản BCH được cấp quyền</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Nhập email Google của thành viên BCH và chọn ban. Tài khoản không có trong danh sách là sinh viên.
          Quyền mới có hiệu lực khi người đó tải lại trang hoặc đăng nhập lại.
        </p>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
            notice.kind === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-400/30 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-400/30 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start space-x-2">
            {notice.kind === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="font-semibold">{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="flex-shrink-0" aria-label="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="email@gmail.com hoặc email@hcmut.edu.vn"
          className={`${inputClass} sm:flex-1`}
        />
        <select value={newRole} onChange={e => setNewRole(e.target.value as Role)} className={`${inputClass} sm:w-48`}>
          {STAFF_ROLES.map(role => (
            <option key={role} value={role}>{ROLE_LABELS[role]}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busyEmail !== null}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap"
        >
          {busyEmail === '__new__' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          <span>Cấp quyền</span>
        </button>
      </form>

      {/* List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {loading ? (
          <p className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">Đang tải…</p>
        ) : accounts.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">Chưa có tài khoản nào được cấp quyền.</p>
        ) : (
          accounts.map(account => {
            const isSelf = account.email === self;
            const busy = busyEmail === account.email;
            return (
              <div key={account.email} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{account.email}</p>
                  {isSelf && <p className="text-[11px] text-slate-500 dark:text-slate-400">Tài khoản của bạn (không tự đổi được)</p>}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={account.role}
                    disabled={isSelf || busyEmail !== null}
                    onChange={e => handleChangeRole(account, e.target.value as Role)}
                    className={`${inputClass} sm:w-44 disabled:opacity-60`}
                    aria-label={`Quyền của ${account.email}`}
                  >
                    {STAFF_ROLES.map(role => (
                      <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setRemoving(account)}
                    disabled={isSelf || busyEmail !== null}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 disabled:hover:bg-transparent"
                    aria-label={`Thu hồi quyền của ${account.email}`}
                    title="Thu hồi quyền"
                  >
                    {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirm remove */}
      {removing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => busyEmail === null && setRemoving(null)}>
          <div
            role="alertdialog"
            aria-labelledby="remove-staff-title"
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl"
          >
            <h3 id="remove-staff-title" className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100">Thu hồi quyền?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 break-words">
              <strong>{removing.email}</strong> ({ROLE_LABELS[removing.role]}) sẽ trở thành tài khoản sinh viên, không vào được trang Quản trị và không quét QR được nữa.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRemoving(null)}
                disabled={busyEmail !== null}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={busyEmail !== null}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Thu hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
