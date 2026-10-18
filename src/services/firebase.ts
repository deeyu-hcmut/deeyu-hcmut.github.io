import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore/lite';
import { APP_CHECK_SITE_KEY, firebaseConfig, USE_FIREBASE_EMULATOR } from './firebaseConfig';

export const app = initializeApp(firebaseConfig);

// App Check proves a request comes from this site, so a script that only has the public API key cannot
// drain the free daily read quota once enforcement is switched on in the Firebase console.
// Set up before Firestore so the very first read already carries a token.
if (APP_CHECK_SITE_KEY && !USE_FIREBASE_EMULATOR) {
  // On localhost the console must list the debug token printed in the browser console
  if (import.meta.env.DEV) (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
}

// The Lite SDK (no realtime listeners / offline cache) is a fraction of the full
// Firestore bundle and covers everything the portal does. It picks up the signed-in
// user's token automatically once firebase/auth is initialised on the same app.
export const db = getFirestore(app);

if (USE_FIREBASE_EMULATOR) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
