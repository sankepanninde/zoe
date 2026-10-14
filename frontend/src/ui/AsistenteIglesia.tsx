import { useState } from "react";
import "./AsistenteIglesia.css";

/* Configuración inicial de la iglesia en 5 pasos: domingos, entre semana, reuniones,
   ministerios y revisión. Al crear, entrega la lista de ministerios a la pantalla padre. */

interface Culto { id: number; nombre: string; hora: string; quitable: boolean }
interface Reunion { dia: string; hora: string; nombre: string }

export interface AsistenteIglesiaProps {
  /** Paso con el que abre (0 = domingos … 4 = revisar). */
  pasoInicial?: number;
  /** Se llama al crear la iglesia con los nombres de los ministerios elegidos. */
  onCrear?: (ministerios: string[]) => void;
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const PASOS = ["Domingos", "Entre semana", "Reuniones", "Ministerios", "Revisar"];
const REUNIONES: [string, string, string, string][] = [
  // [etiqueta, ejemplo, hora por defecto, día por defecto]
  ["Niños", "Por ejemplo, domingo 09:00", "09:00", "Domingo"],
  ["Jóvenes", "Por ejemplo, sábado 18:00", "18:00", "Sábado"],
  ["Adultos", "", "19:00", "Domingo"],
  ["Mujeres", "", "09:00", "Domingo"],
  ["Hombres", "", "07:00", "Domingo"],
  ["Células", "Células o grupos pequeños", "19:30", "Domingo"],
  ["Oración", "Oración o intercesión", "06:30", "Domingo"],
  ["Otro", "Otra reunión", "19:00", "Domingo"],
];
const MINISTERIOS_BASE = ["Sonido", "Audiovisuales", "Aseo", "Bienvenida", "Parqueadero", "Niños"];
const MINISTERIOS_INICIALES = ["Sonido", "Audiovisuales", "Aseo"];

const cultosDe = (modo: "uno" | "varios" | "ninguno"): Culto[] => {
  if (modo === "uno") return [{ id: 1, nombre: "Culto", hora: "10:00", quitable: false }];
  if (modo === "varios") return [
    { id: 1, nombre: "Culto 1", hora: "08:00", quitable: false },
    { id: 2, nombre: "Culto 2", hora: "10:00", quitable: false },
    { id: 3, nombre: "Culto 3", hora: "12:00", quitable: true },
  ];
  return [];
};

export function AsistenteIglesia({ pasoInicial = 0, onCrear }: AsistenteIglesiaProps) {
  const [paso, setPaso] = useState(pasoInicial);
  const [creada, setCreada] = useState(false);

  // Paso 1
  const [modo, setModo] = useState<"uno" | "varios" | "ninguno">("uno");
  const [cultos, setCultos] = useState<Culto[]>(cultosDe("uno"));
  const [siguienteId, setSiguienteId] = useState(10);

  // Paso 2
  const [semanales, setSemanales] = useState<string[]>(["Miércoles"]);
  const [nomSem, setNomSem] = useState("Entre semana");
  const [horSem, setHorSem] = useState("19:00");

  // Paso 3
  const [reuniones, setReuniones] = useState<string[]>([]);
  const [detReu, setDetReu] = useState<Record<string, Reunion>>({});

  // Paso 4
  const [ministerios, setMinisterios] = useState<string[]>(MINISTERIOS_INICIALES);
  const [extra, setExtra] = useState<string[]>([]);
  const [otro, setOtro] = useState("");
  const [errMin, setErrMin] = useState("");

  const elegidos = [...ministerios, ...extra];

  const cambiarModo = (m: "uno" | "varios" | "ninguno") => {
    setModo(m);
    setCultos(cultosDe(m));
  };

  const agregarCulto = () => {
    setCultos([...cultos, { id: siguienteId, nombre: `Culto ${cultos.length + 1}`, hora: "12:00", quitable: true }]);
    setSiguienteId(siguienteId + 1);
  };

  const alternarSemanal = (d: string) =>
    setSemanales(semanales.includes(d) ? semanales.filter((x) => x !== d) : [...semanales, d]);

  const alternarReunion = (t: string) =>
    setReuniones(reuniones.includes(t) ? reuniones.filter((x) => x !== t) : [...reuniones, t]);

  const detalleDe = (t: string): Reunion => {
    const r = REUNIONES.find((x) => x[0] === t);
    return detReu[t] ?? { dia: r?.[3] ?? "Domingo", hora: r?.[2] ?? "19:00", nombre: t };
  };
  const cambiarDetalle = (t: string, cambio: Partial<Reunion>) =>
    setDetReu({ ...detReu, [t]: { ...detalleDe(t), ...cambio } });

  const toggleMin = (m: string) =>
    setMinisterios(ministerios.includes(m) ? ministerios.filter((x) => x !== m) : [...ministerios, m]);

  const agregarOtro = () => {
    const n = otro.trim();
    if (!n) return setErrMin("Escribe el nombre del ministerio.");
    if (elegidos.some((m) => m.toLowerCase() === n.toLowerCase())) return setErrMin("Ya está en la lista.");
    setExtra([...extra, n]);
    setOtro("");
    setErrMin("");
  };

  const siguiente = () => {
    if (paso === PASOS.length - 1) {
      setCreada(true);
      onCrear?.(elegidos);
      return;
    }
    setPaso(paso + 1);
  };

  const resumen: [string, string][] = [];
  if (modo !== "ninguno") cultos.forEach((c) => resumen.push([`Domingo ${c.hora}`, c.nombre || "Culto"]));
  semanales.forEach((d) => resumen.push([`${d} ${horSem}`, nomSem || "Entre semana"]));
  reuniones.forEach((t) => {
    const d = detalleDe(t);
    resumen.push([`${d.dia} ${d.hora}`, t === "Otro" ? d.nombre || "Otra reunión" : t]);
  });

  return (
    <div className="asi-wrap">
      <header className="asi-cab">
        <span className="k-label">Configuración inicial</span>
        <h1>Configura tu iglesia</h1>
        <p className="k-muted">Unas pocas preguntas. Lo que no aplique lo dejas como está; todo se puede cambiar después.</p>
      </header>

      <div className="asi-progreso" aria-hidden="true">
        {PASOS.map((_, i) => <span key={i} className={i <= paso ? "on" : ""} />)}
      </div>

      {!creada && (
        <section className="caja" aria-labelledby="asi-titulo">
          <span className="asi-paso">Paso {paso + 1} de 5 · {PASOS[paso]}</span>

          {paso === 0 && (
            <>
              <h2 id="asi-titulo">¿Cuántos cultos hay los domingos?</h2>
              <div className="asi-grid" role="radiogroup" aria-label="Cultos del domingo">
                {([["uno", "Un culto", "Por ejemplo, 10:00"], ["varios", "Varios cultos", "Por ejemplo, 08:00, 10:00 y 12:00"], ["ninguno", "No hay culto los domingos", ""]] as const).map(([v, t, s]) => (
                  <label key={v} className="asi-opcion">
                    <input type="radio" name="dom" value={v} checked={modo === v} onChange={() => cambiarModo(v)} />
                    <span>{t}{s && <small>{s}</small>}</span>
                  </label>
                ))}
              </div>
              {modo !== "ninguno" && (
                <div className="asi-lista">
                  {cultos.map((c) => (
                    <div key={c.id} className="asi-fila">
                      <label className="k-field">
                        <span className="k-field__label">Nombre</span>
                        <input className="k-input" defaultValue={c.nombre} />
                      </label>
                      <label className="k-field">
                        <span className="k-field__label">Hora</span>
                        <input className="k-input" type="time" defaultValue={c.hora} />
                      </label>
                      {c.quitable ? (
                        <button type="button" className="asi-quitar" onClick={() => setCultos(cultos.filter((x) => x.id !== c.id))}>Quitar</button>
                      ) : <span />}
                    </div>
                  ))}
                  {modo === "varios" && (
                    <div><button type="button" className="asi-btn asi-btn--ghost" onClick={agregarCulto}>+ Agregar culto</button></div>
                  )}
                </div>
              )}
            </>
          )}

          {paso === 1 && (
            <>
              <h2 id="asi-titulo">¿Hay algo entre semana?</h2>
              <div className="asi-grid">
                {["Martes", "Miércoles", "Jueves", "Viernes"].map((d) => (
                  <label key={d} className="asi-opcion">
                    <input type="checkbox" checked={semanales.includes(d)} onChange={() => alternarSemanal(d)} />
                    <span>{d}{d === "Miércoles" && <small>Por ejemplo, 19:00</small>}</span>
                  </label>
                ))}
              </div>
              <div className="asi-fila">
                <label className="k-field">
                  <span className="k-field__label">Nombre</span>
                  <input className="k-input" value={nomSem} onChange={(e) => setNomSem(e.target.value)} />
                </label>
                <label className="k-field">
                  <span className="k-field__label">Hora</span>
                  <input className="k-input" type="time" value={horSem} onChange={(e) => setHorSem(e.target.value)} />
                </label>
                <span />
              </div>
              <p className="asi-ayuda">Si no hay nada entre semana, no marques ningún día.</p>
            </>
          )}

          {paso === 2 && (
            <>
              <h2 id="asi-titulo">¿Qué reuniones tienen además de los cultos?</h2>
              <div className="asi-grid">
                {REUNIONES.map(([t, ej]) => (
                  <label key={t} className="asi-opcion">
                    <input type="checkbox" checked={reuniones.includes(t)} onChange={() => alternarReunion(t)} />
                    <span>{t === "Células" ? "Células o grupos pequeños" : t === "Oración" ? "Oración o intercesión" : t === "Otro" ? "Otra reunión" : t}{ej && !ej.startsWith("Células") && !ej.startsWith("Oración") && !ej.startsWith("Otra") && <small>{ej}</small>}</span>
                  </label>
                ))}
              </div>
              {reuniones.map((t) => {
                const d = detalleDe(t);
                return (
                  <div key={t} className="asi-fila asi-fila--reu">
                    {t === "Otro" ? (
                      <label className="k-field">
                        <span className="k-field__label">Nombre</span>
                        <input className="k-input" placeholder="Ej. Intercesión" value={d.nombre === "Otro" ? "" : d.nombre} onChange={(e) => cambiarDetalle(t, { nombre: e.target.value })} />
                      </label>
                    ) : (
                      <label className="k-field">
                        <span className="k-field__label">Reunión</span>
                        <input className="k-input" value={t} disabled />
                      </label>
                    )}
                    <label className="k-field">
                      <span className="k-field__label">Día</span>
                      <select className="k-select" value={d.dia} onChange={(e) => cambiarDetalle(t, { dia: e.target.value })}>
                        {DIAS.map((x) => <option key={x}>{x}</option>)}
                      </select>
                    </label>
                    <label className="k-field">
                      <span className="k-field__label">Hora</span>
                      <input className="k-input" type="time" value={d.hora} onChange={(e) => cambiarDetalle(t, { hora: e.target.value })} />
                    </label>
                  </div>
                );
              })}
              <p className="asi-ayuda">Si algo es solo de vez en cuando, no hace falta agregarlo aquí.</p>
            </>
          )}

          {paso === 3 && (
            <>
              <h2 id="asi-titulo">¿Qué ministerios tiene la iglesia?</h2>
              <p className="asi-ayuda">Cada ministerio tendrá su líder, que define sus horarios y su equipo.</p>
              <div className="asi-grid">
                {MINISTERIOS_BASE.map((m) => (
                  <label key={m} className="asi-opcion">
                    <input type="checkbox" checked={ministerios.includes(m)} onChange={() => toggleMin(m)} />
                    <span>{m}</span>
                  </label>
                ))}
                {extra.map((m) => (
                  <label key={m} className="asi-opcion">
                    <input type="checkbox" checked readOnly />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
              <div className="asi-fila asi-fila--min">
                <label className="k-field">
                  <span className="k-field__label">Otro ministerio</span>
                  <input className="k-input" placeholder="Ej. Intercesión" value={otro} onChange={(e) => setOtro(e.target.value)} />
                </label>
                <button type="button" className="asi-btn asi-btn--ghost" onClick={agregarOtro}>Agregar</button>
              </div>
              <p className="asi-err" role="alert">{errMin}</p>
            </>
          )}

          {paso === 4 && (
            <>
              <h2 id="asi-titulo">Así quedó tu iglesia</h2>
              <div className="asi-resumen">
                {resumen.length === 0 ? (
                  <div><span className="k-muted">Sin cultos ni reuniones todavía</span></div>
                ) : (
                  resumen.map(([a, b], i) => <div key={i}><span>{b}</span><small>{a}</small></div>)
                )}
                <div>
                  <span>Ministerios</span>
                  <small>{elegidos.length ? elegidos.join(", ") : "Ninguno todavía"}</small>
                </div>
              </div>
              <p className="asi-ayuda">Después puedes cambiar cualquier dato, una fecha a la vez.</p>
            </>
          )}
        </section>
      )}

      {creada ? (
        <div className="asi-exito" role="status">
          Listo. Los ministerios ya aparecen en Personas › Ministerios, sin líder asignado.
        </div>
      ) : (
        <div className="asi-acciones">
          {paso > 0 ? (
            <button type="button" className="asi-btn asi-btn--ghost" onClick={() => setPaso(paso - 1)}>Atrás</button>
          ) : <span />}
          <button type="button" className="asi-btn" onClick={siguiente}>
            {paso === PASOS.length - 1 ? "Crear iglesia" : "Siguiente"}
          </button>
        </div>
      )}
    </div>
  );
}
