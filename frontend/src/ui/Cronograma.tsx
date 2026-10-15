import { useMemo, useState } from "react";
import "./Cronograma.css";

/* Cronograma semanal. El líder arma el equipo de cada turno de su ministerio;
   el siervo ve sus turnos y acepta o rechaza. Los cambios se avisan con onCambio
   para que la Bandeja y las otras pantallas se actualicen. */

export interface Plantilla {
  id: string;
  nombre: string;
  dia: number; // 0 = lunes … 6 = domingo
  desde: string;
  hasta: string;
}

export interface Regla {
  id: string;
  ministerio: string;
  nombre: string;
  /** Turno que sigue a un culto de la plantilla… */
  despuesDe?: string;
  /** …o turno fijo en un día de la semana. */
  dia?: number;
  desde: string;
  hasta: string;
  cupo: number;
}

export interface Puntual {
  key: string;
  ministerio: string;
  fecha: string;
  desde: string;
  hasta: string;
  nombre: string;
  fijo: string; // id de la persona asignada a mano
}

export interface PersonaAgenda {
  id: string;
  nombre: string;
  marco: string[]; // cultos a los que marcó disponibilidad
  slots: string[]; // "día|hora" de sus horarios de ministerio, p. ej. "3|18:30"
  ultimo: string; // "2026-09-13"
}

export interface CronogramaProps {
  rol: "lider" | "siervo";
  /** Persona que entra como siervo. */
  quien?: string;
  /** Ministerio que administra el líder. */
  ministerio?: string;
  /** Cualquier día de la semana a mostrar. */
  semanaInicio?: string;
  plantilla?: Plantilla[];
  reglas?: Regla[];
  puntuales?: Puntual[];
  personas?: PersonaAgenda[];
  /** Miembros habituales de cada ministerio. */
  miembros?: Record<string, string[]>;
  /** Fecha de referencia para mostrar "hoy" en el calendario. */
  hoy?: string;
  /** Turno abierto al cargar (clave del evento). */
  selInicial?: string;
  onCambio?: (asignaciones: Record<string, string[]>) => void;
}

