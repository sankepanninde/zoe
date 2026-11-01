import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Disponibilidad, fechaISO, lunesDe, sumarDias } from '@/ui/Disponibilidad';
import {
  getMiDisponibilidad,
  fijarServicio,
  fijarDia,
  crearBloqueo,
  actualizarBloqueo,
  quitarBloqueo,
  type DisponibilidadRango,
  type EstadoDisponibilidad,
  type Repeticion,
} from '@/lib/availability.api';
import { getApiError } from '@/lib/api';

export function AvailabilityPage() {
  const qc = useQueryClient();
  const hoy = fechaISO(new Date());
  const anioNum = Number(hoy.slice(0, 4));
  const desdeAnio = `${anioNum}-01-01`;
  const hastaAnio = `${anioNum}-12-31`;

  const [semana, setSemana] = useState(() => lunesDe(new Date()));
  const desde = fechaISO(semana);
  const hasta = fechaISO(sumarDias(semana, 6));
  const key = ['availability', 'me', 'services', desde, hasta] as const;

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => getMiDisponibilidad(desde, hasta),
    placeholderData: keepPreviousData,
  });

  const { data: dataAnio } = useQuery({
    queryKey: ['availability', 'me', 'services', desdeAnio, hastaAnio] as const,
    queryFn: () => getMiDisponibilidad(desdeAnio, hastaAnio),
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ['availability', 'me'] });

  const servicio = useMutation({
    mutationFn: (v: { serviceId: string; estado: EstadoDisponibilidad | null }) =>
      fijarServicio(v.serviceId, v.estado === 'PENDIENTE' ? null : v.estado),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key });
      const previo = qc.getQueryData<DisponibilidadRango>(key);
      const nuevo: EstadoDisponibilidad = v.estado ?? 'PENDIENTE';
      const fuente = v.estado ? 'servicio' : 'pendiente';
      qc.setQueryData<DisponibilidadRango>(key, (d) =>
        d && {
          ...d,
          dias: d.dias.map((dia) => ({
            ...dia,
            servicios: dia.servicios.map((s) =>
              s.serviceId === v.serviceId ? { ...s, estado: nuevo, fuente } : s,
            ),
          })),
        },
      );
      return { previo };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previo) qc.setQueryData(key, ctx.previo);
      toast.error(getApiError(err));
    },
    onSettled: invalidar,
  });

  const marcarDia = useMutation({
    mutationFn: (v: { fecha: string; estado: 'DISPONIBLE' | 'NO_DISPONIBLE' }) => fijarDia(v.fecha, v.estado),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key });
      const previo = qc.getQueryData<DisponibilidadRango>(key);
      const nuevo: EstadoDisponibilidad = v.estado === 'NO_DISPONIBLE' ? 'NO_DISPONIBLE' : 'PENDIENTE';
      const fuente = nuevo === 'NO_DISPONIBLE' ? 'servicio' : 'pendiente';
      qc.setQueryData<DisponibilidadRango>(key, (d) =>
        d && {
          ...d,
          dias: d.dias.map((dia) =>
            dia.fecha !== v.fecha
              ? dia
              : { ...dia, estado: v.estado, servicios: dia.servicios.map((s) => ({ ...s, estado: nuevo, fuente })) },
          ),
        },
      );
      return { previo };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previo) qc.setQueryData(key, ctx.previo);
      toast.error(getApiError(err));
    },
    onSettled: invalidar,
  });

  // Provisional: un request por día. Cuando haya un endpoint de semana, se cambia aquí.
  const marcarSemana = useMutation({
    mutationFn: (v: { no: boolean; fechas: string[] }) =>
      Promise.all(v.fechas.map((f) => fijarDia(f, v.no ? 'NO_DISPONIBLE' : 'DISPONIBLE'))),
    onSettled: invalidar,
    onError: (err) => toast.error(getApiError(err)),
  });

  const bloquear = useMutation({
    mutationFn: (v: { desde: string; hasta: string; repite: Repeticion }) =>
      crearBloqueo(v.desde, v.hasta, v.repite),
    onSuccess: () => {
      toast.success('Fechas agregadas. No te asignarán turnos en ese rango.');
      invalidar();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const editarBloqueo = useMutation({
    mutationFn: (v: { id: string; desde: string; hasta: string; repite: Repeticion }) =>
      actualizarBloqueo(v.id, { desde: v.desde, hasta: v.hasta, repite: v.repite }),
    onSuccess: () => {
      toast.success('Fechas actualizadas.');
      invalidar();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const desbloquear = useMutation({
    mutationFn: (id: string) => quitarBloqueo(id),
    onSuccess: invalidar,
    onError: (err) => toast.error(getApiError(err)),
  });

  const ocupado =
    servicio.isPending ||
    marcarDia.isPending ||
    marcarSemana.isPending ||
    bloquear.isPending ||
    editarBloqueo.isPending ||
    desbloquear.isPending;

  return (
    <div className="k-page">
      {isError ? (
        <p className="k-error" role="alert">No pudimos cargar tu disponibilidad. Intenta de nuevo.</p>
      ) : isLoading || !data ? (
        <p className="k-muted">Cargando…</p>
      ) : (
        <Disponibilidad
          semana={semana}
          hoy={hoy}
          dias={data.dias}
          anio={dataAnio?.dias ?? []}
          bloqueos={data.bloqueos}
          ocupado={ocupado}
          onSemana={(n) => setSemana((s) => sumarDias(s, n * 7))}
          onServicio={(serviceId, estado) => servicio.mutate({ serviceId, estado })}
          onDia={(fecha, estado) => marcarDia.mutate({ fecha, estado })}
          onMarcarSemana={(no) =>
            marcarSemana.mutate({ no, fechas: data.dias.filter((d) => !d.bloqueado).map((d) => d.fecha) })
          }
          onBloquear={(d, h, repite) => bloquear.mutate({ desde: d, hasta: h, repite })}
          onEditarBloqueo={(id, d, h, repite) => editarBloqueo.mutate({ id, desde: d, hasta: h, repite })}
          onQuitarBloqueo={(id) => desbloquear.mutate(id)}
        />
      )}
    </div>
  );
}