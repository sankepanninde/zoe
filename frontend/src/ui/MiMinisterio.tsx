import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import "./MinisteriosPastor.css";
import type { Horario, Persona } from "./MinisteriosPastor";

/* Pantalla del Líder: define los horarios de servicio de su ministerio
   y arma el equipo. Usa los estilos compartidos de MinisteriosPastor.css. */

export interface TurnoIncompleto {
  fecha: string; // "2026-10-18"
  desde: string; // "11:30"
  faltan: number;
}

export interface MiMinisterioProps {
  ministerio?: { id: string; nombre: string };
  horarios?: Horario[];
  personas?: Persona[];
  /** Turnos del cronograma que aún no tienen el equipo completo. */
  incompletos?: TurnoIncompleto[];
  /** Cuando no hay internet, se deshabilitan las acciones que guardan. */
  sinConexion?: boolean;
  onCambio?: (horarios: Horario[], personas: Persona[]) => void;
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HORA = /^\d{2}:\d{2}$/;

const iniciales = (n: string) =>
  n.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function MiMinisterio({
  ministerio = { id: "aseo", nombre: "Aseo" },
  horarios: inicialHor = [],
  personas: inicialPer = [],
  incompletos = [],
  sinConexion = false,
  onCambio,
}: MiMinisterioProps) {
  const [horarios, setHorarios] = useState<Horario[]>(inicialHor);
  const [personas, setPersonas] = useState<Persona[]>(inicialPer);
  const [aviso, setAviso] = useState<{ texto: string; warn?: boolean } | null>(null);
  const [errHor, setErrHor] = useState("");
  const [dia, setDia] = useState("6");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cupo, setCupo] = useState("4");

  const dlgEquipo = useRef<HTMLDialogElement>(null);
  const seleccion = useRef<Set<string>>(new Set());

  const miembros = personas.filter((p) => p.mins.includes(ministerio.id));
  const disponibles = personas.filter((p) => !p.mins.includes(ministerio.id));
  const cupoTotal = horarios.reduce((a, h) => a + h.cupo, 0);
  const pct = cupoTotal ? Math.min(100, Math.round((miembros.length / cupoTotal) * 100)) : 0;

  const actualizar = (nuevoHor: Horario[], nuevaPer: Persona[]) => {
    setHorarios(nuevoHor);
    setPersonas(nuevaPer);
    onCambio?.(nuevoHor, nuevaPer);
  };

