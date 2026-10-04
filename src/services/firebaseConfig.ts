// Firebase web config is public by design: it ships in every visitor's bundle and
// access is enforced by firestore.rules. VITE_FIREBASE_* variables override it
// (e.g. to point a local build at the emulator's demo project).
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD8r0DtLY-0Mp4oAF7iLB-J9mtzSzbYdjo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'deeyu-hcmut.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'deeyu-hcmut',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:369477368212:web:ca1a18efb12fb45733f781',
};

// VITE_DEMO_MODE=true runs the old localStorage / Express demo without Firebase
export const FIREBASE_ENABLED = import.meta.env.VITE_DEMO_MODE !== 'true';

// Local development against `firebase emulators:start` (ports from firebase.json)
export const USE_FIREBASE_EMULATOR = import.meta.env.VITE_FIREBASE_EMULATOR === 'true';
