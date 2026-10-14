import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Priority } from "./Announcements";

export interface NuevoAnuncioData {
  titulo: string;
  categoria: string;
  prioridad: Priority;
  resumen: string;
  cuerpo: string;
  publicarEl: string;
  publico: "todos" | "roles" | "ministerio";
  roles: string[];
}

interface NuevoAnuncioProps {
  onGuardar: (data: NuevoAnuncioData) => void;
  onCerrar: () => void;
  /** "ministerio": el líder solo publica para su ministerio. */
  alcance?: "iglesia" | "ministerio";
  ministerio?: string;
  /** Aviso dentro del formulario si el servidor no publicó el anuncio. */
  error?: string | null;
}

const categorias = ["General", "Voluntarios", "Inscripciones", "Células", "Eventos", "Oración"];
const rolesDisponibles = ["Siervo", "Líder", "Pastor"];

type Errores = Partial<Record<"titulo" | "resumen" | "cuerpo", string>>;

/** Formulario de nuevo anuncio, con la estructura de dashboard.html. */
export function NuevoAnuncio({ onGuardar, onCerrar, alcance = "iglesia", ministerio = "", error = null }: NuevoAnuncioProps) {
  const [prioridad, setPrioridad] = useState<Priority>("media");
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState(categorias[0]);
  const [publicarEl, setPublicarEl] = useState(() => new Date().toISOString().slice(0, 10));
  const [resumen, setResumen] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [publico, setPublico] = useState<"todos" | "roles" | "ministerio">(alcance === "ministerio" ? "ministerio" : "todos");
  const [roles, setRoles] = useState<string[]>([]);
  const [errores, setErrores] = useState<Errores>({});
  const tituloRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  useEffect(() => {
    function esc(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCerrar]);

  function alternarRol(r: string) {
    setRoles((actual) => (actual.includes(r) ? actual.filter((x) => x !== r) : [...actual, r]));
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    const nuevos: Errores = {};
    if (!titulo.trim()) nuevos.titulo = "Escribe un título.";
    if (!resumen.trim()) nuevos.resumen = "Escribe un resumen.";
    if (!cuerpo.trim()) nuevos.cuerpo = "Escribe el contenido.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      const primero = (["titulo", "resumen", "cuerpo"] as const).find((k) => nuevos[k]);
      if (primero === "titulo") tituloRef.current?.focus();
      return;
    }
    onGuardar({
      titulo: titulo.trim(),
      categoria,
      prioridad,
      resumen: resumen.trim(),
      cuerpo: cuerpo.trim(),
      publicarEl,
      publico,
      roles: publico === "roles" ? roles : [],
    });
  }

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <form className="sheet" role="dialog" aria-modal="true" aria-labelledby="nuevo-titulo-h" onSubmit={enviar} noValidate>
        <h2 id="nuevo-titulo-h">Nuevo anuncio</h2>

        <div className="field">
          <span className="flabel" id="lbl-prio">Prioridad</span>
          <div className="chips" role="group" aria-labelledby="lbl-prio">
            {(["alta", "media", "baja"] as Priority[]).map((p) => (
              <button key={p} type="button" className="chip" aria-pressed={prioridad === p} onClick={() => setPrioridad(p)}>
                {p === "alta" ? "Alta" : p === "media" ? "Media" : "Baja"}
              </button>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <div className="field span-2">
            <label htmlFor="n-titulo">Título</label>
            <input
              ref={tituloRef}
              id="n-titulo"
              type="text"
              placeholder="Qué necesitas que la gente sepa"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              aria-invalid={errores.titulo ? true : undefined}
              aria-describedby="e-titulo"
            />
            <div className="err" id="e-titulo">{errores.titulo}</div>
          </div>

          <div className="field">
            <label htmlFor="n-cat">Categoría</label>
            <select id="n-cat" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {categorias.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="field">
            <label htmlFor="n-fecha">Publicar el</label>
            <input id="n-fecha" type="date" value={publicarEl} onChange={(e) => setPublicarEl(e.target.value)} />
          </div>

          <div className="field span-2">
            <label htmlFor="n-resumen">Resumen</label>
            <input
              id="n-resumen"
              type="text"
              placeholder="Una línea para la lista"
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              aria-invalid={errores.resumen ? true : undefined}
              aria-describedby="e-resumen"
            />
            <div className="err" id="e-resumen">{errores.resumen}</div>
          </div>

          <div className="field span-2">
            <label htmlFor="n-cuerpo">Contenido</label>
            <textarea
              id="n-cuerpo"
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              aria-invalid={errores.cuerpo ? true : undefined}
              aria-describedby="e-cuerpo"
            />
            <div className="err" id="e-cuerpo">{errores.cuerpo}</div>
          </div>

          <div className="field span-2">
            <span className="flabel" id="lbl-publico">Quién lo ve</span>
            <div className="chips" role="group" aria-labelledby="lbl-publico">
              {alcance === "iglesia" ? (
                <>
                  <button type="button" className="chip" aria-pressed={publico === "todos"} onClick={() => setPublico("todos")}>Todos</button>
                  <button type="button" className="chip" aria-pressed={publico === "roles"} onClick={() => setPublico("roles")}>Roles específicos</button>
                </>
              ) : (
                <button type="button" className="chip" aria-pressed={true}>Mi ministerio{ministerio ? ` · ${ministerio}` : ""}</button>
              )}
            </div>
            {publico === "roles" && (
              <div className="chips" role="group" aria-label="Roles">
                {rolesDisponibles.map((r) => (
                  <button key={r} type="button" className="chip" aria-pressed={roles.includes(r)} onClick={() => alternarRol(r)}>
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p role="alert" style={{ color: "var(--danger)", margin: "0 0 16px" }}>{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn solid">Publicar</button>
        </div>
      </form>
    </div>
  );
}