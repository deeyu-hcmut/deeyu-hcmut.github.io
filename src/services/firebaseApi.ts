import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  where,
  writeBatch,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type WriteBatch,
} from 'firebase/firestore/lite';
import { db } from './firebase';
import type { Api } from './api';
import {
  BCHMember,
  EmailDispatchLog,
  EventItem,
  NewsItem,
  NotificationItem,
  RegistrationRecord,
} from '../types';

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
} from './shared';

/*
 * Firestore layout (access rules in /firestore.rules):
 *   events/{eventId}                   public read; staff write; public +1 on registration
 *   news/{newsId}, bch/{memberId}      public read; staff write
 *   registrations/{eventId}_{mssvKey}  ticket without contact info; public get, staff list/update
 *   registrationContacts/{same id}     email/phone/note; staff only
 *   students/{mssvKey}                 { eventIds } index for the public MSSV lookup
 *   notifications/{id}                 public read; staff write
 *   emailLogs/{id}                     staff only
 *   admins/{email}                     { role } of each staff Google account
 */

type ContactInfo = { email: string; phone: string; note: string };
type StoredEvent = EventItem & { createdAt?: string; checkedInCount?: number };
type StoredNotification = Omit<NotificationItem, 'id' | 'timestamp' | 'read'> & { createdAt: string };

const NOTIFICATIONS_READ_AT_KEY = 'fee_portal_notifications_read_at';

function withId<T>(snap: DocumentSnapshot | QueryDocumentSnapshot): T {
  return { id: snap.id, ...snap.data() } as T;
}

function mssvKeyOf(mssv: string): string {
  return mssv.trim().toLowerCase();
}

function toRecord(id: string, data: Record<string, unknown>, contact?: ContactInfo): RegistrationRecord {
  const { mssvKey: _mssvKey, ...rest } = data;
  return {
    id,
    ...(rest as Omit<RegistrationRecord, 'id' | 'email' | 'phone'>),
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    note: contact?.note || undefined,
  };
}

function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function readNotificationsReadAt(): string {
  try {
    return localStorage.getItem(NOTIFICATIONS_READ_AT_KEY) || '';
  } catch {
    return '';
  }
}

function queueNotification(batch: WriteBatch, notification: Omit<StoredNotification, 'createdAt'>) {
  batch.set(doc(collection(db, 'notifications')), { ...notification, createdAt: new Date().toISOString() });
}

// App mount asks for stats, events and news at the same time; share one read per collection.
const listCache = new Map<string, { at: number; promise: Promise<unknown[]> }>();
const LIST_CACHE_MS = 10_000;

function cachedList<T>(name: string, load: () => Promise<T[]>): Promise<T[]> {
  const hit = listCache.get(name);
  if (hit && Date.now() - hit.at < LIST_CACHE_MS) return hit.promise as Promise<T[]>;
  const promise = load();
  listCache.set(name, { at: Date.now(), promise });
  promise.catch(() => listCache.delete(name));
  return promise;
}

function invalidate(...names: string[]) {
  names.forEach(name => listCache.delete(name));
}