interface Evento {
  key: string;
  nombre: string;
  fecha: string;
  desde: string;
  hasta: string;
  tipo: "culto" | "jornada" | "puntual";
  ministerio?: string;
  marcaId?: string | null;
  cupo?: number;
  fijo?: string;
}

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const COLOR: Record<string, string> = { aseo: "var(--warm)", sonido: "var(--ok)" };
const NOMBRE: Record<string, string> = { aseo: "Aseo", sonido: "Sonido" };

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const aMin = (h: string) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const diaSemana = (f: string) => (new Date(f + "T00:00").getDay() + 6) % 7;
const lunesDe = (f: string) => iso(addDays(new Date(f + "T00:00"), -diaSemana(f)));
const largo = (f: string) => {
  const t = new Date(f + "T00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const corto = (f: string) => new Date(f + "T00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" });

function eventosSemana(inicio: string, plantilla: Plantilla[], reglas: Regla[], puntuales: Puntual[]): Evento[] {
  const out: Evento[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(new Date(inicio + "T00:00"), i);
    const f = iso(d);
    const wd = i;
    plantilla.filter((s) => s.dia === wd).forEach((s) => {
      out.push({ key: `${s.id}-${f}`, nombre: s.nombre, fecha: f, desde: s.desde, hasta: s.hasta, tipo: "culto" });
      reglas.filter((r) => r.despuesDe === s.id).forEach((r) =>
        out.push({ key: `${r.id}-${f}`, nombre: r.nombre, ministerio: r.ministerio, fecha: f, desde: r.desde, hasta: r.hasta, tipo: "jornada", marcaId: s.id, cupo: r.cupo }));
    });
    reglas.filter((r) => r.dia === wd).forEach((r) =>
      out.push({ key: `${r.id}-${f}`, nombre: r.nombre, ministerio: r.ministerio, fecha: f, desde: r.desde, hasta: r.hasta, tipo: "jornada", marcaId: null, cupo: r.cupo }));
  }
  puntuales.filter((p) => p.fecha >= inicio && p.fecha <= iso(addDays(new Date(inicio + "T00:00"), 6))).forEach((p) =>
    out.push({ key: p.key, nombre: p.nombre, fecha: p.fecha, desde: p.desde, hasta: p.hasta, tipo: "puntual", ministerio: p.ministerio, fijo: p.fijo }));
  return out;
}

const slotDe = (ev: Evento) => diaSemana(ev.fecha) + "|" + ev.desde;

export function Cronograma({
  rol,
  quien = "ana",
  ministerio = "aseo",
  semanaInicio = "2026-10-12",
  plantilla = [],
  reglas = [],
  puntuales = [],
  personas = [],
  miembros = {},
  hoy = "2026-10-13",
  selInicial,
  onCambio,
}: CronogramaProps) {
  const [semana, setSemana] = useState(lunesDe(semanaInicio));
  const [asig, setAsig] = useState<Record<string, string[]>>({});
  const [aprobados, setAprobados] = useState<Set<string>>(new Set());
  const [aceptados, setAceptados] = useState<Set<string>>(new Set());
  const [selKey, setSelKey] = useState<string | null>(selInicial ?? null);
  const [aviso, setAviso] = useState("");

  const eventos = useMemo(() => eventosSemana(semana, plantilla, reglas, puntuales), [semana, plantilla, reglas, puntuales]);
  const indice = useMemo(() => new Map(eventos.map((e) => [e.key, e])), [eventos]);
  const persona = (id: string) => personas.find((p) => p.id === id);

  const fueraDeHorario = (p: PersonaAgenda, ev: Evento) => !ev.marcaId && p.slots && !p.slots.includes(slotDe(ev));

  /* Estado de una persona para un turno. `equipoFn` dice quién está en cada turno;
     se pasa para poder calcular propuestas sin depender de la propuesta misma. */
  function chequeo(pid: string, ev: Evento, equipoFn: (e: Evento) => string[]): { t: string; c: "ok" | "warn" | "bad" } {
    const p = persona(pid);
    if (!p) return { t: "Sin datos", c: "warn" };
    if (equipoFn(ev).includes(pid)) return { t: "Asignado", c: "ok" };
    for (const o of eventos) {
      if (o.key === ev.key || o.fecha !== ev.fecha || o.tipo === "culto") continue;
      if (!equipoFn(o).includes(pid)) continue;
      if (aMin(o.desde) < aMin(ev.hasta) && aMin(ev.desde) < aMin(o.hasta)) return { t: "Choca con " + o.nombre, c: "bad" };
    }
    if (fueraDeHorario(p, ev)) return { t: "No marcó este horario", c: "warn" };
    if (ev.marcaId && !p.marco.includes(ev.marcaId)) return { t: "No marcó este horario", c: "warn" };
    return { t: "Disponible", c: "ok" };
  }

  const estadoDe = (pid: string, ev: Evento) => chequeo(pid, ev, equipoDe);

  /* Propuesta automática: miembros del ministerio disponibles, los que sirvieron hace más tiempo primero */
  const propuesta = (ev: Evento): string[] => {
    if (ev.tipo !== "jornada") return [];
    return (miembros[ev.ministerio ?? ""] ?? [])
      .filter((id) => chequeo(id, ev, equipoGuardado).t === "Disponible")
      .sort((a, b) => (persona(a)?.ultimo ?? "").localeCompare(persona(b)?.ultimo ?? ""))
      .slice(0, ev.cupo ?? 0);
  };

  /* Equipo guardado a mano, sin propuestas */
  const equipoGuardado = (ev: Evento): string[] => {
    if (asig[ev.key]) return asig[ev.key];
    if (ev.tipo === "puntual") return ev.fijo ? [ev.fijo] : [];
    return [];
  };

  /* Equipo de un turno: lo guardado, o la propuesta si todavía no se ha tocado */
  const equipoDe = (ev: Evento): string[] => asig[ev.key] ?? (ev.tipo === "puntual" ? equipoGuardado(ev) : propuesta(ev));

  const guardar = (key: string, lista: string[]) => {
    const nuevo = { ...asig, [key]: lista };
    setAsig(nuevo);
    onCambio?.(nuevo);
  };

  const mostrarAviso = (t: string) => setAviso(t);

  const quitar = (ev: Evento, pid: string) => {
    guardar(ev.key, equipoDe(ev).filter((x) => x !== pid));
    mostrarAviso(`${persona(pid)?.nombre} salió del turno. Se le avisó.`);
  };

  const asignar = (ev: Evento, pid: string) => {
    if (!pid) return;
    guardar(ev.key, [...equipoDe(ev), pid]);
    mostrarAviso(`${persona(pid)?.nombre} asignado a ${ev.nombre}. Se le avisó.`);
  };

  const aprobar = (ev: Evento) => {
    setAprobados(new Set([...aprobados, ev.key]));
    mostrarAviso("Equipo aprobado. Se les envió la invitación.");
  };

  const reproponer = (ev: Evento) => {
    const cand = (miembros[ev.ministerio ?? ""] ?? [])
      .filter((id) => ["Disponible", "Asignado"].includes(chequeo(id, ev, equipoGuardado).t))
      .sort((a, b) => (persona(a)?.ultimo ?? "").localeCompare(persona(b)?.ultimo ?? ""))
      .slice(0, ev.cupo ?? 0);
    guardar(ev.key, cand);
    mostrarAviso("Propuesta nueva lista. Revisa el equipo antes de aprobar.");
  };

  const aceptarTurno = (ev: Evento, pid: string) => {
    setAceptados(new Set([...aceptados, `${ev.key}|${pid}`]));
    mostrarAviso("Confirmado. Te llegará el recordatorio.");
  };

  const noPuedo = (ev: Evento, pid: string) => {
    guardar(ev.key, equipoDe(ev).filter((x) => x !== pid));
    mostrarAviso("Listo. Tu líder recibe tu respuesta y busca reemplazo.");
  };

  /* Turnos visibles: el líder ve su ministerio; el siervo, solo lo suyo */
  const visible = (e: Evento) => {
    if (e.tipo === "culto") return true;
    if (rol === "siervo") return equipoDe(e).includes(quien);
    return e.ministerio === ministerio;
  };
  const evs = eventos.filter(visible);
  const sel = selKey ? indice.get(selKey) : undefined;
  const selVisible = sel && visible(sel) ? sel : undefined;

  const top = (t: string) => (aMin(t) - 420) * 40 / 60;
  const alto = (d: string, h: string) => (aMin(h) - aMin(d)) * 40 / 60;
  const dias = Array.from({ length: 7 }, (_, i) => addDays(new Date(semana + "T00:00"), i));
  const finSemana = iso(addDays(new Date(semana + "T00:00"), 6));

  const mover = (n: number) => setSemana(iso(addDays(new Date(semana + "T00:00"), n * 7)));

  return (
    <div className="cro-wrap">
      <header className="cro-cab">
        <div>
          <span className="k-label">{rol === "lider" ? `Líder · ${NOMBRE[ministerio] ?? ministerio}` : "Siervo"}</span>
          <h1>Semana del {corto(semana)} al {corto(finSemana)}</h1>
        </div>
        <div className="cro-acciones">
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => mover(-1)} aria-label="Semana anterior">←</button>
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => mover(1)} aria-label="Semana siguiente">→</button>
        </div>
      </header>

      <div className="cro-leyenda">
        {rol === "lider" ? (
          <>
            <span><i style={{ ["--c" as string]: "var(--muted)" }} />Culto</span>
            <span><i style={{ ["--c" as string]: COLOR[ministerio] ?? "var(--ok)" }} />{NOMBRE[ministerio] ?? ministerio}</span>
          </>
        ) : (
          <>
            <span><i style={{ ["--c" as string]: "var(--warm)" }} />Mis turnos</span>
            <span><i style={{ ["--c" as string]: "var(--muted)" }} />Culto</span>
          </>
        )}
      </div>

      {aviso && <div className="aviso" role="status">{aviso}</div>}

      <div className="cal" role="grid" aria-label="Semana">
        <div className="cal__head" />
        {dias.map((d, i) => (
          <div key={i} className={"cal__head" + (iso(d) === hoy ? " cal__head--hoy" : "")}>
            <b>{d.getDate()}</b>{DIAS[i]}
          </div>
        ))}
        <div className="cal__horas">
          {Array.from({ length: 16 }, (_, k) => 7 + k).map((h) => (
            <span key={h} style={{ top: (h * 60 - 420) * 40 / 60 }}>{pad(h)}:00</span>
          ))}
        </div>
        {dias.map((d) => {
          const f = iso(d);
          return (
            <div key={f} className="cal__col">
              {evs.filter((e) => e.fecha === f).map((e) => (
                <button
                  key={e.key}
                  type="button"
                  className="bloque"
                  style={{ top: top(e.desde), height: Math.max(alto(e.desde, e.hasta), 28), ["--c" as string]: e.tipo === "culto" ? "var(--muted)" : COLOR[e.ministerio ?? ""] ?? "var(--ok)" }}
                  aria-pressed={selKey === e.key}
                  onClick={() => setSelKey(e.key)}
                >
                  <b>{e.nombre}</b>
                  <small>{e.desde}–{e.hasta}</small>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <section className="caja" aria-live="polite">
        {!selVisible ? (
          <p className="k-muted">Toca un bloque para ver el detalle.</p>
        ) : selVisible.tipo === "culto" ? (
          <p className="k-muted">Culto de la iglesia.</p>
        ) : selVisible.tipo === "puntual" ? (
          <p>{persona(selVisible.fijo ?? "")?.nombre ?? "—"} · asignado a mano</p>
        ) : rol === "siervo" ? (
          <SiervoDetalle
            ev={selVisible}
            confirmado={aceptados.has(`${selVisible.key}|${quien}`)}
            onAceptar={() => aceptarTurno(selVisible, quien)}
            onNoPuedo={() => noPuedo(selVisible, quien)}
            titulo={largo(selVisible.fecha)}
          />
        ) : (
          <LiderDetalle
            ev={selVisible}
            titulo={largo(selVisible.fecha)}
            equipo={equipoDe(selVisible)}
            personas={personas}
            estadoDe={estadoDe}
            aprobado={aprobados.has(selVisible.key)}
            onQuitar={(pid) => quitar(selVisible, pid)}
            onAsignar={(pid) => asignar(selVisible, pid)}
            onAprobar={() => aprobar(selVisible)}
            onReproponer={() => reproponer(selVisible)}
            persona={persona}
          />
        )}
      </section>
    </div>
  );
}

function SiervoDetalle({ ev, confirmado, onAceptar, onNoPuedo, titulo }: {
  ev: Evento; confirmado: boolean; onAceptar: () => void; onNoPuedo: () => void; titulo: string;
}) {
  return (
    <div className="cro-detalle">
      <strong>{ev.nombre}</strong>
      <span className="k-muted">{titulo} · {ev.desde}–{ev.hasta}</span>
      {confirmado ? (
        <span className="k-status k-status--ok">Confirmado</span>
      ) : (
        <div className="cro-acciones">
          <button type="button" className="k-btn k-btn--auto" onClick={onAceptar}>Acepto</button>
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={onNoPuedo}>No puedo</button>
        </div>
      )}
    </div>
  );
}

function LiderDetalle({ ev, titulo, equipo, personas, estadoDe, aprobado, onQuitar, onAsignar, onAprobar, onReproponer, persona }: {
  ev: Evento;
  titulo: string;
  equipo: string[];
  personas: PersonaAgenda[];
  estadoDe: (pid: string, ev: Evento) => { t: string; c: "ok" | "warn" | "bad" };
  aprobado: boolean;
  onQuitar: (pid: string) => void;
  onAsignar: (pid: string) => void;
  onAprobar: () => void;
  onReproponer: () => void;
  persona: (id: string) => PersonaAgenda | undefined;
}) {
  const fuera = personas.filter((p) => !equipo.includes(p.id));
  const cupo = ev.cupo ?? 0;
  return (
    <div className="cro-detalle">
      <strong>{ev.nombre}</strong>
      <span className="k-muted">{titulo} · {ev.desde}–{ev.hasta}</span>

      <div className="cro-acciones">
        <span className={"k-status " + (equipo.length < cupo ? "k-status--warn" : "k-status--ok")}>
          {equipo.length} de {cupo} asignados
        </span>
        {aprobado && <span className="k-status k-status--ok">Aprobado</span>}
      </div>

      {equipo.map((pid) => (
        <div key={pid} className="cro-fila">
          <div>
            <strong>{persona(pid)?.nombre}</strong>
            <div className="k-muted">Último turno: {corto(persona(pid)?.ultimo ?? "")}</div>
          </div>
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => onQuitar(pid)}>Quitar</button>
        </div>
      ))}

      <div className="cro-fila cro-fila--final">
        <label className="k-field">
          <span className="k-field__label">Asignar a</span>
          <select
            className="k-select"
            defaultValue=""
            onChange={(e) => { onAsignar(e.target.value); e.target.value = ""; }}
          >
            <option value="">Elegir…</option>
            {fuera.map((p) => {
              const e = estadoDe(p.id, ev);
              return <option key={p.id} value={p.id} disabled={e.c === "bad"}>{p.nombre} — {e.t}</option>;
            })}
          </select>
        </label>
        <div className="cro-acciones">
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={onReproponer}>Proponer otro equipo</button>
          <button type="button" className="k-btn k-btn--auto" onClick={onAprobar} disabled={aprobado}>Aprobar</button>
        </div>
      </div>
    </div>
  );
}
