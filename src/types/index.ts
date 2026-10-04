// HC_TV replaces Ban CTXH (EVENT_MANAGER), TT_SK replaces Ban Truyền thông (EDITOR),
// QLNS_CTSV keeps the student / Đoàn viên / Hội viên records. See src/utils/roles.ts.
export type Role = 'SUPER_ADMIN' | 'HC_TV' | 'TT_SK' | 'QLNS_CTSV' | 'STUDENT';

export interface UserProfile {
  id: string;
  name: string;
  mssv?: string;
  email: string;
  phone?: string;
  role: Role;
  avatarUrl: string;
  classGroup?: string; // e.g. D21_DTVT01, D22_DKTD02
  academicYear?: string;
}

export type NewsCategory = 
  | 'HOAT_DONG_KHOA' 
  | 'PHONG_TRAO_SINH_VIEN' 
  | 'THONG_BAO_HOC_THUAT' 
  | 'CUOC_THI_NCKH'
  | 'HOC_BONG_DOANH_NGHIEP';

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: NewsCategory;
  categoryName: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  coverImage: string;
  tags: string[];
  views: number;
  featured?: boolean;
}

export type EventStatus = 'UPCOMING' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'COMPLETED';
export type EventType = 'ACADEMIC_CONTEST' | 'VOLUNTEER' | 'SPORTS_CULTURE' | 'SEMINAR_WORKSHOP' | 'UNION_CONFERENCE';

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  type: EventType;
  typeName: string;
  status: EventStatus;
  location: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  bannerUrl: string;
  organizer: string;
  contactEmail: string;
  requirements: string[];
  isMandatoryCheckIn: boolean;
}

export interface RegistrationRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  fullName: string;
  mssv: string;
  email: string;
  phone: string;
  classGroup: string;
  faculty: string;
  registeredAt: string;
  ticketCode: string;
  qrCodeUrl?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  note?: string;
}

export type BchOrganization = 'DOAN_KHOA' | 'HOI_SINH_VIEN' | 'DOI_CTV';

// Shown publicly on the "Cơ cấu Tổ chức" page, so no phone number is stored
export interface BCHMember {
  id: string;
  name: string;
  position: string;
  organization: BchOrganization;
  email: string;
  classGroup: string;
  avatarUrl: string; // https URL or a small JPEG data URL uploaded from the admin page
  bio: string;
  department: string;
}

// admins/{email}: a Google account granted a staff role by the Super Admin
export interface StaffAccount {
  email: string;
  role: Role;
  updatedAt?: string;
}

export type MemberGender = 'NAM' | 'NU' | 'KHAC' | '';
export type MemberStatus = 'STUDYING' | 'RESERVED' | 'GRADUATED' | 'DROPPED';

// Student / Đoàn viên / Hội viên record kept by Ban QLNS-CTSV; id is the lower-cased MSSV
export interface MemberRecord {
  id: string;
  mssv: string;
  fullName: string;
  gender: MemberGender;
  dateOfBirth: string; // YYYY-MM-DD or ''
  cohort: string; // Khóa, e.g. K2022
  classGroup: string;
  email: string;
  phone: string;
  isUnionMember: boolean; // Đoàn viên
  unionJoinDate: string; // YYYY-MM-DD or ''
  isAssociationMember: boolean; // Hội viên
  status: MemberStatus;
  note: string;
  updatedAt: string;
  // @hcmut.edu.vn Google account the student linked on first sign-in ('' = not linked yet)
  accountEmail: string;
  // When the student finished the first sign-in profile form ('' = not yet)
  profileCompletedAt: string;
}

// Fields a student fills in (or corrects) on their first sign-in
export type StudentProfilePatch = Pick<
  MemberRecord,
  'gender' | 'dateOfBirth' | 'classGroup' | 'email' | 'phone' | 'isUnionMember' | 'unionJoinDate' | 'isAssociationMember'
>;

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'EVENT' | 'NEWS' | 'REMINDER' | 'URGENT';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface EmailDispatchLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  type: 'REGISTRATION_CONFIRMATION' | 'REMINDER_24H' | 'ATTENDANCE_SUCCESS' | 'GENERAL_ANNOUNCEMENT';
  sentAt: string;
  status: 'DELIVERED' | 'SENT' | 'QUEUED';
  ticketCode?: string;
}

export interface FacultyStats {
  totalMembers: number;
  totalEventsHeld: number;
  totalNewsPublished: number;
  totalRegistrations: number;
  totalCheckIns: number;
  topClubsCount: number;
  academicCompetitions: number;
}
