import { api } from './api';

// ===========================================
// TIPOS
// ===========================================

export interface Availability {
  id: string;
  date: string;
  available: boolean;
  reason: string | null;
}

export type DayStatus = 'available' | 'unavailable' | 'unmarked';

// ===========================================
// MIS DÍAS
// ===========================================

export async function listMyAvailability(
  year: number,
  month: number
): Promise<Availability[]> {
  const { data } = await api.get<{ availability: Availability[] }>(
    '/availability/me',
    { params: { year, month } }
  );
  return data.availability;
}

export async function toggleDay(payload: {
  date: string;
  available: boolean;
  reason?: string | null;
}): Promise<Availability> {
  const { data } = await api.post<{ availability: Availability }>(
    '/availability/me/toggle',
    payload
  );
  return data.availability;
}

export async function clearMonth(year: number, month: number): Promise<void> {
  await api.delete('/availability/me/month', {
    params: { year, month },
  });
}

// ===========================================
// DISPONIBILIDAD DE OTRO USUARIO (líder)
// ===========================================

export async function listUserAvailability(
  userId: string,
  year: number,
  month: number
): Promise<Availability[]> {
  const { data } = await api.get<{ availability: Availability[] }>(
    `/availability/user/${userId}`,
    { params: { year, month } }
  );
  return data.availability;
}