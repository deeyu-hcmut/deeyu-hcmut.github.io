export type Role = 'SUPER_ADMIN' | 'EDITOR' | 'EVENT_MANAGER' | 'STUDENT';

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

export interface BCHMember {
  id: string;
  name: string;
  position: string;
  organization: 'DOAN_KHOA' | 'HOI_SINH_VIEN' | 'DOI_CTV';
  email: string;
  phone: string;
  classGroup: string;
  avatarUrl: string;
  bio: string;
  department: string;
}

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
