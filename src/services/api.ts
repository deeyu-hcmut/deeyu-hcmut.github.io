import { EventItem, NewsItem, RegistrationRecord, BCHMember, NotificationItem, EmailDispatchLog, FacultyStats, MemberRecord, Role, StaffAccount, StudentProfilePatch } from '../types';
import { 
  INITIAL_EVENTS, 
  INITIAL_NEWS, 
  INITIAL_BCH, 
  INITIAL_REGISTRATIONS, 
  INITIAL_NOTIFICATIONS
} from '../data/mockData';
import { FIREBASE_ENABLED } from './firebaseConfig';
import {
  EDITABLE_EVENT_FIELDS,
  EDITABLE_NEWS_FIELDS,
  pickFields,
  buildEvent,
  buildNews,
  buildStats,
  filterEvents,
  filterNews,
  filterRegistrations,
  generateTicketCode,
  buildMember,
  memberIdOf,
  buildBch,
  normalizeStaffEmail,
  buildStudentProfile,
  type MemberInput,
  type BchInput
} from './shared';

// Storage keys for client-side persistence (GitHub Pages static mode)
const STORAGE_KEYS = {
  EVENTS: 'fee_portal_events_v2',
  NEWS: 'fee_portal_news_v2',
  REGISTRATIONS: 'fee_portal_registrations_v2',
  NOTIFICATIONS: 'fee_portal_notifications_v2',
  EMAIL_LOGS: 'fee_portal_email_logs_v2',
  MEMBERS: 'fee_portal_members_v1',
  BCH: 'fee_portal_bch_v1',
  ADMINS: 'fee_portal_admins_v1',
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
    return buildStats({
      registrations: registrations.length,
      checkIns: registrations.filter(r => r.checkedIn).length,
      events: events.length,
      news: news.length,
    });
  },

  getNews: (category?: string, search?: string): NewsItem[] =>
    filterNews(getLocalData<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS), category, search),

  createNews: (newsData: Partial<NewsItem>): NewsItem => {
    const news = getLocalData<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    const notifications = getLocalData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

    const newArticle: NewsItem = { id: `news-${Date.now()}`, ...buildNews(newsData) };
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

  updateNews: (newsId: string, patch: Partial<NewsItem>): NewsItem => {
    const news = getLocalData<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    const article = news.find(n => n.id === newsId);
    if (!article) throw new Error('Bài viết không tồn tại');
    Object.assign(article, pickFields(patch, EDITABLE_NEWS_FIELDS));
    setLocalData(STORAGE_KEYS.NEWS, news);
    return article;
  },

  deleteNews: (newsId: string) => {
    const news = getLocalData<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS);
    setLocalData(STORAGE_KEYS.NEWS, news.filter(n => n.id !== newsId));
  },

  getEvents: (type?: string, status?: string): EventItem[] =>
    filterEvents(getLocalData<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS), type, status),

  createEvent: (eventData: Partial<EventItem>): EventItem => {
    const events = getLocalData<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const notifications = getLocalData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

    const newEvt: EventItem = { id: `evt-${Date.now()}`, ...buildEvent(eventData) };
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

  updateEvent: (eventId: string, patch: Partial<EventItem>): EventItem => {
    const events = getLocalData<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const event = events.find(e => e.id === eventId);
    if (!event) throw new Error('Sự kiện không tồn tại');
    Object.assign(event, pickFields(patch, EDITABLE_EVENT_FIELDS));
    setLocalData(STORAGE_KEYS.EVENTS, events);
    // Tickets keep a copy of the title
    const registrations = getLocalData<RegistrationRecord[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    registrations.forEach(r => { if (r.eventId === eventId) r.eventTitle = event.title; });
    setLocalData(STORAGE_KEYS.REGISTRATIONS, registrations);
    return event;
  },

  deleteEvent: (eventId: string) => {
    const events = getLocalData<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const registrations = getLocalData<RegistrationRecord[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const remaining = registrations.filter(r => r.eventId !== eventId);
    setLocalData(STORAGE_KEYS.EVENTS, events.filter(e => e.id !== eventId));
    setLocalData(STORAGE_KEYS.REGISTRATIONS, remaining);
    return { deletedRegistrations: registrations.length - remaining.length };
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

    const ticketCode = generateTicketCode(event.type);

    const newRecord: RegistrationRecord = {
      id: `reg-${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      fullName: registrationData.fullName.trim(),
      mssv: registrationData.mssv.trim(),
      email: registrationData.email.trim(),
      phone: registrationData.phone.trim(),
      classGroup: registrationData.classGroup ? registrationData.classGroup.trim() : 'Khoa Điện - Điện tử',
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
      subject: `[Đoàn - Hội Khoa Điện - Điện tử] Xác nhận đăng ký "${event.title}" - Mã vé QR: ${ticketCode}`,
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
        success: false,
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
      subject: `[Đoàn - Hội Khoa Điện - Điện tử] Ghi nhận Điểm danh tham dự thành công`,
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
      classGroup: records[0]?.classGroup || 'Khoa Điện - Điện tử',
      totalRegistered: records.length,
      totalCheckedIn: records.filter(r => r.checkedIn).length,
      history: records
    };
  },

  getRegistrations: (eventId?: string, search?: string): RegistrationRecord[] =>
    filterRegistrations(getLocalData<RegistrationRecord[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS), eventId, search),

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

  getStaffAccounts: (): StaffAccount[] =>
    getLocalData<StaffAccount[]>(STORAGE_KEYS.ADMINS, []).sort((a, b) => a.email.localeCompare(b.email)),

  setStaffRole: (email: string, role: Role): StaffAccount => {
    const account: StaffAccount = { email: normalizeStaffEmail(email), role, updatedAt: new Date().toISOString() };
    const others = clientStorage.getStaffAccounts().filter(a => a.email !== account.email);
    setLocalData(STORAGE_KEYS.ADMINS, [...others, account]);
    return account;
  },

  removeStaffAccount: (email: string): void => {
    setLocalData(STORAGE_KEYS.ADMINS, clientStorage.getStaffAccounts().filter(a => a.email !== email));
  },

  // Stored in display order
  getBCH: (): BCHMember[] => getLocalData<BCHMember[]>(STORAGE_KEYS.BCH, INITIAL_BCH),

  saveBchMember: (input: BchInput, id?: string): BCHMember => {
    const list = clientStorage.getBCH();
    const member: BCHMember = { id: id || `bch-${Date.now()}`, ...buildBch(input) };
    const index = list.findIndex(m => m.id === id);
    if (index >= 0) list[index] = member;
    else list.push(member);
    setLocalData(STORAGE_KEYS.BCH, list);
    return member;
  },

  deleteBchMember: (id: string): void => {
    setLocalData(STORAGE_KEYS.BCH, clientStorage.getBCH().filter(m => m.id !== id));
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
    return getLocalData<EmailDispatchLog[]>(STORAGE_KEYS.EMAIL_LOGS, []);
  },

  getMembers: (): MemberRecord[] =>
    getLocalData<MemberRecord[]>(STORAGE_KEYS.MEMBERS, []).sort((a, b) => a.mssv.localeCompare(b.mssv)),

  saveMember: (input: MemberInput, previousId?: string, unlinkAccount?: boolean): MemberRecord => {
    const members = getLocalData<MemberRecord[]>(STORAGE_KEYS.MEMBERS, []);
    const member = buildMember(input, members.find(m => m.id === previousId), unlinkAccount);
    if (member.id !== previousId && members.some(m => m.id === member.id)) {
      throw new Error(`MSSV ${member.mssv} đã có trong danh sách.`);
    }
    setLocalData(STORAGE_KEYS.MEMBERS, [member, ...members.filter(m => m.id !== previousId && m.id !== member.id)]);
    return member;
  },

  deleteMember: (memberId: string): void => {
    const members = getLocalData<MemberRecord[]>(STORAGE_KEYS.MEMBERS, []);
    setLocalData(STORAGE_KEYS.MEMBERS, members.filter(m => m.id !== memberId));
  },

  // The demo has no sign-in, so these only serve the type; the first sign-in form needs Firebase
  getMyMemberProfile: (accountEmail: string): MemberRecord | null =>
    getLocalData<MemberRecord[]>(STORAGE_KEYS.MEMBERS, []).find(m => m.accountEmail === accountEmail.toLowerCase()) ?? null,

  findMemberForLink: (mssv: string, _fullName: string, _accountEmail: string): MemberRecord => {
    const member = getLocalData<MemberRecord[]>(STORAGE_KEYS.MEMBERS, []).find(m => m.id === memberIdOf(mssv));
    if (!member) throw new Error('MSSV này chưa có trong danh sách sinh viên của khoa.');
    return member;
  },

  saveMyProfile: (memberId: string, patch: StudentProfilePatch, accountEmail: string): void => {
    const now = new Date().toISOString();
    const members = getLocalData<MemberRecord[]>(STORAGE_KEYS.MEMBERS, []).map(m =>
      m.id === memberId
        ? { ...m, ...buildStudentProfile(patch), accountEmail: accountEmail.toLowerCase(), profileCompletedAt: now, updatedAt: now }
        : m
    );
    setLocalData(STORAGE_KEYS.MEMBERS, members);
  }
};

// GitHub Pages is a static host with no /api routes: skip the network round-trip
// (and the 404 it produces) and go straight to localStorage. `npm run dev` serves the
// Express API, and a production server build can opt in with VITE_API_SERVER=true.
const HAS_API_SERVER = import.meta.env.DEV || import.meta.env.VITE_API_SERVER === 'true';

async function fetchApi<T>(url: string, init?: RequestInit, acceptStatus: number[] = []): Promise<T | undefined> {
  if (!HAS_API_SERVER) return undefined;
  try {
    const res = await fetch(url, init);
    if (res.ok || acceptStatus.includes(res.status)) return await res.json();
  } catch {
    // Fallback
  }
  return undefined;
}

function postJson(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

const localApi = {
  // Stats
  getStats: async (): Promise<FacultyStats> =>
    (await fetchApi<FacultyStats>('/api/stats')) ?? clientStorage.getStats(),

  // News
  getNews: async (category?: string, search?: string): Promise<NewsItem[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return (await fetchApi<NewsItem[]>(`/api/news?${params.toString()}`)) ?? clientStorage.getNews(category, search);
  },

  createNews: async (newsData: Partial<NewsItem>): Promise<NewsItem> =>
    (await fetchApi<NewsItem>('/api/news', postJson(newsData))) ?? clientStorage.createNews(newsData),

  // Events
  getEvents: async (type?: string, status?: string): Promise<EventItem[]> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    return (await fetchApi<EventItem[]>(`/api/events?${params.toString()}`)) ?? clientStorage.getEvents(type, status);
  },

  createEvent: async (eventData: Partial<EventItem>): Promise<EventItem> =>
    (await fetchApi<EventItem>('/api/events', postJson(eventData))) ?? clientStorage.createEvent(eventData),

  updateNews: async (newsId: string, patch: Partial<NewsItem>): Promise<NewsItem> =>
    (await fetchApi<NewsItem>(`/api/news/${encodeURIComponent(newsId)}`, { ...postJson(patch), method: 'PATCH' })) ??
    clientStorage.updateNews(newsId, patch),

  deleteNews: async (newsId: string): Promise<void> => {
    if (await fetchApi(`/api/news/${encodeURIComponent(newsId)}`, { method: 'DELETE' })) return;
    clientStorage.deleteNews(newsId);
  },

  updateEvent: async (eventId: string, patch: Partial<EventItem>): Promise<EventItem> =>
    (await fetchApi<EventItem>(`/api/events/${encodeURIComponent(eventId)}`, { ...postJson(patch), method: 'PATCH' })) ??
    clientStorage.updateEvent(eventId, patch),

  // Also removes the event's registrations / check-ins
  deleteEvent: async (eventId: string): Promise<{ deletedRegistrations: number }> =>
    (await fetchApi<{ deletedRegistrations: number }>(`/api/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' })) ??
    clientStorage.deleteEvent(eventId),

  registerEvent: async (eventId: string, registrationData: {
    fullName: string;
    mssv: string;
    email: string;
    phone: string;
    classGroup: string;
    faculty: string;
    note?: string;
  }): Promise<{ success: boolean; message: string; registration: RegistrationRecord; eventUpdated: EventItem }> =>
    (await fetchApi<{ success: boolean; message: string; registration: RegistrationRecord; eventUpdated: EventItem }>(
      `/api/events/${eventId}/register`,
      postJson(registrationData)
    )) ?? clientStorage.registerEvent(eventId, registrationData),

  // Attendance & Check-in
  checkIn: async (code: string, eventId?: string): Promise<{ success: boolean; message: string; record: RegistrationRecord; warning?: boolean }> =>
    (await fetchApi<{ success: boolean; message: string; record: RegistrationRecord; warning?: boolean }>(
      '/api/attendance/check-in',
      postJson({ code, eventId }),
      [409]
    )) ?? clientStorage.checkIn(code, eventId),

  // Student history lookup
  lookupStudent: async (mssv: string) =>
    (await fetchApi<ReturnType<typeof clientStorage.lookupStudent>>(`/api/attendance/student/${encodeURIComponent(mssv)}`)) ??
    clientStorage.lookupStudent(mssv),

  // Registrations list for admin
  getRegistrations: async (eventId?: string, search?: string): Promise<RegistrationRecord[]> => {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    if (search) params.append('search', search);
    return (await fetchApi<RegistrationRecord[]>(`/api/registrations?${params.toString()}`)) ??
      clientStorage.getRegistrations(eventId, search);
  },

  // Reminder trigger
  sendReminder: async (eventId: string): Promise<{ success: boolean; message: string; sentCount: number }> =>
    (await fetchApi<{ success: boolean; message: string; sentCount: number }>(
      '/api/notifications/send-reminder',
      postJson({ eventId })
    )) ?? clientStorage.sendReminder(eventId),

  // BCH
  getBCH: async (): Promise<BCHMember[]> => clientStorage.getBCH(),

  // Staff Google accounts and their roles (Super Admin only)
  getStaffAccounts: async (): Promise<StaffAccount[]> => clientStorage.getStaffAccounts(),

  // Adds the account or changes its role
  setStaffRole: async (email: string, role: Role): Promise<StaffAccount> => clientStorage.setStaffRole(email, role),

  removeStaffAccount: async (email: string): Promise<void> => clientStorage.removeStaffAccount(email),

  // BCH / Đội CTV cards on the "Cơ cấu Tổ chức" page (Super Admin, Ban QLNS-CTSV)
  saveBchMember: async (input: BchInput, id?: string): Promise<BCHMember> => clientStorage.saveBchMember(input, id),

  deleteBchMember: async (id: string): Promise<void> => clientStorage.deleteBchMember(id),



  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> =>
    (await fetchApi<NotificationItem[]>('/api/notifications')) ?? clientStorage.getNotifications(),

  markNotificationsRead: async (): Promise<void> => {
    await fetchApi('/api/notifications/mark-read', { method: 'POST' });
    clientStorage.markNotificationsRead();
  },

  // Email Logs
  getEmailLogs: async (): Promise<EmailDispatchLog[]> =>
    (await fetchApi<EmailDispatchLog[]>('/api/email-logs')) ?? clientStorage.getEmailLogs(),

  // Student / Đoàn viên / Hội viên records (Ban QLNS-CTSV); the demo keeps them in this browser only
  getMembers: async (): Promise<MemberRecord[]> => clientStorage.getMembers(),

  // previousId: the record being edited (its MSSV may change), undefined when adding.
  // The student's account link is kept unless unlinkAccount is set.
  saveMember: async (input: MemberInput, previousId?: string, unlinkAccount?: boolean): Promise<MemberRecord> =>
    clientStorage.saveMember(input, previousId, unlinkAccount),

  deleteMember: async (memberId: string): Promise<void> => clientStorage.deleteMember(memberId),


  // ---------- First sign-in of a student with an @hcmut.edu.vn account ----------

  // The record linked to this account, or null when the student has not linked one yet
  getMyMemberProfile: async (accountEmail: string): Promise<MemberRecord | null> =>
    clientStorage.getMyMemberProfile(accountEmail),

  // Checks MSSV + full name against the list before the student may claim the record
  findMemberForLink: async (mssv: string, fullName: string, accountEmail: string): Promise<MemberRecord> =>
    clientStorage.findMemberForLink(mssv, fullName, accountEmail),

  // Links the account and stores what the student filled in
  saveMyProfile: async (memberId: string, patch: StudentProfilePatch, accountEmail: string): Promise<void> =>
    clientStorage.saveMyProfile(memberId, patch, accountEmail)
};

export type Api = typeof localApi;

// With Firebase configured every call goes to Firestore instead. The SDK sits in its
// own chunk, so a build without Firebase config never downloads it.
function lazyFirebaseApi(): Api {
  const load = () => import('./firebaseApi').then(m => m.firebaseApi);
  return new Proxy({} as Api, {
    get: (_target, key) => async (...args: unknown[]) => {
      const impl = await load();
      return (impl[key as keyof Api] as (...params: unknown[]) => unknown)(...args);
    },
  });
}

export const api: Api = FIREBASE_ENABLED ? lazyFirebaseApi() : localApi;
