import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { confirmAssignment, listMyServices } from '@/lib/my-schedule.api';
import { getApiError } from '@/lib/api';
import { groupByDate, nextShift, summarizeByMonth, type MyService } from '@/lib/my-schedule';
import { NextShiftCard } from '@/components/my-schedule/NextShiftCard';
import { YearlyMatrix } from '@/components/my-schedule/YearlyMatrix';
import { ReplaceRequestModal } from '@/components/my-schedule/ReplaceRequestModal';
import './MySchedule.css';
import { CalendarLinkCard } from '@/components/my-schedule/CalendarLinkCard';

export function MySchedule() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [replacing, setReplacing] = useState<MyService | null>(null);

  const query = useQuery({
    queryKey: ['my-services', year],
    queryFn: () => listMyServices(`${year}-01-01`, `${year}-12-31`),
    placeholderData: keepPreviousData,
  });

  const services = useMemo(() => query.data ?? [], [query.data]);
  const next = useMemo(() => nextShift(services), [services]);
  const porDia = useMemo(() => groupByDate(services), [services]);
  const meses = useMemo(() => summarizeByMonth(services, year), [services, year]);
  const totales = useMemo(
    () =>
      meses.reduce(
        (acc, m) => ({
          total: acc.total + m.total,
          confirmados: acc.confirmados + m.confirmed,
          pendientes: acc.pendientes + m.pending,
        }),
        { total: 0, confirmados: 0, pendientes: 0 },
      ),
    [meses],
  );

  const confirmMutation = useMutation({
    mutationFn: (assignmentId: string) => confirmAssignment(assignmentId),
    onSuccess: () => {
      toast.success('Asistencia confirmada');
      void queryClient.invalidateQueries({ queryKey: ['my-services'] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div className="ms-page">
      <header className="ms-header">
        <div>
          <p className="k-label">Mi espacio</p>
          <h1 className="ms-title">Mis turnos</h1>
          <p className="k-muted">Tus servicios asignados y su estado.</p>
        </div>
        <div className="ms-year" role="group" aria-label="Año">
          <button
            type="button"
            className="k-btn k-btn--ghost"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Año anterior"
          >
            ‹
          </button>
          <span className="ms-year__num" aria-live="polite">
            {year}
          </span>
          <button
            type="button"
            className="k-btn k-btn--ghost"
            onClick={() => setYear((y) => y + 1)}
            aria-label="Año siguiente"
          >
            ›
          </button>
        </div>
      </header>

      {query.isError && (
        <section className="k-panel ms-error" role="alert">
          <p>{getApiError(query.error)}</p>
          <button type="button" className="k-btn" onClick={() => void query.refetch()}>
            Reintentar
          </button>
        </section>
      )}

      {query.isPending && (
        <p className="k-muted" role="status">
          Cargando tus turnos…
        </p>
      )}

      {query.isSuccess && (
        <>
          <dl className="ms-stats">
            <Stat label={`Turnos en ${year}`} value={totales.total} />
            <Stat label="Confirmados" value={totales.confirmados} />
            <Stat label="Pendientes" value={totales.pendientes} />
          </dl>

          {next ? (
            <NextShiftCard
              service={next}
              onConfirm={(id) => confirmMutation.mutate(id)}
              confirming={confirmMutation.isPending}
              onReplace={() => setReplacing(next)}
            />
          ) : services.length > 0 ? (
            <p className="k-panel ms-empty">No tienes turnos próximos.</p>
          ) : null}

          {services.length === 0 ? (
            <p className="k-panel ms-empty">
              Aún no tienes asignaciones. Cuando tu líder te asigne a un servicio, aparecerá aquí.
            </p>
          ) : (
            <YearlyMatrix
              year={year}
              porDia={porDia}
              onReplace={setReplacing}
              onConfirm={(id) => confirmMutation.mutate(id)}
              confirmando={confirmMutation.isPending}
            />
          )}
        </>
      )}

      <CalendarLinkCard />

      {replacing && (
        <ReplaceRequestModal service={replacing} onClose={() => setReplacing(null)} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="ms-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}