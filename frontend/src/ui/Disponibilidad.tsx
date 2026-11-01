import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  BloqueoDisponibilidad,
  DiaDisponibilidad,
  EstadoDisponibilidad,
  Repeticion,
  ServicioDisponibilidad,
} from '@/lib/availability.api';
import './Disponibilidad.css';

export const NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const TIPO: Record<ServicioDisponibilidad['tipo'], string> = { CULTO: 'Culto', ENSAYO: 'Ensayo', EVENTO: 'Evento' };
const REPITE_TXT: Record<Repeticion, string> = { ninguna: '', anual: ' · todos los años', mensual: ' · todos los meses' };

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

const corto = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()]}`;

const esNo = (s: ServicioDisponibilidad) => s.estado === 'NO_DISPONIBLE';
const diaNo = (d: DiaDisponibilidad) =>
  d.bloqueado || d.estado === 'NO_DISPONIBLE' || (d.servicios.length > 0 && d.servicios.every(esNo));
const noPuede = (d: DiaDisponibilidad | undefined, s: ServicioDisponibilidad) => !!d?.bloqueado || esNo(s);
// Toca un servicio: si no puede, lo vuelve a puedo (null); si puede, lo marca como no puedo.
const siguiente = (s: ServicioDisponibilidad): EstadoDisponibilidad | null => (esNo(s) ? null : 'NO_DISPONIBLE');

function useEsMovil() {
  const consulta = '(max-width: 760px)';
  const [movil, setMovil] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const lista = window.matchMedia(consulta);
    const cambio = () => setMovil(lista.matches);
    lista.addEventListener('change', cambio);
    return () => lista.removeEventListener('change', cambio);
  }, []);
  return movil;
}

function BotonServicio({
  s,
  d,
  deshabilitado,
  onClick,
}: {
  s: ServicioDisponibilidad;
  d: DiaDisponibilidad | undefined;
  deshabilitado: boolean;
  onClick: () => void;
}) {
  const no = noPuede(d, s);
  return (
    <button
      type="button"
      className="disp-srv"
      data-estado={no ? 'NO_DISPONIBLE' : s.estado}
      disabled={deshabilitado}
      onClick={onClick}
      aria-label={`${s.nombre}, ${no ? 'no puedo' : 'puedo'}. Toca para cambiar`}
    >
      {s.tipo && <span className={`disp-tipo disp-tipo--${s.tipo.toLowerCase()}`}>{TIPO[s.tipo]}</span>}
      {s.ministerio && <span className="disp-etq">{s.ministerio}</span>}
      <strong>{s.nombre}</strong>
      <small>{s.horaInicio} – {s.horaFin}</small>
      <span className="disp-estado">{no ? 'No puedo' : '✓ Puedo'}</span>
    </button>
  );
}

export interface DisponibilidadProps {
  semana: Date;
  hoy: string;
  dias: DiaDisponibilidad[];
  anio: DiaDisponibilidad[];
  bloqueos: BloqueoDisponibilidad[];
  ocupado: boolean;
  onSemana: (delta: number) => void;
  onServicio: (serviceId: string, estado: EstadoDisponibilidad | null) => void;
  onDia: (fecha: string, estado: 'DISPONIBLE' | 'NO_DISPONIBLE') => void;
  onMarcarSemana: (no: boolean) => void;
  onBloquear: (desde: string, hasta: string, repite: Repeticion) => void;
  onEditarBloqueo: (id: string, desde: string, hasta: string, repite: Repeticion) => void;
  onQuitarBloqueo: (id: string) => void;
}

const OPCIONES_REPETIR: { valor: Repeticion; texto: string }[] = [
  { valor: 'ninguna', texto: 'No se repite' },
  { valor: 'anual', texto: 'Cada año (mismo día y mes)' },
  { valor: 'mensual', texto: 'Cada mes (mismos días del mes)' },
];

function SelectorRepetir({ valor, onCambio }: { valor: Repeticion; onCambio: (v: Repeticion) => void }) {
  const [abierto, setAbierto] = useState(false);
  const actual = OPCIONES_REPETIR.find((o) => o.valor === valor) ?? OPCIONES_REPETIR[0];
  return (
    <div className="disp-select">
      <span className="disp-label">Repetir</span>
      <button
        type="button"
        className="disp-select__btn"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
        onBlur={() => setAbierto(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setAbierto(false);
        }}
      >
        {actual.texto}
      </button>
      {abierto && (
        <ul className="disp-select__lista" role="listbox" aria-label="Repetir">
          {OPCIONES_REPETIR.map((o) => (
            <li
              key={o.valor}
              role="option"
              aria-selected={o.valor === valor}
              className="disp-select__op"
              // onMouseDown con preventDefault evita que el botón pierda el foco antes de elegir
              onMouseDown={(e) => {
                e.preventDefault();
                onCambio(o.valor);
                setAbierto(false);
              }}
            >
              {o.texto}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Disponibilidad({
  semana,
  hoy,
  dias,
  anio,
  bloqueos,
  ocupado,
  onSemana,
  onServicio,
  onDia,
  onMarcarSemana,
  onBloquear,
  onEditarBloqueo,
  onQuitarBloqueo,
}: DisponibilidadProps) {
  const movil = useEsMovil();
  const hoyD = desdeISO(hoy);
  const anioNum = hoyD.getFullYear();
  const mesInicio = hoyD.getMonth();

  const [vista, setVista] = useState<'semana' | 'anio'>('semana');
  const [mesMovil, setMesMovil] = useState(mesInicio);
  const [diaSel, setDiaSel] = useState<string | null>(null);
  const [actualizado, setActualizado] = useState(() => new Date());
  const [pAbierto, setPAbierto] = useState(false);
  const [pMes, setPMes] = useState(() => new Date(anioNum, mesInicio, 1));
  const [pDesde, setPDesde] = useState('');
  const [pHasta, setPHasta] = useState('');
  const [repite, setRepite] = useState<Repeticion>('ninguna');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [verTodas, setVerTodas] = useState(false);
  const [confirmarQuitar, setConfirmarQuitar] = useState<string | null>(null);
  const [confirmarSemana, setConfirmarSemana] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => setActualizado(new Date()), [dias, anio, bloqueos]);

  const mapaAnio = new Map(anio.map((d) => [d.fecha, d] as const));
  const semanaKey = fechaISO(semana);
  const fin = sumarDias(semana, 6);
  const noSemana = dias.filter(diaNo).length;
  const todosNo = dias.length > 0 && noSemana === dias.length;
  const hayMarcadosManual = dias.some((d) => !d.bloqueado && diaNo(d));
  const hayLibres = dias.some((d) => !d.bloqueado);

  const titulo = vista === 'semana' ? 'Mis días disponibles' : movil ? 'Mi mes' : 'Mi año';
  const resumen =
    vista === 'anio'
      ? 'Cada barra de un día es un servicio, en el orden del panel: verde puedo, rojo no puedo. Toca un día para cambiarlo.'
      : noSemana === 0
        ? 'Estás disponible los 7 días de esta semana.'
        : noSemana === dias.length
          ? 'No puedes servir ningún día de esta semana.'
          : `Estás disponible ${dias.length - noSemana} de ${dias.length} días esta semana.`;

  const diasMesHoy = new Date(anioNum, mesInicio + 1, 0).getDate();
  const prefijoMes = hoy.slice(0, 7);
  const noMesHoy = anio.filter((d) => d.fecha.startsWith(prefijoMes) && diaNo(d)).length;
  const resumenMes = `${MESES_LARGOS[mesInicio]}: disponible ${diasMesHoy - noMesHoy} de ${diasMesHoy} días.`;

  // Calendario del selector de fechas
  const py = pMes.getFullYear();
  const pm = pMes.getMonth();
  const celdasPicker: (string | null)[] = [
    ...Array.from({ length: (new Date(py, pm, 1).getDay() + 6) % 7 }, () => null),
    ...Array.from({ length: new Date(py, pm + 1, 0).getDate() }, (_, i) => fechaISO(new Date(py, pm, i + 1))),
  ];
  const textoPicker = !pDesde
    ? 'Toca un día para empezar.'
    : !pHasta
      ? `Desde el ${corto(desdeISO(pDesde))}. Toca otro día para elegir hasta cuándo, o agrega solo ese día.`
      : `Del ${corto(desdeISO(pDesde))} al ${corto(desdeISO(pHasta))}.`;
  const textoAbrir = !pDesde
    ? 'Elegir fechas'
    : pHasta && pHasta !== pDesde
      ? `Fechas: ${corto(desdeISO(pDesde))} – ${corto(desdeISO(pHasta))}`
      : `Fecha: ${corto(desdeISO(pDesde))}`;
  const claseDiaPicker = (f: string) =>
    `disp-mes__dia${f === hoy ? ' hoy' : ''}${pDesde && pHasta && f > pDesde && f < pHasta ? ' en' : ''}${
      f === pDesde || f === pHasta ? ' sel' : ''
    }`;

  const elegirDia = (f: string) => {
    if (!pDesde || pHasta) {
      setPDesde(f);
      setPHasta('');
    } else if (f < pDesde) {
      setPHasta(pDesde);
      setPDesde(f);
    } else {
      setPHasta(f);
    }
  };

  const cancelar = () => {
    setEditandoId(null);
    setPDesde('');
    setPHasta('');
    setPAbierto(false);
    setRepite('ninguna');
    setError('');
  };

  const editarRango = (b: BloqueoDisponibilidad) => {
    const [y, m] = b.desde.split('-').map(Number);
    setEditandoId(b.id);
    setPDesde(b.desde);
    setPHasta(b.hasta);
    setPMes(new Date(y, m - 1, 1));
    setRepite(b.repite);
    setPAbierto(true);
    setError('');
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!pDesde) {
      setError('Elige la fecha de inicio.');
      return;
    }
    const hastaFinal = pHasta || pDesde;
    setError('');
    if (editandoId) onEditarBloqueo(editandoId, pDesde, hastaFinal, repite);
    else onBloquear(pDesde, hastaFinal, repite);
    cancelar();
  };

  const pedirQuitar = (b: BloqueoDisponibilidad) => {
    if (b.repite !== 'ninguna') setConfirmarQuitar(b.id);
    else onQuitarBloqueo(b.id);
  };

  const listaRangos = verTodas ? bloqueos : bloqueos.slice(0, 3);

  // Año: meses desde el actual hasta diciembre (en celular, uno por vez)
  const mesesVisibles = movil ? [mesMovil] : Array.from({ length: 12 - mesInicio }, (_, i) => mesInicio + i);

  // Detalle del día en la vista anual
  const fSel = diaSel ? desdeISO(diaSel) : null;
  const dSel = diaSel ? mapaAnio.get(diaSel) : undefined;
  const listaSel = dSel?.servicios ?? [];
  const noSel = dSel ? diaNo(dSel) : false;

  return (
    <div className="disp-wrap">
      <header className="disp-cab">
        <div>
          <span className="disp-eyebrow">Mi disponibilidad</span>
          <h1>{titulo}</h1>
          <p className="disp-resumen">{resumen}</p>
          <p className="disp-actualizado">
            Actualizado hoy a las {actualizado.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="disp-actualizado">{resumenMes}</p>
        </div>
        <div className="disp-acciones">
          <div className="disp-toggle" role="group" aria-label="Vista">
            <button type="button" aria-pressed={vista === 'semana'} onClick={() => setVista('semana')}>
              Semana
            </button>
            <button type="button" aria-pressed={vista === 'anio'} onClick={() => setVista('anio')}>
              {movil ? 'Mes' : 'Año'}
            </button>
          </div>
          {vista === 'semana' && (
            <div className="disp-nav">
              <button type="button" onClick={() => onSemana(-1)} disabled={ocupado} aria-label="Semana anterior">
                ←
              </button>
              <span className="disp-rango">{corto(semana)} – {corto(fin)}</span>
              <button type="button" onClick={() => onSemana(1)} disabled={ocupado} aria-label="Semana siguiente">
                →
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="disp-info">
        <b>Solo es información de disponibilidad.</b> No es una programación ni te asigna turnos. Quien arma el
        cronograma lo consulta para saber con quién contar.
      </div>

      <div className="disp-leyenda">
        <span><i className="disp-punto disp-punto--ok" />Puedo (por defecto)</span>
        <span><i className="disp-punto disp-punto--no" />No puedo</span>
        <span className="disp-tipo disp-tipo--culto">Culto</span>
        <span className="disp-tipo disp-tipo--ensayo">Ensayo</span>
        <span className="disp-tipo disp-tipo--evento">Evento</span>
        <span>Puedes marcar el día completo o solo algunos servicios.</span>
      </div>

      <section className="disp-fechas">
        <div>
          <h2 className="disp-h2">Fechas en que no puedo</h2>
          <p className="disp-muted">
            Agrega un día o un rango (vacaciones, una semana puntual). El calendario las marca solo como no disponibles.
          </p>
        </div>
        <form className="disp-form" onSubmit={enviar} noValidate>
          <button
            type="button"
            className="k-btn k-btn--ghost k-btn--auto"
            onClick={() => setPAbierto(!pAbierto)}
          >
            {textoAbrir}
          </button>
          {pAbierto && (
            <div className="disp-picker">
              <div className="disp-picker__cab">
                <div className="disp-nav">
                  <button type="button" onClick={() => setPMes(new Date(py, pm - 1, 1))} aria-label="Mes anterior">
                    ←
                  </button>
                </div>
                <b>{MESES_LARGOS[pm]} {py}</b>
                <div className="disp-nav">
                  <button type="button" onClick={() => setPMes(new Date(py, pm + 1, 1))} aria-label="Mes siguiente">
                    →
                  </button>
                </div>
              </div>
              <div className="disp-mes__grid">
                {LETRAS.map((l) => (
                  <span key={l} className="disp-mes__dn">{l}</span>
                ))}
                {celdasPicker.map((f, i) =>
                  f === null ? (
                    <span key={`v${i}`} />
                  ) : (
                    <button key={f} type="button" className={claseDiaPicker(f)} onClick={() => elegirDia(f)}>
                      {desdeISO(f).getDate()}
                    </button>
                  ),
                )}
              </div>
              <p className="disp-muted">{textoPicker}</p>
            </div>
          )}
          <SelectorRepetir valor={repite} onCambio={setRepite} />
          <button type="submit" className="k-btn k-btn--auto" disabled={ocupado}>
            {editandoId ? 'Guardar cambios' : 'Agregar'}
          </button>
          {editandoId && (
            <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={cancelar}>
              Cancelar
            </button>
          )}
        </form>
        {error && <p className="disp-error" role="alert">{error}</p>}
        <div>
          {bloqueos.length === 0 ? (
            <p className="disp-muted">Aún no agregas fechas.</p>
          ) : (
            <>
              {listaRangos.map((b) => (
                <div key={b.id} className="disp-fila">
                  <span>
                    {corto(desdeISO(b.desde))}
                    {b.hasta !== b.desde && ` – ${corto(desdeISO(b.hasta))}`}
                    {REPITE_TXT[b.repite]}
                  </span>
                  {confirmarQuitar === b.id ? (
                    <span className="disp-fila-acc">
                      <span className="disp-pregunta">
                        {b.repite === 'anual' ? '¿Quitar de todos los años?' : '¿Quitar de todos los meses?'}
                      </span>
                      <button
                        type="button"
                        className="k-btn k-btn--auto"
                        disabled={ocupado}
                        onClick={() => {
                          setConfirmarQuitar(null);
                          onQuitarBloqueo(b.id);
                        }}
                      >
                        Sí, quitar
                      </button>
                      <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => setConfirmarQuitar(null)}>
                        No
                      </button>
                    </span>
                  ) : (
                    <span className="disp-fila-acc">
                      <button type="button" className="k-btn k-btn--ghost k-btn--auto" disabled={ocupado} onClick={() => editarRango(b)}>
                        Editar
                      </button>
                      <button type="button" className="k-btn k-btn--ghost k-btn--auto" disabled={ocupado} onClick={() => pedirQuitar(b)}>
                        Quitar
                      </button>
                    </span>
                  )}
                </div>
              ))}
              {bloqueos.length > 3 && (
                <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => setVerTodas(!verTodas)}>
                  {verTodas ? 'Ver menos' : `Ver todas (${bloqueos.length})`}
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {vista === 'semana' ? (
        <>
          <div className="disp-semana-acc">
            {todosNo && hayMarcadosManual ? (
              <>
                <span className="disp-muted">Toda la semana está como no puedo.</span>
                <button type="button" className="k-btn k-btn--ghost k-btn--auto" disabled={ocupado} onClick={() => onMarcarSemana(false)}>
                  Volver a disponible
                </button>
              </>
            ) : todosNo ? (
              <span className="disp-muted">Esta semana está dentro de un bloqueo.</span>
            ) : confirmarSemana === semanaKey ? (
              <>
                <span className="disp-pregunta">¿Marcar los 7 días como no puedo? Los bloqueos no cambian.</span>
                <button
                  type="button"
                  className="k-btn k-btn--auto"
                  disabled={ocupado}
                  onClick={() => {
                    setConfirmarSemana(null);
                    onMarcarSemana(true);
                  }}
                >
                  Sí, marcar la semana
                </button>
                <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => setConfirmarSemana(null)}>
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                className="k-btn k-btn--ghost k-btn--auto"
                disabled={ocupado || !hayLibres}
                onClick={() => setConfirmarSemana(semanaKey)}
              >
                No puedo toda la semana
              </button>
            )}
          </div>

          <div className="disp-semana">
            {dias.map((d) => {
              const fecha = desdeISO(d.fecha);
              const idx = (fecha.getDay() + 6) % 7;
              const noDia = diaNo(d);
              const total = d.servicios.length;
              const okN = d.servicios.filter((s) => !noPuede(d, s)).length;
              const pill = noDia ? (
                <span className="disp-pill disp-pill--no">No puedo</span>
              ) : total === 0 ? (
                <span className="disp-pill disp-pill--ok">Disponible</span>
              ) : okN < total ? (
                <span className="disp-pill disp-pill--parc">{okN}/{total}</span>
              ) : (
                <span className="disp-pill disp-pill--ok">{total}/{total}</span>
              );
              return (
                <div
                  key={d.fecha}
                  className={['disp-dia', d.fecha === hoy && 'disp-dia--hoy', noDia && 'disp-dia--no'].filter(Boolean).join(' ')}
                >
                  <div className="disp-dia__cab">
                    <span><b>{fecha.getDate()}</b> {NOMBRES[idx]}</span>
                    {pill}
                  </div>
                  <button
                    type="button"
                    className={`disp-mini${noDia ? ' disp-mini--no' : ''}`}
                    disabled={ocupado || d.bloqueado}
                    onClick={() => onDia(d.fecha, noDia ? 'DISPONIBLE' : 'NO_DISPONIBLE')}
                  >
                    {d.bloqueado ? 'Viene de un rango de fechas' : noDia ? 'Quitar: sí puedo ese día' : 'Marcar: no puedo todo el día'}
                  </button>
                  <div className="disp-dia__cuerpo">
                    {total === 0 ? (
                      <div className="disp-vacio">Sin servicios</div>
                    ) : (
                      d.servicios.map((s) => (
                        <BotonServicio
                          key={s.serviceId}
                          s={s}
                          d={d}
                          deshabilitado={ocupado || d.bloqueado}
                          onClick={() => onServicio(s.serviceId, siguiente(s))}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="disp-leyenda-anio">
            <span><i className="disp-muestra disp-muestra--ok" />Verde: puedo ese servicio</span>
            <span><i className="disp-muestra disp-muestra--no" />Rojo: no puedo</span>
            <span><i className="disp-muestra" />Gris: ese día no hay servicio</span>
            <span>El número dentro de cada barra es el orden del servicio ese día: 1 = primero, 2 = segundo.</span>
          </div>

          <div className="disp-anio">
            {movil && (
              <div className="disp-mes-nav">
                <button type="button" onClick={() => setMesMovil(Math.max(mesInicio, mesMovil - 1))} aria-label="Mes anterior">
                  ←
                </button>
                <b>{MESES_LARGOS[mesMovil]} {anioNum}</b>
                <button type="button" onClick={() => setMesMovil(Math.min(11, mesMovil + 1))} aria-label="Mes siguiente">
                  →
                </button>
              </div>
            )}
            {mesesVisibles.map((m) => {
              const diasDelMes = new Date(anioNum, m + 1, 0).getDate();
              const offset = (new Date(anioNum, m, 1).getDay() + 6) % 7;
              const fechasMes = Array.from({ length: diasDelMes }, (_, i) => fechaISO(new Date(anioNum, m, i + 1)));
              const noDiasMes = fechasMes.filter((f) => {
                const d = mapaAnio.get(f);
                return d ? diaNo(d) : false;
              }).length;
              const noSrvsMes = fechasMes.reduce((acc, f) => {
                const d = mapaAnio.get(f);
                return d && !diaNo(d) ? acc + d.servicios.filter(esNo).length : acc;
              }, 0);
              return (
                <div key={m} className="disp-mes">
                  <div className="disp-mes__cab">
                    <h3>{MESES_LARGOS[m]}</h3>
                    <small>
                      {noDiasMes || noSrvsMes ? `${noDiasMes} días no · ${noSrvsMes} servicios no` : 'Todo disponible'}
                    </small>
                  </div>
                  <div className="disp-mes__grid">
                    {LETRAS.map((l) => (
                      <span key={l} className="disp-mes__dn">{l}</span>
                    ))}
                    {Array.from({ length: offset }, (_, i) => (
                      <span key={`v${i}`} />
                    ))}
                    {fechasMes.map((f, i) => {
                      const dd = i + 1;
                      const fecha = desdeISO(f);
                      const d = mapaAnio.get(f);
                      const lista = d?.servicios ?? [];
                      const noDia = d ? diaNo(d) : false;
                      const okN = lista.filter((s) => !noPuede(d, s)).length;
                      const clsCnt = okN === lista.length ? 'ok' : okN === 0 ? 'no' : 'parc';
                      const parc = !noDia && lista.some(esNo);
                      const clases = `disp-mes__dia${f === hoy ? ' hoy' : ''}${noDia ? ' no' : ''}${parc ? ' parc' : ''}${
                        fecha < hoyD ? ' pasado' : ''
                      }`;
                      return (
                        <button
                          key={f}
                          type="button"
                          className={clases}
                          onClick={() => setDiaSel(f)}
                          aria-label={`${dd} de ${MESES_LARGOS[m]}, ${noDia ? 'no puedo' : 'disponible'}`}
                        >
                          {dd}
                          <span className="disp-barras">
                            {lista.length > 2 ? (
                              <i className={clsCnt}>{okN}/{lista.length}</i>
                            ) : (
                              lista.map((s, k) => (
                                <i key={s.serviceId} className={noPuede(d, s) ? 'no' : 'ok'} title={`${s.nombre} · ${s.horaInicio}`}>
                                  {k + 1}
                                </i>
                              ))
                            )}
                          </span>
                          <span className={`disp-pop${lista.length > 4 ? ' many' : ''}`}>
                            {noDia ? (
                              <span className="disp-pop-f no"><span>No puedo ese día</span></span>
                            ) : lista.length === 0 ? (
                              <span className="disp-pop-f"><span>Sin servicios</span></span>
                            ) : (
                              lista.map((s, k) => {
                                const puede = !noPuede(d, s);
                                const muchos = lista.length > 4;
                                return (
                                  <span key={s.serviceId} className={`disp-pop-f ${puede ? 'ok' : 'no'}`}>
                                    <b>{k + 1}</b>
                                    <span>{muchos ? s.nombre : `${s.nombre} · ${s.horaInicio}`}</span>
                                    <em>{muchos ? (puede ? '✓' : '✕') : puede ? 'Puedo' : 'No puedo'}</em>
                                  </span>
                                );
                              })
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {fSel && diaSel && (
            <section className="disp-detalle">
              <div className="disp-detalle__cab">
                <b>
                  {NOMBRES[(fSel.getDay() + 6) % 7]} {fSel.getDate()} de {MESES_LARGOS[fSel.getMonth()].toLowerCase()}
                </b>
                <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => setDiaSel(null)}>
                  Cerrar
                </button>
              </div>
              {listaSel.length === 0 ? (
                <p className="disp-muted">Ese día no tiene servicios.</p>
              ) : (
                <div className="disp-detalle__lista">
                  {listaSel.map((s) => (
                    <BotonServicio
                      key={s.serviceId}
                      s={s}
                      d={dSel}
                      deshabilitado={ocupado || !!dSel?.bloqueado}
                      onClick={() => onServicio(s.serviceId, siguiente(s))}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                className="disp-mini"
                disabled={ocupado || !!dSel?.bloqueado}
                onClick={() => onDia(diaSel, noSel ? 'DISPONIBLE' : 'NO_DISPONIBLE')}
              >
                {dSel?.bloqueado ? 'Viene de un rango de fechas' : noSel ? 'Quitar: sí puedo ese día' : 'Marcar: no puedo todo el día'}
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}