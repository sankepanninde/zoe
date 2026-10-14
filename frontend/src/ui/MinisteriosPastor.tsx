import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import "./MinisteriosPastor.css";

/* Pantalla del Pastor: crear ministerios, elegir su líder, quitar personas
   y ver los horarios que define cada líder (solo lectura). */

export interface Lider {
  id: string;
  nombre: string;
}

export interface Horario {
  id: number;
  dia: number; // 0 = lunes … 6 = domingo
  desde: string;
  hasta: string;
  cupo: number;
  ancla?: string; // p. ej. "Culto 2"
}

export interface Ministerio {
  id: string;
  nombre: string;
  lider: string; // id del líder, "" si no hay
  horarios: Horario[];
}

export interface Persona {
  id: string;
  nombre: string;
  rol: "Siervo" | "Líder" | "Pastor";
  mins: string[];
  estado: "Activa" | "Invitada";
  ultimo?: string; // último turno, p. ej. "13 sep"
}

export interface MinisteriosPastorProps {
  ministerios?: Ministerio[];
  personas?: Persona[];
  lideres?: Lider[];
  /** Muestra el esqueleto de carga mientras llegan los datos. */
  cargando?: boolean;
  /** Se llama con cada cambio, para que la pantalla padre lo guarde o lo envíe. */
  onCambio?: (ministerios: Ministerio[], personas: Persona[]) => void;
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const COLORES = ["var(--warm)", "var(--ok)", "var(--danger)", "var(--fg)"];
const SIN_LIDER: Lider = { id: "", nombre: "Sin asignar" };

const iniciales = (n: string) =>
  n.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function MinisteriosPastor({
  ministerios: inicialMin = [],
  personas: inicialPer = [],
  lideres: listaLideres = [],
  cargando = false,
  onCambio,
}: MinisteriosPastorProps) {
  const [ministerios, setMinisterios] = useState<Ministerio[]>(inicialMin);
  const [personas, setPersonas] = useState<Persona[]>(inicialPer);
  const [vista, setVista] = useState<"min" | "per">("min");
  const [aviso, setAviso] = useState<{ texto: string; warn?: boolean } | null>(null);
  const [pendienteBorrar, setPendienteBorrar] = useState<string | null>(null);
  const [ministerioEquipo, setMinisterioEquipo] = useState<string | null>(null);
  const [errNuevo, setErrNuevo] = useState("");
  const [errInv, setErrInv] = useState("");

  const dlgNuevo = useRef<HTMLDialogElement>(null);
  const dlgBorrar = useRef<HTMLDialogElement>(null);
  const dlgEquipo = useRef<HTMLDialogElement>(null);
  const nomMin = useRef<HTMLInputElement>(null);
  const liderMin = useRef<HTMLSelectElement>(null);
  const seleccion = useRef<Set<string>>(new Set());

  const lideres = [SIN_LIDER, ...listaLideres];
  const nombreLider = (id: string) => lideres.find((l) => l.id === id)?.nombre ?? "Sin líder";
  const minPorId = (id: string) => ministerios.find((m) => m.id === id);

  // Cada cambio se avisa a la pantalla padre.
  const actualizar = (nuevoMin: Ministerio[], nuevaPer: Persona[]) => {
    setMinisterios(nuevoMin);
    setPersonas(nuevaPer);
    onCambio?.(nuevoMin, nuevaPer);
  };

  const mostrarAviso = (texto: string, warn = false) => setAviso({ texto, warn });

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2800);
    return () => clearTimeout(t);
  }, [aviso]);

  const cambiarLider = (mid: string, lider: string) => {
    const m = minPorId(mid);
    if (!m) return;
    actualizar(
      ministerios.map((x) => (x.id === mid ? { ...x, lider } : x)),
      personas,
    );
    mostrarAviso(`Líder de ${m.nombre} cambiado a ${nombreLider(lider)}. Ya ve el ministerio en su panel.`);
  };

  const quitarPersona = (pid: string, mid: string) => {
    const p = personas.find((x) => x.id === pid);
    const m = minPorId(mid);
    if (!p || !m) return;
    actualizar(
      ministerios,
      personas.map((x) => (x.id === pid ? { ...x, mins: x.mins.filter((id) => id !== mid) } : x)),
    );
    mostrarAviso(`${p.nombre} salió de ${m.nombre}.`, true);
  };

  const pedirBorrar = (mid: string) => {
    setPendienteBorrar(mid);
    dlgBorrar.current?.showModal();
  };

  const confirmarBorrar = () => {
    const m = minPorId(pendienteBorrar ?? "");
    if (!m) return;
    dlgBorrar.current?.close();
    actualizar(
      ministerios.filter((x) => x.id !== m.id),
      personas.map((p) => ({ ...p, mins: p.mins.filter((id) => id !== m.id) })),
    );
    mostrarAviso(`Ministerio “${m.nombre}” eliminado.`, true);
  };

  const abrirNuevo = () => {
    setErrNuevo("");
    if (nomMin.current) nomMin.current.value = "";
    dlgNuevo.current?.showModal();
    nomMin.current?.focus();
  };

  const crearMinisterio = (e: FormEvent) => {
    e.preventDefault();
    const nombre = nomMin.current?.value.trim() ?? "";
    if (!nombre) return setErrNuevo("Escribe el nombre del ministerio.");
    if (ministerios.some((m) => m.nombre.toLowerCase() === nombre.toLowerCase()))
      return setErrNuevo("Ya existe un ministerio con ese nombre.");
    const nuevo: Ministerio = {
      id: "m" + (ministerios.length + 100),
      nombre,
      lider: liderMin.current?.value ?? "",
      horarios: [],
    };
    dlgNuevo.current?.close();
    actualizar([...ministerios, nuevo], personas);
    mostrarAviso(`Ministerio “${nombre}” creado. Su líder ya puede definir horarios y equipo.`);
  };

  const abrirEquipo = (mid: string) => {
    seleccion.current = new Set();
    setMinisterioEquipo(mid);
    dlgEquipo.current?.showModal();
  };

  const agregarEquipo = () => {
    const m = minPorId(ministerioEquipo ?? "");
    const ids = [...seleccion.current];
    dlgEquipo.current?.close();
    if (!m || !ids.length) return;
    actualizar(
      ministerios,
      personas.map((p) => (ids.includes(p.id) && !p.mins.includes(m.id) ? { ...p, mins: [...p.mins, m.id] } : p)),
    );
    mostrarAviso(`${ids.length === 1 ? "1 persona agregada" : ids.length + " personas agregadas"} a ${m.nombre}.`);
  };

  const invitar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const nombre = (form.elements.namedItem("nombre") as HTMLInputElement).value.trim();
    const correo = (form.elements.namedItem("correo") as HTMLInputElement).value.trim();
    const min = (form.elements.namedItem("min") as HTMLSelectElement).value;
    if (!nombre) return setErrInv("Escribe el nombre de la persona.");
    if (!/^\S+@\S+\.\S+$/.test(correo)) return setErrInv("El correo no parece válido.");
    setErrInv("");
    const nueva: Persona = { id: "n" + (personas.length + 100), nombre, rol: "Siervo", mins: [min], estado: "Invitada" };
    form.reset();
    actualizar(ministerios, [...personas, nueva]);
    mostrarAviso(`Invitación enviada a ${correo}.`);
  };

  const stMin = ministerios.length;
  const stPer = new Set(personas.filter((p) => p.mins.length).map((p) => p.id)).size;
  const stInv = personas.filter((p) => p.estado === "Invitada").length;
  const enEquipo = ministerioEquipo ? personas.filter((p) => p.mins.includes(ministerioEquipo)) : [];
  const disponibles = ministerioEquipo ? personas.filter((p) => !p.mins.includes(ministerioEquipo)) : [];

  return (
    <div className="min-wrap">
      <header className="k-hello min-hello">
        <span className="k-label">Pastor</span>
        <h1>Ministerios y personas</h1>
        <p className="k-muted">Creas cada ministerio y eliges a su líder. El líder define sus horarios y arma su equipo.</p>
      </header>

      <div className="k-seg" role="group" aria-label="Vista">
        <button type="button" aria-pressed={vista === "min"} onClick={() => setVista("min")}>Ministerios</button>
        <button type="button" aria-pressed={vista === "per"} onClick={() => setVista("per")}>Personas</button>
      </div>

      {aviso && (
        <div className={"aviso" + (aviso.warn ? " aviso--warn" : "")} role="status">{aviso.texto}</div>
      )}

      <div className="k-stats-strip min-stats" aria-label="Resumen">
        <div><b>{stMin}</b><span>Ministerios</span></div>
        <div><b>{stPer}</b><span>Personas en equipos</span></div>
        <div><b>{stInv}</b><span>Invitaciones pendientes</span></div>
      </div>

      {vista === "min" ? (
        <section aria-label="Ministerios" aria-busy={cargando} className="min-seccion">
          <div className="caja min-barra">
            <div>
              <h2 className="min-h2">Ministerios de la iglesia</h2>
              <p className="ayuda">¿Falta un ministerio? Créalo aquí y luego elige su líder.</p>
            </div>
            <button type="button" className="k-btn k-btn--auto" onClick={abrirNuevo}>+ Crear ministerio</button>
          </div>

          {cargando ? (
            <>
              <div className="caja" aria-hidden="true"><span className="sk sk--t" /><span className="sk sk--l" /><span className="sk sk--l" /></div>
              <div className="caja" aria-hidden="true"><span className="sk sk--t" /><span className="sk sk--l" /></div>
              <p className="k-muted" role="status">Cargando ministerios…</p>
            </>
          ) : ministerios.length === 0 ? (
            <div className="vacio-bloque">
              <h3>Aún no hay ministerios</h3>
              <p className="ayuda">Crea el primero o elige los de tu iglesia en la configuración inicial.</p>
              <div><button type="button" className="k-btn k-btn--auto" onClick={abrirNuevo}>+ Crear ministerio</button></div>
            </div>
          ) : (
            ministerios.map((m, idx) => {
              const miembros = personas.filter((p) => p.mins.includes(m.id));
              return (
                <article key={m.id} className="caja acento" style={{ ["--c" as string]: COLORES[idx % COLORES.length] }}>
                  <div className="caja__cab acento-head">
                    <span className="monograma">{iniciales(m.nombre)}</span>
                    <div style={{ flex: 1 }}>
                      <h2 className="min-h2">{m.nombre}</h2>
                      <p className="ayuda">Líder: {nombreLider(m.lider)}</p>
                    </div>
                    <label className="min-cambio k-muted">
                      Cambiar líder
                      <select
                        className="k-select k-select--compact"
                        aria-label={`Líder de ${m.nombre}`}
                        value={m.lider}
                        onChange={(e) => cambiarLider(m.id, e.target.value)}
                      >
                        {lideres.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="min-borrar">
                    <button type="button" className="k-btn k-btn--ghost k-btn--auto min-peligro" onClick={() => pedirBorrar(m.id)}>
                      Eliminar ministerio
                    </button>
                  </div>

                  <div>
                    <p className="sub">Horarios · los define el líder</p>
                    {m.horarios.length === 0 ? (
                      <p className="k-muted">Sin horarios todavía. Los agrega el líder.</p>
                    ) : (
                      m.horarios.map((h) => (
                        <div key={h.id} className="horario">
                          <div>
                            <strong>{DIAS[h.dia]} {h.desde} – {h.hasta}</strong>
                            <small>{h.ancla ? `Después de ${h.ancla}` : "Horario propio"} · cupo {h.cupo}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <div className="caja__cab min-equipo-cab">
                      <p className="sub">Equipo · {miembros.length} {miembros.length === 1 ? "persona" : "personas"}</p>
                      <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => abrirEquipo(m.id)}>
                        Agregar personas
                      </button>
                    </div>
                    {miembros.length === 0 ? (
                      <p className="k-muted">Aún no hay personas en este equipo.</p>
                    ) : (
                      miembros.map((p) => (
                        <div key={p.id} className="equipo__fila">
                          <div className="persona">
                            <span className="av">{iniciales(p.nombre)}</span>
                            <div><strong>{p.nombre}</strong><small>{p.rol}</small></div>
                          </div>
                          <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => quitarPersona(p.id, m.id)}>
                            Quitar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      ) : (
        <section aria-label="Personas" className="min-seccion">
          <div className="caja">
            <div>
              <h2 className="min-h2">Invitar a una persona nueva</h2>
              <p className="ayuda">Le llega un correo para entrar a la app y queda en el ministerio que elijas.</p>
            </div>
            <form onSubmit={invitar} noValidate className="min-form">
              <div className="k-field">
                <label className="k-field__label" htmlFor="inv-nombre">Nombre completo</label>
                <input className="k-input" id="inv-nombre" name="nombre" placeholder="Ej. Pedro Gómez" autoComplete="off" />
              </div>
              <div className="k-field">
                <label className="k-field__label" htmlFor="inv-correo">Correo</label>
                <input className="k-input" id="inv-correo" name="correo" type="email" placeholder="Ej. pedro@correo.com" autoComplete="off" />
              </div>
              <div className="k-field">
                <label className="k-field__label" htmlFor="inv-min">Ministerio inicial</label>
                <select className="k-select" id="inv-min" name="min">
                  {ministerios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <p className="k-error" role="alert">{errInv}</p>
              <div><button type="submit" className="k-btn k-btn--auto">Enviar invitación</button></div>
            </form>
          </div>

          <div className="caja">
            <h2 className="min-h2">Todas las personas</h2>
            <table className="tabla">
              <thead><tr><th>Persona</th><th>Ministerios</th><th>Estado</th></tr></thead>
              <tbody>
                {personas.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.nombre}</strong><div className="k-muted">{p.rol}</div></td>
                    <td>
                      <div className="chips">
                        {p.mins.length === 0
                          ? <span className="k-muted">Sin ministerio</span>
                          : p.mins.map((id) => <span key={id} className="chip">{minPorId(id)?.nombre}</span>)}
                      </div>
                    </td>
                    <td>
                      <span className={"k-status " + (p.estado === "Activa" ? "k-status--ok" : "k-status--warn")}>{p.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Confirmar eliminar */}
      <dialog ref={dlgBorrar} className="dlg" aria-labelledby="min-dlg-borrar">
        <div className="dlg__form">
          <header className="dlg__cab">
            <h2 id="min-dlg-borrar">¿Eliminar este ministerio?</h2>
            <p className="k-muted">
              {(() => {
                const m = minPorId(pendienteBorrar ?? "");
                if (!m) return null;
                const n = personas.filter((p) => p.mins.includes(m.id)).length;
                return `Se quitará “${m.nombre}” de la iglesia. ${
                  n ? `${n} ${n === 1 ? "persona deja" : "personas dejan"} de verlo.` : "Nadie está en su equipo."
                } Los turnos futuros de sus horarios se cancelan.`;
              })()}
            </p>
          </header>
          <footer className="dlg__pie">
            <span />
            <div className="dlg__botones">
              <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => dlgBorrar.current?.close()}>Cancelar</button>
              <button type="button" className="k-btn k-btn--auto min-peligro-solido" onClick={confirmarBorrar}>Sí, eliminar</button>
            </div>
          </footer>
        </div>
      </dialog>

      {/* Crear ministerio */}
      <dialog ref={dlgNuevo} className="dlg" aria-labelledby="min-dlg-nuevo">
        <form method="dialog" className="dlg__form" onSubmit={crearMinisterio} noValidate>
          <header className="dlg__cab">
            <h2 id="min-dlg-nuevo">Crear un ministerio</h2>
            <p className="k-muted">Solo necesitas un nombre y un líder. El líder después define los horarios y el equipo.</p>
          </header>
          <div className="min-campo">
            <label className="k-field__label" htmlFor="min-nombre">Nombre del ministerio</label>
            <input ref={nomMin} className="k-input" id="min-nombre" placeholder="Ej. Niños, Oración, Parqueadero" />
          </div>
          <div className="min-campo">
            <label className="k-field__label" htmlFor="min-lider">Líder</label>
            <select ref={liderMin} className="k-select" id="min-lider" defaultValue="">
              {lideres.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>
          <p className="k-error" role="alert">{errNuevo}</p>
          <footer className="dlg__pie">
            <span />
            <div className="dlg__botones">
              <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={() => dlgNuevo.current?.close()}>Cancelar</button>
              <button type="submit" className="k-btn k-btn--auto">Crear ministerio</button>
            </div>
          </footer>
        </form>
      </dialog>

      {/* Agregar personas al equipo */}
      <dialog ref={dlgEquipo} className="dlg" aria-labelledby="min-dlg-equipo">
        <div className="dlg__form">
          <header className="dlg__cab">
            <h2 id="min-dlg-equipo">Agregar personas al equipo</h2>
            <p className="k-muted">Marca las personas que van a este ministerio. Puedes marcar varias.</p>
          </header>
          <div className="min-lista-dlg">
            {disponibles.length === 0 ? (
              <p className="k-muted">Todas las personas ya están en este equipo.</p>
            ) : (
              disponibles.map((p) => (
                <label key={p.id} className="min-opcion">
                  <input
                    type="checkbox"
                    defaultChecked={false}
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
            <span className="k-muted">{enEquipo.length} en el equipo ahora</span>
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
