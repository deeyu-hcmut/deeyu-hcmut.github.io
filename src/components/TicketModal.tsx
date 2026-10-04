import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  QrCode as QrIcon, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Award, 
  Sparkles, 
  Printer,
  ShieldCheck
} from 'lucide-react';
import { RegistrationRecord, EventItem } from '../types';
import { FIREBASE_ENABLED } from '../services/firebaseConfig';

interface TicketModalProps {
  record: RegistrationRecord;
  event: EventItem;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  record,
  event,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      // Generate dynamic QR Code for attendance
      QRCode.toCanvas(
        canvasRef.current,
        record.ticketCode,
        {
          width: 180,
          margin: 1.5,
          color: {
            dark: '#020617', // Dark navy slate
            light: '#ffffff'  // Pure crisp white background for max scanner contrast
          }
        },
        (error) => {
          if (error) console.error('QR code generation failed', error);
        }
      );
    }
  }, [record.ticketCode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(record.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-white/20 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-tech text-sm font-bold tracking-wider">
              VÉ ĐIỆN TỬ THAM DỰ SỰ KIỆN
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Container */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Visual Ticket Pass */}
          <div 
            id="printable-ticket-card"
            className="relative rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-600/30 p-5 shadow-md text-center overflow-hidden"
          >
            {/* Top faculty badge */}
            <div className="text-[10px] uppercase font-bold tracking-widest text-blue-700 dark:text-blue-300 flex items-center justify-center space-x-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
              <span>KHOA ĐIỆN - ĐIỆN TỬ • PORTAL 2026</span>
            </div>

            <h3 className="font-tech text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight mt-1">
              {event.title}
            </h3>

            {/* Middle QR Code Canvas */}
            <div className="my-4 flex flex-col items-center justify-center">
              <div className="p-2.5 rounded-2xl bg-white shadow-md border-2 border-blue-600 inline-block">
                <canvas ref={canvasRef} className="rounded-lg" />
              </div>

              {/* Ticket Code Tag */}
              <div className="mt-2.5 flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-400/30">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Mã vé:</span>
                <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 font-mono tracking-wider">
                  #{record.ticketCode}
                </span>
              </div>
            </div>

            {/* Dashed Separator */}
            <div className="relative my-4">
              <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700" />
              <div className="absolute -left-7 -top-2.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
              <div className="absolute -right-7 -top-2.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
            </div>

            {/* Student & Event Details */}
            <div className="grid grid-cols-2 gap-2.5 text-left text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sinh viên:</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{record.fullName}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">MSSV / Chi đoàn:</span>
                <p className="font-bold text-blue-700 dark:text-blue-300 font-mono">{record.mssv} - {record.classGroup}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Thời gian:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{event.eventDate} ({event.startTime})</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Hình thức:</span>
                <p className="font-semibold text-blue-700 dark:text-blue-300">Vé điện tử QR</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Địa điểm:</span>
                <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{event.location}</p>
              </div>
            </div>

            {/* Check-in status pill */}
            <div className="mt-3">
              {record.checkedIn ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-400/30">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  ĐÃ ĐIỂM DANH ({new Date(record.checkedInAt!).toLocaleTimeString('vi-VN')})
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-400/30">
                  <QrIcon className="w-3.5 h-3.5 mr-1" />
                  SẴN SÀNG QUÉT CHECK-IN TẠI CỬA
                </span>
              )}
            </div>

          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> : <Copy className="w-4 h-4 text-blue-600 dark:text-blue-300" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>In / Lưu vé PDF</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
            {FIREBASE_ENABLED || !record.email ? (
              // No mail service is wired to Firebase yet, so don't claim a copy was sent
              <>Hãy chụp màn hình hoặc in vé để xuất trình mã QR khi điểm danh. Có thể tra cứu lại vé bằng MSSV.</>
            ) : (
              <>Một bản sao vé và mã QR đã được gửi tự động tới hòm thư <strong>{record.email}</strong>.</>
            )}
          </p>

        </div>

      </div>
    </div>
  );
};
