import { useState } from "react";
import "./Bandeja.css";

/* Bandeja de avisos. El contenido cambia según el rol: el Siervo ve invitaciones,
   el Líder ve turnos sin cubrir de su ministerio y el Pastor ve lo de toda la iglesia.
   Las respuestas (Aceptar, No puedo, etc.) se muestran aquí y se avisan con onResponder. */

export type TipoAviso = "Invitación" | "Cambio" | "Recordatorio" | "Anuncio" | "Respuesta" | "Turno";
export type RolBandeja = "TE" | "LE" | "AD";

export interface Aviso {
  id: string;
  tipo: TipoAviso;
  prio: "alta" | "media";
  titulo: string;
  texto: string;
  fecha: string;
  /** Botones de respuesta: [etiqueta, valor]. Vacío si solo se puede marcar como leído. */
  acc: [string, string][];
  /** Mensaje que aparece después de responder, por valor. */
  resp?: Record<string, string>;
  estado: "pendiente" | "leido" | "respondido";
  respuesta?: string;
}

export interface BandejaProps {
  rol: RolBandeja;
  avisos?: Aviso[];
  /** Se llama al responder un aviso, para que la pantalla padre actualice el cronograma. */
  onResponder?: (aviso: Aviso, valor: string) => void;
}

const ROLES: Record<RolBandeja, { et: string; sub: string }> = {
  TE: { et: "Siervo", sub: "Invitaciones a turnos, cambios en tu horario y recordatorios." },
  LE: { et: "Líder", sub: "Lo que necesita tu decisión en tu ministerio: turnos sin cubrir y respuestas de tu equipo." },
  AD: { et: "Pastor", sub: "Lo que cambia en la iglesia: ministerios sin cubrir y avisos de líderes." },
};

export function Bandeja({ rol, avisos: inicial = [], onResponder }: BandejaProps) {
  const [avisos, setAvisos] = useState<Aviso[]>(inicial);
  const [soloNuevas, setSoloNuevas] = useState(true);

  const pendientes = avisos.filter((a) => a.estado === "pendiente").length;
  const visibles = avisos.filter((a) => !soloNuevas || a.estado === "pendiente");
  const d = ROLES[rol];

  const responder = (a: Aviso, valor: string) => {
    const respuesta = a.resp?.[valor] ?? "Listo.";
    setAvisos((xs) => xs.map((x) => (x.id === a.id ? { ...x, estado: "respondido", respuesta } : x)));
    onResponder?.(a, valor);
  };

  const marcarLeido = (id: string) =>
    setAvisos((xs) => xs.map((x) => (x.id === id ? { ...x, estado: "leido" } : x)));

  return (
    <div className="ban-wrap">
      <header className="k-hello">
        <span className="k-label">{d.et}</span>
        <h1>Tus avisos</h1>
        <p className="k-muted">{d.sub}</p>
      </header>

      <div className="k-seg" role="group" aria-label="Filtrar">
        <button type="button" aria-pressed={soloNuevas} onClick={() => setSoloNuevas(true)}>
          Por responder {pendientes ? `(${pendientes})` : ""}
        </button>
        <button type="button" aria-pressed={!soloNuevas} onClick={() => setSoloNuevas(false)}>Todas</button>
      </div>

      <ul className="k-list">
        {visibles.map((a) => (
          <li
            key={a.id}
            className={`k-item k-item--${a.prio === "alta" ? "alta" : "media"}${a.estado !== "pendiente" ? " item--leido" : ""}`}
          >
            <span className="k-item__rule" />
            <div>
              <span className="k-label">{a.tipo} · {a.fecha}</span>
              <h2 className="k-item__title">{a.titulo}</h2>
              <p className="k-item__excerpt">{a.texto}</p>

              {a.acc.length > 0 && (
                <div className="ban-acciones">
                  {a.acc.map(([etiqueta, valor], i) => (
                    <button
                      key={valor}
                      type="button"
                      className={"k-btn" + (i ? " k-btn--ghost" : "")}
                      onClick={() => responder(a, valor)}
                      disabled={a.estado === "respondido"}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>
              )}

              {a.respuesta && <p className="ban-meta">{a.respuesta}</p>}

              {a.acc.length === 0 && a.estado === "pendiente" && (
                <div className="ban-acciones">
                  <button type="button" className="k-btn k-btn--ghost" onClick={() => marcarLeido(a.id)}>
                    Marcar como leído
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {visibles.length === 0 && <p className="ban-vacio">No tienes avisos pendientes.</p>}
    </div>
  );
}
