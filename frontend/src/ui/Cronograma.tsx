import { useMemo, useState, type CSSProperties } from "react";
import "./kit.css";
import "./Cronograma.css";

/* Cronograma Fey: vista de año y de semana, por rol (Líder o Siervo).
   Datos de ejemplo al inicio del archivo; reemplazar por los del backend. */

type Ministerio = "aseo" | "sonido";
type Tipo = "culto" | "jornada" | "puntual";

interface Evento {
  key: string;
  fecha: string;
  desde: string;
  hasta: string;
  nombre: string;
  tipo: Tipo;
  ministerio?: Ministerio;
  marcaId?: string | null;
  cupo?: number;
  fijo?: string;
}

interface Persona { id: string; nombre: string; marco: string[]; ultimo: string }

const MINISTERIOS: Record<Ministerio, { nombre: string; color: string }> = {
  aseo: { nombre: "Aseo", color: "var(--warm)" },
  sonido: { nombre: "Sonido", color: "var(--ok)" },
};
const CULTO_COLOR = "var(--muted)";

// dia: 0 = lunes ... 6 = domingo
const PLANTILLA = [
  { id: "c1", nombre: "Culto 1", dia: 6, desde: "08:00", hasta: "09:30" },
  { id: "c2", nombre: "Culto 2", dia: 6, desde: "10:00", hasta: "11:30" },
  { id: "ee", nombre: "Entre semana", dia: 2, desde: "19:00", hasta: "21:00" },
];
const REGLAS = [
  { id: "aseo-post", ministerio: "aseo" as Ministerio, nombre: "Aseo después del culto", despuesDe: "c2", desde: "11:30", hasta: "13:00", cupo: 4 },
  { id: "sonido-ens", ministerio: "sonido" as Ministerio, nombre: "Ensayo de sonido", dia: 3, desde: "18:30", hasta: "20:00", cupo: 3 },
];
const PERSONAS: Persona[] = [
  { id: "ana", nombre: "Ana Ruiz", marco: ["c1", "c2"], ultimo: "2026-09-13" },
  { id: "luis", nombre: "Luis Ortiz", marco: ["c2"], ultimo: "2026-09-27" },
  { id: "marta", nombre: "Marta Vélez", marco: ["c2"], ultimo: "2026-08-30" },
  { id: "jorge", nombre: "Jorge Peña", marco: ["c2", "ee"], ultimo: "2026-10-04" },
  { id: "camila", nombre: "Camila Soto", marco: ["c1"], ultimo: "2026-07-19" },
  { id: "diego", nombre: "Diego Mora", marco: ["c2"], ultimo: "2026-09-06" },
];
const PUNTUALES = [
  { key: "ens-dom-18", ministerio: "sonido" as Ministerio, fecha: "2026-10-18", desde: "10:30", hasta: "11:45", nombre: "Ensayo de sonido", fijo: "jorge" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const aMin = (h: string) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const diaSemana = (d: Date) => (d.getDay() + 6) % 7;
const lunesDe = (f: string) => { const d = new Date(f + "T00:00"); return addDays(d, -diaSemana(d)); };
const fmt = (f: string, o: Intl.DateTimeFormatOptions) => new Date(f + "T00:00").toLocaleDateString("es-CO", o);
const persona = (id: string) => PERSONAS.find((p) => p.id === id);
const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function eventosEn(a: Date, b: Date): Evento[] {
  const out: Evento[] = [];
  for (let d = new Date(a); d <= b; d = addDays(d, 1)) {
    const f = iso(d), wd = diaSemana(d);
    PLANTILLA.filter((s) => s.dia === wd).forEach((s) => {
      out.push({ key: `${s.id}-${f}`, fecha: f, desde: s.desde, hasta: s.hasta, nombre: s.nombre, tipo: "culto", marcaId: s.id });
      REGLAS.filter((r) => r.despuesDe === s.id).forEach((r) =>
        out.push({ key: `${r.id}-${f}`, fecha: f, desde: r.desde, hasta: r.hasta, nombre: r.nombre, tipo: "jornada", ministerio: r.ministerio, marcaId: s.id, cupo: r.cupo }));
    });
    REGLAS.filter((r) => "dia" in r && r.dia === wd).forEach((r) =>
      out.push({ key: `${r.id}-${f}`, fecha: f, desde: r.desde, hasta: r.hasta, nombre: r.nombre, tipo: "jornada", ministerio: r.ministerio, marcaId: null, cupo: r.cupo }));
  }
  PUNTUALES.filter((p) => p.fecha >= iso(a) && p.fecha <= iso(b))
    .forEach((p) => out.push({ key: p.key, fecha: p.fecha, desde: p.desde, hasta: p.hasta, nombre: p.nombre, tipo: "puntual", ministerio: p.ministerio, fijo: p.fijo }));
  return out;
}

const INDICE = new Map<string, Evento>();
eventosEn(new Date(2025, 0, 1), new Date(2027, 11, 31)).forEach((e) => INDICE.set(e.key, e));

function choqueCon(pid: string, ev: Evento, asig: Record<string, string[]>): string | null {
  for (const k of Object.keys(asig)) {
    if (k === ev.key || !asig[k].includes(pid)) continue;
    const o = INDICE.get(k);
    if (!o || o.fecha !== ev.fecha) continue;
    if (aMin(o.desde) < aMin(ev.hasta) && aMin(ev.desde) < aMin(o.hasta)) return o.nombre;
  }
  return null;
}

type Estado = { t: string; c: "ok" | "warn" | "bad" };
function estadoDe(p: Persona, ev: Evento, asig: Record<string, string[]>): Estado {
  if ((asig[ev.key] || []).includes(p.id)) return { t: "Asignado", c: "ok" };
  const ch = choqueCon(p.id, ev, asig);
  if (ch) return { t: "Choca con " + ch, c: "bad" };
  if (ev.marcaId && !p.marco.includes(ev.marcaId)) return { t: "No marcó este horario", c: "warn" };
  return { t: "Disponible", c: "ok" };
}
function proponer(ev: Evento, asig: Record<string, string[]>): string[] {
  return PERSONAS.filter((p) => estadoDe(p, ev, asig).t === "Disponible")
    .sort((a, b) => a.ultimo.localeCompare(b.ultimo))
    .slice(0, ev.cupo ?? 0)
    .map((p) => p.id);
}
function asignacionInicial(): Record<string, string[]> {
  const asig: Record<string, string[]> = {};
  PUNTUALES.forEach((p) => { asig[p.key] = [p.fijo]; });
  [...INDICE.values()].filter((e) => e.tipo === "jornada")
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .forEach((ev) => { asig[ev.key] = proponer(ev, asig); });
  return asig;
}

const PREF = "cronograma.vista";
const leerPref = (): string | null => { try { return localStorage.getItem(PREF); } catch { return null; } };
const guardarPref = (v: string | null) => { try { if (v) localStorage.setItem(PREF, v); else localStorage.removeItem(PREF); } catch { /* sin almacenamiento */ } };

export function Cronograma({ rol = "lider" }: { rol?: "lider" | "siervo" }) {
  const [vista, setVista] = useState<"anio" | "semana">(leerPref() === "semana" ? "semana" : "anio");
  const [recordar, setRecordar] = useState(!!leerPref());
  const [minSel, setMinSel] = useState<Ministerio | "todos">("aseo");
  const [quien, setQuien] = useState("ana");
  const [anio, setAnio] = useState(() => new Date().getFullYear());
  const [semana, setSemana] = useState(() => lunesDe("2026-10-12"));
  const [selFecha, setSelFecha] = useState<string | null>("2026-10-18");
  const [selKey, setSelKey] = useState<string | null>(null);
  const [diaSel, setDiaSel] = useState(0);
  const [asig, setAsig] = useState<Record<string, string[]>>(asignacionInicial);
  const [aceptados, setAceptados] = useState<Set<string>>(new Set());
  const [aprobados, setAprobados] = useState<Set<string>>(new Set());

  const visible = (e: Evento) => {
    if (e.tipo === "culto") return true;
    if (rol === "siervo") return (asig[e.key] || []).includes(quien);
    return minSel === "todos" || e.ministerio === minSel;
  };
  const colorDe = (e: Evento) => (e.tipo === "culto" || !e.ministerio ? CULTO_COLOR : MINISTERIOS[e.ministerio].color);

  const cambiarVista = (v: "anio" | "semana") => {
    setVista(v);
    if (recordar) guardarPref(v);
  };
  const alternarRecordar = (on: boolean) => { setRecordar(on); guardarPref(on ? vista : null); };
  const irASemana = (f: string) => {
    setSemana(lunesDe(f));
    setDiaSel(diaSemana(new Date(f + "T00:00")));
    setSelKey(null);
    cambiarVista("semana");
  };

  const titulo = useMemo(() => {
    if (vista === "anio") return `Año ${anio}`;
    const fin = addDays(semana, 6);
    return `${fmt(iso(semana), { day: "numeric", month: "short" })} – ${fmt(iso(fin), { day: "numeric", month: "short", year: "numeric" })}`;
  }, [vista, anio, semana]);

  return (
    <div className="cro-wrap">
      <header className="cro-cab">
        <div>
          <span className="k-label">{vista === "anio" ? "Cronograma" : "Semana"}</span>
          <h1>{titulo}</h1>
        </div>
        <div className="cro-acciones">
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" aria-label="Anterior"
            onClick={() => (vista === "anio" ? setAnio(anio - 1) : setSemana(addDays(semana, -7)))}>←</button>
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" aria-label="Siguiente"
            onClick={() => (vista === "anio" ? setAnio(anio + 1) : setSemana(addDays(semana, 7)))}>→</button>
        </div>
      </header>

      <div className="cro-controles">
        <div className="k-seg" role="group" aria-label="Vista">
          <button type="button" aria-pressed={vista === "anio"} onClick={() => cambiarVista("anio")}>Año</button>
          <button type="button" aria-pressed={vista === "semana"} onClick={() => cambiarVista("semana")}>Semana</button>
        </div>
        {rol === "lider" && (
          <div className="k-seg" role="group" aria-label="Ministerio">
            {(["aseo", "sonido", "todos"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={minSel === m} onClick={() => { setMinSel(m); setSelKey(null); }}>
                {m === "todos" ? "Todos" : MINISTERIOS[m].nombre}
              </button>
            ))}
          </div>
        )}
        {rol === "siervo" && (
          <label className="k-field cro-quien">
            <span className="k-field__label">Entrar como</span>
            <select className="k-select" value={quien} onChange={(e) => { setQuien(e.target.value); setSelKey(null); }}>
              {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </label>
        )}
        <label className="cro-recordar">
          <input type="checkbox" checked={recordar} onChange={(e) => alternarRecordar(e.target.checked)} /> Abrir siempre en esta vista
        </label>
      </div>

      <div className="cro-leyenda">
        {rol === "lider" && minSel !== "todos" && (
          <>
            <span><i style={{ "--c": CULTO_COLOR } as CSSProperties} />Culto</span>
            <span><i style={{ "--c": MINISTERIOS[minSel].color } as CSSProperties} />{MINISTERIOS[minSel].nombre}</span>
          </>
        )}
        {rol === "lider" && minSel === "todos" && (
          <>
            <span><i style={{ "--c": CULTO_COLOR } as CSSProperties} />Culto</span>
            <span><i style={{ "--c": MINISTERIOS.aseo.color } as CSSProperties} />Aseo</span>
            <span><i style={{ "--c": MINISTERIOS.sonido.color } as CSSProperties} />Sonido</span>
          </>
        )}
        {rol === "siervo" && (
          <>
            <span><i style={{ "--c": "var(--warm)" } as CSSProperties} />Mis turnos</span>
            <span><i style={{ "--c": CULTO_COLOR } as CSSProperties} />Culto</span>
          </>
        )}
      </div>

      {vista === "anio" ? (
        <VistaAnio
          anio={anio}
          selFecha={selFecha}
          visible={visible}
          colorDe={colorDe}
          rol={rol}
          quien={quien}
          asig={asig}
          onDia={setSelFecha}
          onVerSemana={irASemana}
        />
      ) : (
        <VistaSemana
          semana={semana}
          diaSel={diaSel}
          setDiaSel={setDiaSel}
          visible={visible}
          colorDe={colorDe}
          rol={rol}
          minSel={minSel}
          quien={quien}
          asig={asig}
          setAsig={setAsig}
          selKey={selKey}
          setSelKey={setSelKey}
          aceptados={aceptados}
          setAceptados={setAceptados}
          aprobados={aprobados}
          setAprobados={setAprobados}
        />
      )}
    </div>
  );
}

/* ---------- Año ---------- */
function VistaAnio(props: {
  anio: number; selFecha: string | null; visible: (e: Evento) => boolean; colorDe: (e: Evento) => string;
  rol: "lider" | "siervo"; quien: string; asig: Record<string, string[]>;
  onDia: (f: string) => void; onVerSemana: (f: string) => void;
}) {
  const { anio, selFecha, visible, rol, quien, asig, onDia, onVerSemana } = props;
  const hoy = new Date();
  const inicioMes = anio === hoy.getFullYear() ? hoy.getMonth() : 0;
  const todos = useMemo(() => eventosEn(new Date(anio, 0, 1), new Date(anio, 11, 31)), [anio]);
  const porFecha = useMemo(() => {
    const m: Record<string, Evento[]> = {};
    todos.forEach((e) => (m[e.fecha] ||= []).push(e));
    return m;
  }, [todos]);
  const lista = selFecha ? (porFecha[selFecha] || []).filter(visible) : [];

  return (
    <>
      <div className="anio">
        {Array.from({ length: 12 - inicioMes }, (_, k) => {
          const m = inicioMes + k;
          const primero = new Date(anio, m, 1);
          const offset = diaSemana(primero);
          const dias = new Date(anio, m + 1, 0).getDate();
          const celdas = [];
          for (let i = 0; i < offset; i++) celdas.push(<span key={`v${i}`} className="dia dia--vacio" />);
          for (let dd = 1; dd <= dias; dd++) {
            const f = iso(new Date(anio, m, dd));
            const items = (porFecha[f] || []).filter(visible);
            const mio = rol === "siervo" && items.some((e) => e.tipo !== "culto");
            const atenuado = rol === "siervo" && items.length === 0;
            const cls = ["dia", mio && "dia--mio", selFecha === f && "dia--sel", atenuado && "dia--atenuado"].filter(Boolean).join(" ");
            const pts = [...new Set(items.map((e) => (e.tipo === "culto" ? "culto" : e.ministerio || "culto")))].slice(0, 3);
            celdas.push(
              <button key={f} type="button" className={cls} onClick={() => onDia(f)}>
                {dd}
                {pts.length > 0 && (
                  <span className="dia__pts">
                    {pts.map((t) => <i key={t} style={{ "--c": t === "culto" ? CULTO_COLOR : MINISTERIOS[t as Ministerio].color } as CSSProperties} />)}
                  </span>
                )}
              </button>
            );
          }
          return (
            <div key={m} className="mes">
              <h3>{primero.toLocaleDateString("es-CO", { month: "long" })}</h3>
              <div className="mes__rejilla">
                {["L", "M", "X", "J", "V", "S", "D"].map((x) => <span key={x} className="mes__dia-n">{x}</span>)}
                {celdas}
              </div>
            </div>
          );
        })}
      </div>

      <div className="caja detalle">
        {!selFecha && <p className="k-muted">Toca un día para ver sus turnos.</p>}
        {selFecha && (
          <>
            <strong>{capitalizar(fmt(selFecha, { weekday: "long", day: "numeric", month: "long" }))}</strong>
            {lista.length === 0 && <p className="k-muted">Sin turnos para mostrar.</p>}
            {lista.map((e) => (
              <div key={e.key} className="cro-bloque-detalle">
                <div><strong>{e.nombre}</strong><div className="k-muted">{e.desde}–{e.hasta}</div></div>
                {e.tipo !== "culto" &&
                  (asig[e.key] || []).map((pid) => (
                    <div key={pid} className="cro-fila">
                      <span>{persona(pid)?.nombre}</span>
                      {pid === quien && rol === "siervo" && <span className="k-status k-status--ok">Tú</span>}
                    </div>
                  ))}
              </div>
            ))}
            <div className="acciones">
              <button type="button" className="k-btn" onClick={() => onVerSemana(selFecha)}>Ver esta semana</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ---------- Semana ---------- */
function VistaSemana(props: {
  semana: Date; diaSel: number; setDiaSel: (n: number) => void; visible: (e: Evento) => boolean;
  colorDe: (e: Evento) => string; rol: "lider" | "siervo"; minSel: Ministerio | "todos"; quien: string;
  asig: Record<string, string[]>; setAsig: (fn: (a: Record<string, string[]>) => Record<string, string[]>) => void;
  selKey: string | null; setSelKey: (k: string | null) => void;
  aceptados: Set<string>; setAceptados: (fn: (s: Set<string>) => Set<string>) => void;
  aprobados: Set<string>; setAprobados: (fn: (s: Set<string>) => Set<string>) => void;
}) {
  const { semana, diaSel, setDiaSel, visible, colorDe, rol, minSel, quien, asig, setAsig, selKey, setSelKey, aceptados, setAceptados, aprobados, setAprobados } = props;
  const dias = Array.from({ length: 7 }, (_, i) => addDays(semana, i));
  const hoy = iso(new Date());
  const evs = useMemo(() => eventosEn(semana, addDays(semana, 6)).filter(visible), [semana, visible]);
  const top = (t: string) => ((aMin(t) - 420) * 40) / 60;
  const alto = (d: string, h: string) => ((aMin(h) - aMin(d)) * 40) / 60;
  const ev = selKey ? INDICE.get(selKey) : undefined;

  const quitar = (k: string, pid: string) => {
    setAsig((a) => ({ ...a, [k]: (a[k] || []).filter((x) => x !== pid) }));
    setAceptados((s) => { const n = new Set(s); n.delete(k + "|" + pid); return n; });
  };

  return (
    <>
      <div className="cal-sel">
        {dias.map((d, i) => (
          <button key={i} type="button" className={`k-btn ${i === diaSel ? "" : "k-btn--ghost"}`} style={{ width: "auto" }} onClick={() => setDiaSel(i)}>
            {DIAS_CORTOS[i]} {d.getDate()}
          </button>
        ))}
      </div>

      <div className="cal">
        <div className="cal__head" />
        {dias.map((d, i) => (
          <div key={i} className={`cal__head ${iso(d) === hoy ? "cal__head--hoy" : ""} ${i === diaSel ? "cal__head--sel" : ""}`}>
            <b>{d.getDate()}</b>{DIAS_CORTOS[i]}
          </div>
        ))}
        <div className="cal__horas">
          {Array.from({ length: 16 }, (_, k) => 7 + k).map((h) => (
            <span key={h} style={{ top: ((h * 60 - 420) * 40) / 60 }}>{pad(h)}:00</span>
          ))}
        </div>
        {dias.map((d, i) => {
          const f = iso(d);
          return (
            <div key={i} className={`cal__col ${i === diaSel ? "cal__col--sel" : ""}`}>
              {evs.filter((e) => e.fecha === f).map((e) => (
                <button key={e.key} type="button" className="bloque"
                  style={{ top: top(e.desde), height: Math.max(alto(e.desde, e.hasta), 28), "--c": colorDe(e) } as CSSProperties}
                  aria-pressed={selKey === e.key} onClick={() => setSelKey(e.key)}>
                  <b>{e.nombre}</b>
                  <small>{e.desde}–{e.hasta}</small>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="caja detalle">
        {!ev && <p className="k-muted">Toca un bloque para ver el detalle.</p>}
        {ev && (
          <>
            <div className="cro-fila">
              <strong>{ev.nombre}</strong>
              <span className="k-muted">{capitalizar(fmt(ev.fecha, { weekday: "long", day: "numeric", month: "short" }))} · {ev.desde}–{ev.hasta}</span>
            </div>

            {ev.tipo === "culto" && <span className="k-muted">Culto de la iglesia.</span>}

            {ev.tipo === "puntual" && (
              <span className="k-status k-status--ok">{persona(ev.fijo || "")?.nombre} · asignado a mano</span>
            )}

            {ev.tipo === "jornada" && rol === "siervo" && (() => {
              const k = ev.key + "|" + quien;
              return aceptados.has(k) ? (
                <span className="k-status k-status--ok">Confirmado</span>
              ) : (
                <div className="acciones">
                  <button type="button" className="k-btn" style={{ width: "auto" }} onClick={() => setAceptados((s) => new Set(s).add(k))}>Acepto</button>
                  <button type="button" className="k-btn k-btn--ghost" style={{ width: "auto" }}
                    onClick={() => { setAsig((a) => ({ ...a, [ev.key]: (a[ev.key] || []).filter((x) => x !== quien) })); }}>No puedo</button>
                </div>
              );
            })()}

            {ev.tipo === "jornada" && rol === "lider" && minSel === "todos" && (
              <span className="k-muted">Equipo: {(asig[ev.key] || []).map((pid) => persona(pid)?.nombre).join(", ") || "sin personas"}. Para aprobar o asignar, elige el ministerio.</span>
            )}

            {ev.tipo === "jornada" && rol === "lider" && minSel !== "todos" && (
              <EquipoJornada ev={ev} asig={asig} setAsig={setAsig} aprobados={aprobados} setAprobados={setAprobados} quitar={quitar} />
            )}
          </>
        )}
      </div>
    </>
  );
}

function EquipoJornada(props: {
  ev: Evento; asig: Record<string, string[]>; setAsig: (fn: (a: Record<string, string[]>) => Record<string, string[]>) => void;
  aprobados: Set<string>; setAprobados: (fn: (s: Set<string>) => Set<string>) => void; quitar: (k: string, pid: string) => void;
}) {
  const { ev, asig, setAsig, aprobados, setAprobados, quitar } = props;
  const equipo = asig[ev.key] || [];
  const cupo = ev.cupo ?? 0;
  const ok = aprobados.has(ev.key);
  const opciones = PERSONAS.filter((p) => !equipo.includes(p.id));

  return (
    <>
      <div className="acciones">
        <span className={`k-status ${equipo.length < cupo ? "k-status--warn" : "k-status--ok"}`}>{equipo.length} de {cupo} asignados</span>
        {ok && <span className="k-status k-status--ok">Aprobado</span>}
      </div>
      {equipo.map((pid) => (
        <div key={pid} className="cro-fila">
          <div>
            <strong>{persona(pid)?.nombre}</strong>
            <div className="k-muted">Último turno: {fmt(persona(pid)?.ultimo ?? "", { day: "numeric", month: "short" })}</div>
          </div>
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => quitar(ev.key, pid)}>Quitar</button>
        </div>
      ))}
      <div className="cro-fila cro-fila--final">
        <label className="k-field" style={{ minWidth: 240 }}>
          <span className="k-field__label">Asignar a</span>
          <select className="k-select" value="" onChange={(e) => {
            const pid = e.target.value;
            if (!pid) return;
            setAsig((a) => ({ ...a, [ev.key]: [...(a[ev.key] || []), pid] }));
          }}>
            <option value="">Elegir…</option>
            {opciones.map((p) => {
              const est = estadoDe(p, ev, asig);
              return <option key={p.id} value={p.id} disabled={est.c === "bad"}>{p.nombre} — {est.t}</option>;
            })}
          </select>
        </label>
        <div className="acciones">
          <button type="button" className="k-btn k-btn--ghost" onClick={() => {
            setAsig((a) => ({ ...a, [ev.key]: proponer(ev, a) }));
            setAprobados((s) => { const n = new Set(s); n.delete(ev.key); return n; });
          }}>Proponer otro equipo</button>
          <button type="button" className="k-btn" disabled={ok} onClick={() => setAprobados((s) => new Set(s).add(ev.key))}>Aprobar</button>
        </div>
      </div>
    </>
  );
}

function capitalizar(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
