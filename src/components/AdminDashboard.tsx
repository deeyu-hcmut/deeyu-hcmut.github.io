import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
  const handleExportExcel = () => {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Sach_Dang_Ky_FEE');
    
    // Generate file download
    const fileName = `Danh_Sach_Sinh_Vien_FEE_${selectedEventId !== 'ALL' ? selectedEventId : 'All'}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setActionNotice(`Đã xuất thành công file ${fileName}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Trigger 24h Automated Email Reminder to all registered participants
  const handleTrigger24hReminder = async (eventId: string) => {
    setSendingReminder(true);
    try {
      const res = await api.sendReminder(eventId);
      setActionNotice(`Hệ thống đã tự động gửi email nhắc nhở 24h kèm vé QR tới ${res.sentCount} sinh viên!`);
      loadData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice(`Lỗi: ${err.message}`);
    } finally {
      setSendingReminder(false);
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
      title: 'Ban Truyền thông (FEE Media)',
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
    <div className="py-8 bg-slate-50 min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-tech text-xl sm:text-2xl font-extrabold text-slate-900">
                TRUNG TÂM QUẢN TRỊ & TỰ ĐỘNG HÓA (FEE ADMIN)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý thành viên, xuất file Excel, tự động hóa Email/Push và kiểm soát phân quyền
              </p>
            </div>
          </div>

          {/* Role badge */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Quyền hiện tại:</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm">
              {currentRole}
            </span>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in shadow-2xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-semibold">
              Đóng
            </button>
          </div>
        )}

        {/* Nav Tabs */}
        <div className="mt-6 flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
          <button
            onClick={() => setActiveTab('REGISTRATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'REGISTRATIONS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản lý Đăng ký & Xuất Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('AUTOMATION')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'AUTOMATION'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Tự động hóa Email & Push 24h</span>
          </button>

          <button
            onClick={() => setActiveTab('ROLES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'ROLES'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Phân quyền Người dùng (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('EMAIL_LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'EMAIL_LOGS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
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
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                
                {/* Event Select */}
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full sm:w-64 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleSearch}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
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
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Mã Vé</th>
                      <th className="px-4 py-3">Sinh viên</th>
                      <th className="px-4 py-3">MSSV / Lớp</th>
                      <th className="px-4 py-3">Sự kiện</th>
                      <th className="px-4 py-3">Thời gian ĐK</th>
                      <th className="px-4 py-3 text-right">Trạng thái Điểm danh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          Chưa có dữ liệu đăng ký nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      registrations.map(r => (
                        <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-blue-700">
                            #{r.ticketCode}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{r.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{r.email}</p>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <span className="text-slate-900 font-bold">{r.mssv}</span>
                            <span className="text-slate-500 block text-[10px]">{r.classGroup}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="line-clamp-1 max-w-[200px] text-slate-700 font-medium">{r.eventTitle}</span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-500">
                            {new Date(r.registeredAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {r.checkedIn ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3 mr-1" />
                                Đã điểm danh
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
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
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-tech text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <Send className="w-5 h-5 text-blue-600" />
                <span>Gửi Email & Push Notification Nhắc Nhở 24h Trước Sự Kiện</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-4">
                Hệ thống tự động quét danh sách người đăng ký và gửi email kèm mã vé QR nhắc nhở trước giờ khai mạc.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.filter(e => e.status !== 'COMPLETED').map(evt => (
                  <div key={evt.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase">{evt.typeName}</span>
                      <h4 className="font-bold text-slate-900 text-xs mt-1 line-clamp-1">{evt.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        📅 {evt.eventDate} ({evt.startTime}) • 📍 {evt.location}
                      </p>
                      <p className="text-[11px] text-slate-700 mt-2 font-mono">
                        Số lượng đã đăng ký: <strong className="text-blue-700 font-bold">{evt.currentParticipants} sinh viên</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleTrigger24hReminder(evt.id)}
                      disabled={sendingReminder}
                      className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Kích hoạt Gửi Nhắc Nhở 24h</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Template Previewer */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="font-tech text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-orange-600" />
                  <span>Trình Xem Trước Mẫu Email Tự Động (HTML Email Template)</span>
                </h3>

                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setPreviewType('TICKET')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      previewType === 'TICKET' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Xác nhận ĐK & Vé QR
                  </button>
                  <button
                    onClick={() => setPreviewType('REMINDER')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      previewType === 'REMINDER' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Nhắc nhở 24h
                  </button>
                  <button
                    onClick={() => setPreviewType('CHECKIN')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      previewType === 'CHECKIN' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Xác nhận Điểm danh
                  </button>
                </div>
              </div>

              {/* Realistic Email Mockup Window */}
              <div className="rounded-2xl border border-slate-200 bg-white text-slate-900 p-6 shadow-md max-w-2xl mx-auto font-sans">
                {/* Email Header */}
                <div className="border-b pb-4 text-center">
                  <div className="inline-block bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-xs tracking-wider mb-2 shadow-2xs">
                    ĐOÀN - HỘI KHOA ĐIỆN - ĐIỆN TỬ
                  </div>
                  <h2 className="text-xl font-extrabold text-blue-900">
                    {previewType === 'TICKET' 
                      ? 'XÁC NHẬN ĐĂNG KÝ SỰ KIỆN THÀNH CÔNG' 
                      : previewType === 'REMINDER'
                      ? 'NHẮC NHỞ: SỰ KIỆN SẮP DIỄN RA TRONG 24H'
                      : 'XÁC NHẬN ĐIỂM DANH THAM DỰ SỰ KIỆN'}
                  </h2>
                </div>

                {/* Email Body */}
                <div className="py-5 text-sm space-y-3 text-slate-700">
                  <p>Xin chào <strong>Nguyễn Văn An</strong> (MSSV: <strong>2211001</strong>),</p>
                  
                  {previewType === 'TICKET' && (
                    <>
                      <p>Bạn đã đăng ký tham gia thành công sự kiện <strong>EE TECH DAY 2026: Triển lãm Đồ án & Ngày hội Tuyển dụng</strong>.</p>
                      
                      <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <p className="text-xs text-slate-500 uppercase font-bold">MÃ VÉ ĐIỆN TỬ CỦA BẠN</p>
                        <p className="text-2xl font-mono font-extrabold text-blue-700 my-1">#FEE-TECH-88392</p>
                        <p className="text-xs text-slate-600">Thời gian: 08:00 Ngày 28/08/2026 • Hội trường A</p>
                      </div>

                      <p className="text-xs text-slate-500">Vui lòng lưu lại email này hoặc xuất trình mã vé tại cổng Hội trường để hoàn tất điểm danh.</p>
                    </>
                  )}

                  {previewType === 'REMINDER' && (
                    <>
                      <p>Sự kiện <strong>EE TECH DAY 2026</strong> bạn đã đăng ký sẽ chính thức khai mạc vào <strong>08:00 sáng mai</strong> tại Hội trường A.</p>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        ⚡ <strong>Lưu ý:</strong> Vui lòng mặc trang phục lịch sự / Áo Đoàn và mang theo thẻ sinh viên kèm vé QR (#FEE-TECH-88392).
                      </div>
                    </>
                  )}

                  {previewType === 'CHECKIN' && (
                    <>
                      <p>Ban Tổ chức xác nhận bạn đã <strong>Check-in thành công</strong> tại sự kiện <strong>EE TECH DAY 2026</strong>.</p>
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-center font-bold">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rolesList.map(item => (
                <div 
                  key={item.role}
                  className={`p-6 rounded-3xl border transition-all ${
                    currentRole === item.role
                      ? 'bg-blue-50/60 border-blue-400 shadow-md'
                      : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      {item.role}
                    </span>
                    {currentRole === item.role ? (
                      <span className="flex items-center text-xs font-bold text-blue-700">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-blue-600" />
                        Đang kích hoạt
                      </span>
                    ) : (
                      <button
                        onClick={() => setCurrentRole(item.role)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors"
                      >
                        Chuyển sang vai này
                      </button>
                    )}
                  </div>

                  <h4 className="font-tech text-base font-bold text-slate-900">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Quyền hạn truy cập:</span>
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      {item.permissions.map((perm, idx) => (
                        <li key={idx} className="flex items-center space-x-1.5">
                          <Check className="w-3 h-3 text-blue-600 flex-shrink-0" />
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
            <div className="p-4 rounded-2xl bg-white border border-slate-200 mb-4 flex items-center justify-between shadow-sm">
              <span className="text-xs text-slate-700 font-semibold">
                Nhật ký các email tự động đã gửi qua SMTP / Resend Simulation
              </span>
              <button
                onClick={loadData}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Người nhận</th>
                    <th className="px-4 py-3">Tiêu đề thư</th>
                    <th className="px-4 py-3">Loại thông báo</th>
                    <th className="px-4 py-3">Thời gian gửi</th>
                    <th className="px-4 py-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emailLogs.map(log => (
                    <tr key={log.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{log.recipientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.recipientEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {log.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-blue-700 border border-slate-200 font-medium">
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {new Date(log.sentAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
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
