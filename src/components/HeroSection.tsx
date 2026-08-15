import React from 'react';
import { 
  Zap, 
  Calendar, 
  Users, 
  Award, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  QrCode, 
  CheckCircle2, 
  FileText, 
  GraduationCap,
  Flame
} from 'lucide-react';
import { FacultyStats, EventItem } from '../types';

interface HeroSectionProps {
  stats: FacultyStats;
  upcomingEvent?: EventItem;
  onExploreEvents: () => void;
  onOpenLookup: () => void;
  onOpenQRScanner: () => void;
  onReadNews: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  stats,
  upcomingEvent,
  onExploreEvents,
  onOpenLookup,
  onOpenQRScanner,
  onReadNews
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 pt-8 pb-14 sm:pt-14 sm:pb-18 border-b border-slate-200 bg-grid-pattern">
      {/* Ambient Soft Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Highlight Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-100/90 border border-blue-200 text-blue-800 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Kỷ nguyên Chuyển đổi số Đoàn - Hội 2026</span>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>Khoa Điện - Điện tử (FEE)</span>
          </div>
        </div>

        {/* Main Title & Slogan */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-tech text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-tight">
            TUỔI TRẺ <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">ĐIỆN - ĐIỆN TỬ</span>
            <br className="hidden sm:inline" /> TIÊN PHONG SÁNG TẠO & CÔNG NGHỆ
          </h1>
          
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Cổng thông tin tích hợp phong trào sinh viên, tự động hóa đăng ký sự kiện, cấp vé điện tử QR và quản trị dữ liệu Đoàn viên/Hội viên Khoa Điện - Điện tử.
          </p>

          {/* Quick Action CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              id="hero-explore-events-btn"
              onClick={onExploreEvents}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/25"
            >
              <Calendar className="w-4 h-4" />
              <span>Khám phá Sự kiện & Đăng ký</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-lookup-points-btn"
              onClick={onOpenLookup}
              className="flex items-center space-x-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-white text-blue-700 border border-blue-200 hover:bg-blue-50/60 active:scale-95 transition-all shadow-sm"
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Tra cứu Hoạt động & Vé QR</span>
            </button>

            <button
              id="hero-qr-checkin-btn"
              onClick={onOpenQRScanner}
              className="flex items-center space-x-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-white text-orange-700 border border-orange-200 hover:bg-orange-50/60 active:scale-95 transition-all shadow-sm"
            >
              <QrCode className="w-4 h-4 text-orange-600" />
              <span>Quét QR Điểm danh</span>
            </button>
          </div>
        </div>

        {/* Featured Live Banner Pill if upcoming event */}
        {upcomingEvent && (
          <div 
            id="hero-upcoming-event-banner"
            onClick={onExploreEvents}
            className="mt-8 max-w-2xl mx-auto p-3.5 rounded-2xl bg-white border border-blue-200 shadow-md cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-orange-100 text-orange-600 border border-orange-200">
                  <Flame className="w-4 h-4 animate-pulse" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Sự kiện Nổi bật</span>
                    <span className="text-[10px] text-slate-500 font-medium">• Ngày {upcomingEvent.eventDate}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {upcomingEvent.title}
                  </p>
                </div>
              </div>
              <span className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg border border-blue-200 flex items-center space-x-1">
                <span>Đăng ký ngay</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Live Counter Metrics Grid */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Đoàn viên / Hội viên</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tech">
                {stats.totalMembers.toLocaleString('vi-VN')}+
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">45 Chi đoàn trực thuộc</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Sự kiện & Phong trào</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tech">
                {stats.totalEventsHeld}+
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Học thuật, Thể thao, Tình nguyện</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-400 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Lượt Đăng ký & Điểm danh</span>
              <Award className="w-4 h-4 text-orange-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tech">
                {stats.totalRegistrations.toLocaleString('vi-VN')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Cấp vé QR & Check-in tự động</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">CLB Học thuật Chuyên sâu</span>
              <Cpu className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tech">
                {stats.topClubsCount} CLB
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Robofee, AIoT Hub, IC Design Lab</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

      </div>
    </section>
  );
};
