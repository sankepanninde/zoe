import { useEffect, useId, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { requestReplacement } from '@/lib/my-schedule.api';
import { getApiError } from '@/lib/api';
import { formatFechaLarga, type MyService } from '@/lib/my-schedule';

const MOTIVOS = [
  'Viaje fuera de la ciudad',
  'Compromiso familiar',
  'Motivo de salud',
  'Compromiso laboral',
];
const OTRO = 'Otro';
const MAX_CARACTERES = 500;

interface Props {
  service: MyService;
  onClose: () => void;
}

export function ReplaceRequestModal({ service, onClose }: Props) {
  const titleId = useId();
  const [motivo, setMotivo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (reason: string) => requestReplacement(service.assignment.id, reason),
    onSuccess: () => {
      toast.success('Solicitud enviada al líder de tu ministerio');
      onClose();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const ocupado = mutation.isPending;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ocupado) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ocupado, onClose]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const reason = (motivo === OTRO ? detalle : motivo).trim();
    if (!reason) {
      setError('Selecciona un motivo o descríbelo.');
      return;
    }
    if (reason.length > MAX_CARACTERES) {
      setError(`Máximo ${MAX_CARACTERES} caracteres.`);
      return;
    }
    setError(null);
    mutation.mutate(reason);
  };

  return (
    <div
      className="ms-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !ocupado) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="k-panel ms-modal">
        <h2 id={titleId} className="ms-modal__title">
          Solicitar reemplazo
        </h2>
        <p className="k-muted">
          {formatFechaLarga(service.date)} · {service.startTime} · {service.assignment.position}
        </p>

        <form onSubmit={submit} noValidate>
          <fieldset className="ms-radios" disabled={ocupado}>
            <legend className="k-label">Motivo</legend>
            {[...MOTIVOS, OTRO].map((m) => (
              <label key={m}>
                <input
                  type="radio"
                  name="motivo"
                  value={m}
                  checked={motivo === m}
                  onChange={() => setMotivo(m)}
                />
                <span>{m === OTRO ? 'Otro (escribe abajo)' : m}</span>
              </label>
            ))}
          </fieldset>

          {motivo === OTRO && (
            <label className="k-field">
              <span className="k-field__label">Describe el motivo</span>
              <textarea
                className="k-input"
                rows={3}
                maxLength={MAX_CARACTERES}
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                disabled={ocupado}
              />
            </label>
          )}

          {error && (
            <p className="ms-err" role="alert">
              {error}
            </p>
          )}

          <div className="ms-modal__actions">
            <button
              type="button"
              className="k-btn k-btn--ghost"
              onClick={onClose}
              disabled={ocupado}
            >
              Cancelar
            </button>
            <button type="submit" className="k-btn" disabled={ocupado}>
              {ocupado ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}