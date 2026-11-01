import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCalendarLink, regenerateCalendarLink } from '@/lib/calendar.api';
import { getApiError } from '@/lib/api';

const QUERY_KEY = ['calendar-link'];

export function CalendarLinkCard() {
  const queryClient = useQueryClient();
  const [mostrar, setMostrar] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getCalendarLink,
    staleTime: Infinity,
  });

  const regenerar = useMutation({
    mutationFn: regenerateCalendarLink,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
      setConfirmando(false);
      toast.success('Enlace nuevo creado. El anterior ya no funciona.');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // Solo mostramos enlaces http(s): nunca un valor que el navegador pudiera ejecutar.
  const url = query.data?.url ?? '';
  const urlSegura = /^https?:\/\//.test(url) ? url : '';

  const copiar = async () => {
    if (!urlSegura) return;
    try {
      await navigator.clipboard.writeText(urlSegura);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar. Selecciona el enlace y cópialo manualmente.');
    }
  };

  return (
    <section className="k-panel ms-cal" aria-labelledby="ms-cal-titulo">
      <div>
        <p className="k-label">Calendario</p>
        <h2 id="ms-cal-titulo" className="ms-cal__titulo">Suscribirse al calendario</h2>
        <p className="k-muted">
          Pega este enlace en Google Calendar o Apple Calendar para ver tus turnos.
          Los cambios pueden tardar unas horas en aparecer.
        </p>
      </div>

      {query.isPending && (
        <p className="k-muted" role="status">Preparando tu enlace…</p>
      )}

      {query.isError && (
        <p className="ms-err" role="alert">{getApiError(query.error)}</p>
      )}

      {query.data && !urlSegura && (
        <p className="ms-err" role="alert">El enlace recibido no es válido. Intenta de nuevo más tarde.</p>
      )}

      {urlSegura && (
        <>
          <div className="ms-cal__campo">
            <input
              className="k-input"
              readOnly
              type={mostrar ? 'text' : 'password'}
              value={urlSegura}
              aria-label="Enlace de suscripción"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="k-btn k-btn--ghost"
              onClick={() => setMostrar((v) => !v)}
              aria-pressed={mostrar}
            >
              {mostrar ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          <div className="ms-row">
            <a
              className="k-btn"
              href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(urlSegura)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Agregar a Google Calendar
            </a>
            <a
              className="k-btn k-btn--ghost"
              href={urlSegura.replace(/^https:/, 'webcal:')}
            >
              Agregar a Apple / iPhone
            </a>
          </div>

          <div className="ms-row">
            <button type="button" className="k-btn k-btn--ghost" onClick={copiar}>
              Copiar enlace
            </button>

            {confirmando ? (
              <div className="ms-row" role="group" aria-label="Confirmar regeneración">
                <span className="ms-small">El enlace actual dejará de funcionar. ¿Continuar?</span>
                <button
                  type="button"
                  className="k-btn"
                  onClick={() => regenerar.mutate()}
                  disabled={regenerar.isPending}
                >
                  {regenerar.isPending ? 'Regenerando…' : 'Sí, regenerar'}
                </button>
                <button
                  type="button"
                  className="k-btn k-btn--ghost"
                  onClick={() => setConfirmando(false)}
                  disabled={regenerar.isPending}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="k-btn k-btn--ghost"
                onClick={() => setConfirmando(true)}
              >
                Regenerar
              </button>
            )}
          </div>

          <details className="ms-cal__pasos">
            <summary>¿El botón no funciona?</summary>
            <ul>
              <li>
                <b>Google Calendar (computador):</b> Otros calendarios → + → Desde URL → pega el enlace.
              </li>
              <li>
                <b>iPhone:</b> Ajustes → Calendario → Cuentas → Agregar cuenta → Otra →
                Agregar calendario suscrito → pega el enlace.
              </li>
            </ul>
          </details>
        </>
      )}
    </section>
  );
}