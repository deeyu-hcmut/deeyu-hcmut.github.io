import { GoogleAuthProvider, connectAuthEmulator, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore/lite';
import { app, db } from './firebase';
import { USE_FIREBASE_EMULATOR } from './firebaseConfig';
import { Role } from '../types';
import { normalizeRole } from '../utils/roles';

export interface StaffSession {
  email: string;
  displayName: string | null;
  // STUDENT when the Google account is not listed in admins/{email}
  role: Role;
}

export const auth = getAuth(app);

if (USE_FIREBASE_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

async function resolveRole(email: string): Promise<Role> {
  try {
    const snap = await getDoc(doc(db, 'admins', email));
    return snap.exists() ? normalizeRole(snap.data().role) : 'STUDENT';
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
  const provider = new GoogleAuthProvider();
  // Always show the account chooser, so a student signed in with Gmail can switch to @hcmut.edu.vn
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export async function signOutStaff(): Promise<void> {
  await signOut(auth);
}
