import { useState } from "react";
import { rolNombre } from "./PanelRol";

/* Todos los bloques usan las clases de dashboard.html (ámbito .k-dash). */

export interface Evento { id: string; cuando: string; titulo: string; lugar: string }

export function Proximos({ eventos }: { eventos: Evento[] }) {
  return (
    <section aria-label="Próximos eventos">
      <div className="events">
        {eventos.map((e) => (
          <div className="card event" key={e.id}>
            <span className="when">{e.cuando}</span>
            <strong>{e.titulo}</strong>
            <span className="place">{e.lugar}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Hoy ---------- */

/** "rol" cambia el panel por rol; "destino" es el id de la sección a la que se desplaza. */
export interface HoyItem { id: string; n: number; texto: string; rol?: "TE" | "LE" | "AD"; destino?: string; onVer?: () => void }

export function Hoy({ items, vacio }: { items: HoyItem[]; vacio?: string }) {
  if (items.length === 0) {
    if (!vacio) return null;
    return (
      <div className="card hoy" aria-labelledby="t-hoy">
        <h2 id="t-hoy">Hoy</h2>
        <p className="muted">{vacio}</p>
      </div>
    );
  }
  return (
    <div className="card hoy" aria-labelledby="t-hoy">
      <h2 id="t-hoy">Hoy</h2>
      {items.map((h) => (
        <div className="hoy-item" key={h.id}>
          <span className="tag">{h.rol ? rolNombre[h.rol] : "Iglesia"}</span>
          <span>{h.texto}</span>
          <button type="button" className="go" onClick={h.onVer}>Ver</button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Cupos con anillo ---------- */

export interface Inscripcion { id: string; nombre: string; ocupados: number; cupo: number; cierra: string }

const CIRC = 113.1;

export function Inscripciones({ items }: { items: Inscripcion[] }) {
  return (
    <div className="cupos">
      {items.map((i) => {
        const pct = i.cupo > 0 ? i.ocupados / i.cupo : 0;
        const bajo = pct >= 0.9;
        return (
          <div className="card cupo" key={i.id}>
            <svg viewBox="0 0 44 44" aria-hidden="true">
              <circle className="ring-bg" cx="22" cy="22" r="18" />
              <circle
                className={bajo ? "ring-fg low" : "ring-fg"}
                cx="22"
                cy="22"
                r="18"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - pct)}
              />
            </svg>
            <div>
              <div className="name">{i.nombre}</div>
              <div className="val">{i.ocupados} de {i.cupo}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Turnos (vista de roles) ---------- */

export interface Turno { id: string; area: string; estado: "cubierto" | "pendiente" | "falta"; nota?: string }

export function Turnos({ items }: { items: Turno[] }) {
  return (
    <div>
      {items.map((t) => (
        <div className="card" key={t.id}>
          <span>{t.area}</span>
          <span className="tag">{t.estado === "falta" ? "Sin cubrir" : t.estado === "pendiente" ? "Pendiente" : "Cubierto"}</span>
          {t.nota && <span className="tag">{t.nota}</span>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Borradores ---------- */

export interface Borrador { id: string; titulo: string; estado: "borrador" | "programado"; detalle: string }

export function Borradores({ items }: { items: Borrador[] }) {
  return (
    <>
      {items.map((b) => (
        <div className="card" key={b.id}>
          <span>{b.titulo}</span>
          <span className="tag">{b.estado === "borrador" ? "Borrador" : b.detalle}</span>
        </div>
      ))}
    </>
  );
}

/* ---------- Oración: restringida ---------- */

export interface Peticion { id: string; texto: string; hace: string }

export function PeticionesRestringidas({ peticiones, puedeVer }: { peticiones: Peticion[] | null; puedeVer: boolean }) {
  const [abierto, setAbierto] = useState(false);
  if (!puedeVer || !peticiones) {
    return (
      <div className="card lock">
        <p>Solo para líderes.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="card lock">
        <p>Peticiones de oración.</p>
        <button
          type="button"
          className="btn"
          aria-pressed={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? "Ocultar" : "Ver"}
        </button>
      </div>
      {abierto && peticiones.map((p) => (
        <div className="card" key={p.id}>
          <span>{p.texto}</span>
          <span className="tag">{p.hace}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Vista general ---------- */

export interface IglesiaResumen { id: string; nombre: string; activos: number; ultimo: string; sinLeer: number; activa: boolean }

export function TablaIglesias({ items }: { items: IglesiaResumen[] }) {
  return (
    <section className="igl-grid" aria-label="Iglesias">
      {items.map((i) => (
        <div className="card" key={i.id}>
          <span className="igl-name">{i.nombre}</span>
          <span className="igl-meta">{i.activos} anuncios · último {i.ultimo}</span>
          <span className={`igl-state ${i.activa ? "ok" : "bad"}`}>{i.activa ? "Activa" : "Inactiva"}</span>
        </div>
      ))}
    </section>
  );
}

export interface Usuario { id: string; nombre: string; rol: string; detalle: string }

export function Usuarios({ items }: { items: Usuario[] }) {
  return (
    <section aria-label="Administradores">
      {items.map((u) => (
        <div className="card" key={u.id}>
          <span>{u.nombre}</span>
          <span className="tag">{u.rol} · {u.detalle}</span>
        </div>
      ))}
    </section>
  );
}
