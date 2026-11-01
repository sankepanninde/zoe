import { useState } from 'react';
import { ETIQUETA_ESTADO, type MyService } from '@/lib/my-schedule';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const pad = (n: number) => String(n).padStart(2, '0');
const claveFecha = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const claseEstado = (estado: MyService['assignment']['status']) => estado.toLowerCase();

function claseDia(lista: MyService[]) {
  if (lista.some((s) => s.assignment.status === 'PENDING')) return 'warm';
  if (lista.every((s) => s.assignment.status === 'CONFIRMED')) return 'ok';
  return 'no';
}

interface Props {
  year: number;
  porDia: Map<string, MyService[]>;
  onReplace: (service: MyService) => void;
  onConfirm?: (assignmentId: string) => void;
  confirmando?: boolean;
}

export function YearlyMatrix({ year, porDia, onReplace, onConfirm, confirmando = false }: Props) {
  const ahora = new Date();
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth();

  const [vista, setVista] = useState<'mes' | 'anio'>('mes');
  const [mes, setMes] = useState(year === anioActual ? mesActual : 0);
  const [fecha, setFecha] = useState<string | null>(null);
  const [verPasados, setVerPasados] = useState(false);

  const lista = fecha ? porDia.get(fecha) ?? [] : [];

  return (
    <div className="mc">
      <div className="mc__barra">
        <div className="mc__seg" role="group" aria-label="Vista">
          <button type="button" aria-pressed={vista === 'mes'} onClick={() => setVista('mes')}>Mes</button>
          <button type="button" aria-pressed={vista === 'anio'} onClick={() => setVista('anio')}>Año</button>
        </div>

        {vista === 'mes' ? (
          <div className="mc__nav">
            <button type="button" aria-label="Mes anterior" disabled={mes === 0} onClick={() => setMes((m) => m - 1)}>‹</button>
            <strong>{MESES[mes]} {year}</strong>
            <button type="button" aria-label="Mes siguiente" disabled={mes === 11} onClick={() => setMes((m) => m + 1)}>›</button>
          </div>
        ) : (
          <label className="mc__pasados">
            <input type="checkbox" checked={verPasados} onChange={(e) => setVerPasados(e.target.checked)} />
            Mostrar meses pasados
          </label>
        )}
      </div>

      <div className="mc__cuerpo">
        <div>
          {vista === 'mes' ? (
            <VistaMes year={year} mes={mes} porDia={porDia} fecha={fecha} onElegir={setFecha} />
          ) : (
            <VistaAnio
              year={year}
              porDia={porDia}
              fecha={fecha}
              onElegir={setFecha}
              verPasados={verPasados}
              anioActual={anioActual}
              mesActual={mesActual}
            />
          )}
        </div>

        <aside className="mc__panel" aria-live="polite">
          <PanelDia
            fecha={fecha}
            servicios={lista}
            onReplace={onReplace}
            onConfirm={onConfirm}
            confirmando={confirmando}
          />
        </aside>
      </div>
    </div>
  );
}

