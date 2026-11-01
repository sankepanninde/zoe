import { api } from '@/lib/api';
import type { MyService } from '@/lib/my-schedule';

/** GET /api/me/services: asignaciones propias del usuario en el rango. */
export const listMyServices = (desde: string, hasta: string) =>
  api.get<MyService[]>('/me/services', { params: { desde, hasta } }).then((r) => r.data);

/** PATCH /api/me/assignments/:id */
export const confirmAssignment = (assignmentId: string) =>
  api.patch(`/me/assignments/${assignmentId}`, { status: 'CONFIRMED' }).then((r) => r.data);

/** POST /api/me/assignments/:id/replacement-requests */
export const requestReplacement = (assignmentId: string, reason: string) =>
  api
    .post(`/me/assignments/${assignmentId}/replacement-requests`, { reason })
    .then((r) => r.data);