const loadEvents = () =>
  cachedList('events', async () =>
    (await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')))).docs.map(d => withId<StoredEvent>(d))
  );

const loadNews = () =>
  cachedList('news', async () =>
    (await getDocs(query(collection(db, 'news'), orderBy('publishedAt', 'desc')))).docs.map(d => withId<NewsItem>(d))
  );

async function loadContacts(): Promise<Map<string, ContactInfo>> {
  const snap = await getDocs(collection(db, 'registrationContacts'));
  return new Map(snap.docs.map(d => [d.id, d.data() as ContactInfo]));
}

async function findRegistration(code: string, eventId?: string): Promise<QueryDocumentSnapshot | DocumentSnapshot | null> {
  const registrations = collection(db, 'registrations');
  const byTicket = await getDocs(query(registrations, where('ticketCode', '==', code.trim().toUpperCase()), limit(1)));
  if (!byTicket.empty) return byTicket.docs[0];

  const mssvKey = mssvKeyOf(code);
  if (eventId) {
    const snap = await getDoc(doc(registrations, `${eventId}_${mssvKey}`));
    return snap.exists() ? snap : null;
  }
  const byMssv = await getDocs(query(registrations, where('mssvKey', '==', mssvKey)));
  return byMssv.docs.find(d => !d.data().checkedIn) ?? byMssv.docs[0] ?? null;
}

const rawFirebaseApi: Api = {
  getStats: async () => {
    const [events, news] = await Promise.all([loadEvents(), loadNews()]);
    return buildStats({
      registrations: events.reduce((sum, e) => sum + (e.currentParticipants || 0), 0),
      checkIns: events.reduce((sum, e) => sum + (e.checkedInCount || 0), 0),
      events: events.length,
      news: news.length,
    });
  },

  getNews: async (category, search) => filterNews(await loadNews(), category, search),

  createNews: async newsData => {
    const ref = doc(collection(db, 'news'));
    const article = buildNews(newsData);
    const batch = writeBatch(db);
    batch.set(ref, article);
    queueNotification(batch, { title: `Tin mới: ${article.title}`, message: article.summary, type: 'NEWS' });
    await batch.commit();
    invalidate('news');
    return { id: ref.id, ...article };
  },

  updateNews: async (newsId, patch) => {
    const ref = doc(db, 'news', newsId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Bài viết không tồn tại');
    const changes = pickFields(patch, EDITABLE_NEWS_FIELDS);
    const batch = writeBatch(db);
    batch.update(ref, changes);
    await batch.commit();
    invalidate('news');
    return { ...withId<NewsItem>(snap), ...changes };
  },

  deleteNews: async newsId => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'news', newsId));
    await batch.commit();
    invalidate('news');
  },

  getEvents: async (type, status) => filterEvents(await loadEvents(), type, status),

  createEvent: async eventData => {
    const ref = doc(collection(db, 'events'));
    const event = buildEvent(eventData);
    const batch = writeBatch(db);
    batch.set(ref, { ...event, checkedInCount: 0, createdAt: new Date().toISOString() });
    queueNotification(batch, {
      title: `Sự kiện mới: ${event.title}`,
      message: `Đang mở đăng ký tham gia. Hạn chót: ${event.registrationDeadline.split('T')[0]}.`,
      type: 'EVENT',
    });
    await batch.commit();
    invalidate('events');
    return { id: ref.id, ...event };
  },

  updateEvent: async (eventId, patch) => {
    const ref = doc(db, 'events', eventId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Sự kiện không tồn tại');
    const before = withId<StoredEvent>(snap);
    const changes = pickFields(patch, EDITABLE_EVENT_FIELDS);

    let batch = writeBatch(db);
    batch.update(ref, changes);
    // Tickets keep a copy of the title (shown in lookups, admin lists and Excel exports)
    if (changes.title && changes.title !== before.title) {
      const regSnap = await getDocs(query(collection(db, 'registrations'), where('eventId', '==', eventId)));
      let writes = 1;
      for (const reg of regSnap.docs) {
        if (writes === 450) {
          await batch.commit();
          batch = writeBatch(db);
          writes = 0;
        }
        batch.update(reg.ref, { eventTitle: changes.title });
        writes++;
      }
    }
    await batch.commit();
    invalidate('events');
    return { ...before, ...changes };
  },

  deleteEvent: async eventId => {
    const regSnap = await getDocs(query(collection(db, 'registrations'), where('eventId', '==', eventId)));
    // Each registration costs 3 writes (ticket, contact info, MSSV lookup index); a batch holds 500
    const PER_BATCH = 150;
    for (let i = 0; i < regSnap.docs.length; i += PER_BATCH) {
      const batch = writeBatch(db);
      regSnap.docs.slice(i, i + PER_BATCH).forEach(reg => {
        batch.delete(reg.ref);
        batch.delete(doc(db, 'registrationContacts', reg.id));
        batch.update(doc(db, 'students', reg.data().mssvKey), { eventIds: arrayRemove(eventId) });
      });
      await batch.commit();
    }
    // The event goes last, so a failure part-way leaves it visible for a retry
    const batch = writeBatch(db);
    batch.delete(doc(db, 'events', eventId));
    await batch.commit();
    invalidate('events');
    return { deletedRegistrations: regSnap.size };
  },

  registerEvent: async (eventId, data) => {
    const mssv = data.mssv.trim();
    const mssvKey = mssvKeyOf(mssv);
    if (!/^[a-z0-9]{1,20}$/.test(mssvKey)) {
      throw new Error('MSSV chỉ gồm chữ và số (tối đa 20 ký tự).');
    }
    const regId = `${eventId}_${mssvKey}`;
    const eventRef = doc(db, 'events', eventId);
    const regRef = doc(db, 'registrations', regId);
    const studentRef = doc(db, 'students', mssvKey);

    const result = await runTransaction(db, async tx => {
      const [eventSnap, regSnap, studentSnap] = await Promise.all([tx.get(eventRef), tx.get(regRef), tx.get(studentRef)]);
      if (!eventSnap.exists()) throw new Error('Sự kiện không tồn tại');
      const event = withId<StoredEvent>(eventSnap);
      if (event.status !== 'REGISTRATION_OPEN') throw new Error('Sự kiện hiện không mở đăng ký');
      if (event.currentParticipants >= event.maxParticipants) throw new Error('Sự kiện đã đủ số lượng đăng ký tối đa');
      if (regSnap.exists()) {
        throw new Error(`MSSV ${mssv} đã đăng ký sự kiện này trước đó với mã vé #${regSnap.data().ticketCode}`);
      }

      const ticket = {
        eventId,
        eventTitle: event.title,
        fullName: data.fullName.trim(),
        mssv,
        mssvKey,
        classGroup: data.classGroup ? data.classGroup.trim() : 'Khoa Điện - Điện tử',
        faculty: data.faculty || 'Khoa Điện - Điện tử',
        registeredAt: new Date().toISOString(),
        ticketCode: generateTicketCode(event.type),
        checkedIn: false,
      };
      const contact: ContactInfo = { email: data.email.trim(), phone: data.phone.trim(), note: data.note?.trim() || '' };
      const currentParticipants = event.currentParticipants + 1;
      const status = currentParticipants >= event.maxParticipants ? 'REGISTRATION_CLOSED' : event.status;
      const previousEventIds: string[] = studentSnap.exists() ? studentSnap.data().eventIds ?? [] : [];

      tx.set(regRef, ticket);
      tx.set(doc(db, 'registrationContacts', regId), contact);
      tx.update(eventRef, { currentParticipants, status, lastRegistrationId: regId });
      tx.set(studentRef, {
        mssv,
        fullName: ticket.fullName,
        classGroup: ticket.classGroup,
        eventIds: [...previousEventIds, eventId],
        lastEventId: eventId,
      });

      return {
        registration: toRecord(regId, ticket, contact),
        eventUpdated: { ...event, currentParticipants, status } as EventItem,
      };
    });

    invalidate('events');
    return { success: true, message: 'Đăng ký tham gia sự kiện thành công!', ...result };
  },

  checkIn: async (code, eventId) => {
    const snap = await findRegistration(code, eventId);
    if (!snap) {
      throw new Error(`Không tìm thấy thông tin đăng ký cho mã "${code}". Vui lòng kiểm tra lại.`);
    }
    const data = snap.data() as Record<string, unknown> & RegistrationRecord;
    const contactSnap = await getDoc(doc(db, 'registrationContacts', snap.id));
    const contact = contactSnap.exists() ? (contactSnap.data() as ContactInfo) : undefined;

    if (data.checkedIn) {
      return {
        success: false,
        warning: true,
        message: `Sinh viên ${data.fullName} (${data.mssv}) ĐÃ ĐƯỢC ĐIỂM DANH trước đó vào lúc ${new Date(data.checkedInAt!).toLocaleTimeString('vi-VN')}.`,
        record: toRecord(snap.id, data, contact),
      };
    }

    const checkedInAt = new Date().toISOString();
    const batch = writeBatch(db);
    batch.update(snap.ref, { checkedIn: true, checkedInAt });
    batch.update(doc(db, 'events', data.eventId), { checkedInCount: increment(1) });
    if (contact?.email) {
      batch.set(doc(collection(db, 'emailLogs')), {
        recipientEmail: contact.email,
        recipientName: data.fullName,
        subject: '[Đoàn - Hội Khoa Điện - Điện tử] Ghi nhận Điểm danh tham dự thành công',
        type: 'ATTENDANCE_SUCCESS',
        sentAt: checkedInAt,
        status: 'QUEUED',
        ticketCode: data.ticketCode,
      } satisfies Omit<EmailDispatchLog, 'id'>);
    }
    await batch.commit();
    invalidate('events');

    return {
      success: true,
      message: `Điểm danh thành công cho sinh viên ${data.fullName} (${data.mssv})!`,
      record: toRecord(snap.id, { ...data, checkedIn: true, checkedInAt }, contact),
    };
  },

  lookupStudent: async mssv => {
    const mssvKey = mssvKeyOf(mssv);
    const studentSnap = mssvKey ? await getDoc(doc(db, 'students', mssvKey)) : null;
    const eventIds: string[] = studentSnap?.exists() ? studentSnap.data().eventIds ?? [] : [];
    const snaps = await Promise.all(eventIds.map(id => getDoc(doc(db, 'registrations', `${id}_${mssvKey}`))));
    // Contact details are staff-only, so lookup results carry no email/phone
    const history = snaps.filter(s => s.exists()).map(s => toRecord(s.id, s.data()!));

    return {
      mssv,
      studentName: history[0]?.fullName || 'Sinh viên Khoa Điện - Điện tử',
      classGroup: history[0]?.classGroup || 'Khoa Điện - Điện tử',
      totalRegistered: history.length,
      totalCheckedIn: history.filter(r => r.checkedIn).length,
      history,
    };
  },

  getRegistrations: async (eventId, search) => {
    const registrations = collection(db, 'registrations');
    const regQuery = eventId && eventId !== 'ALL' ? query(registrations, where('eventId', '==', eventId)) : registrations;
    const [regSnap, contacts] = await Promise.all([getDocs(regQuery), loadContacts()]);
    const records = regSnap.docs
      .map(d => toRecord(d.id, d.data(), contacts.get(d.id)))
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
    return filterRegistrations(records, undefined, search);
  },

  sendReminder: async eventId => {
    const eventSnap = await getDoc(doc(db, 'events', eventId));
    if (!eventSnap.exists()) throw new Error('Sự kiện không tồn tại');
    const event = withId<EventItem>(eventSnap);

    const [regSnap, contacts] = await Promise.all([
      getDocs(query(collection(db, 'registrations'), where('eventId', '==', eventId))),
      loadContacts(),
    ]);
    const recipients = regSnap.docs
      .map(d => ({ data: d.data(), contact: contacts.get(d.id) }))
      .filter(r => r.contact?.email);

    // A batch holds at most 500 writes; keep one slot for the notification
    const sentAt = new Date().toISOString();
    for (let i = 0; i < recipients.length || i === 0; i += 499) {
      const batch = writeBatch(db);
      recipients.slice(i, i + 499).forEach(({ data, contact }) => {
        batch.set(doc(collection(db, 'emailLogs')), {
          recipientEmail: contact!.email,
          recipientName: data.fullName,
          subject: `[Nhắc nhở 24h] Sự kiện "${event.title}" sắp diễn ra tại ${event.location}`,
          type: 'REMINDER_24H',
          sentAt,
          status: 'QUEUED',
          ticketCode: data.ticketCode,
        } satisfies Omit<EmailDispatchLog, 'id'>);
      });
      if (i + 499 >= recipients.length) {
        queueNotification(batch, {
          title: 'Đã gửi thông báo nhắc nhở 24h',
          message: `Đã xếp hàng email nhắc nhở kèm mã vé QR cho ${recipients.length} sinh viên tham gia sự kiện "${event.title}".`,
          type: 'REMINDER',
        });
      }
      await batch.commit();
    }

    return {
      success: true,
      message: `Đã xếp hàng email nhắc nhở 24h cho ${recipients.length} sinh viên.`,
      sentCount: recipients.length,
    };
  },

  getBCH: async () =>
    (await getDocs(query(collection(db, 'bch'), orderBy('order')))).docs.map(d => {
      const { order: _order, ...member } = withId<BCHMember & { order: number }>(d);
      return member;
    }),

  getNotifications: async () => {
    const readAt = readNotificationsReadAt();
    const snap = await getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(20)));
    return snap.docs.map(d => {
      const { createdAt, ...rest } = d.data() as StoredNotification;
      return { id: d.id, ...rest, timestamp: relativeTime(createdAt), read: createdAt <= readAt };
    });
  },

  // Notifications are shared by every visitor, so "read" is tracked per browser
  markNotificationsRead: async () => {
    try {
      localStorage.setItem(NOTIFICATIONS_READ_AT_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
  },

  getEmailLogs: async () =>
    (await getDocs(query(collection(db, 'emailLogs'), orderBy('sentAt', 'desc'), limit(200)))).docs.map(d =>
      withId<EmailDispatchLog>(d)
    ),
};

function friendlyError(err: unknown): Error {
  const code = (err as { code?: string } | null)?.code;
  if (code === 'permission-denied') {
    return new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập bằng tài khoản BCH.');
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return new Error('Không kết nối được máy chủ dữ liệu. Vui lòng kiểm tra mạng và thử lại.');
  }
  return err instanceof Error ? err : new Error(String(err));
}

export const firebaseApi = Object.fromEntries(
  Object.entries(rawFirebaseApi).map(([name, fn]) => [
    name,
    async (...args: unknown[]) => {
      try {
        return await (fn as (...params: unknown[]) => Promise<unknown>)(...args);
      } catch (err) {
        throw friendlyError(err);
      }
    },
  ])
) as Api;

