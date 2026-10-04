import React, { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  Award, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Ticket, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { RegistrationRecord, EventItem } from '../types';
import { TicketModal } from './TicketModal';

interface StudentPortalLookupProps {
  events: EventItem[];
}

export const StudentPortalLookup: React.FC<StudentPortalLookupProps> = ({ events }) => {
  const [mssvInput, setMssvInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    mssv: string;
    studentName: string;
    classGroup: string;
    totalRegistered: number;
    totalCheckedIn: number;
    history: RegistrationRecord[];
  } | null>(null);

  const [activeTicketRecord, setActiveTicketRecord] = useState<{ record: RegistrationRecord; event: EventItem } | null>(null);

  const handleLookup = async (mssvToSearch: string) => {
    if (!mssvToSearch.trim()) return;

    setLoading(true);
    try {
      const res = await api.lookupStudent(mssvToSearch.trim());
      setData(res);
    } catch (err) {
      console.error('Failed to lookup student', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (record: RegistrationRecord) => {
    const matchedEvent = events.find(e => e.id === record.eventId) || {
      id: record.eventId,
      title: record.eventTitle,
      slug: 'su-kien',
      description: '',
      content: '',
      type: 'ACADEMIC_CONTEST' as const,
      typeName: 'Sự kiện Đoàn - Hội',
      status: 'REGISTRATION_OPEN' as const,
      location: 'Hội trường Khoa Điện - Điện tử',
      eventDate: '2026-08-28',
      startTime: '08:00',
      endTime: '11:30',
      registrationDeadline: '',
      maxParticipants: 500,
      currentParticipants: 380,
      bannerUrl: '',
      organizer: 'Đoàn - Hội Khoa',
      contactEmail: '',
      requirements: [],
      isMandatoryCheckIn: true
    };

    setActiveTicketRecord({ record, event: matchedEvent });
  };

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-[75vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-100/90 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4 shadow-2xs">
            <GraduationCap className="w-4 h-4" />
            <span>Cổng Tra Cứu Đoàn Viên - Hội Viên</span>
          </div>
          <h2 className="font-tech text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            TRA CỨU HOẠT ĐỘNG & VÉ ĐIỆN TỬ
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Nhập Mã số sinh viên (MSSV) để kiểm tra danh sách sự kiện đã đăng ký tham gia, lịch sử điểm danh và xem lại các mã vé QR.
          </p>
        </div>

        {/* Search Bar */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md mb-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="student-lookup-mssv-input"
                type="text"
                value={mssvInput}
                onChange={(e) => setMssvInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup(mssvInput)}
                placeholder="Nhập Mã số sinh viên (MSSV) để tra cứu..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-900 dark:text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition-all"
              />
            </div>
            <button
              id="student-lookup-btn"
              onClick={() => handleLookup(mssvInput)}
              disabled={loading || !mssvInput.trim()}
              className="px-8 py-3.5 rounded-2xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-600/20 cursor-pointer whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>Tra cứu ngay</span>
            </button>
          </div>
        </div>

        {/* Results Card */}
        {data && (
          data.history.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm text-center animate-in fade-in slide-in-from-bottom-3">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-300">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h4 className="font-tech text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Chưa có dữ liệu hoạt động cho MSSV <span className="font-mono text-blue-600 dark:text-blue-300">{data.mssv}</span>
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Mã số sinh viên này chưa đăng ký tham gia sự kiện nào hoặc chưa có lịch sử điểm danh được ghi nhận trên hệ thống Đoàn - Hội.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3">
            
            {/* Summary Metrics */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30">
                      SINH VIÊN KHOA ĐIỆN - ĐIỆN TỬ
                    </span>
                  </div>
                  <h3 className="font-tech text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                    {data.studentName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    MSSV: <span className="text-blue-700 dark:text-blue-300 font-bold">{data.mssv}</span> • Chi đoàn: <span className="text-slate-800 dark:text-slate-100 font-bold">{data.classGroup}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 dark:from-blue-950/40 to-indigo-50 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-400/30 flex items-center space-x-3">
                  <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-300 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Trạng thái tham gia</span>
                    <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-300 font-tech">
                      {data.totalCheckedIn}/{data.totalRegistered} Sự kiện
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Sự kiện đã đăng ký:</span>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{data.totalRegistered} sự kiện</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Đã tham gia & Điểm danh:</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-300 mt-0.5">{data.totalCheckedIn} sự kiện</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tỷ lệ chuyên cần:</span>
                  <p className="text-base font-bold text-blue-600 dark:text-blue-300 mt-0.5">
                    {data.totalRegistered > 0 ? Math.round((data.totalCheckedIn / data.totalRegistered) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* History Table / Cards */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h4 className="font-tech text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
                <span>Lịch sử Hoạt động & Vé Điện Tử ({data.history.length})</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nhấn vào vé để xem lại mã QR</span>
              </h4>

              {data.history.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  Chưa có lịch sử đăng ký sự kiện nào cho MSSV này.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.history.map((record) => (
                    <div 
                      key={record.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-400/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-400/30">
                            #{record.ticketCode}
                          </span>
                          {record.checkedIn ? (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-400/30 flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Đã điểm danh
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-400/30">
                              Chưa điểm danh
                            </span>
                          )}
                        </div>

                        <h5 className="font-tech text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {record.eventTitle}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Đăng ký lúc: {new Date(record.registeredAt).toLocaleString('vi-VN')}
                        </p>
                      </div>

                      <button
                        onClick={() => handleViewTicket(record)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex-shrink-0"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Xem Vé QR</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ))}

        {/* Ticket Modal */}
        {activeTicketRecord && (
          <TicketModal
            record={activeTicketRecord.record}
            event={activeTicketRecord.event}
            onClose={() => setActiveTicketRecord(null)}
          />
        )}

      </div>
    </div>
  );
};
