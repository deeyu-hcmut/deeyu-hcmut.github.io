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
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-200 bg-grid-pattern">
      {/* Ambient Soft Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 2-Column Hero Layout for PC */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-100/90 border border-blue-200 text-blue-800 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Kỷ nguyên Chuyển đổi số Đoàn - Hội 2026</span>
              </div>

              <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>Khoa Điện - Điện tử (FEE - HCMUT)</span>
              </div>
            </div>

            {/* Main Title */}
            <h1 className="font-tech text-3xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
              TUỔI TRẺ <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">ĐIỆN - ĐIỆN TỬ</span>
              <br /> TIÊN PHONG SÁNG TẠO & CÔNG NGHỆ
            </h1>
            
            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              Cổng thông tin tích hợp quản lý phong trào sinh viên, tự động hóa đăng ký sự kiện, cấp vé điện tử QR độc nhất và quản trị cơ sở dữ liệu Đoàn - Hội thông minh.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <button
                id="hero-explore-events-btn"
                onClick={onExploreEvents}
                className="flex items-center space-x-2 px-6 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Khám phá Sự kiện & Nhận Vé QR</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-lookup-points-btn"
                onClick={onOpenLookup}
                className="flex items-center space-x-2 px-5 py-4 rounded-xl font-bold text-sm bg-white text-blue-700 border border-blue-200 hover:bg-blue-50/70 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Tra cứu Hoạt động</span>
              </button>

              <button
                id="hero-qr-checkin-btn"
                onClick={onOpenQRScanner}
                className="flex items-center space-x-2 px-5 py-4 rounded-xl font-bold text-sm bg-white text-orange-700 border border-orange-200 hover:bg-orange-50/70 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-orange-600" />
                <span>Quét QR Điểm danh</span>
              </button>
            </div>

            {/* Live Highlight Event Banner */}
            {upcomingEvent && (
              <div 
                id="hero-upcoming-event-banner"
                onClick={onExploreEvents}
                className="pt-2 max-w-xl mx-auto lg:mx-0"
              >
                <div className="p-4 rounded-2xl bg-white border border-blue-200/90 shadow-md hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100 text-orange-600 border border-orange-200">
                      <Flame className="w-5 h-5 animate-pulse" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Sự kiện Đang mở</span>
                        <span className="text-[11px] text-slate-500 font-medium">• Ngày {upcomingEvent.eventDate}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {upcomingEvent.title}
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-xl border border-blue-200 flex items-center space-x-1.5 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <span>Đăng ký</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Interactive Live Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 p-6 sm:p-8 shadow-xl shadow-blue-900/5 overflow-hidden">
              
              {/* Header inside showcase */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-tech text-base font-bold text-slate-900">BẢNG THÔNG SỐ TRỰC TUYẾN</h3>
                    <p className="text-xs text-slate-500">Cập nhật thời gian thực từ hệ thống</p>
                  </div>
                </div>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </span>
              </div>

              {/* 4 Stats Grid in Showcase */}
              <div className="grid grid-cols-2 gap-4 my-6">
                
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                    <span>Đoàn viên/Hội viên</span>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tech">
                    {stats.totalMembers.toLocaleString('vi-VN')}+
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">45 Chi đoàn trực thuộc</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                    <span>Sự kiện / Năm</span>
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tech">
                    {stats.totalEventsHeld}+
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Học thuật & Phong trào</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-orange-300 hover:bg-orange-50/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                    <span>Lượt Đăng ký QR</span>
                    <Award className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tech">
                    {stats.totalRegistrations.toLocaleString('vi-VN')}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Cấp vé QR tự động</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                    <span>CLB Học thuật</span>
                    <Cpu className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tech">
                    {stats.topClubsCount} CLB
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Robofee, AIoT, IC Lab</p>
                </div>

              </div>

              {/* Sample Ticket Preview Bar inside Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Vé Điện Tử Mẫu (E-Ticket)</div>
                      <div className="font-mono text-sm font-extrabold text-white">#FEE-TECH-88392</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                    Hợp lệ
                  </span>
                </div>
              </div>

              {/* Tech Tags */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">#Robocon2026</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">#ICDesign</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">#SinhVien5Tot</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">#MuaHeXanh</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
