import { GoogleAuthProvider, connectAuthEmulator, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore/lite';
import { app, db } from './firebase';
import { USE_FIREBASE_EMULATOR } from './firebaseConfig';
import { Role } from '../types';
import { normalizeRole } from '../utils/roles';
import { isHcmutEmail } from './shared';

export interface StaffSession {
  email: string;
  displayName: string | null;
  // STUDENT when the Google account is not listed in admins/{email}
  role: Role;
  // The role could not be read (e.g. Firestore's daily free quota is used up); `role` is then STUDENT
  roleCheckFailed?: boolean;
}

export const auth = getAuth(app);

if (USE_FIREBASE_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

async function resolveRole(email: string): Promise<{ role: Role; roleCheckFailed?: boolean }> {
  try {
    const snap = await getDoc(doc(db, 'admins', email));
    return { role: snap.exists() ? normalizeRole(snap.data().role) : 'STUDENT' };
  } catch (err) {
    console.error('Could not read the staff role', err);
    return { role: 'STUDENT', roleCheckFailed: true };
  }
}

// `rejected` is set when a sign-in was refused because the account is not an @hcmut.edu.vn one
export function watchSession(onChange: (session: StaffSession | null, rejected?: boolean) => void): () => void {
  return onAuthStateChanged(auth, async user => {
    if (!user?.email) {
      onChange(null);
      return;
    }
    const resolved = await resolveRole(user.email);
    // Only @hcmut.edu.vn accounts may sign in. The one exception is an account listed in admins/{email}, so a
    // Super Admin whose Google account is on another domain can never be locked out (firestore.rules mirrors this).
    if (!isHcmutEmail(user.email) && resolved.role === 'STUDENT') {
      onChange(null, true);
      await signOut(auth);
      return;
    }
    onChange({ email: user.email, displayName: user.displayName, ...resolved });
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
