import { EventItem, EventType, FacultyStats, NewsItem, RegistrationRecord } from '../types';
import { INITIAL_STATS } from '../data/mockData';

// Logic shared by the localStorage backend (api.ts) and the Firestore backend (firebaseApi.ts).

export function buildStats(counts: { registrations: number; checkIns: number; events: number; news: number }): FacultyStats {
  // Offsets are the totals from before the portal went live
  return {
    ...INITIAL_STATS,
    totalRegistrations: counts.registrations + 4230,
    totalCheckIns: counts.checkIns + 3890,
    totalEventsHeld: counts.events + 43,
    totalNewsPublished: counts.news + 120,
  };
}

export function buildNews(newsData: Partial<NewsItem>): Omit<NewsItem, 'id'> {
  return {
    title: newsData.title || 'Tin tức mới',
    slug: (newsData.title || 'tin-tuc-moi').toLowerCase().replace(/\s+/g, '-'),
    summary: newsData.summary || '',
    content: newsData.content || '',
    category: newsData.category || 'HOAT_DONG_KHOA',
    categoryName: newsData.categoryName || 'Hoạt động Khoa',
    author: newsData.author || 'Ban Truyền thông',
    authorRole: newsData.authorRole || 'Cộng tác viên Truyền thông',
    publishedAt: new Date().toISOString(),
    coverImage: newsData.coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    tags: newsData.tags || ['Đoàn - Hội', 'Tuổi trẻ'],
    views: 1
  };
}

export function buildEvent(eventData: Partial<EventItem>): Omit<EventItem, 'id'> {
  return {
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
}

// Fields staff may change after creation. Counters (participants, check-ins), ids and
// timestamps are never taken from an edit form.
export const EDITABLE_EVENT_FIELDS = [
  'title', 'description', 'content', 'type', 'typeName', 'status', 'location',
  'eventDate', 'startTime', 'endTime', 'registrationDeadline', 'maxParticipants', 'bannerUrl',
] as const satisfies readonly (keyof EventItem)[];

export const EDITABLE_NEWS_FIELDS = [
  'title', 'summary', 'content', 'category', 'categoryName', 'tags', 'coverImage',
] as const satisfies readonly (keyof NewsItem)[];

export function pickFields<T extends object, K extends keyof T>(source: Partial<T>, keys: readonly K[]): Partial<Pick<T, K>> {
  const out: Partial<Pick<T, K>> = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key] as T[K];
  }
  return out;
}

// No 0/O/1/I so codes typed by hand at the door are unambiguous
const TICKET_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateTicketCode(type: EventType): string {
  const prefix = type === 'ACADEMIC_CONTEST' ? 'ACAD' : type === 'SEMINAR_WORKSHOP' ? 'SEMI' : 'EVT';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const suffix = Array.from(bytes, b => TICKET_ALPHABET[b % TICKET_ALPHABET.length]).join('');
  return `${prefix}-${suffix}`;
}

export function filterNews(news: NewsItem[], category?: string, search?: string): NewsItem[] {
  let result = news;
  if (category && category !== 'ALL') {
    result = result.filter(item => item.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  return result;
}

export function filterEvents(events: EventItem[], type?: string, status?: string): EventItem[] {
  let result = events;
  if (type && type !== 'ALL') {
    result = result.filter(evt => evt.type === type);
  }
  if (status && status !== 'ALL') {
    result = result.filter(evt => evt.status === status);
  }
  return result;
}

export function filterRegistrations(records: RegistrationRecord[], eventId?: string, search?: string): RegistrationRecord[] {
  let result = records;
  if (eventId && eventId !== 'ALL') {
    result = result.filter(r => r.eventId === eventId);
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(r =>
      r.fullName.toLowerCase().includes(q) ||
      r.mssv.toLowerCase().includes(q) ||
      r.ticketCode.toLowerCase().includes(q) ||
      r.classGroup.toLowerCase().includes(q)
    );
  }
  return result;
}
