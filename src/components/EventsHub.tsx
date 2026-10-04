import React, { useState, lazy, Suspense } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  QrCode, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Grid, 
  List, 
  Plus,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Trash2,
  RefreshCw,
  Pencil
} from 'lucide-react';
import { EventItem, EventStatus, EventType, Role, RegistrationRecord } from '../types';
import { EventDetailModal } from './EventDetailModal';
import { sizedImage } from '../utils/image';

// Modals load on first open, keeping qrcode out of the initial bundle
const RegistrationModal = lazy(() => import('./RegistrationModal').then(m => ({ default: m.RegistrationModal })));
const TicketModal = lazy(() => import('./TicketModal').then(m => ({ default: m.TicketModal })));

interface EventsHubProps {
  events: EventItem[];
  currentRole: Role;
  onRegisterSuccess: (record: RegistrationRecord, updatedEvent: EventItem) => void;
  onCreateEvent: (eventData: Partial<EventItem>) => void;
  onDeleteEvent: (event: EventItem) => Promise<void>;
  onUpdateEvent: (eventId: string, patch: Partial<EventItem>) => Promise<void>;
}

export const EventsHub: React.FC<EventsHubProps> = ({
  events,
  currentRole,
  onRegisterSuccess,
  onCreateEvent,
  onDeleteEvent,
  onUpdateEvent
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID' | 'CALENDAR'>('GRID');

  // Modals state
  const [registeringEvent, setRegisteringEvent] = useState<EventItem | null>(null);
  const [viewingEvent, setViewingEvent] = useState<EventItem | null>(null);
  const [activeTicket, setActiveTicket] = useState<{ record: RegistrationRecord; event: EventItem } | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canManageEvents = currentRole === 'SUPER_ADMIN' || currentRole === 'EVENT_MANAGER';

  const closeDeleteDialog = () => {
    if (deleteBusy) return;
    setDeletingEvent(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await onDeleteEvent(deletingEvent);
      setDeletingEvent(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Không xoá được sự kiện. Vui lòng thử lại.');
    } finally {
      setDeleteBusy(false);
    }
  };

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<EventType>('ACADEMIC_CONTEST');
  const [newLocation, setNewLocation] = useState('Hội trường A Khoa Điện - Điện tử');
  const [newEventDate, setNewEventDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('08:00');
  const [newEndTime, setNewEndTime] = useState('11:30');
  const [newDeadline, setNewDeadline] = useState('');
  const [newMax, setNewMax] = useState(300);
  const [newBanner, setNewBanner] = useState('https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80');
  const [newStatus, setNewStatus] = useState<EventStatus>('REGISTRATION_OPEN');
  // The create form doubles as the edit form when this is set
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventFormError, setEventFormError] = useState<string | null>(null);

  const openCreateEvent = () => {
    setEditingEvent(null);
    setEventFormError(null);
    setNewTitle('');
    setNewDesc('');
    setNewType('ACADEMIC_CONTEST');
    setNewLocation('Hội trường A Khoa Điện - Điện tử');
    setNewEventDate('');
    setNewStartTime('08:00');
    setNewEndTime('11:30');
    setNewDeadline('');
    setNewMax(300);
    setNewBanner('https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80');
    setNewStatus('REGISTRATION_OPEN');
    setIsCreatingEvent(true);
  };

  const openEditEvent = (evt: EventItem) => {
    setEditingEvent(evt);
    setEventFormError(null);
    setNewTitle(evt.title);
    setNewDesc(evt.description);
    setNewType(evt.type);
    setNewLocation(evt.location);
    setNewEventDate(evt.eventDate);
    setNewStartTime(evt.startTime);
    setNewEndTime(evt.endTime);
    setNewDeadline((evt.registrationDeadline || '').slice(0, 10));
    setNewMax(evt.maxParticipants);
    setNewBanner(evt.bannerUrl);
    setNewStatus(evt.status);
    setIsCreatingEvent(true);
  };

  const closeEventForm = () => {
    if (savingEvent) return;
    setIsCreatingEvent(false);
    setEditingEvent(null);
  };

  const eventTypes = [
    { id: 'ALL', label: 'Tất cả loại sự kiện' },
    { id: 'ACADEMIC_CONTEST', label: 'Học thuật & Robocon' },
    { id: 'SEMINAR_WORKSHOP', label: 'Hội thảo & Vi mạch' },
    { id: 'SPORTS_CULTURE', label: 'Thể thao & Văn nghệ' },
    { id: 'VOLUNTEER', label: 'Tình nguyện & Xã hội' },
  ];

  const statusFilters = [
    { id: 'ALL', label: 'Tất cả trạng thái' },
    { id: 'REGISTRATION_OPEN', label: 'Đang mở đăng ký' },
    { id: 'UPCOMING', label: 'Sắp diễn ra' },
    { id: 'REGISTRATION_CLOSED', label: 'Hết slot / Đã đóng' },
    { id: 'COMPLETED', label: 'Đã hoàn thành' },
  ];

  const filteredEvents = events.filter(evt => {
    const matchesType = selectedType === 'ALL' || evt.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || evt.status === selectedStatus;
    const matchesSearch = searchQuery === '' || 
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: EventStatus, current: number, max: number) => {
    if (status === 'REGISTRATION_OPEN') {
      const isAlmostFull = current / max >= 0.85;
      return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center space-x-1 ${
          isAlmostFull 
            ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-400/30 animate-pulse' 
            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isAlmostFull ? 'bg-orange-600' : 'bg-emerald-600'}`} />
          <span>{isAlmostFull ? 'Sắp hết slot!' : 'Đang mở đăng ký'}</span>
        </span>
      );
    }
    if (status === 'UPCOMING') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30">
          Sắp diễn ra
        </span>
      );
    }
    if (status === 'REGISTRATION_CLOSED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-400/30">
          Đã đủ số lượng
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        Đã kết thúc
      </span>
    );
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const typeObj = eventTypes.find(t => t.id === newType);

    if (editingEvent) {
      setSavingEvent(true);
      setEventFormError(null);
      try {
        await onUpdateEvent(editingEvent.id, {
          title: newTitle.trim(),
          description: newDesc,
          // Seeded events have a separate long programme in `content`; only mirror the
          // description when the two were the same to begin with
          ...(editingEvent.content === editingEvent.description ? { content: newDesc } : {}),
          type: newType,
          typeName: typeObj ? typeObj.label : editingEvent.typeName,
          status: newStatus,
          location: newLocation,
          eventDate: newEventDate || editingEvent.eventDate,
          startTime: newStartTime,
          endTime: newEndTime,
          registrationDeadline: newDeadline || editingEvent.registrationDeadline,
          maxParticipants: Number(newMax) || editingEvent.maxParticipants,
          bannerUrl: newBanner.trim() || editingEvent.bannerUrl,
        });
        setIsCreatingEvent(false);
        setEditingEvent(null);
      } catch (err: any) {
        setEventFormError(err?.message || 'Không lưu được thay đổi. Vui lòng thử lại.');
      } finally {
        setSavingEvent(false);
      }
      return;
    }

    onCreateEvent({
      title: newTitle,
      description: newDesc,
      type: newType,
      typeName: typeObj ? typeObj.label : 'Sự kiện Khoa',
      location: newLocation,
      eventDate: newEventDate || new Date().toISOString().split('T')[0],
      startTime: newStartTime,
      endTime: newEndTime,
      registrationDeadline: newDeadline || new Date().toISOString(),
      maxParticipants: Number(newMax) || 200,
      bannerUrl: newBanner.trim() || undefined,
      status: 'REGISTRATION_OPEN',
      organizer: 'Đoàn - Hội Khoa Điện - Điện tử',
      contactEmail: 'doanhoi.fee@university.edu.vn',
      requirements: ['Mang theo Thẻ sinh viên', 'Điểm danh qua mã QR']
    });

    setIsCreatingEvent(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="py-10 bg-slate-50 dark:bg-slate-950 min-h-[75vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-8 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center space-x-3">
              <span className="p-3 rounded-2xl bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 shadow-2xs">
                <Calendar className="w-6 h-6" />
              </span>
              <div>
                <h2 className="font-tech text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  SỰ KIỆN & ĐĂNG KÝ THAM GIA
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Cổng đăng ký trực tuyến, tự động tạo vé điện tử QR độc nhất và điểm danh thời gian thực
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  viewMode === 'GRID' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Dạng lưới"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  viewMode === 'LIST' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('CALENDAR')}
                className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  viewMode === 'CALENDAR' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Dạng lịch trình"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            {/* Create Event (Admin/Manager) */}
            {(currentRole === 'SUPER_ADMIN' || currentRole === 'EVENT_MANAGER') && (
              <button
                id="create-event-btn"
                onClick={openCreateEvent}
                className="flex items-center space-x-2 px-4 py-3 rounded-2xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tạo Sự kiện mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Search */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="event-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sự kiện, địa điểm, từ khóa..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-2xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
            >
              {eventTypes.map(t => (
                <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900">{t.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
            >
              {statusFilters.map(s => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Events Rendering */}
        <div className="mt-8">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Không tìm thấy sự kiện nào.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
              <button
                onClick={() => { setSelectedType('ALL'); setSelectedStatus('ALL'); setSearchQuery(''); }}
                className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                Xem tất cả sự kiện
              </button>
            </div>
          ) : viewMode === 'CALENDAR' ? (
            /* Calendar Timeline View */
            <div className="space-y-4">
              {filteredEvents.map(evt => (
                <div 
                  key={evt.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-400/30 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    {/* Date Block */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 text-white flex flex-col items-center justify-center text-center shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-blue-100">
                        {new Date(evt.eventDate).toLocaleDateString('vi-VN', { month: 'short' })}
                      </span>
                      <span className="text-xl font-extrabold text-white font-tech">
                        {new Date(evt.eventDate).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {getStatusBadge(evt.status, evt.currentParticipants, evt.maxParticipants)}
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{evt.typeName}</span>
                      </div>

                      <h4 
                        onClick={() => setViewingEvent(evt)}
                        className="font-tech text-base font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer transition-colors"
                      >
                        {evt.title}
                      </h4>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-300" />
                          {evt.startTime} - {evt.endTime}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-orange-600 dark:text-orange-300" />
                          {evt.location}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-300" />
                          {evt.currentParticipants}/{evt.maxParticipants} đã đăng ký
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => setViewingEvent(evt)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    >
                      Chi tiết
                    </button>
                    {evt.status === 'REGISTRATION_OPEN' ? (
                      <button
                        id={`register-btn-${evt.id}`}
                        onClick={() => setRegisteringEvent(evt)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm flex items-center space-x-1"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Đăng ký</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 px-3 py-2">Đóng đăng ký</span>
                    )}
                    {canManageEvents && (
                      <button
                        onClick={() => openEditEvent(evt)}
                        className="p-2 rounded-xl text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-400/30 transition-colors"
                        aria-label={`Sửa sự kiện ${evt.title}`}
                        title="Sửa sự kiện"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {canManageEvents && (
                      <button
                        onClick={() => setDeletingEvent(evt)}
                        className="p-2 rounded-xl text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-400/30 transition-colors"
                        aria-label={`Xoá sự kiện ${evt.title}`}
                        title="Xoá sự kiện"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'LIST' ? (
            /* Compact List View */
            <div className="space-y-3">
              {filteredEvents.map(evt => (
                <div 
                  key={evt.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-400/30 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <img 
                      src={sizedImage(evt.bannerUrl, 160)} 
                      alt={evt.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusBadge(evt.status, evt.currentParticipants, evt.maxParticipants)}
                        <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">{evt.typeName}</span>
                      </div>
                      <h4 
                        onClick={() => setViewingEvent(evt)}
                        className="font-tech text-sm font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        {evt.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-3">
                        <span>📅 {evt.eventDate} ({evt.startTime})</span>
                        <span>📍 {evt.location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setViewingEvent(evt)}
                      className="px-3.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    >
                      Xem
                    </button>
                    {evt.status === 'REGISTRATION_OPEN' && (
                      <button
                        onClick={() => setRegisteringEvent(evt)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      >
                        Đăng ký ngay
                      </button>
                    )}
                    {canManageEvents && (
                      <button
                        onClick={() => openEditEvent(evt)}
                        className="p-1.5 rounded-lg text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-400/30 transition-colors"
                        aria-label={`Sửa sự kiện ${evt.title}`}
                        title="Sửa sự kiện"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {canManageEvents && (
                      <button
                        onClick={() => setDeletingEvent(evt)}
                        className="p-1.5 rounded-lg text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-400/30 transition-colors"
                        aria-label={`Xoá sự kiện ${evt.title}`}
                        title="Xoá sự kiện"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Default Grid Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map(evt => {
                const percentage = Math.min(100, Math.round((evt.currentParticipants / evt.maxParticipants) * 100));
                const isFull = evt.currentParticipants >= evt.maxParticipants;

                return (
                  <div
                    key={evt.id}
                    id={`event-card-${evt.id}`}
                    className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-400/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group shadow-xs"
                  >
                    {/* Banner Image with Overlays */}
                    <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img 
                        src={sizedImage(evt.bannerUrl, 800)} 
                        alt={evt.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-black/20 to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        {getStatusBadge(evt.status, evt.currentParticipants, evt.maxParticipants)}
                        {canManageEvents && (
                      <button
                        onClick={() => openEditEvent(evt)}
                        className="p-2 rounded-xl bg-slate-900/80 text-blue-300 hover:bg-blue-600 hover:text-white border border-white/20 backdrop-blur-md transition-colors"
                        aria-label={`Sửa sự kiện ${evt.title}`}
                        title="Sửa sự kiện"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {canManageEvents && (
                      <button
                        onClick={() => setDeletingEvent(evt)}
                        className="p-2 rounded-xl bg-slate-900/80 text-rose-300 hover:bg-rose-600 hover:text-white border border-white/20 backdrop-blur-md transition-colors"
                        aria-label={`Xoá sự kiện ${evt.title}`}
                        title="Xoá sự kiện"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                      </div>

                      {/* Date & Time pill bottom */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
                        <span className="flex items-center px-3 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-white/20 font-medium">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-300" />
                          {evt.eventDate}
                        </span>
                        <span className="flex items-center px-3 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-white/20 font-medium">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-300" />
                          {evt.startTime} - {evt.endTime}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider mb-2">
                          {evt.typeName}
                        </div>

                        <h4 
                          onClick={() => setViewingEvent(evt)}
                          className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug cursor-pointer"
                        >
                          {evt.title}
                        </h4>

                        <div className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 space-y-1.5">
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-300 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        </div>

                        {/* Quota Progress Bar */}
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                            <span className="flex items-center font-medium">
                              <Users className="w-4 h-4 mr-1.5 text-slate-400" />
                              Số lượng đăng ký:
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-xs">
                              {evt.currentParticipants} / {evt.maxParticipants} chỗ
                            </span>
                          </div>
                          
                          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isFull 
                                  ? 'bg-amber-500' 
                                  : percentage > 75 
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500' 
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        <button
                          onClick={() => setViewingEvent(evt)}
                          className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors text-center cursor-pointer"
                        >
                          Xem chi tiết
                        </button>

                        {evt.status === 'REGISTRATION_OPEN' ? (
                          <button
                            id={`register-card-btn-${evt.id}`}
                            onClick={() => setRegisteringEvent(evt)}
                            className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-600/20 active:scale-95 transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Ticket className="w-4 h-4" />
                            <span>Đăng ký ngay</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed text-center"
                          >
                            {evt.status === 'COMPLETED' ? 'Đã kết thúc' : 'Hết slot'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Suspense fallback={null}>
          {/* Modal: Registration Form */}
          {registeringEvent && (
            <RegistrationModal
              event={registeringEvent}
              onClose={() => setRegisteringEvent(null)}
              onSuccess={(record, updatedEvt) => {
                setRegisteringEvent(null);
                onRegisterSuccess(record, updatedEvt);
                setActiveTicket({ record, event: updatedEvt });
              }}
            />
          )}

          {/* Modal: Ticket QR Display */}
          {activeTicket && (
            <TicketModal
              record={activeTicket.record}
              event={activeTicket.event}
              onClose={() => setActiveTicket(null)}
            />
          )}
        </Suspense>

        {/* Modal: Event Detail Overview */}
        {viewingEvent && (
          <EventDetailModal
            event={viewingEvent}
            onClose={() => setViewingEvent(null)}
            onOpenRegister={() => {
              const target = viewingEvent;
              setViewingEvent(null);
              setRegisteringEvent(target);
            }}
          />
        )}

        {/* Modal: Confirm event deletion (Admin) */}
        {deletingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={closeDeleteDialog}>
            <div
              role="alertdialog"
              aria-labelledby="delete-event-title"
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 flex-shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 id="delete-event-title" className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100">
                    Xoá sự kiện này?
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200 break-words">{deletingEvent.title}</p>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {deletingEvent.currentParticipants > 0
                      ? <>Toàn bộ <strong>{deletingEvent.currentParticipants} lượt đăng ký</strong> cùng vé QR và dữ liệu điểm danh của sự kiện cũng bị xoá. </>
                      : <>Sự kiện chưa có lượt đăng ký nào. </>}
                    Không thể hoàn tác.
                  </p>
                  {deleteError && (
                    <p className="mt-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-400/30 rounded-lg px-3 py-2">
                      {deleteError}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeDeleteDialog}
                  disabled={deleteBusy}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  id="confirm-delete-event-btn"
                  onClick={handleConfirmDelete}
                  disabled={deleteBusy}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 flex items-center space-x-1.5"
                >
                  {deleteBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{deleteBusy ? 'Đang xoá…' : 'Xoá sự kiện'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Event Form (Admin) */}
        {isCreatingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="font-tech text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center space-x-2">
                {editingEvent ? <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-300" /> : <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-300" />}
                <span>{editingEvent ? 'Sửa sự kiện' : 'Tạo Sự kiện Mới (Ban CTXH & Quản trị)'}</span>
              </h3>

              <form onSubmit={handleCreateEventSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Tên sự kiện *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="VD: Triển lãm Robocon & Vi mạch 2026..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Loại sự kiện *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EventType)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ACADEMIC_CONTEST">Học thuật & Robocon</option>
                    <option value="SEMINAR_WORKSHOP">Hội thảo & Vi mạch</option>
                    <option value="SPORTS_CULTURE">Thể thao & Văn nghệ</option>
                    <option value="VOLUNTEER">Tình nguyện & Xã hội</option>
                  </select>
                </div>

                {editingEvent && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Trạng thái</label>
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as EventStatus)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="REGISTRATION_OPEN">Đang mở đăng ký</option>
                      <option value="UPCOMING">Sắp diễn ra (chưa mở đăng ký)</option>
                      <option value="REGISTRATION_CLOSED">Đã đóng đăng ký</option>
                      <option value="COMPLETED">Đã kết thúc</option>
                    </select>
                    {newStatus === 'REGISTRATION_OPEN' && editingEvent.currentParticipants >= Number(newMax) && (
                      <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                        Đã có {editingEvent.currentParticipants} người đăng ký — tăng số lượng tối đa để mở thêm chỗ.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Ngày diễn ra *</label>
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Hạn chót đăng ký</label>
                    <input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Giờ kết thúc</label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Số lượng tối đa (Slot)</label>
                    <input
                      type="number"
                      min={editingEvent ? Math.max(1, editingEvent.currentParticipants) : 10}
                      max={2000}
                      value={newMax}
                      onChange={(e) => setNewMax(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Địa điểm tổ chức *</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Mô tả sự kiện *</label>
                  <textarea
                    rows={3}
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Mô tả nội dung chương trình, quyền lợi tham gia..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Ảnh bìa (link ảnh)</label>
                  <input
                    type="url"
                    value={newBanner}
                    onChange={(e) => setNewBanner(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {eventFormError && (
                  <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-400/30 rounded-lg px-3 py-2">{eventFormError}</p>
                )}

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={closeEventForm}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={savingEvent}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-60"
                  >
                    {editingEvent ? (savingEvent ? 'Đang lưu…' : 'Lưu thay đổi') : 'Đăng sự kiện'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
