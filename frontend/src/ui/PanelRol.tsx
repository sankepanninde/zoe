import { useState } from "react";
import "./roles.css";

/* Panel según el rol, con la estructura de dashboard-roles.html.
   TE: técnico (sus turnos, cronograma en lectura).
   LE: líder (su ministerio y asignación limitada a sus técnicos).
   AD: admin (toda la iglesia). */

export type RolVista = "TE" | "LE" | "AD";

/* Roles: TE = Siervo, LE = Líder, AD = Pastor (ve toda la iglesia). El Admin dev usa la vista General. */
export const rolNombre: Record<RolVista, string> = { TE: "Siervo", LE: "Líder", AD: "Pastor" };

export interface TurnoRol {
  id: string;
  cuando: string;
  area: string;
  estado: "pendiente" | "confirmado" | "rechazado";
}

export interface FilaCronograma { id: string; cuando: string; estado: "completo" | "falta"; faltan?: number; integrantes: string }

export interface DiaSemana { dia: string; hora: string; ministerios: { nombre: string; cubiertos: number; total: number }[] }

export interface DatosRol {
  nombre: string;
  ministerio: string;
  misTurnos: TurnoRol[];
  cronograma: FilaCronograma[];
  disponibles: { id: string; nombre: string; nota: string }[];
  semana: DiaSemana[];
  sinCubrir: number;
  usuariosActivos: number;
  anunciosRecientes: { id: string; titulo: string; prioridad: string; cuando: string }[];
  actividad: { id: string; texto: string; cuando: string }[];
}

export interface PanelRolProps {
  rol: RolVista;
  datos: DatosRol;
  onAsignar?: (personaId: string) => void;
  /** Se llama al confirmar un turno, para guardarlo en el backend. */
  onConfirmar?: (turnoId: string) => void | Promise<void>;
  /** Se llama al rechazar un turno, para guardarlo en el backend. */
  onRechazar?: (turnoId: string) => void | Promise<void>;
}

const saludos: Record<RolVista, { p: string }> = {
  TE: { p: "Tu turno del próximo domingo espera confirmación." },
  LE: { p: "Tu ministerio tiene turnos sin cubrir este domingo." },
  AD: { p: "Revisa los turnos sin cubrir de la semana." },
};

