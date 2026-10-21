import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Disponibilidad, fechaISO, lunesDe, sumarDias } from '@/ui/Disponibilidad';
import {
  getMiDisponibilidad,
  fijarServicio,
  fijarDia,
  crearBloqueo,
  quitarBloqueo,
  type DisponibilidadRango,
  type EstadoDisponibilidad,
} from '@/lib/availability.api';
import { getApiError } from '@/lib/api';

export function AvailabilityPage() {
  const qc = useQueryClient();
  const hoy = fechaISO(new Date());
  const [semana, setSemana] = useState(() => lunesDe(new Date()));
  const desde = fechaISO(semana);
  const hasta = fechaISO(sumarDias(semana, 6));
  const key = ['availability', 'me', 'services', desde, hasta] as const;

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => getMiDisponibilidad(desde, hasta),
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ['availability', 'me'] });

  const servicio = useMutation({
    mutationFn: (v: { serviceId: string; estado: EstadoDisponibilidad | null }) =>
      fijarServicio(v.serviceId, v.estado),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key });
      const previo = qc.getQueryData<DisponibilidadRango>(key);
      const nuevoEstado = v.estado ?? ('PENDIENTE' as const);
      const nuevaFuente = v.estado ? ('servicio' as const) : ('pendiente' as const);
      qc.setQueryData<DisponibilidadRango>(key, (d) =>
        d && {
          ...d,
          dias: d.dias.map((dia) => ({
            ...dia,
            servicios: dia.servicios.map((s) =>
              s.serviceId === v.serviceId ? { ...s, estado: nuevoEstado, fuente: nuevaFuente } : s,
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

  const dia = useMutation({
    mutationFn: (v: { fecha: string; estado: 'DISPONIBLE' | 'NO_DISPONIBLE' }) => fijarDia(v.fecha, v.estado),
    onSuccess: invalidar,
    onError: (err) => toast.error(getApiError(err)),
  });

  const bloquear = useMutation({
    mutationFn: (v: { desde: string; hasta: string }) => crearBloqueo(v.desde, v.hasta),
    onSuccess: () => {
      toast.success('Fechas bloqueadas. No te asignarán turnos en ese rango.');
      invalidar();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const desbloquear = useMutation({
    mutationFn: (id: string) => quitarBloqueo(id),
    onSuccess: invalidar,
    onError: (err) => toast.error(getApiError(err)),
  });

  const ocupado = dia.isPending || bloquear.isPending || desbloquear.isPending;

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
          bloqueos={data.bloqueos}
          ocupado={ocupado}
          onSemana={(n) => setSemana((s) => sumarDias(s, n * 7))}
          onServicio={(serviceId, estado) => servicio.mutate({ serviceId, estado })}
          onDia={(fecha, estado) => dia.mutate({ fecha, estado })}
          onBloquear={(d, h) => bloquear.mutate({ desde: d, hasta: h })}
          onQuitarBloqueo={(id) => desbloquear.mutate(id)}
        />
      )}
    </div>
  );
}