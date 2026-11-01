import { useMemo } from 'react';
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
}

export function YearlyMatrix({ year, porDia, onReplace }: Props) {
  const porMes = useMemo(() => {
    const meses: Array<Array<[string, MyService[]]>> = Array.from({ length: 12 }, () => []);
    porDia.forEach((servicios, fecha) => {
      if (yearOf(fecha) !== year) return;
      meses[monthIndexOf(fecha)]?.push([fecha, servicios]);
    });
    return meses;
  }, [porDia, year]);

  return (
    <div className="ms-months">
      {MESES.map((nombre, i) => {
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
                        <span className={`ms-badge ms-badge--${s.assignment.status.toLowerCase()}`}>
                          {ETIQUETA_ESTADO[s.assignment.status]}
                        </span>
                        <button
                          type="button"
                          className="k-btn k-btn--ghost ms-mini"
                          onClick={() => onReplace(s)}
                          aria-label={`Solicitar reemplazo del ${fecha} a las ${s.startTime}`}
                        >
                          Reemplazo
                        </button>
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
  );
}