import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  Mail, 
  Download, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Bell, 
  QrCode, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Trash2,
  Check,
  Eye,
  Layers,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { EventItem, RegistrationRecord, Role, EmailDispatchLog } from '../types';
import { api } from '../services/api';
import { FIREBASE_ENABLED } from '../services/firebaseConfig';

interface AdminDashboardProps {
  events: EventItem[];
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  onOpenQRScanner: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  events,
  currentRole,
  setCurrentRole,
  onOpenQRScanner
}) => {
  const [activeTab, setActiveTab] = useState<'REGISTRATIONS' | 'AUTOMATION' | 'ROLES' | 'EMAIL_LOGS'>('REGISTRATIONS');
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Email Template Preview State
  const [previewType, setPreviewType] = useState<'TICKET' | 'REMINDER' | 'CHECKIN'>('TICKET');

  const loadData = async () => {
    setLoading(true);
    try {
      const [regs, logs] = await Promise.all([
        api.getRegistrations(selectedEventId !== 'ALL' ? selectedEventId : undefined, searchQuery),
        api.getEmailLogs()
      ]);
      setRegistrations(regs);
      setEmailLogs(logs);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEventId]);

  const handleSearch = () => {
    loadData();
  };

  // Export to Excel XLSX file
  const handleExportExcel = async () => {
    // xlsx is ~400KB: load it only when an export is actually requested
    const XLSX = await import('xlsx');

    const dataToExport = registrations.map((r, index) => ({
      'STT': index + 1,
      'Mã vé': r.ticketCode,
      'Họ và tên': r.fullName,
      'MSSV': r.mssv,
      'Chi đoàn': r.classGroup,
      'Email': r.email,
      'Số điện thoại': r.phone,
      'Tên sự kiện': r.eventTitle,
      'Ngày đăng ký': new Date(r.registeredAt).toLocaleString('vi-VN'),
      'Trạng thái điểm danh': r.checkedIn ? 'ĐÃ ĐIỂM DANH' : 'Chưa điểm danh',
      'Thời gian điểm danh': r.checkedInAt ? new Date(r.checkedInAt).toLocaleString('vi-VN') : 'N/A',
      'Ghi chú': r.note || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Sach_Dang_Ky');
    
    // Generate file download
    const fileName = `Danh_Sach_Sinh_Vien_${selectedEventId !== 'ALL' ? selectedEventId : 'All'}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setActionNotice(`Đã xuất thành công file ${fileName}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Trigger 24h Automated Email Reminder to all registered participants
  const handleTrigger24hReminder = async (eventId: string) => {
    setSendingReminder(true);
    try {
      const res = await api.sendReminder(eventId);
      setActionNotice(res.message);
      loadData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice(`Lỗi: ${err.message}`);
    } finally {
      setSendingReminder(false);
    }
  };

  const [seeding, setSeeding] = useState(false);

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      const { seedDemoData } = await import('../services/firebaseApi');
      setActionNotice(`${await seedDemoData()} Tải lại trang để xem dữ liệu.`);
    } catch (err: any) {
      setActionNotice(`Lỗi: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const rolesList: { role: Role; title: string; desc: string; permissions: string[] }[] = [
    {
      role: 'SUPER_ADMIN',
      title: 'Super Admin (Ban Thường vụ Đoàn - Hội Khoa)',
      desc: 'Toàn quyền quản trị cổng thông tin, phê duyệt tin tức, tạo sự kiện, phân quyền người dùng và xuất dữ liệu tham gia.',
      permissions: ['Toàn quyền hệ thống', 'Quản lý thành viên & BCH', 'Xuất báo cáo Excel', 'Gửi thông báo Push toàn khoa']
    },
    {
      role: 'EVENT_MANAGER',
      title: 'Ban CTXH (Quản trị Sự kiện & Tình nguyện)',
      desc: 'Quản lý danh sách đăng ký sự kiện, sử dụng trạm quét QR điểm danh, gửi email nhắc nhở 24h cho người tham dự.',
      permissions: ['Tạo & chỉnh sửa sự kiện', 'Quét QR điểm danh', 'Gửi email nhắc nhở 24h', 'Xuất danh sách sinh viên']
    },
    {
      role: 'EDITOR',
      title: 'Ban Truyền thông',
      desc: 'Phụ trách truyền thông, soạn thảo, đăng tải các bài viết hoạt động Đoàn - Hội, thông báo học vụ, cuộc thi NCKH và quản lý banner.',
      permissions: ['Đăng bài viết mới', 'Quản lý danh mục & Tags', 'Duyệt bài cộng tác viên']
    },
    {
      role: 'STUDENT',
      title: 'Sinh viên / Đoàn viên Khoa Điện - Điện tử',
      desc: 'Xem bản tin, đăng ký tham gia sự kiện, nhận vé QR điện tử và tra cứu lịch sử tham gia cá nhân theo MSSV.',
      permissions: ['Đăng ký sự kiện', 'Lưu vé QR điện tử', 'Tra cứu lịch sử theo MSSV']
    }
  ];

  return (
    <div className="py-10 bg-slate-50 dark:bg-slate-950 min-h-[75vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-8 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 shadow-2xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-tech text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                TRUNG TÂM QUẢN TRỊ & TỰ ĐỘNG HÓA
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Quản lý người tham gia, xuất file Excel, tự động hóa Email/Push 24h và kiểm soát phân quyền RBAC
              </p>
            </div>
          </div>

          {/* Role badge */}
          <div className="flex items-center space-x-2.5 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Quyền hiện tại:</span>
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs">
              {currentRole}
            </span>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-400/30 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between animate-in fade-in shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
              <span className="font-semibold">{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 font-bold cursor-pointer">
              Đóng
            </button>
          </div>
        )}

        {/* Nav Tabs */}
        <div className="mt-8 flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('REGISTRATIONS')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'REGISTRATIONS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản lý Đăng ký & Xuất Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('AUTOMATION')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'AUTOMATION'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Tự động hóa Email & Push 24h</span>
          </button>

          <button
            onClick={() => setActiveTab('ROLES')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'ROLES'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Phân quyền Người dùng (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('EMAIL_LOGS')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'EMAIL_LOGS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Nhật ký Gửi thư ({emailLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: REGISTRATIONS & EXCEL EXPORT */}
        {activeTab === 'REGISTRATIONS' && (
          <div className="mt-6 space-y-6">
            
            {/* Toolbar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                
                {/* Event Select */}
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả sự kiện</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>

                {/* Search */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Tìm tên, MSSV, mã vé..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleSearch}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                >
                  Lọc
                </button>
              </div>

              {/* Action Buttons: Export Excel & Open Scanner */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  id="admin-export-excel-btn"
                  onClick={handleExportExcel}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Xuất file Excel (.xlsx)</span>
                </button>

                <button
                  onClick={onOpenQRScanner}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Mở Trạm Quét QR</span>
                </button>
              </div>
            </div>

            {/* Registrations Table */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Mã Vé</th>
                      <th className="px-4 py-3">Sinh viên</th>
                      <th className="px-4 py-3">MSSV / Lớp</th>
                      <th className="px-4 py-3">Sự kiện</th>
                      <th className="px-4 py-3">Thời gian ĐK</th>
                      <th className="px-4 py-3 text-right">Trạng thái Điểm danh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          Chưa có dữ liệu đăng ký nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      registrations.map(r => (
                        <tr key={r.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-blue-300">
                            #{r.ticketCode}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{r.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{r.email}</p>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <span className="text-slate-900 dark:text-slate-100 font-bold">{r.mssv}</span>
                            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{r.classGroup}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="line-clamp-1 max-w-[200px] text-slate-700 dark:text-slate-200 font-medium">{r.eventTitle}</span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400">
                            {new Date(r.registeredAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {r.checkedIn ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30">
                                <Check className="w-3 h-3 mr-1" />
                                Đã điểm danh
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30">
                                Chưa điểm danh
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: AUTOMATION & EMAIL SERVICE */}
        {activeTab === 'AUTOMATION' && (
          <div className="mt-6 space-y-6">
            
            {/* Quick 24h Reminder Dispatcher */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-tech text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center space-x-2">
                <Send className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                <span>Gửi Email & Push Notification Nhắc Nhở 24h Trước Sự Kiện</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                Hệ thống tự động quét danh sách người đăng ký và gửi email kèm mã vé QR nhắc nhở trước giờ khai mạc.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.filter(e => e.status !== 'COMPLETED').map(evt => (
                  <div key={evt.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">{evt.typeName}</span>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-1 line-clamp-1">{evt.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        📅 {evt.eventDate} ({evt.startTime}) • 📍 {evt.location}
                      </p>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-2 font-mono">
                        Số lượng đã đăng ký: <strong className="text-blue-700 dark:text-blue-300 font-bold">{evt.currentParticipants} sinh viên</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleTrigger24hReminder(evt.id)}
                      disabled={sendingReminder}
                      className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white border border-blue-200 dark:border-blue-400/30 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Kích hoạt Gửi Nhắc Nhở 24h</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Template Previewer */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="font-tech text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                  <span>Trình Xem Trước Mẫu Email Tự Động (HTML Email Template)</span>
                </h3>

                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setPreviewType('TICKET')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      previewType === 'TICKET' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Xác nhận ĐK & Vé QR
                  </button>
                  <button
                    onClick={() => setPreviewType('REMINDER')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      previewType === 'REMINDER' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Nhắc nhở 24h
                  </button>
                  <button
                    onClick={() => setPreviewType('CHECKIN')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      previewType === 'CHECKIN' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Xác nhận Điểm danh
                  </button>
                </div>
              </div>

              {/* Realistic Email Mockup Window */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 shadow-md max-w-2xl mx-auto font-sans">
                {/* Email Header */}
                <div className="border-b pb-4 text-center">
                  <div className="inline-block bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-xs tracking-wider mb-2 shadow-2xs">
                    ĐOÀN - HỘI KHOA ĐIỆN - ĐIỆN TỬ
                  </div>
                  <h2 className="text-xl font-extrabold text-blue-900 dark:text-blue-200">
                    {previewType === 'TICKET' 
                      ? 'XÁC NHẬN ĐĂNG KÝ SỰ KIỆN THÀNH CÔNG' 
                      : previewType === 'REMINDER'
                      ? 'NHẮC NHỞ: SỰ KIỆN SẮP DIỄN RA TRONG 24H'
                      : 'XÁC NHẬN ĐIỂM DANH THAM DỰ SỰ KIỆN'}
                  </h2>
                </div>

                {/* Email Body */}
                <div className="py-5 text-sm space-y-3 text-slate-700 dark:text-slate-200">
                  <p>Xin chào <strong>Nguyễn Văn An</strong> (MSSV: <strong>2211001</strong>),</p>
                  
                  {previewType === 'TICKET' && (
                    <>
                      <p>Bạn đã đăng ký tham gia thành công sự kiện <strong>EE TECH DAY 2026: Triển lãm Đồ án & Ngày hội Tuyển dụng</strong>.</p>
                      
                      <div className="my-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">MÃ VÉ ĐIỆN TỬ CỦA BẠN</p>
                        <p className="text-2xl font-mono font-extrabold text-blue-700 dark:text-blue-300 my-1">#TECH-88392</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">Thời gian: 08:00 Ngày 28/08/2026 • Hội trường A</p>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">Vui lòng lưu lại email này hoặc xuất trình mã vé tại cổng Hội trường để hoàn tất điểm danh.</p>
                    </>
                  )}

                  {previewType === 'REMINDER' && (
                    <>
                      <p>Sự kiện <strong>EE TECH DAY 2026</strong> bạn đã đăng ký sẽ chính thức khai mạc vào <strong>08:00 sáng mai</strong> tại Hội trường A.</p>
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-400/30 rounded-lg text-xs text-amber-900 dark:text-amber-200">
                        ⚡ <strong>Lưu ý:</strong> Vui lòng mặc trang phục lịch sự / Áo Đoàn và mang theo thẻ sinh viên kèm vé QR (#TECH-88392).
                      </div>
                    </>
                  )}

                  {previewType === 'CHECKIN' && (
                    <>
                      <p>Ban Tổ chức xác nhận bạn đã <strong>Check-in thành công</strong> tại sự kiện <strong>EE TECH DAY 2026</strong>.</p>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-400/30 rounded-lg text-emerald-900 dark:text-emerald-200 text-center font-bold">
                        🎉 Ban Tổ chức đã ghi nhận bạn tham gia đầy đủ chương trình.
                      </div>
                    </>
                  )}
                </div>

                {/* Email Footer */}
                <div className="border-t pt-3 text-[11px] text-slate-400 text-center">
                  Văn phòng Đoàn - Hội Khoa Điện - Điện tử • Email: doanhoi.fee@university.edu.vn
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: ROLES & PERMISSIONS (RBAC) */}
        {activeTab === 'ROLES' && (
          <div className="mt-6 space-y-6">
            {FIREBASE_ENABLED && (
              <div className="p-5 rounded-3xl border border-blue-200 dark:border-blue-400/30 bg-blue-50/60 dark:bg-blue-950/40 text-sm text-slate-700 dark:text-slate-200">
                <p>
                  Quyền được cấp trong Firestore: mỗi tài khoản BCH là một document <code className="font-mono text-xs">admins/&lt;email&gt;</code> với
                  trường <code className="font-mono text-xs">role</code> là <code className="font-mono text-xs">SUPER_ADMIN</code>,{' '}
                  <code className="font-mono text-xs">EVENT_MANAGER</code> hoặc <code className="font-mono text-xs">EDITOR</code>.
                </p>
                {currentRole === 'SUPER_ADMIN' && (
                  <button
                    onClick={handleSeedDemoData}
                    disabled={seeding}
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold"
                  >
                    {seeding ? 'Đang nạp...' : 'Nạp dữ liệu mẫu (chỉ khi database còn trống)'}
                  </button>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rolesList.map(item => (
                <div 
                  key={item.role}
                  className={`p-6 rounded-3xl border transition-all ${
                    currentRole === item.role
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-400 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30">
                      {item.role}
                    </span>
                    {currentRole === item.role ? (
                      <span className="flex items-center text-xs font-bold text-blue-700 dark:text-blue-300">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-blue-600 dark:text-blue-300" />
                        Đang kích hoạt
                      </span>
                    ) : FIREBASE_ENABLED ? null : (
                      <button
                        onClick={() => setCurrentRole(item.role)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        Chuyển sang vai này
                      </button>
                    )}
                  </div>

                  <h4 className="font-tech text-base font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1.5">Quyền hạn truy cập:</span>
                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      {item.permissions.map((perm, idx) => (
                        <li key={idx} className="flex items-center space-x-1.5">
                          <Check className="w-3 h-3 text-blue-600 dark:text-blue-300 flex-shrink-0" />
                          <span>{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EMAIL DISPATCH LOGS */}
        {activeTab === 'EMAIL_LOGS' && (
          <div className="mt-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-4 flex items-center justify-between shadow-sm">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold">
                Nhật ký các email tự động đã gửi qua SMTP / Resend Simulation
              </span>
              <button
                onClick={loadData}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Người nhận</th>
                    <th className="px-4 py-3">Tiêu đề thư</th>
                    <th className="px-4 py-3">Loại thông báo</th>
                    <th className="px-4 py-3">Thời gian gửi</th>
                    <th className="px-4 py-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {emailLogs.map(log => (
                    <tr key={log.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/40">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{log.recipientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.recipientEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                        {log.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700 font-medium">
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(log.sentAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
