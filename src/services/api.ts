import { EventItem, NewsItem, RegistrationRecord, BCHMember, NotificationItem, EmailDispatchLog, FacultyStats } from '../types';

export const api = {
  // Stats
  getStats: async (): Promise<FacultyStats> => {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // News
  getNews: async (category?: string, search?: string): Promise<NewsItem[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const res = await fetch(`/api/news?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch news');
    return res.json();
  },

  createNews: async (newsData: Partial<NewsItem>): Promise<NewsItem> => {
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsData),
    });
    if (!res.ok) throw new Error('Failed to create news');
    return res.json();
  },

  // Events
  getEvents: async (type?: string, status?: string): Promise<EventItem[]> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    const res = await fetch(`/api/events?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  createEvent: async (eventData: Partial<EventItem>): Promise<EventItem> => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
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
    const res = await fetch(`/api/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đăng ký thất bại');
    }
    return data;
  },

  // Attendance & Check-in
  checkIn: async (code: string, eventId?: string): Promise<{ success: boolean; message: string; record: RegistrationRecord; warning?: boolean }> => {
    const res = await fetch('/api/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, eventId }),
    });
    const data = await res.json();
    if (!res.ok && res.status !== 409) {
      throw new Error(data.error || 'Điểm danh không thành công');
    }
    return data;
  },

  // Student history lookup
  lookupStudent: async (mssv: string) => {
    const res = await fetch(`/api/attendance/student/${encodeURIComponent(mssv)}`);
    if (!res.ok) throw new Error('Failed to lookup student');
    return res.json();
  },

  // Registrations list for admin
  getRegistrations: async (eventId?: string, search?: string): Promise<RegistrationRecord[]> => {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    if (search) params.append('search', search);
    const res = await fetch(`/api/registrations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch registrations');
    return res.json();
  },

  // Reminder trigger
  sendReminder: async (eventId: string): Promise<{ success: boolean; message: string; sentCount: number }> => {
    const res = await fetch('/api/notifications/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });
    if (!res.ok) throw new Error('Failed to send reminder');
    return res.json();
  },

  // BCH
  getBCH: async (): Promise<BCHMember[]> => {
    const res = await fetch('/api/bch');
    if (!res.ok) throw new Error('Failed to fetch BCH');
    return res.json();
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  markNotificationsRead: async (): Promise<void> => {
    await fetch('/api/notifications/mark-read', { method: 'POST' });
  },

  // Email Logs
  getEmailLogs: async (): Promise<EmailDispatchLog[]> => {
    const res = await fetch('/api/email-logs');
    if (!res.ok) throw new Error('Failed to fetch email logs');
    return res.json();
  }
};
