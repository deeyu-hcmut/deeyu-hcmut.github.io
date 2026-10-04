import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore/lite';
import { firebaseConfig, USE_FIREBASE_EMULATOR } from './firebaseConfig';

export const app = initializeApp(firebaseConfig);

// The Lite SDK (no realtime listeners / offline cache) is a fraction of the full
// Firestore bundle and covers everything the portal does. It picks up the signed-in
// user's token automatically once firebase/auth is initialised on the same app.
export const db = getFirestore(app);

if (USE_FIREBASE_EMULATOR) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
