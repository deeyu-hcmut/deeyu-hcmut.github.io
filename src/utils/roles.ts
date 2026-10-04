import { Role } from '../types';

// Mirrors the role checks in /firestore.rules: the UI only hides what the rules deny anyway.
export const STAFF_ROLES: Role[] = ['SUPER_ADMIN', 'HC_TV', 'TT_SK', 'QLNS_CTSV'];

// Role names stored in admins/{email} before the 2026-10 reorganisation
const LEGACY_ROLES: Record<string, Role> = {
  EVENT_MANAGER: 'HC_TV',
  EDITOR: 'TT_SK',
};

export function normalizeRole(raw: unknown): Role {
  if (typeof raw !== 'string') return 'STUDENT';
  const role = (LEGACY_ROLES[raw] ?? raw) as Role;
  return STAFF_ROLES.includes(role) ? role : 'STUDENT';
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  HC_TV: 'Ban HC-TV',
  TT_SK: 'Ban TT-SK',
  QLNS_CTSV: 'Ban QLNS-CTSV',
  STUDENT: 'Sinh viên',
};

export const isStaff = (role: Role) => STAFF_ROLES.includes(role);

// Every staff role may run the QR check-in station
export const canCheckIn = isStaff;

export const canManageEvents = (role: Role) => role === 'SUPER_ADMIN' || role === 'HC_TV' || role === 'TT_SK';

export const canEditNews = (role: Role) => role === 'SUPER_ADMIN' || role === 'TT_SK';

export const canManageMembers = (role: Role) => role === 'SUPER_ADMIN' || role === 'QLNS_CTSV';
