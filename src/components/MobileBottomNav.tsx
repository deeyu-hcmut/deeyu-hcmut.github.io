import React from 'react';
import { Zap, Calendar, Newspaper, Users, QrCode, GraduationCap } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQRScanner: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQRScanner,
}) => {
  const items = [
    { id: 'home', label: 'Trang chủ', icon: Zap },
    { id: 'events', label: 'Sự kiện', icon: Calendar },
    { id: 'scan', label: 'Điểm danh', icon: QrCode, isAction: true },
    { id: 'news', label: 'Bản tin', icon: Newspaper },
    { id: 'lookup', label: 'Tra cứu', icon: GraduationCap },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 safe-area-pb shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                id="mobile-bottom-qr-btn"
                onClick={onOpenQRScanner}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 active:scale-95 transition-transform border-2 border-white text-white">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={`mobile-bottom-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 stroke-[2.2]' : 'text-slate-400'}`} />
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold text-blue-700' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
