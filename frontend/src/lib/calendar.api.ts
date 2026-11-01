import { api } from '@/lib/api';

export interface CalendarLink {
  url: string;
  createdAt: string;
}

export const getCalendarLink = () =>
  api.get<CalendarLink>('/calendar/me/link').then((r) => r.data);

export const regenerateCalendarLink = () =>
  api.post<CalendarLink>('/calendar/me/link/regenerate').then((r) => r.data);