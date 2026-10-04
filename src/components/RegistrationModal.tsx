import React, { useEffect, useState } from 'react';
import { 
  X, 
  Ticket, 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  Calendar,
  MapPin,
  LogIn,
  Lock
} from 'lucide-react';
import { EventItem, RegistrationRecord } from '../types';
import { api } from '../services/api';
import { FIREBASE_ENABLED } from '../services/firebaseConfig';
import { CLASS_GROUP_PATTERN, isHcmutEmail } from '../services/shared';
import { useSessionInfo } from '../session';

const FACULTY = 'Khoa Điện - Điện tử';

interface RegistrationModalProps {
  event: EventItem;
  onClose: () => void;
  onSuccess: (record: RegistrationRecord, updatedEvent: EventItem) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  onClose,
  onSuccess
}) => {
  const { session, role, myProfile, signIn, openProfile } = useSessionInfo();
  // A student's own profile fills the form; name and MSSV then cannot be changed (no registering for others)
  const profile = myProfile?.profileCompletedAt ? myProfile : null;

  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [mssv, setMssv] = useState(profile?.mssv ?? '');
  const [email, setEmail] = useState(profile?.email || session?.email || '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [classGroup, setClassGroup] = useState(profile?.classGroup ?? '');
  const [note, setNote] = useState('');

  // Fill in once the profile arrives (it loads after sign-in, possibly while this form is open)
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setMssv(profile.mssv);
    setClassGroup(profile.classGroup);
    setPhone(prev => prev || profile.phone);
    setEmail(prev => prev || profile.email || session?.email || '');
  }, [profile?.id, profile?.profileCompletedAt]);

  // Registration needs a signed-in account; an @hcmut.edu.vn student must finish their profile first
  const isStudentAccount = role === 'STUDENT';
  const gate: 'signin' | 'hcmut' | 'profile' | null = !FIREBASE_ENABLED
    ? null
    : !session
      ? 'signin'
      : isStudentAccount && !isHcmutEmail(session.email)
        ? 'hcmut'
        : isStudentAccount && !profile
          ? 'profile'
          : null;
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic validation
    if (!fullName.trim() || !mssv.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
      return;
    }
    if (!CLASS_GROUP_PATTERN.test(classGroup.trim().toUpperCase())) {
      setErrorMessage('Chi đoàn / Lớp phải gồm đúng 8 ký tự chữ hoặc số, ví dụ DD23KSTN.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.registerEvent(event.id, {
        fullName: fullName.trim(),
        mssv: mssv.trim(),
        email: email.trim(),
        phone: phone.trim(),
        classGroup: classGroup.trim().toUpperCase(),
        faculty: FACULTY,
        note: note.trim()
      });

      // Trigger Confetti Celebration
      import('canvas-confetti').then(({ default: confetti }) => confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      }));

      onSuccess(res.registration, res.eventUpdated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Modal Top Header */}
        <div className="p-5 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-tech text-base font-bold">
                ĐĂNG KÝ THAM GIA SỰ KIỆN
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Tự động cấp Vé Điện Tử QR Code điểm danh
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Quick Info Banner */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-1">{event.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-300" />
              {event.eventDate} ({event.startTime})
            </span>
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-orange-600 dark:text-orange-300" />
              {event.location}
            </span>
          </div>
        </div>

        {gate ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center mx-auto">
              {gate === 'profile' ? <GraduationCap className="w-7 h-7" /> : <LogIn className="w-7 h-7" />}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {gate === 'signin' && 'Vui lòng đăng nhập bằng tài khoản @hcmut.edu.vn để đăng ký. Thông tin của bạn sẽ được điền sẵn.'}
              {gate === 'hcmut' && (
                <>
                  Bạn đang đăng nhập bằng <strong>{session?.email}</strong>. Sinh viên cần đăng nhập bằng tài khoản
                  <strong> @hcmut.edu.vn</strong> để đăng ký sự kiện.
                </>
              )}
              {gate === 'profile' && 'Hoàn tất hồ sơ sinh viên trước (chỉ làm một lần), sau đó thông tin sẽ được điền sẵn khi đăng ký.'}
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Hủy bỏ
              </button>
              {gate === 'profile' ? (
                <button
                  type="button"
                  onClick={openProfile}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Hoàn tất hồ sơ</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={signIn}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{gate === 'hcmut' ? 'Đăng nhập tài khoản khác' : 'Đăng nhập với Google'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
        /* Form Body Scrollable */
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {profile && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Thông tin lấy từ hồ sơ sinh viên của bạn. Họ tên và MSSV không sửa được ở đây.
            </p>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-400/30 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-300 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Họ và tên sinh viên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                readOnly={Boolean(profile)}
                placeholder="VD: Nguyễn Văn An"
                className="w-full read-only:bg-slate-50 dark:read-only:bg-slate-950 read-only:text-slate-500 dark:read-only:text-slate-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* MSSV & Class Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Mã số sinh viên (MSSV) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={mssv}
                  onChange={(e) => setMssv(e.target.value)}
                  readOnly={Boolean(profile)}
                  placeholder="VD: 2311234"
                  className="w-full read-only:bg-slate-50 dark:read-only:bg-slate-950 read-only:text-slate-500 dark:read-only:text-slate-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Chi đoàn / Lớp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={classGroup}
                  onChange={(e) => setClassGroup(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={8}
                  pattern={CLASS_GROUP_PATTERN.source}
                  title="Đúng 8 ký tự chữ hoặc số, ví dụ DD23KSTN"
                  placeholder="VD: DD23KSTN"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Email nhận vé QR <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mssv@hcmut.edu.vn"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0912345678"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Ghi chú hoặc câu hỏi cho Ban Tổ chức
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Mong muốn tham gia nhóm thiết kế mạch FPGA..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Notice */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-400/30 text-[11px] text-slate-600 dark:text-slate-300 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
            <span>
              Sau khi bấm xác nhận, hệ thống sẽ tự động phát hành <strong>Mã Vé Điện Tử kèm QR Code</strong> và gửi email xác nhận. Vui lòng xuất trình mã QR khi đến sự kiện để điểm danh.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/20 flex items-center space-x-2 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Xác nhận Đăng ký & Nhận vé</span>
                </>
              )}
            </button>
          </div>

        </form>
        )}
      </div>
    </div>
  );
};
