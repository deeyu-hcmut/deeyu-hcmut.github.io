import React, { useState } from 'react';
import { 
  QrCode, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  User, 
  Award, 
  Clock, 
  Calendar, 
  Camera, 
  Volume2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  X
} from 'lucide-react';
import { RegistrationRecord, EventItem } from '../types';
import { api } from '../services/api';

interface QRCheckInScannerProps {
  events: EventItem[];
  onClose?: () => void;
  onCheckInSuccess?: (record: RegistrationRecord) => void;
}

export const QRCheckInScanner: React.FC<QRCheckInScannerProps> = ({
  events,
  onClose,
  onCheckInSuccess
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [ticketInput, setTicketInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    record?: RegistrationRecord;
    warning?: boolean;
  } | null>(null);

  const [recentCheckIns, setRecentCheckIns] = useState<Array<{
    name: string;
    mssv: string;
    event: string;
    time: string;
  }>>([
    { name: 'Nguyễn Văn An', mssv: '2211001', event: 'EE TECH DAY 2026', time: '08:10' },
    { name: 'Lê Quang Minh', mssv: '2111054', event: 'Hội thảo Vi mạch Bán dẫn', time: '09:05' }
  ]);

  const [isCameraActive, setIsCameraActive] = useState(false);

  const handlePerformCheckIn = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await api.checkIn(
        codeToVerify.trim(), 
        selectedEventId !== 'ALL' ? selectedEventId : undefined
      );

      if (data.warning) {
        setResult({
          success: false,
          warning: true,
          message: data.message,
          record: data.record
        });
      } else {
        setResult({
          success: true,
          message: data.message,
          record: data.record
        });

        // Confetti celebration
        import('canvas-confetti').then(({ default: confetti }) => confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        }));

        // Add to recent feed
        if (data.record) {
          setRecentCheckIns(prev => [
            {
              name: data.record!.fullName,
              mssv: data.record!.mssv,
              event: data.record!.eventTitle,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            },
            ...prev.slice(0, 4)
          ]);

          if (onCheckInSuccess) {
            onCheckInSuccess(data.record);
          }
        }
      }

      setTicketInput('');
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Mã vé hoặc MSSV không hợp lệ trong hệ thống'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateScan = (code: string) => {
    setTicketInput(code);
    handlePerformCheckIn(code);
  };

  return (
    <div className="py-8 bg-slate-50 min-h-[75vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-tech text-xl sm:text-2xl font-extrabold text-slate-900">
                TRẠM ĐIỂM DANH & QUÉT VÉ QR SỰ KIỆN
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Ghi nhận sinh viên tham dự sự kiện trực tuyến
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white text-slate-500 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Event Selector Scope */}
        <div className="mt-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Chọn sự kiện đang tổ chức điểm danh:</span>
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-blue-700 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả sự kiện hôm nay (Tự động nhận diện)</option>
            {events.map(evt => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.eventDate})
              </option>
            ))}
          </select>
        </div>

        {/* Interactive Scanner Box */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Scan / Input Column */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Camera Viewfinder Simulator / Visual Box */}
            <div className="relative rounded-3xl bg-slate-900 border-2 border-blue-500/60 p-6 flex flex-col items-center justify-center text-center overflow-hidden min-h-[260px] shadow-xl">
              
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-400" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-400" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-400" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-400" />

              {/* Animated Scan Line */}
              <div className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse shadow-[0_0_15px_#3b82f6]" />

              <div className="p-4 rounded-full bg-slate-950/80 border border-blue-500/30 text-blue-400 mb-3 shadow-inner">
                <Camera className="w-8 h-8 animate-bounce" />
              </div>

              <h4 className="font-tech text-sm font-bold text-white uppercase tracking-wider">
                MÁY QUÉT QR ĐIỆN TỬ SẴN SÀNG
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xs">
                Đưa mã QR trên thẻ vé điện tử hoặc màn hình điện thoại vào khung ngắm để xác thực.
              </p>

              {/* Sample QR Codes Shortcut */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <span className="text-[10px] text-slate-400 block w-full">Thử nhanh với vé mẫu:</span>
                <button
                  onClick={() => handleSimulateScan('FEE-TECH-88392')}
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-blue-950/90 text-blue-200 border border-blue-500/40 hover:bg-blue-900 transition-colors"
                >
                  #FEE-TECH-88392
                </button>
                <button
                  onClick={() => handleSimulateScan('FEE-TECH-91204')}
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-blue-950/90 text-blue-200 border border-blue-500/40 hover:bg-blue-900 transition-colors"
                >
                  #FEE-TECH-91204
                </button>
                <button
                  onClick={() => handleSimulateScan('2211001')}
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700 transition-colors"
                >
                  MSSV 2211001
                </button>
              </div>
            </div>

            {/* Manual Code / MSSV Input */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nhập thủ công Mã Vé hoặc MSSV:
              </label>
              <div className="flex gap-2">
                <input
                  id="manual-ticket-code-input"
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePerformCheckIn(ticketInput)}
                  placeholder="VD: FEE-TECH-88392 hoặc 2211001..."
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 uppercase font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  id="submit-checkin-btn"
                  onClick={() => handlePerformCheckIn(ticketInput)}
                  disabled={loading || !ticketInput.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Check-in</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Right Status Result & Live Stream */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Feedback Alert Card */}
            {result && (
              <div className={`p-5 rounded-2xl border transition-all animate-in fade-in shadow-2xs ${
                result.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : result.warning
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-start space-x-3">
                  {result.success ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  ) : result.warning ? (
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="font-tech text-sm font-bold">
                      {result.success ? 'ĐIỂM DANH THÀNH CÔNG!' : result.warning ? 'CẢNH BÁO ĐÃ ĐIỂM DANH' : 'LỖI ĐIỂM DANH'}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed font-medium">{result.message}</p>

                    {result.record && (
                      <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1 shadow-2xs">
                        <p><strong>Sinh viên:</strong> {result.record.fullName}</p>
                        <p><strong>MSSV:</strong> <span className="font-mono text-blue-700 font-bold">{result.record.mssv}</span> ({result.record.classGroup})</p>
                        <p><strong>Sự kiện:</strong> {result.record.eventTitle}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Live Check-In Feed */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h4 className="font-tech text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping" />
                  Lịch sử Điểm danh Trực tiếp
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Thời gian thực</span>
              </h4>

              <div className="space-y-2.5">
                {recentCheckIns.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                        <span className="font-mono text-blue-700 font-bold">{item.mssv}</span>
                        <span>•</span>
                        <span className="truncate max-w-[140px]">{item.event}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Đã có mặt
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
