import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Calendar, 
  Newspaper, 
  Users, 
  QrCode, 
  Search, 
  Bell, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  GraduationCap,
  Menu,
  X,
  Radio,
  LogIn,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { Role, NotificationItem } from '../types';
import { api } from '../services/api';
import { FIREBASE_ENABLED } from '../services/firebaseConfig';
import type { StaffSession } from '../services/auth';
import { useTheme } from '../theme';

// Every Firestore poll is billed as reads, so poll far less often than the local demo
const NOTIFICATION_POLL_MS = FIREBASE_ENABLED ? 120_000 : 8000;

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  session: StaffSession | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenQRScanner: () => void;
  onOpenStudentLookup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  session,
  onSignIn,
  onSignOut,
  onOpenQRScanner,
  onOpenStudentLookup
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      if (!document.hidden) loadNotifications();
    }, NOTIFICATION_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    await api.markNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const navLinks = [
    { id: 'home', label: 'Trang chủ', icon: Zap },
    { id: 'events', label: 'Sự kiện & Đăng ký', icon: Calendar },
    { id: 'news', label: 'Bản tin & Hoạt động', icon: Newspaper },
    { id: 'about', label: 'Cơ cấu Tổ chức', icon: Users },
    { id: 'lookup', label: 'Tra cứu Hoạt động', icon: GraduationCap },
    { id: 'admin', label: 'Quản trị & Tự động hóa', icon: ShieldCheck, restricted: currentRole === 'STUDENT' },
  ];

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-blue-100 dark:border-blue-400/30 shadow-md shadow-blue-900/5' 
        : 'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700'
    }`}>
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white px-4 py-1 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30">
              <Radio className="w-2.5 h-2.5 mr-1 text-white animate-pulse" />
              PORTAL 2026
            </span>
            <span className="hidden sm:inline font-medium tracking-wide text-blue-50">ĐOÀN TNCS HỒ CHÍ MINH - HỘI SINH VIÊN KHOA ĐIỆN - ĐIỆN TỬ</span>
            <span className="sm:hidden font-medium text-blue-50">ĐOÀN - HỘI KHOA ĐIỆN - ĐIỆN TỬ</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            {FIREBASE_ENABLED ? (
              /* Staff sign-in: role comes from admins/{email} in Firestore */
              session ? (
                <div className="flex items-center space-x-1.5 bg-blue-800/80 px-2.5 py-0.5 rounded-full border border-blue-400/40 text-white">
                  <span className="hidden md:inline font-medium text-blue-100 max-w-[180px] truncate">{session.email}</span>
                  <span className="font-semibold">{currentRole === 'STUDENT' ? 'Chưa cấp quyền' : currentRole}</span>
                  <button onClick={onSignOut} className="flex items-center font-semibold hover:text-blue-200 cursor-pointer" aria-label="Đăng xuất">
                    <LogOut className="w-3 h-3 ml-1" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onSignIn}
                  className="flex items-center space-x-1.5 bg-blue-800/80 hover:bg-blue-900 px-2.5 py-0.5 rounded-full border border-blue-400/40 text-white font-semibold cursor-pointer"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Đăng nhập BCH</span>
                </button>
              )
            ) : (
            /* Quick Role Switcher (demo mode) */
            <div className="flex items-center space-x-1.5 bg-blue-800/80 px-2.5 py-0.5 rounded-full border border-blue-400/40 text-white">
              <span className="text-blue-100 hidden md:inline font-medium">Vai trò:</span>
              <select 
                value={currentRole} 
                onChange={(e) => setCurrentRole(e.target.value as Role)}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="STUDENT" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Sinh viên / Đoàn viên</option>
                <option value="EVENT_MANAGER" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ban CTXH (Quản trị Sự kiện)</option>
                <option value="EDITOR" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ban Truyền thông (FEE Media)</option>
                <option value="SUPER_ADMIN" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Super Admin (BCH Khoa)</option>
              </select>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Nav Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <div 
            id="portal-logo" 
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-2.5 sm:space-x-3.5 cursor-pointer group select-none min-w-0"
          >
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Logo Đoàn Thanh niên - Hội sinh viên khoa Điện - Điện tử"
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex items-center space-x-2 min-w-0">
              <span className="font-tech text-[13px] sm:text-base font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                Đoàn Thanh niên - Hội sinh viên khoa Điện - Điện tử
              </span>
              <span className="hidden sm:inline px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30">
                HCMUT
              </span>
            </div>
          </div>

          {/* Right Actions: QR Check-In, Notifications, Mobile Hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 ml-2">
            
            {/* Quick QR Attendance Button */}
            <button
              id="header-qr-checkin-btn"
              onClick={onOpenQRScanner}
              className="hidden sm:flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Quét QR Điểm danh</span>
            </button>

            {/* Light / dark theme toggle */}
            <button
              id="header-theme-toggle"
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                id="header-notification-bell"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (unreadCount > 0) handleMarkAllRead();
                }}
                className="relative p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                aria-label="Thông báo"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div 
                  id="notifications-popover" 
                  className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Thông báo từ Đoàn - Hội</span>
                    </div>
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 dark:text-blue-300 hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã đọc tất cả</span>
                    </button>
                  </div>

                  <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">Chưa có thông báo mới</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id}
                          className={`p-3.5 rounded-xl text-xs border transition-all ${
                            n.read 
                              ? 'bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300' 
                              : 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-400/30 text-slate-800 dark:text-slate-100 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-blue-900 dark:text-blue-200 text-xs">{n.title}</span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Nav Links: own row under the brand so labels never wrap */}
        <nav className="hidden lg:flex items-center gap-1.5 pb-3 overflow-x-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl whitespace-nowrap text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-2 pb-6 space-y-2 shadow-lg">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col space-y-2">
            <button
              onClick={() => {
                onOpenStudentLookup();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Tra cứu Hoạt động & Vé QR cá nhân</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
