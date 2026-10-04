import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Calendar, 
  Newspaper, 
  Users, 
  QrCode, 
  ShieldCheck, 
  Layers, 
  GraduationCap, 
  Mail, 
  MapPin, 
  HeartHandshake, 
  Cpu, 
  Globe, 
  Facebook, 
  Instagram,
  Youtube, 
  Radio, 
  ArrowUp,
  Award,
  Sparkles,
  CircuitBoard,
  CheckCircle2
} from 'lucide-react';
import { Role, EventItem, NewsItem, BCHMember, RegistrationRecord, MemberRecord } from './types';
import { api } from './services/api';
import { FIREBASE_ENABLED } from './services/firebaseConfig';
import type { StaffSession } from './services/auth';
import { canCheckIn } from './utils/roles';
import { isHcmutEmail } from './services/shared';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HeroSection } from './components/HeroSection';
import { AboutOrgSection } from './components/AboutOrgSection';
import { NewsFeed } from './components/NewsFeed';
import { EventsHub } from './components/EventsHub';

// Views that are not on the home page are split into their own chunks
const QRCheckInScanner = lazy(() => import('./components/QRCheckInScanner').then(m => ({ default: m.QRCheckInScanner })));
const StudentPortalLookup = lazy(() => import('./components/StudentPortalLookup').then(m => ({ default: m.StudentPortalLookup })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const StudentProfileModal = lazy(() => import('./components/StudentProfileModal').then(m => ({ default: m.StudentProfileModal })));

// "Để sau" on the first sign-in form lasts until the browser tab is closed
const PROFILE_LATER_KEY = 'fee_portal_profile_later';

function profileDeferred(email: string): boolean {
  try {
    return sessionStorage.getItem(PROFILE_LATER_KEY) === email;
  } catch {
    return false;
  }
}

// Tabs are mirrored in the URL hash (#/events, #/news, ...) so they survive a reload,
// can be shared as links and work with the browser Back button on GitHub Pages.
const TABS = ['home', 'events', 'news', 'about', 'lookup', 'admin'];

function tabFromHash(): string {
  const tab = window.location.hash.replace(/^#\/?/, '');
  return TABS.includes(tab) ? tab : 'home';
}

function TabFallback() {
  return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 rounded-full border-2 border-blue-200 dark:border-blue-400/30 border-t-blue-600 animate-spin" />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<string>(tabFromHash);

  useEffect(() => {
    const onHashChange = () => {
      setActiveTabState(tabFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setActiveTab = (tab: string) => {
    window.location.hash = tab === 'home' ? '/' : `/${tab}`;
  };
  // Demo mode (no Firebase) starts as Super Admin so evaluators can try everything;
  // with Firebase the role comes from the signed-in Google account.
  const [currentRole, setCurrentRole] = useState<Role>(FIREBASE_ENABLED ? 'STUDENT' : 'SUPER_ADMIN');
  const [session, setSession] = useState<StaffSession | null>(null);

  useEffect(() => {
    if (!FIREBASE_ENABLED) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    import('./services/auth').then(({ watchSession }) => {
      if (cancelled) return;
      unsubscribe = watchSession(next => {
        setSession(next);
        setCurrentRole(next?.role ?? 'STUDENT');
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // Students signing in with @hcmut.edu.vn link their record and fill in missing details once
  const [myProfile, setMyProfile] = useState<MemberRecord | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const hcmutEmail = FIREBASE_ENABLED && isHcmutEmail(session?.email) ? session!.email.toLowerCase() : null;

  useEffect(() => {
    setMyProfile(null);
    setProfileModalOpen(false);
    if (!hcmutEmail) return;
    let cancelled = false;
    api.getMyMemberProfile(hcmutEmail)
      .then(record => {
        if (cancelled) return;
        setMyProfile(record);
        if (!record?.profileCompletedAt && !profileDeferred(hcmutEmail)) setProfileModalOpen(true);
      })
      .catch(err => console.error('Failed to load student profile', err));
    return () => {
      cancelled = true;
    };
  }, [hcmutEmail]);

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    if (hcmutEmail && !myProfile?.profileCompletedAt) {
      try {
        sessionStorage.setItem(PROFILE_LATER_KEY, hcmutEmail);
      } catch {
        // ignore
      }
    }
  };

  const handleSignIn = async () => {
    try {
      const { signInStaff } = await import('./services/auth');
      await signInStaff();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') showToast(`Đăng nhập thất bại: ${err.message}`);
    }
  };

  const handleSignOut = async () => {
    const { signOutStaff } = await import('./services/auth');
    await signOutStaff();
    if (activeTab === 'admin') setActiveTab('home');
  };

  // Data States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [bchMembers, setBchMembers] = useState<BCHMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Overlay Modals
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Every staff role can run the check-in station; students never see it
  const openQRScanner = canCheckIn(currentRole) ? () => setIsQRScannerOpen(true) : undefined;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [eventsData, newsData, bchData] = await Promise.all([
        api.getEvents().catch(() => []),
        api.getNews().catch(() => []),
        api.getBCH().catch(() => [])
      ]);
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
    showToast(`Đăng ký thành công vé #${record.ticketCode}! Hãy lưu lại mã QR để điểm danh.`);
  };

  const handleCheckInSuccess = (record: RegistrationRecord) => {
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

  // Errors from these handlers propagate so the open form / dialog can show them
  const handleUpdateEvent = async (eventId: string, patch: Partial<EventItem>) => {
    const updated = await api.updateEvent(eventId, patch);
    setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
    showToast('Đã lưu thay đổi sự kiện.');
  };

  const handleUpdateNews = async (newsId: string, patch: Partial<NewsItem>) => {
    const updated = await api.updateNews(newsId, patch);
    setNews(prev => prev.map(n => n.id === newsId ? updated : n));
    showToast('Đã lưu thay đổi bài viết.');
  };

  const handleDeleteNews = async (item: NewsItem) => {
    await api.deleteNews(item.id);
    setNews(prev => prev.filter(n => n.id !== item.id));
    showToast(`Đã xoá bài viết "${item.title}".`);
  };

  const handleDeleteEvent = async (event: EventItem) => {
    const { deletedRegistrations } = await api.deleteEvent(event.id);
    setEvents(prev => prev.filter(e => e.id !== event.id));
    showToast(
      deletedRegistrations > 0
        ? `Đã xoá sự kiện "${event.title}" và ${deletedRegistrations} lượt đăng ký.`
        : `Đã xoá sự kiện "${event.title}".`
    );
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white pb-16 lg:pb-0">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-blue-200 dark:border-blue-400/30 shadow-xl text-xs text-blue-900 dark:text-blue-200 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-300 flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        session={session}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenQRScanner={openQRScanner}
        onOpenStudentLookup={() => setActiveTab('lookup')}
        onOpenProfile={hcmutEmail ? () => setProfileModalOpen(true) : undefined}
      />

      {profileModalOpen && hcmutEmail && (
        <Suspense fallback={null}>
          <StudentProfileModal
            key={myProfile?.id ?? 'unlinked'}
            accountEmail={hcmutEmail}
            displayName={session?.displayName ?? null}
            linked={myProfile}
            onSaved={record => setMyProfile(record)}
            onLater={closeProfileModal}
          />
        </Suspense>
      )}

      {/* Active Tab View Rendering */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="relative">
            <HeroSection
              upcomingEvent={events.find(e => e.status === 'REGISTRATION_OPEN') || events[0]}
              onExploreEvents={() => setActiveTab('events')}
              onOpenLookup={() => setActiveTab('lookup')}
              onOpenQRScanner={openQRScanner}
              onReadNews={() => setActiveTab('news')}
            />

            {/* Seamless Section 1: Events Preview */}
            <section className="relative py-16 sm:py-20 overflow-hidden">
              <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
              <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                  <div>
                    <h3 className="font-tech text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                      SỰ KIỆN NỔI BẬT ĐANG MỞ ĐĂNG KÝ
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Tự động cấp vé QR & điểm danh điện tử trực tuyến</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="self-start sm:self-auto text-sm font-bold text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 flex items-center space-x-2 cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400/50 transition-all"
                  >
                    <span>Khám phá tất cả ({events.length})</span>
                    <span>→</span>
                  </button>
                </div>

                <EventsHub
                  events={events.slice(0, 3)}
                  currentRole={currentRole}
                  onRegisterSuccess={handleRegisterSuccess}
                  onCreateEvent={handleCreateEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onUpdateEvent={handleUpdateEvent}
                  isCompact={true}
                />
              </div>
            </section>

            {/* Subtle Glow Divider */}
            <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-blue-500/20 dark:via-blue-400/20 to-transparent" />

            {/* Seamless Section 2: News Preview */}
            <section className="relative py-16 sm:py-20 overflow-hidden bg-slate-100/50 dark:bg-slate-900/40">
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-50/80 dark:from-slate-950 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50/80 dark:from-slate-950 to-transparent pointer-events-none" />
              <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/2" />

              <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                  <div>
                    <h3 className="font-tech text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                      BẢNG TIN & HOẠT ĐỘNG MỚI NHẤT
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Tin phong trào, nghiên cứu khoa học và học bổng doanh nghiệp</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('news')}
                    className="self-start sm:self-auto text-sm font-bold text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 flex items-center space-x-2 cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400/50 transition-all"
                  >
                    <span>Xem tất cả tin tức ({news.length})</span>
                    <span>→</span>
                  </button>
                </div>

                <NewsFeed
                  newsList={news.slice(0, 3)}
                  currentRole={currentRole}
                  onCreateNews={handleCreateNews}
                  onUpdateNews={handleUpdateNews}
                  onDeleteNews={handleDeleteNews}
                  isCompact={true}
                />
              </div>
            </section>

            {/* Subtle Glow Divider */}
            <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-blue-500/20 dark:via-blue-400/20 to-transparent" />

            {/* Seamless Section 3: BCH & Org snippet */}
            <AboutOrgSection bchMembers={bchMembers} />
          </div>
        )}

        {activeTab === 'events' && (
          <EventsHub
            events={events}
            currentRole={currentRole}
            onRegisterSuccess={handleRegisterSuccess}
            onCreateEvent={handleCreateEvent}
            onDeleteEvent={handleDeleteEvent}
            onUpdateEvent={handleUpdateEvent}
          />
        )}

        {activeTab === 'news' && (
          <NewsFeed
            newsList={news}
            currentRole={currentRole}
            onCreateNews={handleCreateNews}
            onUpdateNews={handleUpdateNews}
            onDeleteNews={handleDeleteNews}
          />
        )}

        {activeTab === 'about' && (
          <AboutOrgSection bchMembers={bchMembers} />
        )}

        <Suspense fallback={<TabFallback />}>
          {activeTab === 'lookup' && (
            <StudentPortalLookup events={events} />
          )}

          {activeTab === 'admin' && FIREBASE_ENABLED && currentRole === 'STUDENT' && (
            <div className="max-w-md mx-auto my-20 px-4 text-center">
              <ShieldCheck className="w-12 h-12 text-blue-600 dark:text-blue-300 mx-auto mb-4" />
              <h2 className="font-tech text-xl font-bold text-slate-900 dark:text-slate-100">Khu vực dành cho BCH</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {session
                  ? `Tài khoản ${session.email} chưa được cấp quyền quản trị. Liên hệ Super Admin để được thêm vào danh sách.`
                  : 'Đăng nhập bằng tài khoản Google đã được cấp quyền để quản lý sự kiện, tin tức và điểm danh.'}
              </p>
              {!session && (
                <button
                  onClick={handleSignIn}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md"
                >
                  Đăng nhập với Google
                </button>
              )}
            </div>
          )}

          {activeTab === 'admin' && !(FIREBASE_ENABLED && currentRole === 'STUDENT') && (
            <AdminDashboard
              events={events}
              currentRole={currentRole}
              setCurrentRole={setCurrentRole}
              onOpenQRScanner={() => setIsQRScannerOpen(true)}
              onBchChange={() => api.getBCH().then(setBchMembers).catch(() => {})}
              currentEmail={session?.email}
            />
          )}
        </Suspense>
      </main>

      {/* Floating QR Scanner Modal if triggered */}
      {isQRScannerOpen && openQRScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl">
            <Suspense fallback={<TabFallback />}>
              <QRCheckInScanner
                events={events}
                onClose={() => setIsQRScannerOpen(false)}
                onCheckInSuccess={handleCheckInSuccess}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation (Always accessible on small viewports) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQRScanner={openQRScanner}
      />

      {/* Smooth Transition into Footer */}
      <div className="h-16 sm:h-24 bg-gradient-to-b from-transparent to-slate-900 dark:to-slate-950 pointer-events-none" />

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 text-sm border-t border-slate-800/80">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 mb-12">
            
            {/* Col 1: Brand & Slogan */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex flex-col items-start space-y-3">
                <img
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt=""
                  width={96}
                  height={96}
                  loading="lazy"
                  className="w-24 h-24"
                />
                <span className="font-tech text-base font-extrabold text-white leading-tight">
                  Đoàn Thanh niên - Hội sinh viên<br />khoa Điện - Điện tử
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
                Cổng thông tin điện tử, quản lý phong trào sinh viên và tự động hóa điểm danh Đoàn TNCS Hồ Chí Minh - Hội Sinh viên Khoa Điện - Điện tử (HCMUT).
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div className="lg:col-span-2">
              <h4 className="font-tech text-xs font-bold uppercase tracking-wider text-white mb-4">
                Chuyên mục
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm">
                <li>
                  <button 
                    onClick={() => { setActiveTab('home'); scrollToTop(); }} 
                    className="hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Trang chủ
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveTab('events'); scrollToTop(); }} 
                    className="hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Sự kiện & Đăng ký
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveTab('news'); scrollToTop(); }} 
                    className="hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Bản tin & Hoạt động
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveTab('about'); scrollToTop(); }} 
                    className="hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Cơ cấu Tổ chức
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveTab('lookup'); scrollToTop(); }} 
                    className="hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Tra cứu Hoạt động
                  </button>
                </li>
                {openQRScanner && (
                  <li>
                    <button 
                      onClick={openQRScanner} 
                      className="hover:text-orange-400 transition-colors cursor-pointer"
                    >
                      Quét QR Điểm danh
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Col 3: Đội Cộng tác viên */}
            <div className="lg:col-span-3">
              <h4 className="font-tech text-xs font-bold uppercase tracking-wider text-white mb-4 leading-relaxed">
                Đội Cộng tác viên Đoàn - Hội<br className="hidden sm:inline" /> khoa Điện - Điện tử
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Đồng hành cùng Ban Chấp hành Đoàn - Hội tổ chức sự kiện, làm truyền thông và hỗ trợ sinh viên toàn khoa.
              </p>
            </div>

            {/* Col 4: Contact */}
            <div className="lg:col-span-3">
              <h4 className="font-tech text-xs font-bold uppercase tracking-wider text-white mb-4">
                Liên hệ Đoàn - Hội Khoa
              </h4>
              <div className="space-y-3 text-xs sm:text-sm text-slate-400">
                <div className="flex items-start space-x-2.5">
                  <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p>P204-B1, BK CS1</p>
                    <p>P515-BK.B6, BK CS2</p>
                  </div>
                </div>
                <p className="flex items-center space-x-2.5">
                  <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <a href="mailto:dtn-ddt@hcmut.edu.vn" className="hover:text-blue-400 transition-colors">
                    dtn-ddt@hcmut.edu.vn
                  </a>
                </p>
                <p className="flex items-center space-x-2.5">
                  <Facebook className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <a 
                    href="https://www.facebook.com/dee.yu.hcmut" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-blue-400 transition-colors"
                  >
                    dee.yu.hcmut
                  </a>
                </p>
                <p className="flex items-center space-x-2.5">
                  <Instagram className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <a 
                    href="https://www.instagram.com/deeyu_media25" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-pink-400 transition-colors"
                  >
                    deeyu_media25
                  </a>
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-slate-400">© 2026 Đoàn - Hội Khoa Điện - Điện tử (HCMUT). All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <button onClick={scrollToTop} className="text-slate-400 hover:text-white flex items-center space-x-1.5 cursor-pointer">
                <span>Về đầu trang</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