function VistaMes(props: {
  year: number;
  mes: number;
  porDia: Map<string, MyService[]>;
  fecha: string | null;
  onElegir: (f: string) => void;
}) {
  const { year, mes, porDia, fecha, onElegir } = props;
  const offset = (new Date(year, mes, 1).getDay() + 6) % 7;
  const dias = new Date(year, mes + 1, 0).getDate();
  const celdas: Array<number | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: dias }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <div className="mc__cal">
      <div className="mc__dows">
        {DIAS_CORTOS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="mc__grid">
        {celdas.map((dia, i) => {
          if (dia === null) return <span key={`v${i}`} className="mc__vacio" />;
          const f = claveFecha(year, mes, dia);
          const lista = porDia.get(f) ?? [];
          return (
            <button key={f} type="button" className="mc__dia" aria-pressed={fecha === f} onClick={() => onElegir(f)}>
              <span className="mc__dia-num">{dia}</span>
              {lista.map((s) => (
                <span key={s.assignment.id} className={`mc__chip mc__chip--${claseEstado(s.assignment.status)}`}>
                  {s.startTime} {s.assignment.position}
                </span>
              ))}
              {lista.length > 0 && (
                <span className="mc__dots">
                  {lista.map((s) => (
                    <i key={s.assignment.id} className={`mc__dot mc__dot--${claseEstado(s.assignment.status)}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VistaAnio(props: {
  year: number;
  porDia: Map<string, MyService[]>;
  fecha: string | null;
  onElegir: (f: string) => void;
  verPasados: boolean;
  anioActual: number;
  mesActual: number;
}) {
  const { year, porDia, fecha, onElegir, verPasados, anioActual, mesActual } = props;
  const meses = Array.from({ length: 12 }, (_, m) => m).filter((m) => {
    if (verPasados) return true;
    if (year > anioActual) return true;
    if (year < anioActual) return false;
    return m >= mesActual;
  });

  return (
    <div className="mc__anio">
      {meses.map((m) => {
        const offset = (new Date(year, m, 1).getDay() + 6) % 7;
        const dias = new Date(year, m + 1, 0).getDate();
        const total = Array.from({ length: dias }, (_, i) => porDia.get(claveFecha(year, m, i + 1))?.length ?? 0)
          .reduce((a, b) => a + b, 0);
        return (
          <article key={m} className="mc__mini">
            <header className="mc__mini-head">
              <strong>{MESES[m]}</strong>
              <small>{total === 1 ? '1 turno' : `${total} turnos`}</small>
            </header>
            <div className="mc__mini-grid">
              {DIAS_CORTOS.map((d) => <span key={d}>{d[0]}</span>)}
              {Array.from({ length: offset }, (_, i) => <span key={`v${i}`} />)}
              {Array.from({ length: dias }, (_, i) => {
                const dd = i + 1;
                const f = claveFecha(year, m, dd);
                const lista = porDia.get(f) ?? [];
                if (lista.length === 0) return <span key={f}>{dd}</span>;
                return (
                  <button
                    key={f}
                    type="button"
                    className={`mc__mini-dia mc__mini-dia--${claseDia(lista)}`}
                    aria-pressed={fecha === f}
                    aria-label={`${dd} de ${MESES[m]}, ${lista.length} turnos`}
                    onClick={() => onElegir(f)}
                  >
                    {dd}
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PanelDia(props: {
  fecha: string | null;
  servicios: MyService[];
  onReplace: (service: MyService) => void;
  onConfirm?: (assignmentId: string) => void;
  confirmando: boolean;
}) {
  const { fecha, servicios, onReplace, onConfirm, confirmando } = props;

  if (!fecha) {
    return <p className="mc__muted">Toca un día para ver tus turnos aquí.</p>;
  }

  const d = new Date(fecha + 'T00:00');
  return (
    <>
      <h3>
        {DIAS_LARGOS[d.getDay()]} {d.getDate()} de {MESES[d.getMonth()].toLowerCase()}
      </h3>

      {servicios.length === 0 && <p className="mc__muted">No tienes turnos este día.</p>}

      {servicios.map((s) => {
        const estado = s.assignment.status;
        return (
          <div key={s.assignment.id} className="mc__srv">
            <div className="mc__srv-top">
              <strong>{s.startTime}</strong>
              <span className={`mc__pill mc__pill--${claseEstado(estado)}`}>{ETIQUETA_ESTADO[estado]}</span>
            </div>
            <small>{s.assignment.position}</small>
            <div className="mc__acc">
              {onConfirm && estado === 'PENDING' && (
                <button
                  type="button"
                  className="mc__btn mc__btn--primary"
                  disabled={confirmando}
                  onClick={() => onConfirm(s.assignment.id)}
                >
                  Confirmar
                </button>
              )}
              {estado !== 'REJECTED' && (
                <button type="button" className="mc__btn" onClick={() => onReplace(s)}>
                  Reemplazo
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}