import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  startAfter,
  where,
  writeBatch,
  type DocumentSnapshot,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type WriteBatch,
} from 'firebase/firestore/lite';
import { db } from './firebase';
import { auth } from './auth';
import { MEMBERS_SHEET_URL } from './firebaseConfig';
import type { Api } from './api';
import {
  BCHMember,
  EmailDispatchLog,
  EventItem,
  isRegistrationOpen,
  MemberRecord,
  NewsItem,
  StaffAccount,
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
  NEWS_PAGE,
  filterEvents,
  filterNews,
  filterRegistrations,
  generateTicketCode,
  buildMember,
  memberIdOf,
  buildBch,
  normalizeStaffEmail,
  buildStudentProfile,
  emailSubject,
  isHcmutEmail,
} from './shared';
import { normalizeKey } from '../utils/excel';
import { STAFF_ROLES, normalizeRole } from '../utils/roles';

/*
 * Firestore layout (access rules in /firestore.rules):
 *   events/{eventId}                   public read; staff write; public +1 on registration
 *   news/{newsId}                      public read; news staff write
 *   bch/{memberId}                     public read; Super Admin / Ban QLNS-CTSV write; `order` sorts the cards
 *   registrations/{eventId}_{mssvKey}  ticket without contact info; get by staff or the student's linked account, staff list/update
 *   registrationContacts/{same id}     email/phone/note; staff only
 *   students/{mssvKey}                 { eventIds } index for the student's ticket lookup
 *   notifications/{id}                 public read; staff write
 *   emailLogs/{id}                     event staff read; any staff adds on check-in
 *   members/{mssvKey}                  student / Đoàn viên / Hội viên records; Ban QLNS-CTSV, plus the
 *                                      student's own record once linked to their @hcmut.edu.vn account
 *   admins/{email}                     { role, updatedAt } of each staff Google account; Super Admin edits
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
// Staff registration lists hold contact info, so they stay in memory only; switching the event
// filter back and forth (or reopening the tab) must not re-read every ticket and contact.
const REGISTRATIONS_CACHE_MS = 2 * 60_000;

// Public lists are also kept in localStorage, so reloads and repeat visits within PERSIST_MS
// cost no reads (the free plan allows 50,000 reads a day for the whole site).
const PERSIST_MS = 15 * 60_000;
// Events and news change often and people expect to see them soon. The cache is per browser, so a
// shorter life only costs returning visitors, not first-time ones.
const FRESH_PERSIST_MS: Record<string, number> = { events: 3 * 60_000, news: 3 * 60_000 };
const persistKey = (name: string) => `fee_cache_${name}`;

function cachedList<T>(name: string, load: () => Promise<T[]>, persist = false, ttl = LIST_CACHE_MS): Promise<T[]> {
  const hit = listCache.get(name);
  if (hit && Date.now() - hit.at < ttl) return hit.promise as Promise<T[]>;
  let stored: { at: number; data: T[] } | null = null;
  if (persist) {
    try {
      stored = JSON.parse(localStorage.getItem(persistKey(name)) || 'null');
    } catch {
      // ignore: storage blocked or corrupt, fall through to Firestore
    }
    if (stored && Date.now() - stored.at < (FRESH_PERSIST_MS[name] ?? PERSIST_MS)) {
      const promise = Promise.resolve(stored.data);
      listCache.set(name, { at: Date.now(), promise });
      return promise;
    }
  }
  const expired = stored;
  const promise = load().catch(err => {
    // Daily quota used up or offline: an out-of-date copy beats an empty page
    if (expired) return expired.data;
    throw err;
  }).then(data => {
    if (persist && data !== expired?.data) {
      try {
        localStorage.setItem(persistKey(name), JSON.stringify({ at: Date.now(), data }));
      } catch {
        // ignore: storage full or blocked
      }
    }
    return data;
  });
  listCache.set(name, { at: Date.now(), promise });
  promise.catch(() => listCache.delete(name));
  return promise;
}

function invalidate(...names: string[]) {
  // Any ticket change makes every cached registration list stale
  if (names.includes('events')) names = [...names, ...[...listCache.keys()].filter(k => k.startsWith('registrations:'))];
  names.forEach(name => {
    listCache.delete(name);
    try {
      localStorage.removeItem(persistKey(name));
    } catch {
      // ignore
    }
  });
}

const loadEvents = () =>
  cachedList('events', async () =>
    (await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')))).docs.map(d => withId<StoredEvent>(d)),
    true
  );

type StoredBch = BCHMember & { order: number };

async function loadBch(): Promise<StoredBch[]> {
  return (await getDocs(query(collection(db, 'bch'), orderBy('order')))).docs.map(d => withId<StoredBch>(d));
}

function nextOrder(list: StoredBch[]): number {
  return list.reduce((max, m) => Math.max(max, m.order ?? 0), -1) + 1;
}

const newsPage = (...constraints: QueryConstraint[]) =>
  getDocs(query(collection(db, 'news'), orderBy('publishedAt', 'desc'), ...constraints, limit(NEWS_PAGE))).then(snap =>
    snap.docs.map(d => withId<NewsItem>(d))
  );

const loadNews = () => cachedList('news', () => newsPage(), true);

// With ids, reads only those contacts instead of every contact of every event
async function loadContacts(ids?: string[]): Promise<Map<string, ContactInfo>> {
  if (ids) {
    const snaps = await Promise.all(ids.map(id => getDoc(doc(db, 'registrationContacts', id))));
    return new Map(snaps.filter(s => s.exists()).map(s => [s.id, s.data() as ContactInfo]));
  }
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

  getOlderNews: (before) => newsPage(startAfter(before)),

  createNews: async newsData => {
    const ref = doc(collection(db, 'news'));
    const article = buildNews(newsData);
    const batch = writeBatch(db);
    batch.set(ref, article);
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
    if (isRegistrationOpen(event)) {
      queueNotification(batch, {
        title: `Sự kiện mới: ${event.title}`,
        message: `Đang mở đăng ký tham gia. Hạn chót: ${event.registrationDeadline.split('T')[0]}.`,
        type: 'EVENT',
      });
    }
    await batch.commit();
    invalidate('events', 'notifications');
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
      // Tickets are readable only by their owner and staff: a denied read of this id means it already exists
      const readRegistration = tx.get(regRef).catch(err => {
        if ((err as { code?: string }).code === 'permission-denied') {
          throw new Error(`MSSV ${mssv} đã đăng ký sự kiện này trước đó.`);
        }
        throw err;
      });
      const [eventSnap, regSnap] = await Promise.all([tx.get(eventRef), readRegistration]);
      if (!eventSnap.exists()) throw new Error('Sự kiện không tồn tại');
      const event = withId<StoredEvent>(eventSnap);
      if (!isRegistrationOpen(event)) throw new Error('Sự kiện hiện không mở đăng ký hoặc đã quá hạn đăng ký');
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
      tx.set(regRef, ticket);
      tx.set(doc(db, 'registrationContacts', regId), contact);
      tx.update(eventRef, { currentParticipants, status, lastRegistrationId: regId });
      // merge + arrayUnion: the index is never read here (students/{mssv} is readable only by its owner)
      tx.set(
        studentRef,
        { mssv, fullName: ticket.fullName, classGroup: ticket.classGroup, eventIds: arrayUnion(eventId), lastEventId: eventId },
        { merge: true }
      );

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
        subject: emailSubject(`Xác nhận điểm danh tham dự sự kiện: ${data.eventTitle}`),
        type: 'ATTENDANCE_SUCCESS',
        sentAt: checkedInAt,
        status: 'QUEUED',
        ticketCode: data.ticketCode,
        mssv: data.mssv,
        eventTitle: data.eventTitle,
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
    let snaps: DocumentSnapshot[];
    try {
      const studentSnap = mssvKey ? await getDoc(doc(db, 'students', mssvKey)) : null;
      const eventIds: string[] = studentSnap?.exists() ? studentSnap.data().eventIds ?? [] : [];
      snaps = await Promise.all(eventIds.map(id => getDoc(doc(db, 'registrations', `${id}_${mssvKey}`))));
    } catch (err) {
      if ((err as { code?: string }).code === 'permission-denied') throw new Error(NOT_YOUR_TICKETS);
      throw err;
    }
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
    const one = eventId && eventId !== 'ALL' ? eventId : undefined;
    const records = await cachedList(
      `registrations:${one ?? 'ALL'}`,
      async () => {
        const registrations = collection(db, 'registrations');
        const regSnap = await getDocs(one ? query(registrations, where('eventId', '==', one)) : registrations);
        const contacts = await loadContacts(one ? regSnap.docs.map(d => d.id) : undefined);
        return regSnap.docs
          .map(d => toRecord(d.id, d.data(), contacts.get(d.id)))
          .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
      },
      false,
      REGISTRATIONS_CACHE_MS
    );
    return filterRegistrations(records, undefined, search);
  },

  getStaffAccounts: async () =>
    (await getDocs(collection(db, 'admins'))).docs
      .map(d => ({ email: d.id, role: normalizeRole(d.data().role), updatedAt: d.data().updatedAt }) as StaffAccount)
      .sort((a, b) => a.email.localeCompare(b.email)),

  setStaffRole: async (email, role) => {
    if (!STAFF_ROLES.includes(role)) throw new Error('Vai trò không hợp lệ.');
    const account = { role, updatedAt: new Date().toISOString() };
    const id = normalizeStaffEmail(email);
    if (!isHcmutEmail(id)) throw new Error('Chỉ cấp quyền được cho tài khoản @hcmut.edu.vn.');
    const batch = writeBatch(db);
    batch.set(doc(db, 'admins', id), account);
    await batch.commit();
    return { email: id, ...account };
  },

  removeStaffAccount: async email => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'admins', email));
    await batch.commit();
  },

  getBCH: async () => (await cachedList('bch', loadBch, true)).map(({ order: _order, ...member }) => member),

  saveBchMember: async (input, id) => {
    const member = buildBch(input);
    const batch = writeBatch(db);
    if (id) {
      const ref = doc(db, 'bch', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Thành viên không còn tồn tại.');
      batch.set(ref, { ...member, order: snap.data().order ?? 0 });
      await batch.commit();
      invalidate('bch');
      return { id, ...member };
    }
    const existing = await loadBch();
    const ref = doc(collection(db, 'bch'));
    batch.set(ref, { ...member, order: nextOrder(existing) });
    await batch.commit();
    invalidate('bch');
    return { id: ref.id, ...member };
  },

  deleteBchMember: async id => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'bch', id));
    await batch.commit();
    invalidate('bch');
  },



  getNotifications: async () => {
    const readAt = readNotificationsReadAt();
    const stored = await cachedList(
      'notifications',
      async () =>
        (await getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(20)))).docs.map(d =>
          withId<StoredNotification & { id: string }>(d)
        ),
      true
    );
    return stored.map(({ createdAt, ...rest }) => ({ ...rest, timestamp: relativeTime(createdAt), read: createdAt <= readAt }));
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
    (await getDocs(query(collection(db, 'emailLogs'), orderBy('sentAt', 'desc'), limit(50)))).docs.map(d =>
      withId<EmailDispatchLog>(d)
    ),

  getMembers: async () =>
    MEMBERS_SHEET_URL
      ? (await callMembersSheet<{ members: MemberRecord[] }>({ action: 'list' })).members
      : (await getDocs(query(collection(db, 'members'), orderBy('mssv')))).docs.map(toMember),

  saveMember: async (input, previousId, unlinkAccount) => {
    if (MEMBERS_SHEET_URL) {
      // The script keeps the account link itself; buildMember only validates and normalises here
      const { member } = await callMembersSheet<{ member: MemberRecord }>({
        action: 'save',
        member: buildMember(input),
        previousId,
        unlinkAccount,
      });
      return member;
    }
    const previousSnap = previousId ? await getDoc(doc(db, 'members', previousId)) : null;
    const previous = previousSnap?.exists() ? toMember(previousSnap) : undefined;
    const { id, ...member } = buildMember(input, previous, unlinkAccount);
    if (id !== previousId && (await getDoc(doc(db, 'members', id))).exists()) {
      throw new Error(`MSSV ${member.mssv} đã có trong danh sách.`);
    }
    const batch = writeBatch(db);
    batch.set(doc(db, 'members', id), member);
    if (previousId && previousId !== id) batch.delete(doc(db, 'members', previousId));
    await batch.commit();
    return { id, ...member };
  },

  deleteMember: async memberId => {
    if (MEMBERS_SHEET_URL) {
      await callMembersSheet({ action: 'delete', id: memberId });
      return;
    }
    const batch = writeBatch(db);
    batch.delete(doc(db, 'members', memberId));
    await batch.commit();
  },

  getMyMemberProfile: async accountEmail => {
    const snap = await getDocs(
      query(collection(db, 'members'), where('accountEmail', '==', accountEmail.toLowerCase()), limit(1))
    );
    return snap.empty ? null : toMember(snap.docs[0]);
  },

  findMemberForLink: async (mssv, fullName, accountEmail) => {
    const id = memberIdOf(mssv);
    if (!/^[a-z0-9]{1,20}$/.test(id)) throw new Error('MSSV chỉ gồm chữ và số.');
    let snap: DocumentSnapshot;
    try {
      snap = await getDoc(doc(db, 'members', id));
    } catch (err) {
      // firestore.rules hide records already linked to another account
      if ((err as { code?: string }).code === 'permission-denied') throw new Error(LINKED_ELSEWHERE);
      throw err;
    }
    if (!snap.exists()) throw new Error(NOT_IN_LIST);
    const member = toMember(snap);
    if (member.accountEmail && member.accountEmail !== accountEmail.toLowerCase()) throw new Error(LINKED_ELSEWHERE);
    if (normalizeKey(member.fullName) !== normalizeKey(fullName)) {
      throw new Error('Họ tên không khớp với MSSV trong danh sách. Kiểm tra lại (có dấu, đầy đủ họ và tên).');
    }
    return member;
  },

  saveMyProfile: async (memberId, patch, accountEmail) => {
    const now = new Date().toISOString();
    const changes = {
      ...buildStudentProfile(patch),
      accountEmail: accountEmail.toLowerCase(),
      profileCompletedAt: now,
      updatedAt: now,
    };
    const batch = writeBatch(db);
    batch.update(doc(db, 'members', memberId), changes);
    await batch.commit();
  },
};

// Staff-only; the Apps Script checks the Firebase ID token and the admins/{email} role itself.
// text/plain keeps this a simple request, so the browser sends no CORS preflight to Apps Script.
async function callMembersSheet<T>(body: Record<string, unknown>): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Vui lòng đăng nhập lại để xem danh sách sinh viên.');
  const res = await fetch(MEMBERS_SHEET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, token }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as T;
}

const NOT_YOUR_TICKETS =
  'Bạn chỉ xem được vé của chính mình. Hãy đăng nhập bằng tài khoản @hcmut.edu.vn đã liên kết với MSSV này (mục Hồ sơ sinh viên).';

const NOT_IN_LIST = 'MSSV này chưa có trong danh sách sinh viên của khoa. Liên hệ Ban QLNS-CTSV để được bổ sung.';
const LINKED_ELSEWHERE =
  'MSSV này đã được liên kết với một tài khoản khác. Nếu đó không phải bạn, liên hệ Ban QLNS-CTSV để được hỗ trợ.';

// Records imported before the account link existed have no link fields
function toMember(snap: DocumentSnapshot | QueryDocumentSnapshot): MemberRecord {
  return { accountEmail: '', profileCompletedAt: '', ...withId<MemberRecord>(snap) };
}

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

