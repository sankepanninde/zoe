import { ETIQUETA_ESTADO, formatFechaLarga, type MyService } from '@/lib/my-schedule';

interface Props {
  service: MyService;
  onConfirm: (assignmentId: string) => void;
  confirming: boolean;
  onReplace: () => void;
}

export function NextShiftCard({ service, onConfirm, confirming, onReplace }: Props) {
  const { assignment } = service;
  const confirmado = assignment.status === 'CONFIRMED';

  return (
    <section className="k-panel ms-next" aria-labelledby="ms-next-titulo">
      <span className="k-label" id="ms-next-titulo">
        Próximo turno
      </span>
      <p className="ms-next__fecha">{formatFechaLarga(service.date)}</p>
      <p className="k-muted">
        Culto {service.startTime}
        {service.soundCheckTime ? ` · prueba de sonido ${service.soundCheckTime}` : ''}
      </p>
      <p className="k-muted">
        {service.serviceType} · {service.ministry} · {assignment.position}
      </p>
      <div className="ms-next__acciones">
        {confirmado ? (
          <span className="ms-badge ms-badge--confirmed">{ETIQUETA_ESTADO[assignment.status]}</span>
        ) : (
          <button
            type="button"
            className="k-btn"
            onClick={() => onConfirm(assignment.id)}
            disabled={confirming}
          >
            {confirming ? 'Confirmando…' : 'Confirmar asistencia'}
          </button>
        )}
        <button type="button" className="k-btn k-btn--ghost" onClick={onReplace}>
          Solicitar reemplazo
        </button>
      </div>
    </section>
  );
}