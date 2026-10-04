// Firebase web config is public by design (access is enforced by firestore.rules),
// so it is injected at build time from VITE_FIREBASE_* variables.
// Without it the app falls back to the Express API / localStorage backend.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const FIREBASE_ENABLED = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Local development against `firebase emulators:start` (ports from firebase.json)
export const USE_FIREBASE_EMULATOR = import.meta.env.VITE_FIREBASE_EMULATOR === 'true';
