// Security rules tests, run against the Firestore emulator:
//   npm install --no-save @firebase/rules-unit-testing@5
//   npx -y firebase-tools@14 emulators:exec --only firestore "node --test tests/firestore.rules.test.mjs"
// (the emulator needs Java 21+). CI runs the same thing in .github/workflows/deploy.yml.
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, increment, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

let env;

const hcmut = email => ({ email, email_verified: true });
const as = email => env.authenticatedContext(email, hcmut(email)).firestore();
const anon = () => env.unauthenticatedContext().firestore();

const STUDENT = 'an.nguyen@hcmut.edu.vn';
const OTHER = 'binh.le@hcmut.edu.vn';
const QLNS = 'qlns@hcmut.edu.vn';
const TTSK = 'ttsk@hcmut.edu.vn';
const SUPER = 'super@hcmut.edu.vn';

const member = (mssv, extra = {}) => ({
  mssv, fullName: 'Nguyễn Văn An', gender: '', dateOfBirth: '', cohort: 'K2023', classGroup: '', email: '', phone: '',
  isUnionMember: false, unionJoinDate: '', isAssociationMember: false, status: 'STUDYING', note: '',
  updatedAt: '2026-01-01T00:00:00.000Z', accountEmail: '', profileCompletedAt: '', ...extra,
});

const event = { title: 'Ngày hội', status: 'REGISTRATION_OPEN', currentParticipants: 0, maxParticipants: 2, checkedInCount: 0 };

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-deeyu-rules',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});

after(() => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'admins', QLNS), { role: 'QLNS_CTSV' });
    await setDoc(doc(db, 'admins', TTSK), { role: 'TT_SK' });
    await setDoc(doc(db, 'admins', SUPER), { role: 'SUPER_ADMIN' });
    await setDoc(doc(db, 'members', '2310001'), member('2310001', { accountEmail: STUDENT }));
    await setDoc(doc(db, 'members', '2310002'), member('2310002', { accountEmail: OTHER }));
    await setDoc(doc(db, 'events', 'e1'), event);
  });
});

// The four writes registerEvent makes in one transaction
function registration(db, mssv) {
  const regId = `e1_${mssv}`;
  const batch = writeBatch(db);
  batch.set(doc(db, 'registrations', regId), {
    eventId: 'e1', eventTitle: 'Ngày hội', fullName: 'Nguyễn Văn An', mssv, mssvKey: mssv, classGroup: 'DD23KSTN',
    faculty: 'Khoa Điện - Điện tử', registeredAt: '2026-11-17T00:00:00.000Z', ticketCode: 'EVT-ABCDEF', checkedIn: false,
  });
  batch.set(doc(db, 'registrationContacts', regId), { email: 'a@b.vn', phone: '0900000000', note: '' });
  batch.update(doc(db, 'events', 'e1'), { currentParticipants: 1, status: 'REGISTRATION_OPEN', lastRegistrationId: regId });
  batch.set(doc(db, 'students', mssv), { mssv, fullName: 'Nguyễn Văn An', classGroup: 'DD23KSTN', eventIds: ['e1'], lastEventId: 'e1' });
  return batch.commit();
}

describe('public content', () => {
  test('anyone reads events and news', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'events', 'e1')));
    await assertSucceeds(getDoc(doc(anon(), 'news', 'n1')));
  });

  test('students cannot write news; TT-SK can', async () => {
    await assertFails(setDoc(doc(as(STUDENT), 'news', 'n1'), { title: 'x' }));
    await assertSucceeds(setDoc(doc(as(TTSK), 'news', 'n1'), { title: 'x' }));
  });

  test('a non-@hcmut.edu.vn account is not signed in', async () => {
    const outsider = env.authenticatedContext('x', { email: 'x@gmail.com', email_verified: true }).firestore();
    await assertFails(registration(outsider, '2310001'));
  });
});

describe('event registration', () => {
  test('a student registers their own linked MSSV', async () => {
    await assertSucceeds(registration(as(STUDENT), '2310001'));
  });

  test("a student cannot register someone else's MSSV", async () => {
    await assertFails(registration(as(STUDENT), '2310002'));
  });

  test('tickets are readable by their owner and staff only', async () => {
    await registration(as(STUDENT), '2310001');
    await assertSucceeds(getDoc(doc(as(STUDENT), 'registrations', 'e1_2310001')));
    await assertSucceeds(getDoc(doc(as(TTSK), 'registrations', 'e1_2310001')));
    await assertFails(getDoc(doc(as(OTHER), 'registrations', 'e1_2310001')));
    await assertFails(getDoc(doc(as(OTHER), 'registrationContacts', 'e1_2310001')));
  });

  test('a ticket is checked in once', async () => {
    await registration(as(STUDENT), '2310001');
    const checkIn = db => {
      const batch = writeBatch(db);
      batch.update(doc(db, 'registrations', 'e1_2310001'), { checkedIn: true, checkedInAt: '2026-11-17T08:00:00.000Z' });
      batch.update(doc(db, 'events', 'e1'), { checkedInCount: increment(1) });
      return batch.commit();
    };
    await assertFails(checkIn(as(STUDENT)));
    await assertSucceeds(checkIn(as(QLNS)));
    await assertFails(checkIn(as(QLNS)));
  });
});

