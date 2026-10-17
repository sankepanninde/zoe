import { api } from '@/lib/api';

export type EstadoDisponibilidad = 'DISPONIBLE' | 'NO_DISPONIBLE' | 'PENDIENTE';

export interface ServicioDisponibilidad {
  serviceId: string;
  nombre: string;
  ministerio: string | null;
  horaInicio: string;
  horaFin: string;
  estado: EstadoDisponibilidad;
  fuente: 'servicio' | 'bloqueo' | 'pendiente';
}

export interface DiaDisponibilidad {
  fecha: string;
  bloqueado: boolean;
  servicios: ServicioDisponibilidad[];
}

export interface BloqueoDisponibilidad {
  id: string;
  desde: string;
  hasta: string;
  motivo: string | null;
}

export interface DisponibilidadRango {
  dias: DiaDisponibilidad[];
  bloqueos: BloqueoDisponibilidad[];
}

export const getMiDisponibilidad = (desde: string, hasta: string) =>
  api.get<DisponibilidadRango>('/availability/me/services', { params: { desde, hasta } }).then((r) => r.data);

export const fijarServicio = (serviceId: string, estado: EstadoDisponibilidad | null) =>
  api.put(`/availability/me/services/${serviceId}`, { estado }).then((r) => r.data);

export const fijarDia = (fecha: string, estado: 'DISPONIBLE' | 'NO_DISPONIBLE') =>
  api.put(`/availability/me/days/${fecha}`, { estado }).then((r) => r.data);

export const crearBloqueo = (desde: string, hasta: string, motivo?: string) =>
  api.post('/availability/me/blocks', { desde, hasta, motivo }).then((r) => r.data);

export const quitarBloqueo = (id: string) =>
  api.delete(`/availability/me/blocks/${id}`).then((r) => r.data);