  const mostrarAviso = (texto: string, warn = false) => setAviso({ texto, warn });

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2800);
    return () => clearTimeout(t);
  }, [aviso]);

  const agregarHorario = (e: FormEvent) => {
    e.preventDefault();
    if (!HORA.test(desde) || !HORA.test(hasta)) return setErrHor("Escribe las horas como 11:30 y 13:00.");
    if (hasta <= desde) return setErrHor("La hora de fin debe ser después de la de inicio.");
    const n = Number(cupo);
    if (!(n >= 1)) return setErrHor("Indica cuántas personas se necesitan.");
    setErrHor("");
    const nuevo: Horario = { id: Date.now(), dia: Number(dia), desde, hasta, cupo: n, ancla: "" };
    const lista = [...horarios, nuevo].sort((a, b) => a.dia - b.dia || a.desde.localeCompare(b.desde));
    setDesde("");
    setHasta("");
    actualizar(lista, personas);
    mostrarAviso("Horario agregado. Se crearán turnos para las próximas semanas.");
  };

  const quitarHorario = (id: number) => {
    actualizar(horarios.filter((h) => h.id !== id), personas);
    mostrarAviso("Horario quitado. Los turnos futuros de ese horario se cancelan.", true);
  };

  const quitarPersona = (pid: string) => {
    const p = personas.find((x) => x.id === pid);
    if (!p) return;
    actualizar(
      horarios,
      personas.map((x) => (x.id === pid ? { ...x, mins: x.mins.filter((m) => m !== ministerio.id) } : x)),
    );
    mostrarAviso(`${p.nombre} salió del equipo. Ya no le llegarán turnos de ${ministerio.nombre}.`, true);
  };

  const abrirEquipo = () => {
    seleccion.current = new Set();
    dlgEquipo.current?.showModal();
  };

  const agregarEquipo = () => {
    const ids = [...seleccion.current];
    dlgEquipo.current?.close();
    if (!ids.length) return;
    actualizar(
      horarios,
      personas.map((p) => (ids.includes(p.id) && !p.mins.includes(ministerio.id) ? { ...p, mins: [...p.mins, ministerio.id] } : p)),
    );
    mostrarAviso(`${ids.length === 1 ? "1 persona agregada" : ids.length + " personas agregadas"} a tu equipo. Se les avisó.`);
  };

  const totalFaltan = incompletos.reduce((a, x) => a + x.faltan, 0);

  return (
    <div className="min-wrap">
      <header className="k-hello min-hello">
        <span className="k-label">Líder de ministerio</span>
        <h1>{ministerio.nombre}</h1>
        <p className="k-muted">Defines cuándo sirve tu ministerio y quién forma parte del equipo.</p>
      </header>

      <div className="k-stats-strip min-stats" aria-label="Resumen">
        <div><b>{miembros.length}</b><span>Personas en el equipo</span></div>
        <div><b>{horarios.length}</b><span>Horarios</span></div>
        <div>
          <span>Cupo cubierto · {miembros.length} de {cupoTotal}</span>
          <div className="k-track" aria-label="Cupo cubierto">
            <div className={"k-track__fill" + (pct < 100 ? " k-track__fill--low" : "")} style={{ width: pct + "%" }} />
          </div>
        </div>
      </div>

      {sinConexion && (
        <div className="aviso aviso--warn" role="alert">
          Sin conexión. No podemos guardar cambios hasta que vuelva internet. Lo que escribas se conserva aquí.
        </div>
      )}
      {aviso && <div className={"aviso" + (aviso.warn ? " aviso--warn" : "")} role="status">{aviso.texto}</div>}

      {incompletos.length > 0 && (
        <section className="caja acento min-alerta" style={{ ["--c" as string]: "var(--danger)" }} aria-live="polite">
          <div className="caja__cab">
            <div>
              <h2 className="min-h2">Faltan {totalFaltan} {totalFaltan === 1 ? "persona" : "personas"} en {ministerio.nombre}</h2>
              <p className="ayuda">
                {incompletos.length} {incompletos.length === 1 ? "turno pendiente" : "turnos pendientes"}. Agrega personas de tu ministerio o revisa la propuesta.
              </p>
            </div>
            <button type="button" className="k-btn k-btn--auto" onClick={abrirEquipo} disabled={sinConexion}>
              Agregar personas
            </button>
          </div>
          {incompletos.slice(0, 3).map((x) => {
            const f = new Date(x.fecha + "T00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
            return (
              <div key={x.fecha + x.desde} className="fila">
                <div><strong>{f} · {x.desde}</strong><small>Faltan {x.faltan}</small></div>
              </div>
            );
          })}
        </section>
      )}

      {/* Horarios */}
      <section className="caja acento" style={{ ["--c" as string]: "var(--warm)" }} aria-labelledby="min-horarios">
        <div>
          <h2 id="min-horarios" className="min-h2">Horarios de servicio</h2>
          <p className="ayuda">Cada horario genera turnos para tu equipo. Los siervos lo ven en su disponibilidad.</p>
        </div>
        <div>
          {horarios.length === 0 ? (
            <p className="k-muted">Aún no hay horarios. Agrega el primero abajo.</p>
          ) : (
            horarios.map((h) => (
              <div key={h.id} className="fila">
                <div>
                  <strong>{DIAS[h.dia]} · {h.desde} – {h.hasta}</strong>
                  <small>{h.ancla ? `Después de ${h.ancla}` : "Horario propio"} · se necesitan {h.cupo} personas</small>
                </div>
                <button
                  type="button"
                  className="k-btn k-btn--ghost k-btn--auto"
                  onClick={() => quitarHorario(h.id)}
                  disabled={sinConexion}
                >
                  Quitar
                </button>
              </div>
            ))
          )}
        </div>

        <form className="nuevo-horario" onSubmit={agregarHorario} noValidate>
          <div className="k-field">
            <label className="k-field__label" htmlFor="h-dia">Día</label>
            <select className="k-select" id="h-dia" value={dia} onChange={(e) => setDia(e.target.value)}>
              {DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="k-field">
            <label className="k-field__label" htmlFor="h-desde">Hora de inicio</label>
            <input className="k-input" id="h-desde" placeholder="11:30" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="k-field">
            <label className="k-field__label" htmlFor="h-hasta">Hora de fin</label>
            <input className="k-input" id="h-hasta" placeholder="13:00" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="k-field">
            <label className="k-field__label" htmlFor="h-cupo">Personas que se necesitan</label>
            <input className="k-input" id="h-cupo" type="number" min="1" value={cupo} onChange={(e) => setCupo(e.target.value)} />
          </div>
          <button type="submit" className="k-btn k-btn--auto" disabled={sinConexion}>Agregar horario</button>
        </form>
        <p className="k-error" role="alert">{errHor}</p>
      </section>

      {/* Equipo */}
      <section className="caja acento" style={{ ["--c" as string]: "var(--ok)" }} aria-labelledby="min-equipo">
        <div className="caja__cab">
          <div>
            <h2 id="min-equipo" className="min-h2">Equipo</h2>
            <p className="ayuda">
              {miembros.length} {miembros.length === 1 ? "persona sirve" : "personas sirven"} en {ministerio.nombre}.
            </p>
          </div>
          <button type="button" className="k-btn k-btn--auto" onClick={abrirEquipo} disabled={sinConexion}>
            Agregar personas
          </button>
        </div>
        <div>
          {miembros.length === 0 ? (
            <p className="k-muted">Aún no tienes personas en el equipo.</p>
          ) : (
            miembros.map((p) => (
              <div key={p.id} className="equipo__fila">
                <div className="persona">
                  <span className="av">{iniciales(p.nombre)}</span>
                  <div><strong>{p.nombre}</strong><small>Último turno: {p.ultimo ?? "Nunca"}</small></div>
                </div>
                <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => quitarPersona(p.id)} disabled={sinConexion}>
                  Quitar
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Agregar personas al equipo */}
      <dialog ref={dlgEquipo} className="dlg" aria-labelledby="min-dlg-agregar">
        <div className="dlg__form">
          <header className="dlg__cab">
            <h2 id="min-dlg-agregar">Agregar personas al equipo</h2>
            <p className="k-muted">Marca las personas que van a {ministerio.nombre}. Puedes marcar varias.</p>
          </header>
          <div className="min-lista-dlg">
            {disponibles.length === 0 ? (
              <p className="k-muted">Todas las personas ya están en este equipo.</p>
            ) : (
              disponibles.map((p) => (
                <label key={p.id} className="min-opcion">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) seleccion.current.add(p.id);
                      else seleccion.current.delete(p.id);
                    }}
                  />
                  <span className="persona">
                    <span className="av">{iniciales(p.nombre)}</span>
                    <span><strong>{p.nombre}</strong><small className="min-peq">{p.rol}</small></span>
                  </span>
                </label>
              ))
            )}
          </div>
          <footer className="dlg__pie">
            <span />
            <div className="dlg__botones">
              <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => dlgEquipo.current?.close()}>Cancelar</button>
              <button type="button" className="k-btn k-btn--auto" onClick={agregarEquipo}>Agregar al equipo</button>
            </div>
          </footer>
        </div>
      </dialog>
    </div>
  );
}
