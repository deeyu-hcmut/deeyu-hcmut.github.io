// Firebase web config is public by design: it ships in every visitor's bundle and
// access is enforced by firestore.rules. VITE_FIREBASE_* variables override it
// (e.g. to point a local build at the emulator's demo project).
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD8r0DtLY-0Mp4oAF7iLB-J9mtzSzbYdjo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'deeyu-hcmut.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'deeyu-hcmut',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:369477368212:web:ca1a18efb12fb45733f781',
};

// reCAPTCHA Enterprise (Fraud Defense) site key for Firebase App Check (public by design, like the apiKey). Empty = App Check off.
export const APP_CHECK_SITE_KEY = import.meta.env.VITE_APP_CHECK_SITE_KEY || '6LeZ2PQtAAAAACACyj5pUztCPCpI6DOXQKDldrgH';

// Apps Script web app of the student Google Sheet (tools/google-sheet-sync). When set, the admin
// "Sinh viên" tab reads and edits the list through it instead of Firestore (saves the daily read quota).
// Not a secret: the script only answers requests carrying a staff Firebase ID token.
// VITE_MEMBERS_SHEET_URL overrides it ("none" falls back to reading Firestore).
const membersSheetUrl =
  import.meta.env.VITE_MEMBERS_SHEET_URL ||
  'https://script.google.com/macros/s/AKfycbwcElJQDSL7LMzNUM5_colj4lEY4UT0Jjo-3FRhMisTpMMIFaO7oCsoB_h4Y3k8Qsk9OA/exec';
export const MEMBERS_SHEET_URL = membersSheetUrl === 'none' ? '' : membersSheetUrl;

// VITE_DEMO_MODE=true runs the old localStorage / Express demo without Firebase
export const FIREBASE_ENABLED = import.meta.env.VITE_DEMO_MODE !== 'true';

// Local development against `firebase emulators:start` (ports from firebase.json)
export const USE_FIREBASE_EMULATOR = import.meta.env.VITE_FIREBASE_EMULATOR === 'true';