export function PanelRol({ rol, datos, onAsignar, onConfirmar, onRechazar }: PanelRolProps) {
  const [turnos, setTurnos] = useState(datos.misTurnos);
  const [errorTurno, setErrorTurno] = useState<string | null>(null);
  const pendientes = turnos.filter((t) => t.estado === "pendiente").length;

  async function responder(id: string, estado: TurnoRol["estado"]) {
    const anterior = turnos;
    setErrorTurno(null);
    setTurnos((actual) => actual.map((t) => (t.id === id ? { ...t, estado } : t)));
    try {
      if (estado === "confirmado") await onConfirmar?.(id);
      if (estado === "rechazado") await onRechazar?.(id);
    } catch {
      // Si el servidor no guarda la respuesta, el turno vuelve a su estado anterior.
      setTurnos(anterior);
      setErrorTurno("No se guardó tu respuesta. Intenta de nuevo.");
    }
  }

  const misTurnos = (
    <section className="card" aria-labelledby="mis-turnos">
      <span className="card-title" id="mis-turnos">Mis turnos</span>
      {errorTurno && <p role="alert" style={{ color: "var(--danger)", margin: "8px 0 0" }}>{errorTurno}</p>}
      <ul className="rows">
        {turnos.map((t) => (
          <li className="row" key={t.id}>
            <strong>{t.area}</strong>
            <span className={`status status--${t.estado === "pendiente" ? "warn" : t.estado === "confirmado" ? "ok" : "mute"}`}>
              {t.estado === "pendiente" ? "Pendiente" : t.estado === "confirmado" ? "Confirmado" : "Rechazado"}
            </span>
            <small>{t.cuando}</small>
            {t.estado === "pendiente" && (
              <div className="acts">
                <button type="button" className="btn solid" onClick={() => responder(t.id, "confirmado")}>Confirmar</button>
                <button type="button" className="btn" onClick={() => responder(t.id, "rechazado")}>Rechazar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );

  const cronograma = (
    <section className="card" aria-labelledby="cronograma">
      <span className="card-title" id="cronograma">Cronograma de {datos.ministerio}</span>
      {rol === "TE" && <p className="muted">Solo lectura. Así ves quién más sirve en tu ministerio.</p>}
      <ul className="rows">
        {datos.cronograma.map((f) => (
          <li className="row" key={f.id}>
            <strong>{f.cuando}</strong>
            {rol === "TE" ? null : (
              <span className={`status status--${f.estado === "completo" ? "ok" : "bad"}`}>
                {f.estado === "completo" ? "Completo" : `Falta ${f.faltan ?? 1}`}
              </span>
            )}
            <small>{f.integrantes}</small>
          </li>
        ))}
      </ul>
    </section>
  );

  if (rol === "TE") {
    return (
      <div className="rol" style={{ display: "grid", gap: 24 }}>
        <section className="hello">
          <h1>Hola, {datos.nombre}</h1>
          <p>{saludos.TE.p}</p>
        </section>
        <div className="grid">
          <div className="card">
            <span className="card-title">Por confirmar</span>
            <span className="big">{pendientes}</span>
            <span className="muted">Turnos que esperan tu respuesta</span>
          </div>
          <div className="card">
            <span className="card-title">Próximo turno</span>
            <span className="big">{turnos[0]?.cuando.split("·")[0] ?? "—"}</span>
            <span className="muted">{turnos[0]?.area}</span>
          </div>
          <div className="card">
            <span className="card-title">Turnos este mes</span>
            <span className="big">{turnos.length}</span>
            <span className="muted">En {datos.ministerio}</span>
          </div>
        </div>
        <div className="grid-2">
          {misTurnos}
          {cronograma}
        </div>
      </div>
    );
  }

  if (rol === "LE") {
    return (
      <div className="rol" style={{ display: "grid", gap: 24 }}>
        <section className="hello">
          <h1>Hola, {datos.nombre}</h1>
          <p>{saludos.LE.p}</p>
        </section>
        <div className="grid">
          <div className="card">
            <span className="card-title">Sin cubrir en {datos.ministerio}</span>
            <span className="big gap">{datos.sinCubrir}</span>
            <span className="muted">Turnos que aún necesitan persona</span>
          </div>
          <div className="card">
            <span className="card-title">Por confirmar</span>
            <span className="big">{datos.disponibles.length}</span>
            <span className="muted">Técnicos de {datos.ministerio} esperando respuesta</span>
          </div>
          <div className="card">
            <span className="card-title">Mis turnos</span>
            <span className="big">{turnos.length}</span>
            <span className="muted">Esta semana, en {datos.ministerio}</span>
          </div>
        </div>
        <div className="grid-2">
          {cronograma}
          <section className="card" aria-labelledby="asignar">
            <span className="card-title" id="asignar">Asignar técnico</span>
            <p className="muted">Solo técnicos de {datos.ministerio}.</p>
            <ul className="rows">
              {datos.disponibles.map((d) => (
                <li className="row" key={d.id}>
                  <strong>{d.nombre}</strong>
                  <button type="button" className="btn" onClick={() => onAsignar?.(d.id)}>Asignar</button>
                  <small>{d.nota}</small>
                </li>
              ))}
            </ul>
          </section>
        </div>
        {misTurnos}
      </div>
    );
  }

  return (
    <div className="rol" style={{ display: "grid", gap: 24 }}>
      <section className="hello">
        <h1>Hola, {datos.nombre}</h1>
        <p>{saludos.AD.p}</p>
      </section>
      <div className="grid">
        <div className="card">
          <span className="card-title">Sin cubrir</span>
          <span className="big gap">{datos.sinCubrir}</span>
          <span className="muted">En toda la iglesia</span>
        </div>
        <div className="card">
          <span className="card-title">Servicios esta semana</span>
          <span className="big">{datos.semana.length}</span>
          <span className="muted">Creados automáticamente desde el cronograma</span>
        </div>
        <div className="card">
          <span className="card-title">Usuarios activos</span>
          <span className="big">{datos.usuariosActivos}</span>
          <span className="muted">Técnicos, líderes y administradores</span>
        </div>
      </div>
      <section className="card" aria-labelledby="sem">
        <span className="card-title" id="sem">Cronograma de la semana</span>
        <div className="grid">
          {datos.semana.map((d) => (
            <div className="day" key={d.dia}>
              <span className="day-head">{d.dia}</span>
              <div className="svc">
                <span className="svc-time">{d.hora}</span>
                <div className="mins">
                  {d.ministerios.map((m) => (
                    <span key={m.nombre}>
                      {m.nombre} <strong className={m.cubiertos < m.total ? "gap" : undefined}>{m.cubiertos} de {m.total}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="grid-2">
        <section className="card" aria-labelledby="anuncios-r">
          <span className="card-title" id="anuncios-r">Anuncios recientes</span>
          <ul className="rows">
            {datos.anunciosRecientes.map((a) => (
              <li className="row" key={a.id}>
                <strong>{a.titulo}</strong>
                <span className="status status--warn">{a.prioridad}</span>
                <small>{a.cuando}</small>
              </li>
            ))}
          </ul>
        </section>
        <section className="card" aria-labelledby="actividad">
          <span className="card-title" id="actividad">Actividad reciente</span>
          <ul className="rows">
            {datos.actividad.map((a) => (
              <li className="row" key={a.id}>
                <strong>{a.texto}</strong>
                <span className="tag">{a.cuando}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}