import { useState } from 'react';
import type { FormEvent } from 'react';
import type { BloqueoDisponibilidad, DiaDisponibilidad, EstadoDisponibilidad } from '@/lib/availability.api';
import './Disponibilidad.css';

export const NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const pad = (n: number) => String(n).padStart(2, '0');
export const fechaISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const desdeISO = (f: string) => {
  const [y, m, d] = f.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const sumarDias = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const lunesDe = (d: Date) =>
  sumarDias(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));

const corto = (d: Date) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

const siguiente = (e: EstadoDisponibilidad): EstadoDisponibilidad | null =>
  e === 'PENDIENTE' ? 'DISPONIBLE' : e === 'DISPONIBLE' ? 'NO_DISPONIBLE' : null;

const etiqueta: Record<EstadoDisponibilidad, string> = {
  DISPONIBLE: 'Puedo',
  NO_DISPONIBLE: 'No puedo',
  PENDIENTE: 'Sin responder',
};

export interface DisponibilidadProps {
  semana: Date;
  hoy: string;
  dias: DiaDisponibilidad[];
  bloqueos: BloqueoDisponibilidad[];
  ocupado: boolean;
  onSemana: (delta: number) => void;
  onServicio: (serviceId: string, estado: EstadoDisponibilidad | null) => void;
  onDia: (fecha: string, estado: 'DISPONIBLE' | 'NO_DISPONIBLE') => void;
  onBloquear: (desde: string, hasta: string) => void;
  onQuitarBloqueo: (id: string) => void;
}

export function Disponibilidad({
  semana,
  hoy,
  dias,
  bloqueos,
  ocupado,
  onSemana,
  onServicio,
  onDia,
  onBloquear,
  onQuitarBloqueo,
}: DisponibilidadProps) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [error, setError] = useState('');

  const todos = dias.flatMap((d) => d.servicios);
  const cuenta = (e: EstadoDisponibilidad) => todos.filter((s) => s.estado === e).length;
  const si = cuenta('DISPONIBLE');
  const no = cuenta('NO_DISPONIBLE');
  const pend = cuenta('PENDIENTE');
  const fin = sumarDias(semana, 6);

  const resumen =
    todos.length === 0
      ? 'No hay servicios en esta semana.'
      : pend === todos.length
        ? 'Aún no respondes en esta semana.'
        : `Puedes en ${si}, no puedes en ${no} y ${pend} están sin responder.`;

  const enviarBloqueo = (e: FormEvent) => {
    e.preventDefault();
    const h = hasta || desde;
    if (!desde) return setError('Elige la fecha de inicio.');
    if (h < desde) return setError('La fecha final debe ser después de la inicial.');
    setError('');
    onBloquear(desde, h);
    setDesde('');
    setHasta('');
  };

  return (
    <div className="disp-wrap">
      <header className="disp-cab">
        <div>
          <h1>¿Cuándo puedes servir?</h1>
          <p className="disp-resumen">{resumen}</p>
        </div>
        <div className="disp-nav">
          <button type="button" onClick={() => onSemana(-1)} disabled={ocupado} aria-label="Semana anterior">←</button>
          <span className="disp-rango">{corto(semana)} – {corto(fin)}</span>
          <button type="button" onClick={() => onSemana(1)} disabled={ocupado} aria-label="Semana siguiente">→</button>
        </div>
      </header>

      <div className="disp-leyenda">
        <span className="ok">Puedo</span>
        <span className="no">No puedo</span>
        <span>Sin responder</span>
      </div>

      <div className="disp-semana" aria-label="Disponibilidad de la semana">
        {dias.map((d) => {
          const fecha = desdeISO(d.fecha);
          const idx = (fecha.getDay() + 6) % 7;
          const sinServicios = d.servicios.length === 0;
          const deshabilitado = ocupado || d.bloqueado;
          const clases = ['disp-dia', d.fecha === hoy && 'disp-dia--hoy', d.bloqueado && 'disp-dia--bloqueado']
            .filter(Boolean)
            .join(' ');
          return (
            <div key={d.fecha} className={clases}>
              <div className="disp-dia__cab">
                <span>
                  <b>{fecha.getDate()}</b> {NOMBRES[idx]}
                </span>
                {d.bloqueado && <span className="disp-etq">No puedo</span>}
              </div>
              <div className="disp-dia__acciones">
                <button type="button" className="disp-mini" disabled={deshabilitado || sinServicios} onClick={() => onDia(d.fecha, 'DISPONIBLE')}>
                  ✓ Todo
                </button>
                <button type="button" className="disp-mini" disabled={deshabilitado || sinServicios} onClick={() => onDia(d.fecha, 'NO_DISPONIBLE')}>
                  ✕ Nada
                </button>
              </div>
              <div className="disp-dia__cuerpo">
                {sinServicios ? (
                  <div className="disp-vacio">Sin servicios</div>
                ) : (
                  d.servicios.map((s) => (
                    <button
                      key={s.serviceId}
                      type="button"
                      className="disp-srv"
                      data-estado={s.estado}
                      disabled={deshabilitado}
                      onClick={() => onServicio(s.serviceId, siguiente(s.estado))}
                      aria-label={`${s.nombre}, ${etiqueta[s.estado]}. Toca para cambiar`}
                    >
                      <span className="disp-etq">{s.ministerio ?? 'Iglesia'}</span>
                      <strong>{s.nombre}</strong>
                      <small>{s.horaInicio} – {s.horaFin}</small>
                      <span className="disp-estado">{etiqueta[s.estado]}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section className="disp-caja" aria-labelledby="disp-bloqueos">
        <div>
          <h2 id="disp-bloqueos" className="disp-h2">Fechas en que no puedo</h2>
          <p className="disp-muted">Vacaciones o una semana puntual. Ahí no te asignan nada.</p>
        </div>
        <form className="disp-form" onSubmit={enviarBloqueo} noValidate>
          <label className="disp-campo">
            Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="disp-campo">
            Hasta (opcional)
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
          <button type="submit" className="disp-btn" disabled={ocupado}>Bloquear</button>
        </form>
        {error && <p className="disp-error" role="alert">{error}</p>}
        <div>
          {bloqueos.length === 0 ? (
            <p className="disp-muted">No tienes fechas bloqueadas.</p>
          ) : (
            bloqueos.map((b) => (
              <div key={b.id} className="disp-fila">
                <span>
                  {corto(desdeISO(b.desde))}
                  {b.hasta !== b.desde && ` – ${corto(desdeISO(b.hasta))}`}
                </span>
                <button type="button" className="disp-quitar" onClick={() => onQuitarBloqueo(b.id)} disabled={ocupado}>
                  Quitar
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}