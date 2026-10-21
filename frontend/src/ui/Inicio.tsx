import type { ReactNode } from "react";
import type { RolVista } from "./PanelRol";
import "./Inicio.css";

/* Inicio por rol (Siervo, Líder, Pastor). Mismo contenido que la vista interactiva.
   Los datos de abajo son de ejemplo: reemplazarlos por los del backend. */

interface Props {
  rol: RolVista;
  nombre: string;
  /** Lleva a otra sección del menú (por ejemplo "disp"). */
  onNavegar?: (id: string) => void;
}

const semanas = ["S-7", "S-6", "S-5", "S-4", "S-3", "S-2", "S-1", "Esta"];

/* Gráfica de barras: meta punteada, barras bajo la meta en naranja, la última en blanco. */
function Barras({ vals, labels, meta, label }: { vals: number[]; labels: string[]; meta: number; label: string }) {
  const w = 600, h = 170, padB = 26, padT = 12, usable = h - padB - padT;
  const slot = (w - 16) / vals.length, bw = slot * 0.56;
  const my = h - padB - (meta / 100) * usable;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label} className="chart">
      <line x1={0} x2={w} y1={my} y2={my} className="chart__meta" />
      <text x={w} y={my - 6} textAnchor="end" className="chart__txt">Meta {meta}%</text>
      {vals.map((v, i) => {
        const x = 8 + i * slot + (slot - bw) / 2;
        const bh = (v / 100) * usable;
        const cls = i === vals.length - 1 ? "chart__bar--ultima" : v < meta ? "chart__bar--bajo" : "chart__bar";
        return (
          <g key={labels[i]}>
            <rect x={x} y={h - padB - bh} width={bw} height={bh} rx={6} className={cls} />
            <text x={x + bw / 2} y={h - 8} textAnchor="middle" className="chart__txt">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* Gráfica de línea con meta. */
function Linea({ vals, labels, meta, label }: { vals: number[]; labels: string[]; meta: number; label: string }) {
  const w = 600, h = 170, padB = 26, padT = 12, usable = h - padB - padT;
  const xs = vals.map((_, i) => 8 + (i * (w - 16)) / (vals.length - 1));
  const ys = vals.map((v) => h - padB - (v / 100) * usable);
  const my = h - padB - (meta / 100) * usable;
  const last = vals.length - 1;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label} className="chart">
      <line x1={0} x2={w} y1={my} y2={my} className="chart__meta" />
      <text x={w} y={my - 6} textAnchor="end" className="chart__txt">Meta {meta}%</text>
      <polyline points={xs.map((x, i) => `${x},${ys[i]}`).join(" ")} className="chart__linea" />
      {vals.map((v, i) => (
        <g key={labels[i]}>
          <circle cx={xs[i]} cy={ys[i]} r={i === last ? 5 : 3} className={v < meta ? "chart__bar--bajo" : i === last ? "chart__bar--ultima" : "chart__bar"} />
          <text x={xs[i]} y={h - 8} textAnchor="middle" className="chart__txt">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function Panel({ titulo, sub, children }: { titulo: string; sub?: string; children: ReactNode }) {
  return (
    <section className="panel panel--ancho">
      <div>
        <h2>{titulo}</h2>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Atencion({ texto }: { texto: string }) {
  return (
    <section className="atencion" aria-label="Requiere tu atención">
      <span className="atencion__tag">Requiere tu atención</span>
      <span>{texto}</span>
    </section>
  );
}

const grafSiervo = <Barras vals={[2, 3, 1, 4, 3, 2]} labels={["May", "Jun", "Jul", "Ago", "Sep", "Oct"]} meta={3} label="Turnos por mes" />;
const grafLider = <Linea vals={[80, 85, 78, 90, 92, 88, 95, 91]} labels={semanas} meta={90} label="Cobertura de Sonido" />;
const grafPastor = <Barras vals={[92, 88, 95, 90, 84, 93, 96, 89]} labels={semanas} meta={90} label="Cobertura de la iglesia" />;

export function Inicio({ rol, nombre, onNavegar }: Props) {
  if (rol === "TE") {
    return (
      <div className="inicio">
        <header className="inicio-head">
          <div className="kicker">Inicio · Siervo</div>
          <h1>Hola, <em>{nombre}</em>.</h1>
          <p className="summary">Tienes <b>2</b> turnos por confirmar esta semana.</p>
        </header>
        <Atencion texto="Confirma tu turno del domingo 18 antes de las 6 p. m." />
        <div className="stats">
          <div className="stat"><span>Por confirmar</span><b>2</b></div>
          <div className="stat"><span>Próximo turno</span><b>Dom 08:00</b></div>
          <div className="stat"><span>Turnos este mes</span><b>3</b></div>
        </div>
        <section className="panel">
          <div className="row">
            <div><strong>Falta marcar tu disponibilidad</strong><div className="muted">Próxima semana: 3 servicios sin responder</div></div>
            <button className="btn solid" type="button" onClick={() => onNavegar?.("disp")}>Marcar ahora</button>
          </div>
        </section>
        <Panel titulo="Mis próximos servicios" sub="Tu compromiso de las próximas semanas">
          <div className="row"><div><strong>Dom 18 · 11:00 · Culto dominical</strong><div className="muted">Sonido principal</div></div><span className="okc">Confirmado</span></div>
          <div className="row"><div><strong>Mié 21 · 19:00 · Círculo de oración</strong><div className="muted">Monitor</div></div><span className="prio">Pendiente</span></div>
          <div className="row"><div><strong>Vie 23 · 20:00 · Jóvenes</strong><div className="muted">Sonido principal</div></div><span className="prio alta">Cambiado</span></div>
        </Panel>
        <Panel titulo="Mis turnos" sub="Confirma o rechaza">
          <div className="row"><div><strong>Culto dominical · Sonido</strong><div className="muted">Dom 18 · 11:00</div></div><div><button className="act" type="button">Confirmar</button> <button className="act" type="button">Rechazar</button></div></div>
          <div className="row"><div><strong>Círculo de oración</strong><div className="muted">Mié 21 · 19:00</div></div><div><button className="act" type="button">Confirmar</button> <button className="act" type="button">Rechazar</button></div></div>
        </Panel>
        <Panel titulo="Mis turnos por mes" sub="Turnos confirmados en los últimos 6 meses">{grafSiervo}</Panel>
      </div>
    );
  }

  if (rol === "LE") {
    return (
      <div className="inicio">
        <header className="inicio-head">
          <div className="kicker">Inicio · Líder de Sonido</div>
          <h1>Hola, <em>{nombre}</em>.</h1>
          <p className="summary">Tienes <b>2</b> turnos sin cubrir en tu ministerio.</p>
        </header>
        <Atencion texto="Mateo tiene conflicto: quedó en dos servicios el domingo 18 a las 11:00." />
        <div className="stats">
          <div className="stat"><span>Por confirmar</span><b>1</b></div>
          <div className="stat"><span>Sin cubrir en Sonido</span><b className="warn">2</b></div>
          <div className="stat"><span>Próximo turno</span><b>Dom 11:00</b></div>
        </div>
        <Panel titulo="Hoy en Sonido" sub="Turnos de tu ministerio, en orden">
          <div className="linea">
            <div className="linea__item"><span className="linea__hora">08:00</span><div><strong>Culto dominical</strong><div className="muted">Andrea</div></div><span className="okc">Cubierto</span></div>
            <div className="linea__item"><span className="linea__hora">11:00</span><div><strong>Culto dominical</strong><div className="muted">Mateo y Sofía (conflicto)</div></div><span className="prio alta">Revisar</span></div>
          </div>
        </Panel>
        <Panel titulo="Técnicos sin disponibilidad" sub="No han marcado la próxima semana. Sin eso no puedes asignarlos con seguridad.">
          <div className="row"><div><strong>Mateo</strong><div className="muted">0 de 3 servicios respondidos</div></div><button className="act" type="button">Recordar</button></div>
          <div className="row"><div><strong>Sofía</strong><div className="muted">1 de 3 servicios respondidos</div></div><button className="act" type="button">Recordar</button></div>
        </Panel>
        <Panel titulo="Solicitudes de cambio" sub="Turnos que tus técnicos piden mover">
          <div className="row"><div><strong>Mateo pide cambiar el Dom 18 · 11:00</strong><div className="muted">Motivo: viaje de trabajo</div></div><div><button className="act" type="button">Aprobar</button> <button className="act" type="button">Rechazar</button></div></div>
          <div className="row"><div><strong>Sofía pide cambiar el Vie 23 · 20:00</strong><div className="muted">Motivo: examen</div></div><div><button className="act" type="button">Aprobar</button> <button className="act" type="button">Rechazar</button></div></div>
        </Panel>
        <Panel titulo="Próximos servicios de Sonido" sub="Quién está asignado a cada uno">
          <div className="row"><div><strong>Dom 18 · 11:00</strong><div className="muted">Sonido principal</div></div><span className="prio alta">Mateo y Sofía (conflicto)</span></div>
          <div className="row"><div><strong>Dom 18 · 08:00</strong><div className="muted">Sonido principal</div></div><span>Andrea</span></div>
          <div className="row"><div><strong>Vie 23 · 20:00</strong><div className="muted">Sonido principal</div></div><span className="muted">Falta 1</span></div>
        </Panel>
        <Panel titulo="Cobertura de Sonido" sub="Porcentaje de turnos cubiertos, últimas 8 semanas">{grafLider}</Panel>
      </div>
    );
  }

  return (
    <div className="inicio">
      <header className="inicio-head">
        <div className="kicker">Inicio · Pastor</div>
        <h1>Hola, <em>{nombre}</em>.</h1>
        <p className="summary">Hay <b>1</b> turno sin cubrir en la iglesia esta semana.</p>
      </header>
      <Atencion texto="Sonido tiene un conflicto de asignación y 2 turnos sin cubrir esta semana." />
      <div className="stats">
        <div className="stat"><span>Sin cubrir</span><b className="warn">1</b></div>
        <div className="stat"><span>Servicios esta semana</span><b>4</b></div>
        <div className="stat"><span>Usuarios activos</span><b>38</b></div>
      </div>
      <Panel titulo="Hoy en la iglesia" sub="Servicios del día, en orden">
        <div className="linea">
          <div className="linea__item"><span className="linea__hora">08:00</span><div><strong>Culto dominical</strong><div className="muted">Sonido, Media, Acomodación</div></div><span className="okc">Completo</span></div>
          <div className="linea__item"><span className="linea__hora">11:00</span><div><strong>Culto dominical</strong><div className="muted">Sonido sin cubrir</div></div><span className="warn-txt">Falta 1</span></div>
          <div className="linea__item"><span className="linea__hora">19:00</span><div><strong>Círculo de oración</strong><div className="muted">Mié · próximo</div></div><span className="muted">Pendiente</span></div>
        </div>
      </Panel>
      <Panel titulo="Conflictos de asignación" sub="Técnicos asignados a dos servicios que se cruzan">
        <div className="row"><div><strong>Mateo</strong><div className="muted">Dom 18 · 11:00 (Sonido) y Dom 18 · 11:30 (Media)</div></div><button className="act" type="button">Resolver</button></div>
      </Panel>
      <Panel titulo="Disponibilidad de la semana" sub="Técnicos que aún no han respondido">
        <div className="stats stats--compactos">
          <div className="stat"><span>Sin responder</span><b className="warn">6</b></div>
          <div className="stat"><span>Respondieron</span><b>32</b></div>
          <div className="stat"><span>Ministerios afectados</span><b>2</b></div>
        </div>
      </Panel>
      <Panel titulo="Cobertura de la iglesia" sub="Porcentaje de turnos cubiertos, últimas 8 semanas">{grafPastor}</Panel>
    </div>
  );
}
