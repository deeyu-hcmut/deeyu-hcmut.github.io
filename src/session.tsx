import { createContext, useContext } from 'react';
import { MemberRecord, Role } from './types';
import type { StaffSession } from './services/auth';

// Who is signed in, shared with deeply nested views (e.g. the event registration form)
export interface SessionInfo {
  session: StaffSession | null;
  role: Role;
  // The student record linked to this @hcmut.edu.vn account (null when not linked yet)
  myProfile: MemberRecord | null;
  signIn: () => void;
  // Opens the student profile form; undefined when the account is not an @hcmut.edu.vn student
  openProfile?: () => void;
}

export const SessionContext = createContext<SessionInfo>({
  session: null,
  role: 'STUDENT',
  myProfile: null,
  signIn: () => {},
});

export const useSessionInfo = () => useContext(SessionContext);
