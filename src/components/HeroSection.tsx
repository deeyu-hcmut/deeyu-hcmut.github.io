import React from 'react';
import { Calendar, ArrowRight, Cpu, QrCode, GraduationCap, Flame } from 'lucide-react';
import { EventItem } from '../types';

interface HeroSectionProps {
  upcomingEvent?: EventItem;
  onExploreEvents: () => void;
  onOpenLookup: () => void;
  onOpenQRScanner: () => void;
  onReadNews: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  upcomingEvent,
  onExploreEvents,
  onOpenLookup,
  onOpenQRScanner,
  onReadNews
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 dark:from-blue-950/40 via-white dark:via-slate-900 to-slate-50 dark:to-slate-950 pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-200 dark:border-slate-700 bg-grid-pattern">
      {/* Ambient Soft Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div>
          <div className="max-w-5xl mx-auto space-y-6 text-center">
            
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-100/90 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-400/30 text-blue-800 dark:text-blue-200 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Kỷ nguyên Chuyển đổi số Đoàn - Hội 2026</span>
              </div>

              <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                <span>Khoa Điện - Điện tử (HCMUT)</span>
              </div>
            </div>

            {/* Main Title */}
            {/* Always exactly two lines: each line is nowrap and the size scales with the viewport */}
            <h1 className="font-tech hero-title font-extrabold tracking-tight text-slate-950 dark:text-slate-100 leading-[1.15]">
              <span className="block whitespace-nowrap">
                TUỔI TRẺ <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 dark:from-blue-300 dark:via-blue-200 dark:to-indigo-300 bg-clip-text text-transparent">ĐIỆN - ĐIỆN TỬ</span>
              </span>
              <span className="block whitespace-nowrap">KHAI PHÓNG - TIÊN PHONG - SÁNG TẠO</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              Cổng thông tin tích hợp quản lý phong trào sinh viên, tự động hóa đăng ký sự kiện, cấp vé điện tử QR độc nhất và quản trị cơ sở dữ liệu Đoàn - Hội thông minh.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
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
                className="flex items-center space-x-2 px-5 py-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                <span>Tra cứu Hoạt động</span>
              </button>

              <button
                id="hero-qr-checkin-btn"
                onClick={onOpenQRScanner}
                className="flex items-center space-x-2 px-5 py-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-900 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-400/30 hover:bg-orange-50/70 dark:hover:bg-orange-950/40 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                <span>Quét QR Điểm danh</span>
              </button>
            </div>

            {/* Live Highlight Event Banner */}
            {upcomingEvent && (
              <div 
                id="hero-upcoming-event-banner"
                onClick={onExploreEvents}
                className="pt-2 max-w-xl mx-auto text-left"
              >
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-blue-400/30 shadow-md hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-400/30">
                      <Flame className="w-5 h-5 animate-pulse" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-300">Sự kiện Đang mở</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">• Ngày {upcomingEvent.eventDate}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        {upcomingEvent.title}
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 px-3.5 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-400/30 flex items-center space-x-1.5 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <span>Đăng ký</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </section>
  );
};
