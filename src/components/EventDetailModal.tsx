import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Award, 
  Ticket, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Share2, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { EventItem } from '../types';

interface EventDetailModalProps {
  event: EventItem;
  onClose: () => void;
  onOpenRegister: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onOpenRegister
}) => {
  const percentage = Math.min(100, Math.round((event.currentParticipants / event.maxParticipants) * 100));
  const isRegistrationOpen = event.status === 'REGISTRATION_OPEN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header with image */}
        <div className="relative h-48 sm:h-64 overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
          <img 
            src={event.bannerUrl} 
            alt={event.title}
            referrerPolicy="no-referrer"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-sm">
              {event.typeName}
            </span>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <h2 className="font-tech text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {event.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center">
                <Calendar className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-300" />
                Thời gian:
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100">{event.eventDate}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{event.startTime} - {event.endTime}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center">
                <MapPin className="w-3 h-3 mr-1 text-orange-600 dark:text-orange-300" />
                Địa điểm:
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{event.location}</p>
            </div>

            <div className="space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center">
                <Users className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-300" />
                Chỉ tiêu tham gia:
              </span>
              <p className="font-bold text-blue-700 dark:text-blue-300 font-mono">{event.currentParticipants} / {event.maxParticipants}</p>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-1">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ width: `${percentage}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Detailed Content */}
          <div className="prose max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            {event.content}
          </div>

          {/* Requirements & Organizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                <span>Yêu cầu đối với người tham gia</span>
              </h4>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                {event.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                <span>Đơn vị tổ chức</span>
              </h4>
              <p className="text-slate-800 dark:text-slate-100 font-semibold text-[11px]">{event.organizer}</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 flex items-center">
                <Mail className="w-3 h-3 mr-1 text-slate-400" />
                {event.contactEmail}
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Hạn đăng ký: <strong className="text-slate-800 dark:text-slate-100">{event.registrationDeadline.split('T')[0]}</strong>
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Đóng
              </button>

              {isRegistrationOpen ? (
                <button
                  onClick={onOpenRegister}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition-all"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Đăng ký tham gia</span>
                </button>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  Đã hết hạn / Đủ số lượng
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
