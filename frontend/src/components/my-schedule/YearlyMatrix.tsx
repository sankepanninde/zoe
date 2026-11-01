import { useMemo, useState } from 'react';
import {
  ETIQUETA_ESTADO,
  dayOfWeek,
  monthIndexOf,
  yearOf,
  type MyService,
} from '@/lib/my-schedule';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface Props {
  year: number;
  porDia: Map<string, MyService[]>;
  onReplace: (service: MyService) => void;
  onConfirm?: (assignmentId: string) => void;
  confirmando?: boolean;
}

export function YearlyMatrix({ year, porDia, onReplace, onConfirm, confirmando = false }: Props) {
  const [verPasados, setVerPasados] = useState(false);
  const ahora = new Date();
  const anioActual = ahora.getFullYear();

  // Primer mes visible: meses pasados se ocultan salvo que la casilla esté activa.
  const primerMes = verPasados
    ? 0
    : year < anioActual ? 12 : year > anioActual ? 0 : ahora.getMonth();

  const porMes = useMemo(() => {
    const meses: Array<Array<[string, MyService[]]>> = Array.from({ length: 12 }, () => []);
    porDia.forEach((servicios, fecha) => {
      if (yearOf(fecha) !== year) return;
      meses[monthIndexOf(fecha)]?.push([fecha, servicios]);
    });
    return meses;
  }, [porDia, year]);

  return (
    <div className="ms-year-matriz">
      <label className="ms-small ms-pasados">
        <input type="checkbox" checked={verPasados} onChange={(e) => setVerPasados(e.target.checked)} />
        {' '}Mostrar meses pasados
      </label>

      {primerMes === 12 && <p className="ms-empty">No hay meses pendientes en {year}.</p>}

      <div className="ms-months">
        {MESES.map((nombre, i) => {
          if (i < primerMes) return null;
          const dias = porMes[i] ?? [];
          return (
            <article key={nombre} className="k-panel ms-month" aria-label={`${nombre} ${year}`}>
              <header className="ms-month__head">
                <h2>{nombre}</h2>
                <span className="k-muted">
                  {dias.length === 0 ? 'Sin turnos' : `${dias.length} ${dias.length === 1 ? 'fecha' : 'fechas'}`}
                </span>
              </header>
              <ul className="ms-days">
                {dias.map(([fecha, servicios]) => (
                  <li key={fecha} className="ms-day">
                    <div className="ms-day__fecha">
                      <span className="ms-day__dow">{DIAS[dayOfWeek(fecha)] ?? ''}</span>
                      <span className="ms-day__num">{Number(fecha.slice(8, 10))}</span>
                    </div>
                    <div className="ms-day__servicios">
                      {servicios.map((s) => (
                        <div key={s.serviceId} className="ms-svc">
                          <div>
                            <span className="ms-svc__hora">{s.startTime}</span>
                            <span className="k-muted"> · {s.assignment.position}</span>
                          </div>
                          <div className="ms-svc__acciones">
                            <span className={`ms-badge ms-badge--${s.assignment.status.toLowerCase()}`}>
                              {ETIQUETA_ESTADO[s.assignment.status]}
                            </span>
                            {onConfirm && s.assignment.status === 'PENDING' && (
                              <button
                                type="button"
                                className="k-btn k-btn--auto ms-mini"
                                disabled={confirmando}
                                onClick={() => onConfirm(s.assignment.id)}
                                aria-label={`Confirmar turno del ${fecha} a las ${s.startTime}`}
                              >
                                Confirmar
                              </button>
                            )}
                            <button
                              type="button"
                              className="k-btn k-btn--ghost ms-mini"
                              onClick={() => onReplace(s)}
                              aria-label={`Solicitar reemplazo del ${fecha} a las ${s.startTime}`}
                            >
                              Reemplazo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}