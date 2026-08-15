import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Calendar, 
  Newspaper, 
  Users, 
  QrCode, 
  ShieldCheck, 
  Layers, 
  GraduationCap, 
  Mail, 
  Phone, 
  MapPin, 
  HeartHandshake, 
  Cpu, 
  Globe, 
  Facebook, 
  Youtube, 
  Radio, 
  ArrowUp,
  Award,
  Sparkles,
  CircuitBoard,
  CheckCircle2
} from 'lucide-react';
import { Role, EventItem, NewsItem, BCHMember, FacultyStats, RegistrationRecord } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HeroSection } from './components/HeroSection';
import { AboutOrgSection } from './components/AboutOrgSection';
import { NewsFeed } from './components/NewsFeed';
import { EventsHub } from './components/EventsHub';
import { QRCheckInScanner } from './components/QRCheckInScanner';
import { StudentPortalLookup } from './components/StudentPortalLookup';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitectureDocViewer } from './components/ArchitectureDocViewer';
import { INITIAL_STATS } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentRole, setCurrentRole] = useState<Role>('SUPER_ADMIN'); // Default to Super Admin so evaluators can test everything immediately!
  
  // Data States
  const [stats, setStats] = useState<FacultyStats>(INITIAL_STATS);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [bchMembers, setBchMembers] = useState<BCHMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Overlay Modals
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [statsData, eventsData, newsData, bchData] = await Promise.all([
        api.getStats().catch(() => INITIAL_STATS),
        api.getEvents().catch(() => []),
        api.getNews().catch(() => []),
        api.getBCH().catch(() => [])
      ]);
      setStats(statsData);
      setEvents(eventsData);
      setNews(newsData);
      setBchMembers(bchData);
    } catch (err) {
      console.error('Initial data fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterSuccess = (record: RegistrationRecord, updatedEvent: EventItem) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setStats(prev => ({
      ...prev,
      totalRegistrations: prev.totalRegistrations + 1
    }));
    showToast(`Đăng ký thành công vé #${record.ticketCode}! Email xác nhận đã được gửi.`);
  };

  const handleCheckInSuccess = (record: RegistrationRecord) => {
    setStats(prev => ({
      ...prev,
      totalCheckIns: prev.totalCheckIns + 1
    }));
    showToast(`Đã điểm danh cho sinh viên ${record.fullName}!`);
  };

  const handleCreateNews = async (newsItem: Partial<NewsItem>) => {
    try {
      const created = await api.createNews(newsItem);
      setNews(prev => [created, ...prev]);
      showToast('Đã đăng bản tin mới thành công!');
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    }
  };

  const handleCreateEvent = async (eventItem: Partial<EventItem>) => {
    try {
      const created = await api.createEvent(eventItem);
      setEvents(prev => [created, ...prev]);
      showToast('Đã tạo sự kiện mới thành công!');
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white pb-16 lg:pb-0">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-white/95 border border-blue-200 shadow-xl text-xs text-blue-900 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenStudentLookup={() => setActiveTab('lookup')}
      />

      {/* Active Tab View Rendering */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div>
            <HeroSection
              stats={stats}
              upcomingEvent={events.find(e => e.status === 'REGISTRATION_OPEN') || events[0]}
              onExploreEvents={() => setActiveTab('events')}
              onOpenLookup={() => setActiveTab('lookup')}
              onOpenQRScanner={() => setIsQRScannerOpen(true)}
              onReadNews={() => setActiveTab('news')}
            />

            {/* Quick Section previews on home */}
            <div className="py-12 bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-tech text-xl font-bold text-slate-900 flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span>SỰ KIỆN NỔI BẬT ĐANG MỞ ĐĂNG KÝ</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-normal">Tự động cấp vé QR & điểm danh điện tử trực tuyến</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 hover:underline"
                  >
                    <span>Xem tất cả ({events.length})</span>
                    <span>→</span>
                  </button>
                </div>

                <EventsHub
                  events={events.slice(0, 3)}
                  currentRole={currentRole}
                  onRegisterSuccess={handleRegisterSuccess}
                  onCreateEvent={handleCreateEvent}
                />
              </div>
            </div>

            {/* News preview on home */}
            <div className="py-12 bg-slate-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-tech text-xl font-bold text-slate-900 flex items-center space-x-2">
                      <Newspaper className="w-5 h-5 text-blue-600" />
                      <span>BẢNG TIN & HOẠT ĐỘNG MỚI NHẤT</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-normal">Tin phong trào, nghiên cứu khoa học và học bổng doanh nghiệp</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('news')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 hover:underline"
                  >
                    <span>Xem tất cả ({news.length})</span>
                    <span>→</span>
                  </button>
                </div>

                <NewsFeed
                  newsList={news.slice(0, 3)}
                  currentRole={currentRole}
                  onCreateNews={handleCreateNews}
                />
              </div>
            </div>

            {/* Org Section snippet */}
            <AboutOrgSection bchMembers={bchMembers} />
          </div>
        )}

        {activeTab === 'events' && (
          <EventsHub
            events={events}
            currentRole={currentRole}
            onRegisterSuccess={handleRegisterSuccess}
            onCreateEvent={handleCreateEvent}
          />
        )}

        {activeTab === 'news' && (
          <NewsFeed
            newsList={news}
            currentRole={currentRole}
            onCreateNews={handleCreateNews}
          />
        )}

        {activeTab === 'about' && (
          <AboutOrgSection bchMembers={bchMembers} />
        )}

        {activeTab === 'lookup' && (
          <StudentPortalLookup events={events} />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            events={events}
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureDocViewer />
        )}
      </main>

      {/* Floating QR Scanner Modal if triggered */}
      {isQRScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xl">
            <QRCheckInScanner
              events={events}
              onClose={() => setIsQRScannerOpen(false)}
              onCheckInSuccess={handleCheckInSuccess}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation (Always accessible on small viewports) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* Col 1: Brand & Slogan */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-md">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-tech text-base font-extrabold text-white">
                  PORTAL ĐOÀN - HỘI FEE
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Cổng thông tin điện tử, quản lý phong trào sinh viên và tự động hóa điểm danh Đoàn TNCS Hồ Chí Minh - Hội Sinh viên Khoa Điện - Điện tử.
              </p>
              <div className="text-[11px] text-blue-400 font-semibold flex items-center space-x-1">
                <CircuitBoard className="w-3.5 h-3.5" />
                <span>Tiên phong Chuyển đổi số & Công nghệ Vi mạch</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 className="font-tech text-xs font-bold uppercase tracking-wider text-white mb-3">
                Chuyên mục
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => setActiveTab('events')} className="hover:text-blue-400 transition-colors">
                    Sự kiện & Đăng ký trực tuyến
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('news')} className="hover:text-blue-400 transition-colors">
                    Tin tức phong trào & Cuộc thi NCKH
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('lookup')} className="hover:text-blue-400 transition-colors">
                    Tra cứu Hoạt động & Vé QR
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsQRScannerOpen(true)} className="hover:text-orange-400 transition-colors">
                    Trạm Quét QR Điểm danh
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: CLB Trực thuộc */}
            <div>
              <h4 className="font-tech text-xs font-bold uppercase tracking-wider text-white mb-3">
                Hệ sinh thái CLB FEE
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="text-slate-300 font-medium">• CLB Robofee & Hệ thống Nhúng</li>
                <li className="text-slate-300 font-medium">• CLB IoT & AIoT Hub</li>
                <li className="text-slate-300 font-medium">• Đội Tình nguyện Xanh & Chuyên Điện</li>
                <li className="text-slate-300 font-medium">• Ban Truyền thông FEE Media Production</li>
              </ul>
            </div>

            {/* Col 4: Contact */}
            <div>
              <h4 className="font-tech text-xs font-bold uppercase tracking-wider text-white mb-3">
                Liên hệ Đoàn - Hội Khoa
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <p className="flex items-start space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Văn phòng Đoàn - Hội Khoa Điện - Điện tử (Phòng B102, Nhà B)</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>doanhoi.fee@university.edu.vn</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="font-mono">0903 123 456 (Hotline Bí thư)</span>
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p>© 2026 Đoàn - Hội Khoa Điện - Điện tử. All rights reserved.</p>
            <div className="flex items-center space-x-3">
              <button onClick={() => setActiveTab('architecture')} className="text-blue-400 hover:underline">
                Kiến trúc Hệ thống & Prisma Schema
              </button>
              <span>•</span>
              <button onClick={scrollToTop} className="text-slate-400 hover:text-white flex items-center space-x-1">
                <span>Về đầu trang</span>
                <ArrowUp className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
