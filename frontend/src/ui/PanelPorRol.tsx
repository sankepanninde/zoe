import { Rol, rolEtiqueta } from "./permisos";
import { Button } from "./Button";

export interface TurnoPersonal {
  id: string;
  cuando: string;
  area: string;
  estado: "pendiente" | "confirmado" | "rechazado";
}

export interface CronogramaFila {
  id: string;
  cuando: string;
  integrantes: string;
  estado: "completo" | "falta";
  faltan?: number;
}

export interface PanelPorRolProps {
  rol: Rol;
  nombre: string;
  ministerio: string;
  misTurnos: TurnoPersonal[];
  cronograma: CronogramaFila[];
  disponibles?: { id: string; nombre: string; nota: string }[];
  sinCubrir: number;
  onConfirmar: (turnoId: string) => void;
  onRechazar: (turnoId: string) => void;
  onAsignar?: (personaId: string) => void;
}

const estadoTurno = {
  pendiente: { texto: "Pendiente", clase: "k-status--warn" },
  confirmado: { texto: "Confirmado", clase: "k-status--ok" },
  rechazado: { texto: "Rechazado", clase: "k-status--mute" },
};

/**
 * Panel de inicio según el rol.
 * TECHNICIAN: sus turnos y el cronograma de su ministerio en lectura.
 * LEADER: su ministerio con gestión, y sus propios turnos.
 * ADMIN y SUPER_ADMIN: toda la iglesia.
 */
export function PanelPorRol(props: PanelPorRolProps) {
  const { rol, nombre, ministerio, misTurnos, cronograma, disponibles, sinCubrir } = props;
  const pendientes = misTurnos.filter((t) => t.estado === "pendiente").length;

  return (
    <div className="k-panel">
      <header className="k-hello">
        <h1>Hola, {nombre}</h1>
        <p className="k-muted">{rolEtiqueta[rol]}{ministerio ? ` · ${ministerio}` : ""}</p>
      </header>

      {rol === "TECHNICIAN" && (
        <>
          <div className="k-grid-3">
            <div className="k-card"><span className="k-label">Por confirmar</span><span className="k-big">{pendientes}</span><span className="k-muted">Turnos que esperan tu respuesta</span></div>
          </div>
          <div className="k-grid-2">
            <Turnos turnos={misTurnos} titulo="Mis turnos" {...props} />
            <Cronograma filas={cronograma} titulo={`Cronograma de ${ministerio}`} nota="Solo lectura" />
          </div>
        </>
      )}

      {rol === "LEADER" && (
        <>
          <div className="k-grid-3">
            <div className="k-card"><span className="k-label">Sin cubrir en {ministerio}</span><span className="k-big k-status--bad">{sinCubrir}</span><div className="k-acts"><Button block={false} className="k-btn--auto">Asignar</Button></div></div>
            <div className="k-card"><span className="k-label">Por confirmar</span><span className="k-big">{pendientes}</span><span className="k-muted">Tus turnos esperando respuesta</span></div>
          </div>
          <div className="k-grid-2">
            <Cronograma filas={cronograma} titulo={`Cronograma de ${ministerio}`} />
            {disponibles && (
              <section className="k-card" aria-label="Asignar técnico">
                <span className="k-label">Asignar técnico</span>
                <ul className="k-rows">
                  {disponibles.map((d) => (
                    <li className="k-row" key={d.id}>
                      <span>{d.nombre}</span>
                      <Button variant="ghost" block={false} className="k-btn--auto" onClick={() => props.onAsignar?.(d.id)}>Asignar</Button>
                      <small>{d.nota}</small>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <Turnos turnos={misTurnos} titulo="Mis turnos" {...props} />
        </>
      )}

      {(rol === "ADMIN" || rol === "SUPER_ADMIN") && (
        <>
          <div className="k-grid-3">
            <div className="k-card"><span className="k-label">Sin cubrir</span><span className="k-big k-status--bad">{sinCubrir}</span><span className="k-muted">En toda la iglesia</span></div>
          </div>
          <Cronograma filas={cronograma} titulo="Cronograma de la semana" />
        </>
      )}
    </div>
  );
}

function Turnos({ turnos, titulo, onConfirmar, onRechazar }: PanelPorRolProps & { turnos: TurnoPersonal[]; titulo: string }) {
  return (
    <section className="k-card" aria-label={titulo}>
      <span className="k-label">{titulo}</span>
      <ul className="k-rows">
        {turnos.map((t) => (
          <li className="k-row" key={t.id}>
            <span>{t.area}</span>
            <span className={`k-status ${estadoTurno[t.estado].clase}`}>{estadoTurno[t.estado].texto}</span>
            <small>{t.cuando}</small>
            {t.estado === "pendiente" && (
              <div className="k-acts">
                <Button block={false} className="k-btn--auto" onClick={() => onConfirmar(t.id)}>Confirmar</Button>
                <Button variant="ghost" block={false} className="k-btn--auto" onClick={() => onRechazar(t.id)}>Rechazar</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Cronograma({ filas, titulo, nota }: { filas: CronogramaFila[]; titulo: string; nota?: string }) {
  return (
    <section className="k-card" aria-label={titulo}>
      <span className="k-label">{titulo}</span>
      {nota && <span className="k-muted">{nota}</span>}
      <ul className="k-rows">
        {filas.map((f) => (
          <li className="k-row" key={f.id}>
            <span>{f.cuando}</span>
            <span className={`k-status ${f.estado === "completo" ? "k-status--ok" : "k-status--bad"}`}>
              {f.estado === "completo" ? "Completo" : `Faltan ${f.faltan ?? 1}`}
            </span>
            <small>{f.integrantes}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
