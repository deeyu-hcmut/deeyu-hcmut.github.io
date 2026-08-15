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
  const [mssvInput, setMssvInput] = useState('2211001');
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
    <div className="py-8 bg-slate-50 min-h-[75vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold mb-3">
            <GraduationCap className="w-4 h-4" />
            <span>Cổng Tra Cứu Đoàn Viên - Hội Viên</span>
          </div>
          <h2 className="font-tech text-2xl sm:text-4xl font-extrabold text-slate-900">
            TRA CỨU HOẠT ĐỘNG & VÉ ĐIỆN TỬ
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium">
            Nhập Mã số sinh viên (MSSV) để kiểm tra danh sách sự kiện đã đăng ký tham gia và xem lại các mã vé QR.
          </p>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="student-lookup-mssv-input"
                type="text"
                value={mssvInput}
                onChange={(e) => setMssvInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup(mssvInput)}
                placeholder="Nhập MSSV (VD: 2211001, 2111054, 2211089)..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
              />
            </div>
            <button
              id="student-lookup-btn"
              onClick={() => handleLookup(mssvInput)}
              disabled={loading || !mssvInput.trim()}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-600/20"
            >
              <Search className="w-4 h-4" />
              <span>Tra cứu ngay</span>
            </button>
          </div>

          {/* Quick MSSV Suggestions */}
          <div className="mt-3 flex items-center flex-wrap gap-2 text-xs text-slate-500">
            <span className="text-[11px] font-semibold text-slate-400">Mẫu gợi ý:</span>
            <button
              onClick={() => { setMssvInput('2211001'); handleLookup('2211001'); }}
              className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-blue-700 font-mono border border-slate-200 text-[11px] font-medium transition-colors"
            >
              2211001 (Nguyễn Văn An)
            </button>
            <button
              onClick={() => { setMssvInput('2111054'); handleLookup('2111054'); }}
              className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-blue-700 font-mono border border-slate-200 text-[11px] font-medium transition-colors"
            >
              2111054 (Lê Quang Minh)
            </button>
            <button
              onClick={() => { setMssvInput('2211089'); handleLookup('2211089'); }}
              className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-blue-700 font-mono border border-slate-200 text-[11px] font-medium transition-colors"
            >
              2211089 (Trần Thị Bích Ngọc)
            </button>
          </div>
        </div>

        {/* Results Card */}
        {data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3">
            
            {/* Summary Metrics */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      SINH VIÊN KHOA ĐIỆN - ĐIỆN TỬ
                    </span>
                  </div>
                  <h3 className="font-tech text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                    {data.studentName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    MSSV: <span className="text-blue-700 font-bold">{data.mssv}</span> • Chi đoàn: <span className="text-slate-800 font-bold">{data.classGroup}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center space-x-3">
                  <CheckCircle2 className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Trạng thái tham gia</span>
                    <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-tech">
                      {data.totalCheckedIn}/{data.totalRegistered} Sự kiện
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Sự kiện đã đăng ký:</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{data.totalRegistered} sự kiện</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Đã tham gia & Điểm danh:</span>
                  <p className="text-base font-bold text-emerald-600 mt-0.5">{data.totalCheckedIn} sự kiện</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 font-medium">Tỷ lệ chuyên cần:</span>
                  <p className="text-base font-bold text-blue-600 mt-0.5">
                    {data.totalRegistered > 0 ? Math.round((data.totalCheckedIn / data.totalRegistered) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* History Table / Cards */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h4 className="font-tech text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
                <span>Lịch sử Hoạt động & Vé Điện Tử ({data.history.length})</span>
                <span className="text-xs text-slate-500 font-medium">Nhấn vào vé để xem lại mã QR</span>
              </h4>

              {data.history.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-medium">
                  Chưa có lịch sử đăng ký sự kiện nào cho MSSV này.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.history.map((record) => (
                    <div 
                      key={record.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                            #{record.ticketCode}
                          </span>
                          {record.checkedIn ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Đã điểm danh
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                              Chưa điểm danh
                            </span>
                          )}
                        </div>

                        <h5 className="font-tech text-sm font-bold text-slate-900 truncate">
                          {record.eventTitle}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Đăng ký lúc: {new Date(record.registeredAt).toLocaleString('vi-VN')}
                        </p>
                      </div>

                      <button
                        onClick={() => handleViewTicket(record)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 shadow-2xs transition-colors flex-shrink-0"
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
        )}

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