describe('privacy consent log', () => {
  const consent = { mssv: '2310001', version: '1.1.0', agreedAt: '2026-11-17T00:00:00.000Z' };

  test('a student logs their own consent once and reads it back', async () => {
    const ref = doc(as(STUDENT), 'consents', STUDENT, 'versions', '1.1.0');
    await assertSucceeds(getDoc(ref)); // missing doc: hasConsent() must be allowed to check
    await assertSucceeds(setDoc(ref, consent));
    await assertSucceeds(getDoc(ref));
    await assertFails(setDoc(ref, { ...consent, agreedAt: '2027-01-01T00:00:00.000Z' }));
    await assertFails(deleteDoc(ref));
  });

  test("nobody logs consent for another account or a different version", async () => {
    await assertFails(setDoc(doc(as(OTHER), 'consents', STUDENT, 'versions', '1.1.0'), consent));
    await assertFails(setDoc(doc(as(STUDENT), 'consents', STUDENT, 'versions', '9.9.9'), consent));
    await assertFails(getDoc(doc(as(OTHER), 'consents', STUDENT, 'versions', '1.1.0')));
  });
});

describe('audit log', () => {
  const entry = by => ({ action: 'DELETE_NEWS', target: 'n1', by, at: serverTimestamp() });

  test('staff append entries under their own name, with the server time', async () => {
    await assertSucceeds(setDoc(doc(as(TTSK), 'auditLogs', 'l1'), entry(TTSK)));
    await assertFails(setDoc(doc(as(TTSK), 'auditLogs', 'l2'), entry(SUPER)));
    await assertFails(setDoc(doc(as(TTSK), 'auditLogs', 'l3'), { ...entry(TTSK), at: '2020-01-01' }));
    await assertFails(setDoc(doc(as(STUDENT), 'auditLogs', 'l4'), entry(STUDENT)));
  });

  test('entries cannot be changed or removed, and only a Super Admin reads them', async () => {
    await setDoc(doc(as(TTSK), 'auditLogs', 'l1'), entry(TTSK));
    await assertFails(updateDoc(doc(as(SUPER), 'auditLogs', 'l1'), { target: 'x' }));
    await assertFails(deleteDoc(doc(as(SUPER), 'auditLogs', 'l1')));
    await assertFails(getDoc(doc(as(TTSK), 'auditLogs', 'l1')));
    await assertSucceeds(getDoc(doc(as(SUPER), 'auditLogs', 'l1')));
  });
});

describe('erasure and staff roles', () => {
  test('Ban QLNS-CTSV erases every record of an MSSV', async () => {
    await registration(as(STUDENT), '2310001');
    await setDoc(doc(as(STUDENT), 'consents', STUDENT, 'versions', '1.1.0'), { mssv: '2310001', version: '1.1.0', agreedAt: 'x' });
    const db = as(QLNS);
    for (const path of ['registrations/e1_2310001', 'registrationContacts/e1_2310001', 'students/2310001',
      `consents/${STUDENT}/versions/1.1.0`, 'members/2310001']) {
      await assertSucceeds(deleteDoc(doc(db, path)));
    }
  });

  test('students cannot erase records', async () => {
    await registration(as(STUDENT), '2310001');
    await assertFails(deleteDoc(doc(as(STUDENT), 'registrations', 'e1_2310001')));
    await assertFails(deleteDoc(doc(as(STUDENT), 'members', '2310001')));
  });

  test('only a Super Admin grants roles, never to themselves', async () => {
    await assertFails(setDoc(doc(as(TTSK), 'admins', OTHER), { role: 'SUPER_ADMIN' }));
    await assertSucceeds(setDoc(doc(as(SUPER), 'admins', OTHER), { role: 'TT_SK', updatedAt: 'x' }));
    await assertFails(updateDoc(doc(as(SUPER), 'admins', SUPER), { role: 'TT_SK' }));
  });
});
