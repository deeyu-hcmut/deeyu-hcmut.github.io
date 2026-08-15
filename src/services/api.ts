import { EventItem, NewsItem, RegistrationRecord, BCHMember, NotificationItem, EmailDispatchLog, FacultyStats } from '../types';
import { 
  INITIAL_EVENTS, 
  INITIAL_NEWS, 
  INITIAL_BCH, 
  INITIAL_REGISTRATIONS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_STATS 
} from '../data/mockData';

// Storage keys for client-side persistence (GitHub Pages static mode)
const STORAGE_KEYS = {
  EVENTS: 'fee_portal_events',
  NEWS: 'fee_portal_news',
  REGISTRATIONS: 'fee_portal_registrations',
  NOTIFICATIONS: 'fee_portal_notifications',
  EMAIL_LOGS: 'fee_portal_email_logs',
};

function getLocalData<T>(key: string, initialData: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(item) as T;
  } catch {
    return initialData;
  }
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Client-side fallback handlers for GitHub Pages
const clientStorage = {
  getStats: (): FacultyStats => {
    const registrations = getLocalData<RegistrationRecord[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const events = getLocalData<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const news = getLocalData<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    const totalRegs = registrations.length + 4230;
    const totalCheckins = registrations.filter(r => r.checkedIn).length + 3890;

    return {
      ...INITIAL_STATS,
      totalRegistrations: totalRegs,
      totalCheckIns: totalCheckins,
      totalEventsHeld: events.length + 43,
      totalNewsPublished: news.length + 120,
    };
  },

  getNews: (category?: string, search?: string): NewsItem[] => {
    let news = getLocalData<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    if (category && category !== 'ALL') {
      news = news.filter(item => item.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      news = news.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.summary.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return news;
  },

  createNews: (newsData: Partial<NewsItem>): NewsItem => {
    const news = getLocalData<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    const notifications = getLocalData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

    const newArticle: NewsItem = {
      id: `news-${Date.now()}`,
      title: newsData.title || 'Tin tức mới',
      slug: (newsData.title || 'tin-tuc-moi').toLowerCase().replace(/\s+/g, '-'),
      summary: newsData.summary || '',
      content: newsData.content || '',
      category: newsData.category || 'HOAT_DONG_KHOA',
      categoryName: newsData.categoryName || 'Hoạt động Khoa',
      author: newsData.author || 'Ban Truyền thông FEE Media',
      authorRole: newsData.authorRole || 'Cộng tác viên Truyền thông',
      publishedAt: new Date().toISOString(),
      coverImage: newsData.coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      tags: newsData.tags || ['FEE Portal', 'Đoàn - Hội'],
      views: 1
    };
    news.unshift(newArticle);
    setLocalData(STORAGE_KEYS.NEWS, news);

    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Tin mới: ${newArticle.title}`,
      message: newArticle.summary,
      type: 'NEWS',
      timestamp: 'Vừa xong',
      read: false
    });
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, notifications);

    return newArticle;
  },

  getEvents: (type?: string, status?: string): EventItem[] => {
    let events = getLocalData<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    if (type && type !== 'ALL') {
      events = events.filter(evt => evt.type === type);
    }
    if (status && status !== 'ALL') {
      events = events.filter(evt => evt.status === status);
    }
    return events;
  },

  createEvent: (eventData: Partial<EventItem>): EventItem => {
    const events = getLocalData<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const notifications = getLocalData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

    const newEvt: EventItem = {
      id: `evt-${Date.now()}`,
      title: eventData.title || 'Sự kiện mới',
      slug: (eventData.title || 'su-kien-moi').toLowerCase().replace(/\s+/g, '-'),
      description: eventData.description || '',
      content: eventData.content || eventData.description || '',
      type: eventData.type || 'ACADEMIC_CONTEST',
      typeName: eventData.typeName || 'Học thuật & Triển lãm',
      status: eventData.status || 'REGISTRATION_OPEN',
      location: eventData.location || 'Hội trường A Khoa Điện - Điện tử',
      eventDate: eventData.eventDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      startTime: eventData.startTime || '08:00',
      endTime: eventData.endTime || '11:30',
      registrationDeadline: eventData.registrationDeadline || new Date(Date.now() + 86400000 * 6).toISOString(),
      maxParticipants: Number(eventData.maxParticipants) || 200,
      currentParticipants: 0,
      bannerUrl: eventData.bannerUrl || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
      organizer: eventData.organizer || 'Đoàn - Hội Khoa Điện - Điện tử',
      contactEmail: eventData.contactEmail || 'doanhoi.fee@university.edu.vn',
      requirements: eventData.requirements || ['Thẻ sinh viên', 'Áo Đoàn / Đồng phục'],
      isMandatoryCheckIn: true
    };
    events.unshift(newEvt);
    setLocalData(STORAGE_KEYS.EVENTS, events);

    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Sự kiện mới: ${newEvt.title}`,
      message: `Đang mở đăng ký tham gia. Hạn chót: ${newEvt.registrationDeadline.split('T')[0]}.`,
      type: 'EVENT',
      timestamp: 'Vừa xong',
      read: false
    });
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, notifications);

    return newEvt;
  },

  registerEvent: (eventId: string, registrationData: {
    fullName: string;
    mssv: string;
    email: string;
    phone: string;
    classGroup: string;
    faculty: string;
    note?: string;
  }) => {
    const events = getLocalData<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const registrations = getLocalData<RegistrationRecord[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const notifications = getLocalData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const emailLogs = getLocalData<EmailDispatchLog[]>(STORAGE_KEYS.EMAIL_LOGS, []);

    const event = events.find(e => e.id === eventId);
    if (!event) {
      throw new Error('Sự kiện không tồn tại');
    }

    if (event.status !== 'REGISTRATION_OPEN') {
      throw new Error('Sự kiện hiện không mở đăng ký');
    }

    if (event.currentParticipants >= event.maxParticipants) {
      event.status = 'REGISTRATION_CLOSED';
      setLocalData(STORAGE_KEYS.EVENTS, events);
      throw new Error('Sự kiện đã đủ số lượng đăng ký tối đa');
    }

    const existing = registrations.find(r => r.eventId === eventId && r.mssv.trim().toLowerCase() === (registrationData.mssv || '').trim().toLowerCase());
    if (existing) {
      throw new Error(`MSSV ${registrationData.mssv} đã đăng ký sự kiện này trước đó với mã vé #${existing.ticketCode}`);
    }

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const prefix = event.type === 'ACADEMIC_CONTEST' ? 'FEE-ACAD' : event.type === 'SEMINAR_WORKSHOP' ? 'FEE-SEMI' : 'FEE-EVT';
    const ticketCode = `${prefix}-${randomSuffix}`;

    const newRecord: RegistrationRecord = {
      id: `reg-${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      fullName: registrationData.fullName.trim(),
      mssv: registrationData.mssv.trim(),
      email: registrationData.email.trim(),
      phone: registrationData.phone.trim(),
      classGroup: registrationData.classGroup ? registrationData.classGroup.trim() : 'FEE',
      faculty: registrationData.faculty || 'Khoa Điện - Điện tử',
      registeredAt: new Date().toISOString(),
      ticketCode,
      checkedIn: false,
      note: registrationData.note
    };

    registrations.unshift(newRecord);
    event.currentParticipants += 1;
    if (event.currentParticipants >= event.maxParticipants) {
      event.status = 'REGISTRATION_CLOSED';
    }

    setLocalData(STORAGE_KEYS.REGISTRATIONS, registrations);
    setLocalData(STORAGE_KEYS.EVENTS, events);

    emailLogs.unshift({
      id: `email-${Date.now()}`,
      recipientEmail: newRecord.email,
      recipientName: newRecord.fullName,
      subject: `[FEE Portal] Xác nhận đăng ký "${event.title}" - Mã vé QR: ${ticketCode}`,
      type: 'REGISTRATION_CONFIRMATION',
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
      ticketCode
    });
    setLocalData(STORAGE_KEYS.EMAIL_LOGS, emailLogs);

    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Đăng ký thành công: ${event.title}`,
      message: `Mã vé điện tử của bạn: #${ticketCode}. Vui lòng lưu mã QR để quét điểm danh tại cửa.`,
      type: 'EVENT',
      timestamp: 'Vừa xong',
      read: false
    });
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, notifications);

    return {
      success: true,
      message: 'Đăng ký tham gia sự kiện thành công!',
      registration: newRecord,
      eventUpdated: event
    };
  },

  checkIn: (code: string, eventId?: string) => {
    const registrations = getLocalData<RegistrationRecord[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const emailLogs = getLocalData<EmailDispatchLog[]>(STORAGE_KEYS.EMAIL_LOGS, []);
    const query = (code || '').trim().toUpperCase();

    const target = registrations.find(r => 
      r.ticketCode.toUpperCase() === query || 
      (eventId ? (r.eventId === eventId && r.mssv.toUpperCase() === query) : r.mssv.toUpperCase() === query)
    );

    if (!target) {
      throw new Error(`Không tìm thấy thông tin đăng ký cho mã "${code}". Vui lòng kiểm tra lại.`);
    }

    if (target.checkedIn) {
      return {
        warning: true,
        message: `Sinh viên ${target.fullName} (${target.mssv}) ĐÃ ĐƯỢC ĐIỂM DANH trước đó vào lúc ${new Date(target.checkedInAt!).toLocaleTimeString('vi-VN')}.`,
        record: target
      };
    }

    target.checkedIn = true;
    target.checkedInAt = new Date().toISOString();
    setLocalData(STORAGE_KEYS.REGISTRATIONS, registrations);

    emailLogs.unshift({
      id: `email-${Date.now()}`,
      recipientEmail: target.email,
      recipientName: target.fullName,
      subject: `[FEE Portal] Ghi nhận Điểm danh tham dự thành công`,
      type: 'ATTENDANCE_SUCCESS',
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
      ticketCode: target.ticketCode
    });
    setLocalData(STORAGE_KEYS.EMAIL_LOGS, emailLogs);

    return {
      success: true,
      message: `Điểm danh thành công cho sinh viên ${target.fullName} (${target.mssv})!`,
      record: target
    };
  },

  lookupStudent: (mssv: string) => {
    const registrations = getLocalData<RegistrationRecord[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const cleaned = mssv.trim().toLowerCase();
    const records = registrations.filter(r => r.mssv.toLowerCase() === cleaned);

    return {
      mssv,
      studentName: records[0]?.fullName || 'Sinh viên Khoa Điện - Điện tử',
      classGroup: records[0]?.classGroup || 'FEE',
      totalRegistered: records.length,
      totalCheckedIn: records.filter(r => r.checkedIn).length,
      history: records
    };
  },

  getRegistrations: (eventId?: string, search?: string): RegistrationRecord[] => {
    let records = getLocalData<RegistrationRecord[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    if (eventId && eventId !== 'ALL') {
      records = records.filter(r => r.eventId === eventId);
    }
    if (search) {
      const q = search.toLowerCase();
      records = records.filter(r => 
        r.fullName.toLowerCase().includes(q) ||
        r.mssv.toLowerCase().includes(q) ||
        r.ticketCode.toLowerCase().includes(q) ||
        r.classGroup.toLowerCase().includes(q)
      );
    }
    return records;
  },

  sendReminder: (eventId: string) => {
    const events = getLocalData<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const registrations = getLocalData<RegistrationRecord[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const notifications = getLocalData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const emailLogs = getLocalData<EmailDispatchLog[]>(STORAGE_KEYS.EMAIL_LOGS, []);

    const event = events.find(e => e.id === eventId);
    if (!event) {
      throw new Error('Sự kiện không tồn tại');
    }

    const participants = registrations.filter(r => r.eventId === eventId);
    let sentCount = 0;

    participants.forEach(p => {
      emailLogs.unshift({
        id: `email-${Date.now()}-${Math.random()}`,
        recipientEmail: p.email,
        recipientName: p.fullName,
        subject: `[Nhắc nhở 24h] Sự kiện "${event.title}" sắp diễn ra tại ${event.location}`,
        type: 'REMINDER_24H',
        sentAt: new Date().toISOString(),
        status: 'DELIVERED',
        ticketCode: p.ticketCode
      });
      sentCount++;
    });
    setLocalData(STORAGE_KEYS.EMAIL_LOGS, emailLogs);

    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Đã gửi thông báo nhắc nhở 24h`,
      message: `Hệ thống đã tự động gửi email nhắc nhở kèm mã vé QR đến ${sentCount} sinh viên tham gia sự kiện "${event.title}".`,
      type: 'REMINDER',
      timestamp: 'Vừa xong',
      read: false
    });
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, notifications);

    return {
      success: true,
      message: `Đã tự động gửi email nhắc nhở 24h đến ${sentCount} sinh viên thành công!`,
      sentCount
    };
  },

  getBCH: (): BCHMember[] => {
    return INITIAL_BCH;
  },

  getNotifications: (): NotificationItem[] => {
    return getLocalData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  markNotificationsRead: (): void => {
    const notifications = getLocalData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    notifications.forEach(n => n.read = true);
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  getEmailLogs: (): EmailDispatchLog[] => {
    return getLocalData<EmailDispatchLog[]>(STORAGE_KEYS.EMAIL_LOGS, [
      {
        id: 'email-001',
        recipientEmail: '2211001@student.university.edu.vn',
        recipientName: 'Nguyễn Văn An',
        subject: '[FEE Portal] Xác nhận đăng ký EE TECH DAY 2026 kèm Vé Điện Tử QR',
        type: 'REGISTRATION_CONFIRMATION',
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: 'DELIVERED',
        ticketCode: 'FEE-TECH-88392'
      },
      {
        id: 'email-002',
        recipientEmail: '2111054@student.university.edu.vn',
        recipientName: 'Lê Quang Minh',
        subject: '[FEE Portal] Nhắc nhở: Hội thảo Thiết kế Vi mạch Bán dẫn VLSI diễn ra ngày mai',
        type: 'REMINDER_24H',
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        status: 'DELIVERED',
        ticketCode: 'FEE-VLSI-44211'
      }
    ]);
  }
};

export const api = {
  // Stats
  getStats: async (): Promise<FacultyStats> => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.getStats();
  },

  // News
  getNews: async (category?: string, search?: string): Promise<NewsItem[]> => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      const res = await fetch(`/api/news?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.getNews(category, search);
  },

  createNews: async (newsData: Partial<NewsItem>): Promise<NewsItem> => {
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsData),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.createNews(newsData);
  },

  // Events
  getEvents: async (type?: string, status?: string): Promise<EventItem[]> => {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      const res = await fetch(`/api/events?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.getEvents(type, status);
  },

  createEvent: async (eventData: Partial<EventItem>): Promise<EventItem> => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.createEvent(eventData);
  },

  registerEvent: async (eventId: string, registrationData: {
    fullName: string;
    mssv: string;
    email: string;
    phone: string;
    classGroup: string;
    faculty: string;
    note?: string;
  }): Promise<{ success: boolean; message: string; registration: RegistrationRecord; eventUpdated: EventItem }> => {
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.registerEvent(eventId, registrationData);
  },

  // Attendance & Check-in
  checkIn: async (code: string, eventId?: string): Promise<{ success: boolean; message: string; record: RegistrationRecord; warning?: boolean }> => {
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, eventId }),
      });
      if (res.ok || res.status === 409) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.checkIn(code, eventId);
  },

  // Student history lookup
  lookupStudent: async (mssv: string) => {
    try {
      const res = await fetch(`/api/attendance/student/${encodeURIComponent(mssv)}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.lookupStudent(mssv);
  },

  // Registrations list for admin
  getRegistrations: async (eventId?: string, search?: string): Promise<RegistrationRecord[]> => {
    try {
      const params = new URLSearchParams();
      if (eventId) params.append('eventId', eventId);
      if (search) params.append('search', search);
      const res = await fetch(`/api/registrations?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.getRegistrations(eventId, search);
  },

  // Reminder trigger
  sendReminder: async (eventId: string): Promise<{ success: boolean; message: string; sentCount: number }> => {
    try {
      const res = await fetch('/api/notifications/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.sendReminder(eventId);
  },

  // BCH
  getBCH: async (): Promise<BCHMember[]> => {
    try {
      const res = await fetch('/api/bch');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.getBCH();
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.getNotifications();
  },

  markNotificationsRead: async (): Promise<void> => {
    try {
      await fetch('/api/notifications/mark-read', { method: 'POST' });
    } catch {
      // Fallback
    }
    clientStorage.markNotificationsRead();
  },

  // Email Logs
  getEmailLogs: async (): Promise<EmailDispatchLog[]> => {
    try {
      const res = await fetch('/api/email-logs');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return clientStorage.getEmailLogs();
  }
};

