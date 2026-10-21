import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

export type Priority = "alta" | "media" | "baja";
export type Filter = "todos" | "alta" | "nuevos";

export interface Comment {
  id: string;
  autor: string;
  cuando: string;
  texto: string;
}

export interface Announcement {
  id: string;
  prioridad: Priority;
  categoria: string;
  titulo: string;
  resumen: string;
  cuerpo: string;
  fecha: string;
  leido: boolean;
  comentarios: Comment[];
}

const orden: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };

/** Sin leer primero y, dentro de cada grupo, por prioridad. El texto busca en título y cuerpo. */
export function ordenar(items: Announcement[], filtro: Filter, texto = ""): Announcement[] {
  const q = texto.trim().toLowerCase();
  return items
    .filter((a) => {
      if (filtro === "nuevos" && a.leido) return false;
      if (filtro === "alta" && a.prioridad !== "alta") return false;
      if (q && `${a.titulo} ${a.cuerpo}`.toLowerCase().indexOf(q) === -1) return false;
      return true;
    })
    .sort((a, b) => (a.leido !== b.leido ? (a.leido ? 1 : -1) : orden[a.prioridad] - orden[b.prioridad]));
}

/* ---------- Resumen en tarjetas ---------- */

export function Resumen({ items, tendencia }: { items: Announcement[]; tendencia?: number[] }) {
  const sinLeer = items.filter((a) => !a.leido).length;
  const urgentes = items.filter((a) => a.prioridad === "alta" && !a.leido).length;
  const max = Math.max(1, ...(tendencia ?? [0]));
  const puntos = tendencia && tendencia.length > 1
    ? tendencia.map((v, i) => `${(i / (tendencia.length - 1)) * 100},${100 - (v / max) * 90 - 5}`).join(" ")
    : "";
  return (
    <section className="stats" aria-label="Resumen">
      <div className="card stat">
        <span className="n">{items.length}</span>
        <span className="label">Anuncios</span>
        {puntos && (
          <svg className="spark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Tendencia de los últimos 7 días" role="img">
            <polyline points={puntos} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="card stat"><span className="n">{sinLeer}</span><span className="label">Sin leer</span></div>
      <div className="card stat"><span className="n">{urgentes}</span><span className="label">Urgentes</span></div>
    </section>
  );
}

/* ---------- Buscador, filtros y acciones ---------- */

const filtros: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "alta", label: "Urgentes" },
  { value: "nuevos", label: "Sin leer" },
];

export function Barra({
  filtro,
  onFiltro,
  texto,
  onTexto,
  onMarcarTodo,
  onNuevo,
}: {
  filtro: Filter;
  onFiltro: (f: Filter) => void;
  texto: string;
  onTexto: (t: string) => void;
  onMarcarTodo: () => void;
  onNuevo?: () => void;
}) {
  return (
    <div className="col" style={{ gap: 20 }}>
      <input
        className="search"
        type="search"
        placeholder="Buscar"
        aria-label="Buscar anuncios"
        value={texto}
        onChange={(e) => onTexto(e.target.value)}
      />
      <div className="bar">
        <div className="filters" role="group" aria-label="Filtrar">
          {filtros.map((f) => (
            <button key={f.value} type="button" aria-pressed={filtro === f.value} onClick={() => onFiltro(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn" onClick={onMarcarTodo}>Marcar todo</button>
          {onNuevo && <button type="button" className="btn solid" onClick={onNuevo}>Nuevo</button>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Lista en filas ---------- */

export function Lista({
  items,
  onAbrir,
  onMarcarLeido,
}: {
  items: Announcement[];
  onAbrir: (a: Announcement) => void;
  onMarcarLeido: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="empty">Nada por aquí.</p>;
  }
  return (
    <ol className="list" aria-label="Anuncios">
      {items.map((a) => (
        <Item key={a.id} a={a} onAbrir={onAbrir} onMarcarLeido={onMarcarLeido} />
      ))}
    </ol>
  );
}

function Item({
  a,
  onAbrir,
  onMarcarLeido,
}: {
  a: Announcement;
  onAbrir: (a: Announcement) => void;
  onMarcarLeido: (id: string) => void;
}) {
  function onKey(e: KeyboardEvent<HTMLLIElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onAbrir(a);
    }
  }
  return (
    <li
      className="item"
      data-prio={a.prioridad}
      role="button"
      tabIndex={0}
      aria-label={`${a.titulo}${a.leido ? "" : ". Sin leer"}`}
      onClick={() => onAbrir(a)}
      onKeyDown={onKey}
    >
      <span className="rule" aria-hidden="true" />
      <div>
        <div className="item-title">{a.titulo}</div>
        <div className="item-meta">
          {!a.leido && <span className="dot" aria-hidden="true" />}
          <span>{a.categoria}</span>
        </div>
      </div>
      <div className="side">
        <span>{a.fecha}</span>
        <button
          type="button"
          className="read"
          data-read={a.id}
          disabled={a.leido}
          onClick={(e) => {
            e.stopPropagation();
            onMarcarLeido(a.id);
          }}
        >
          {a.leido ? "Leído" : "Marcar"}
        </button>
      </div>
    </li>
  );
}

/* ---------- Detalle con comentarios ---------- */

export function DetalleAnuncio({
  a,
  onCerrar,
  onComentar,
}: {
  a: Announcement;
  onCerrar: () => void;
  onComentar: (texto: string) => void | Promise<void>;
}) {
  const [texto, setTexto] = useState("");
  const [invalido, setInvalido] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const titleId = `anuncio-${a.id}`;

  // El foco entra al modal una sola vez, al abrirlo.
  useEffect(() => {
    cerrarRef.current?.focus();
  }, []);

  useEffect(() => {
    function esc(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCerrar]);

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) {
      setInvalido(true);
      return;
    }
    setInvalido(false);
    // El texto solo se borra si el comentario se guardó; si falla, se conserva para reintentar.
    Promise.resolve(onComentar(texto.trim())).then(() => setTexto(""), () => {});
  }

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <article className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div className="tag">{a.categoria} · {a.fecha}</div>
          <button ref={cerrarRef} type="button" className="btn" onClick={onCerrar}>Cerrar</button>
        </div>
        <h2 id={titleId}>{a.titulo}</h2>
        <p className="body">{a.cuerpo}</p>

        <ul className="comments">
          {a.comentarios.map((c) => (
            <li key={c.id}>
              <span className="by">{c.autor}</span>
              <span className="when">{c.cuando}</span>
              <div>{c.texto}</div>
            </li>
          ))}
        </ul>

        <form className="cform" onSubmit={enviar} noValidate>
          <label className="tag" htmlFor={`${titleId}-nuevo`}>Comentar</label>
          <textarea
            id={`${titleId}-nuevo`}
            placeholder="Escribe aquí"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-invalid={invalido || undefined}
            aria-describedby={invalido ? `${titleId}-err` : undefined}
          />
          {invalido && <div className="err" id={`${titleId}-err`}>Escribe un comentario antes de enviar.</div>}
          <div className="row-end"><button type="submit" className="btn solid">Enviar</button></div>
        </form>

      </article>
    </div>
  );
}
