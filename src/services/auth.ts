import { GoogleAuthProvider, connectAuthEmulator, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore/lite';
import { app, db } from './firebase';
import { USE_FIREBASE_EMULATOR } from './firebaseConfig';
import { Role } from '../types';

export interface StaffSession {
  email: string;
  displayName: string | null;
  // STUDENT when the Google account is not listed in admins/{email}
  role: Role;
}

const STAFF_ROLES: Role[] = ['SUPER_ADMIN', 'EDITOR', 'EVENT_MANAGER'];

export const auth = getAuth(app);

if (USE_FIREBASE_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

async function resolveRole(email: string): Promise<Role> {
  try {
    const snap = await getDoc(doc(db, 'admins', email));
    const role = snap.exists() ? (snap.data().role as Role) : 'STUDENT';
    return STAFF_ROLES.includes(role) ? role : 'STUDENT';
  } catch {
    return 'STUDENT';
  }
}

export function watchSession(onChange: (session: StaffSession | null) => void): () => void {
  return onAuthStateChanged(auth, async user => {
    if (!user?.email) {
      onChange(null);
      return;
    }
    onChange({ email: user.email, displayName: user.displayName, role: await resolveRole(user.email) });
  });
}

export async function signInStaff(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOutStaff(): Promise<void> {
  await signOut(auth);
}
