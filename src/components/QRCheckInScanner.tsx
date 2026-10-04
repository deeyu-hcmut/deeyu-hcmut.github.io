import React, { useEffect, useRef, useState } from 'react';
import type QrScanner from 'qr-scanner';
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
  X,
  CameraOff,
  SwitchCamera
} from 'lucide-react';
import { RegistrationRecord, EventItem } from '../types';
import { api } from '../services/api';

type CameraState = 'idle' | 'starting' | 'on' | 'error';

// The same ticket stays in front of the lens for a while; ignore repeats within this window
const RESCAN_COOLDOWN_MS = 5000;

function cameraErrorMessage(err: unknown): string {
  const name = (err as { name?: string } | null)?.name;
  const text = String((err as { message?: string } | null)?.message ?? err);
  if (!window.isSecureContext) return 'Camera chỉ hoạt động khi mở web qua HTTPS.';
  if (name === 'NotAllowedError' || /permission|denied/i.test(text)) {
    return 'Trình duyệt đang chặn camera. Bấm biểu tượng ổ khoá / camera trên thanh địa chỉ, chọn Cho phép camera rồi bấm Bật camera lại.';
  }
  if (name === 'NotReadableError') return 'Camera đang được ứng dụng khác sử dụng. Đóng ứng dụng đó rồi thử lại.';
  if (text === 'NO_CAMERA' || /not found/i.test(text)) return 'Không tìm thấy camera trên thiết bị này. Hãy nhập mã vé hoặc MSSV thủ công.';
  return `Không mở được camera: ${text}`;
}

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
  }>>([]);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const busyRef = useRef(false);
  const lastScanRef = useRef({ code: '', at: 0 });

  const handlePerformCheckIn = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;

    busyRef.current = true;
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
      busyRef.current = false;
      setLoading(false);
    }
  };

  // The scanner callback is created once; route it to the latest render's handler
  const checkInRef = useRef(handlePerformCheckIn);
  checkInRef.current = handlePerformCheckIn;

  const handleDecoded = (raw: string) => {
    const code = raw.trim();
    const now = Date.now();
    if (!code || busyRef.current) return;
    if (code === lastScanRef.current.code && now - lastScanRef.current.at < RESCAN_COOLDOWN_MS) return;
    lastScanRef.current = { code, at: now };
    navigator.vibrate?.(80);
    setTicketInput(code);
    checkInRef.current(code);
  };

  // pause(true) stops the stream at once; destroy() alone keeps it alive ~300ms (camera light stays on)
  const releaseCamera = () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    scanner.pause(true);
    scanner.destroy();
  };

  const stopCamera = () => {
    releaseCamera();
    setCameraState('idle');
  };

  const startCamera = async () => {
    if (!videoRef.current) return;
    setCameraError(null);
    setCameraState('starting');
    try {
      // ~60KB decoder, loaded only when a staff member actually opens the camera
      const { default: Scanner } = await import('qr-scanner');
      if (!(await Scanner.hasCamera())) throw new Error('NO_CAMERA');
      const scanner = new Scanner(videoRef.current, result => handleDecoded(result.data), {
        preferredCamera: facingMode,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 8,
        returnDetailedScanResult: true,
      });
      scannerRef.current = scanner;
      await scanner.start();
      setCameraState('on');
    } catch (err) {
      releaseCamera();
      setCameraError(cameraErrorMessage(err));
      setCameraState('error');
    }
  };

  const switchCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    try {
      await scannerRef.current?.setCamera(next);
    } catch (err) {
      setCameraError(cameraErrorMessage(err));
    }
  };

  // Release the camera when the station is closed
  useEffect(() => releaseCamera, []);

  const handleSimulateScan = (code: string) => {
    setTicketInput(code);
    handlePerformCheckIn(code);
  };

  return (
    <div className="py-8 bg-slate-50 dark:bg-slate-950 min-h-[75vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 shadow-2xs">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-tech text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                TRẠM ĐIỂM DANH & QUÉT VÉ QR SỰ KIỆN
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Ghi nhận sinh viên tham dự sự kiện trực tuyến
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Event Selector Scope */}
        <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
            <span>Chọn sự kiện đang tổ chức điểm danh:</span>
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            
            {/* Camera viewfinder */}
            <div className="relative rounded-3xl bg-slate-900 border-2 border-blue-500/60 overflow-hidden shadow-xl">
              {/* qr-scanner draws its scan-region overlay next to the video, so this wrapper must stay relative */}
              <div className={`relative ${cameraState === 'on' || cameraState === 'starting' ? 'block' : 'hidden'}`}>
                <video ref={videoRef} playsInline muted className="w-full max-h-[60vh] object-cover bg-black" />
                {cameraState === 'starting' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-slate-200 text-xs font-semibold px-4 text-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                    Đang mở camera… (hãy bấm Cho phép nếu trình duyệt hỏi)
                  </div>
                )}
              </div>

              {cameraState === 'on' || cameraState === 'starting' ? (
                <div className="flex items-center justify-between gap-2 p-3 bg-slate-950/90">
                  {/* Latest result right under the video, so the person scanning never has to scroll */}
                  {loading ? (
                    <p className="text-[11px] text-slate-300 flex items-center">
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Đang kiểm tra vé…
                    </p>
                  ) : result ? (
                    <p className={`text-xs font-bold ${result.success ? 'text-emerald-300' : result.warning ? 'text-amber-300' : 'text-rose-300'}`}>
                      {result.success
                        ? `✓ ${result.record?.fullName ?? 'Đã điểm danh'}`
                        : result.warning
                        ? `⚠ ${result.record?.fullName ?? ''} đã điểm danh trước đó`
                        : `✗ ${result.message}`}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-300">Đưa mã QR trên vé vào khung — hệ thống tự điểm danh.</p>
                  )}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={switchCamera}
                      className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700 transition-colors"
                      aria-label="Đổi camera trước / sau"
                      title="Đổi camera trước / sau"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                    >
                      <CameraOff className="w-4 h-4" />
                      <span>Tắt camera</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative p-6 flex flex-col items-center justify-center text-center min-h-[260px]">
                  {/* Corner brackets */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-400" />

                  <div className="p-4 rounded-full bg-slate-950/80 border border-blue-500/30 text-blue-400 mb-3 shadow-inner">
                    <Camera className="w-8 h-8" />
                  </div>

                  <h4 className="font-tech text-sm font-bold text-white uppercase tracking-wider">
                    QUÉT VÉ QR BẰNG CAMERA
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs">
                    Dùng camera sau của điện thoại hoặc webcam để quét mã QR trên vé điện tử của sinh viên.
                  </p>

                  <button
                    id="start-camera-btn"
                    onClick={startCamera}
                    className="mt-4 flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-md"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{cameraState === 'error' ? 'Thử bật camera lại' : 'Bật camera quét QR'}</span>
                  </button>

                  {cameraError && (
                    <p className="mt-3 max-w-sm text-xs text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2">
                      {cameraError}
                    </p>
                  )}

                </div>
              )}
            </div>

            {/* Manual Code / MSSV Input */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Nhập thủ công Mã Vé hoặc MSSV:
              </label>
              <div className="flex gap-2">
                <input
                  id="manual-ticket-code-input"
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePerformCheckIn(ticketInput)}
                  placeholder="VD: TECH-88392 hoặc 2211001..."
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 uppercase font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-400/30 text-emerald-900 dark:text-emerald-200'
                  : result.warning
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-400/30 text-amber-900 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-400/30 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {result.success ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
                  ) : result.warning ? (
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-300 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-300 flex-shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="font-tech text-sm font-bold">
                      {result.success ? 'ĐIỂM DANH THÀNH CÔNG!' : result.warning ? 'CẢNH BÁO ĐÃ ĐIỂM DANH' : 'LỖI ĐIỂM DANH'}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed font-medium">{result.message}</p>

                    {result.record && (
                      <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 space-y-1 shadow-2xs">
                        <p><strong>Sinh viên:</strong> {result.record.fullName}</p>
                        <p><strong>MSSV:</strong> <span className="font-mono text-blue-700 dark:text-blue-300 font-bold">{result.record.mssv}</span> ({result.record.classGroup})</p>
                        <p><strong>Sự kiện:</strong> {result.record.eventTitle}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Live Check-In Feed */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h4 className="font-tech text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping" />
                  Lịch sử Điểm danh
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Phiên quét này</span>
              </h4>

              <div className="space-y-2.5">
                {recentCheckIns.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Chưa có lượt điểm danh nào trong phiên này.</p>
                )}
                {recentCheckIns.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5">
                        <span className="font-mono text-blue-700 dark:text-blue-300 font-bold">{item.mssv}</span>
                        <span>•</span>
                        <span className="truncate max-w-[140px]">{item.event}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30">
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
