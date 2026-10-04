import { EventItem, EventType, FacultyStats, MemberGender, MemberRecord, MemberStatus, NewsItem, RegistrationRecord } from '../types';
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
    author: newsData.author || 'Ban TT-SK',
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

export type MemberInput = Omit<MemberRecord, 'id' | 'updatedAt'>;

const MEMBER_GENDERS: MemberGender[] = ['NAM', 'NU', 'KHAC', ''];
const MEMBER_STATUSES: MemberStatus[] = ['STUDYING', 'RESERVED', 'GRADUATED', 'DROPPED'];

// Same key as registrations / students: the lower-cased MSSV
export function memberIdOf(mssv: string): string {
  return mssv.trim().toLowerCase();
}

function text(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

// Normalises a form / Excel row; `previous` fills in what the input leaves out
export function buildMember(input: Partial<MemberInput>, previous?: MemberRecord): MemberRecord {
  const merged = { ...previous, ...Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) };
  const mssv = text(merged.mssv, 20);
  const id = memberIdOf(mssv);
  if (!/^[a-z0-9]{1,20}$/.test(id)) throw new Error(`MSSV "${mssv}" không hợp lệ (chỉ gồm chữ và số, tối đa 20 ký tự).`);
  const fullName = text(merged.fullName, 100);
  if (!fullName) throw new Error(`Thiếu họ tên cho MSSV ${mssv}.`);
  const isUnionMember = Boolean(merged.isUnionMember);
  return {
    id,
    mssv,
    fullName,
    gender: MEMBER_GENDERS.includes(merged.gender as MemberGender) ? (merged.gender as MemberGender) : '',
    dateOfBirth: text(merged.dateOfBirth, 10),
    cohort: text(merged.cohort, 20),
    classGroup: text(merged.classGroup, 50),
    email: text(merged.email, 100),
    phone: text(merged.phone, 20),
    isUnionMember,
    unionJoinDate: isUnionMember ? text(merged.unionJoinDate, 10) : '',
    unionCardNumber: isUnionMember ? text(merged.unionCardNumber, 30) : '',
    isAssociationMember: Boolean(merged.isAssociationMember),
    status: MEMBER_STATUSES.includes(merged.status as MemberStatus) ? (merged.status as MemberStatus) : 'STUDYING',
    note: text(merged.note, 500),
    updatedAt: new Date().toISOString(),
  };
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
