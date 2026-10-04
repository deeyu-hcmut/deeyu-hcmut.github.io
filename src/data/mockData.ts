import { EventItem, NewsItem, BCHMember, RegistrationRecord, NotificationItem, FacultyStats } from '../types';

export const INITIAL_STATS: FacultyStats = {
  totalMembers: 0,
  totalEventsHeld: 0,
  totalNewsPublished: 0,
  totalRegistrations: 0,
  totalCheckIns: 0,
  topClubsCount: 0,
  academicCompetitions: 0,
};

export const INITIAL_NEWS: NewsItem[] = [];

export const INITIAL_EVENTS: EventItem[] = [];

export const INITIAL_BCH: BCHMember[] = [];

export const INITIAL_REGISTRATIONS: RegistrationRecord[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
