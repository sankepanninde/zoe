import { api } from '@/lib/api';

export type EstadoDia = 'DISPONIBLE' | 'NO_DISPONIBLE';
export type EstadoDisponibilidad = EstadoDia | 'PENDIENTE';
export type Repeticion = 'ninguna' | 'anual' | 'mensual';
export type FuenteEstado = 'bloqueo' | 'servicio' | 'dia' | 'pendiente';

export interface ServicioDisponibilidad {
  serviceId: string;
  nombre: string;
  tipo: string;
  ministerio: string | null;
  horaInicio: string;
  horaFin: string;
  estado: EstadoDisponibilidad;
  fuente: FuenteEstado;
}

export interface DiaDisponibilidad {
  fecha: string; // YYYY-MM-DD
  bloqueado: boolean;
  estado: EstadoDia | null;
  servicios: ServicioDisponibilidad[];
}

export interface BloqueoDisponibilidad {
  id: string;
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  repite: Repeticion;
  motivo: string | null;
}

export interface DisponibilidadRango {
  dias: DiaDisponibilidad[];
  bloqueos: BloqueoDisponibilidad[];
}

export interface CambiosBloqueo {
  desde?: string;
  hasta?: string;
  repite?: Repeticion;
  motivo?: string;
}

/** Forma cruda que devuelven POST y PATCH de bloqueos. */
interface BloqueoRaw {
  id: string;
  desde: string;
  hasta: string;
  repite: string;
  motivo: string | null;
}

/**
 * Lleva el bloqueo a la misma forma que el GET.
 * El backend responde con fechas ISO a las 12:00 UTC, que en Bogotá
 * siguen siendo el mismo día, así que tomar los primeros 10 caracteres es seguro.
 */
export function normalizarBloqueo(raw: BloqueoRaw): BloqueoDisponibilidad {
  return {
    id: raw.id,
    desde: raw.desde.slice(0, 10),
    hasta: raw.hasta.slice(0, 10),
    repite: raw.repite.toLowerCase() as Repeticion,
    motivo: raw.motivo,
  };
}

/** GET /availability/me/services: días y bloqueos del rango. */
export const getMiDisponibilidad = (desde: string, hasta: string) =>
  api
    .get<DisponibilidadRango>('/availability/me/services', { params: { desde, hasta } })
    .then((r) => r.data);

/** PUT /availability/me/days/:fecha. Responde 204: invalida la consulta después. */
export const fijarDia = (fecha: string, estado: EstadoDia) =>
  api.put(`/availability/me/days/${fecha}`, { estado });

/** PUT /availability/me/services/:serviceId. null borra la decisión y vuelve a pendiente. */
export const fijarServicio = (serviceId: string, estado: EstadoDia | null) =>
  api.put(`/availability/me/services/${serviceId}`, { estado });

export const crearBloqueo = (
  desde: string,
  hasta: string,
  repite: Repeticion = 'ninguna',
  motivo?: string,
) =>
  api
    .post<BloqueoRaw>('/availability/me/blocks', { desde, hasta, repite, motivo })
    .then((r) => normalizarBloqueo(r.data));

export const actualizarBloqueo = (id: string, cambios: CambiosBloqueo) =>
  api
    .patch<BloqueoRaw>(`/availability/me/blocks/${id}`, cambios)
    .then((r) => normalizarBloqueo(r.data));

export const quitarBloqueo = (id: string) =>
  api.delete(`/availability/me/blocks/${id}`);