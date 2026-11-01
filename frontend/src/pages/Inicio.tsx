import { useEffect, useRef, useState } from "react";
import "./Inicio.css";

export type RolVista = "te" | "le" | "ad" | "dev";

interface Props {
  rol: RolVista;
  nombre: string;
}

const W = 400, H = 180, PAD = 28;

function Barras({ datos, max, color, etiquetas, label }: { datos: number[]; max: number; color: string; etiquetas: string[]; label: string }) {
  const ancho = (W - PAD * 2) / datos.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="ch">
      {[0, 1, 2, 3].map((i) => {
        const y = PAD / 2 + ((H - PAD * 1.5) * i) / 3;
        return <line key={i} x1={PAD} x2={W - PAD / 2} y1={y} y2={y} className="ch-grid" />;
      })}
      {datos.map((v, i) => {
        const h = ((H - PAD * 1.5) * v) / max;
        const x = PAD + i * ancho + ancho * 0.2;
        return (
          <g key={i}>
            <rect x={x} y={H - PAD - h} width={ancho * 0.6} height={h} rx={6} fill={color}>
              <title>{`${etiquetas[i]}: ${v}`}</title>
            </rect>
            <text x={x + ancho * 0.3} y={H - 8} textAnchor="middle" className="ch-txt">{etiquetas[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Linea({ datos, max, etiquetas, label }: { datos: number[]; max: number; etiquetas: string[]; label: string }) {
  const paso = (W - PAD * 2) / (datos.length - 1);
  const pts = datos.map((v, i) => ({ x: PAD + i * paso, y: H - PAD - ((H - PAD * 1.5) * v) / max, v }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="ch">
      {[0, 1, 2, 3].map((i) => {
        const y = PAD / 2 + ((H - PAD * 1.5) * i) / 3;
        return <line key={i} x1={PAD} x2={W - PAD / 2} y1={y} y2={y} className="ch-grid" />;
      })}
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} className="ch-linea" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} className="ch-punto"><title>{`${etiquetas[i]}: ${p.v}`}</title></circle>
          <text x={p.x} y={H - 8} textAnchor="middle" className="ch-txt">{etiquetas[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function Bandeja() {
  const [abierta, setAbierta] = useState(false);
  const [items, setItems] = useState([
    { id: "m", t: "Mensajes del equipo", n: 5 },
    { id: "c", t: "Comentarios en anuncios", n: 3 },
    { id: "a", t: "Solicitudes de acceso", n: 2 },
  ]);
  const ref = useRef<HTMLDivElement>(null);
  const total = items.reduce((s, i) => s + i.n, 0);

  useEffect(() => {
    if (!abierta) return;
    const cerrar = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAbierta(false);
    };
    document.addEventListener("click", cerrar);
    return () => document.removeEventListener("click", cerrar);
  }, [abierta]);

  const leer = (id: string) => setItems((p) => p.map((i) => (i.id === id ? { ...i, n: 0 } : i)));
  const leerTodo = () => setItems((p) => p.map((i) => ({ ...i, n: 0 })));

  return (
    <div className="campana-wrap" ref={ref}>
      <button className="campana" aria-haspopup="true" aria-expanded={abierta} aria-label="Bandeja" onClick={() => setAbierta((v) => !v)}>
        <svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
        {total > 0 && <b>{total}</b>}
      </button>
      {abierta && (
        <div className="bandeja-menu">
          <div className="bm-head">Pendientes</div>
          {items.map((i) => (
            <button key={i.id} className="bm-row" onClick={() => leer(i.id)}>
              <span>{i.t}</span>
              <span className={i.n ? "bm-n" : "bm-n leido"}>{i.n}</span>
            </button>
          ))}
          <button className="bm-todo" onClick={leerTodo}>Marcar todo como leído</button>
        </div>
      )}
    </div>
  );
}

function VistaSiervo() {
  const [estado, setEstado] = useState<"pendiente" | "acepto" | "no">("pendiente");
  return (
    <>
      <div className="card ancla">
        <div>
          <small className="eyebrow">Próximo culto</small>
          <h2>Domingo 26 · 08:00 y 10:00</h2>
        </div>
        <div className="pct pct--sm">Confirmado<small>2 de 2 turnos</small></div>
      </div>
      <div className="card accion">
        <div><strong>Confirma tu turno del 2 de nov.</strong></div>
        <div className="acc-btns">
          <button className="btn" disabled={estado !== "pendiente"} onClick={() => setEstado("acepto")}>
            {estado === "acepto" ? "Confirmado" : "Acepto"}
          </button>
          <button className="btn ghost" disabled={estado !== "pendiente"} onClick={() => setEstado("no")}>
            {estado === "no" ? "Avisado" : "No puedo"}
          </button>
        </div>
      </div>
      <div className="stats">
        <div className="card stat"><b>3</b><span>Turnos este mes</span></div>
        <div className="card stat"><b>9 h</b><span>Horas servidas</span></div>
        <div className="card stat"><b>4 sem</b><span>Desde tu último turno</span></div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Horas por mes</h3>
          <Barras datos={[4, 6, 5, 7, 6, 9]} max={10} color="#479ffa" etiquetas={["May", "Jun", "Jul", "Ago", "Sep", "Oct"]} label="Horas por mes" />
        </div>
        <div className="card">
          <h3>Mis próximos turnos</h3>
          <div className="row"><div>Culto 1</div><span className="tag ok">Confirmado</span></div>
          <div className="row"><div>Culto 2</div><span className="tag ok">Confirmado</span></div>
          <div className="row"><div>Ensayo de sonido</div><span className="tag warn">Pendiente</span></div>
        </div>
      </div>
    </>
  );
}

function VistaLider() {
  const [vacantes, setVacantes] = useState(2);
  const [avisado, setAvisado] = useState(false);
  const cubiertos = 8 - vacantes;
  const pct = Math.round((cubiertos / 8) * 100);
  const dom = ["S-5", "S-4", "S-3", "S-2", "S-1", "Hoy"];
  return (
    <>
      <div className="card ancla">
        <div>
          <small className="eyebrow">Cobertura · Sonido · domingo 26</small>
          <h2>{cubiertos} de 8 puestos cubiertos</h2>
          <div className="meter"><i style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="pct">{pct}%<small>cubierto</small></div>
      </div>
      <div className="card accion">
        <div><strong>{vacantes > 0 ? `Cubrir ${vacantes} vacantes del domingo 26` : "Domingo 26 cubierto"}</strong></div>
        <button className="btn" disabled={vacantes === 0} onClick={() => setVacantes(0)}>
          {vacantes === 0 ? "Listo" : "Asignar sugeridos"}
        </button>
      </div>
      <div className="stats">
        <div className="card stat"><b>5</b><span>Confirmados</span></div>
        <div className="card stat"><b>2</b><span>Sin respuesta</span></div>
        <div className="card stat"><b>3</b><span>Sin servir +3 sem</span></div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Cobertura por domingo</h3>
          <Barras datos={[70, 85, 60, 90, 75, 75]} max={100} color="#ffa16c" etiquetas={dom} label="Cobertura por domingo" />
        </div>
        <div className="card">
          <h3>Alertas</h3>
          <div className="row">
            <div>{vacantes > 0 ? "2 vacantes en Sonido, domingo 26" : "Sonido cubierto"}</div>
            <button className="mini" disabled={vacantes === 0} onClick={() => setVacantes(0)}>{vacantes === 0 ? "Hecho" : "Asignar"}</button>
          </div>
          <div className="row">
            <div>Luis Ortiz no ha respondido</div>
            <button className="mini" disabled={avisado} onClick={() => setAvisado(true)}>{avisado ? "Hecho" : "Recordar"}</button>
          </div>
        </div>
      </div>
    </>
  );
}

function VistaPastor() {
  const [aprobado, setAprobado] = useState(false);
  return (
    <>
      <div className="card accion">
        <div><strong>{aprobado ? "Anuncios al día" : "Aprobar 3 anuncios pendientes"}</strong></div>
        <button className="btn" disabled={aprobado} onClick={() => setAprobado(true)}>{aprobado ? "Aprobado" : "Revisar"}</button>
      </div>
      <div className="card ancla">
        <div>
          <small className="eyebrow">Cobertura de la iglesia</small>
          <h2>Asistencia y cobertura</h2>
        </div>
        <div className="pct">82%<small>cobertura</small></div>
      </div>
      <div className="stats">
        <div className="card stat"><b>142</b><span>Asistentes último culto</span></div>
        <div className="card stat"><b>5</b><span>Ministerios activos</span></div>
        <div className="card stat"><b>3</b><span>Alertas abiertas</span></div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Asistencia</h3>
          <Linea datos={[118, 131, 124, 140, 127, 135, 138, 142]} max={160} etiquetas={["S-7", "S-6", "S-5", "S-4", "S-3", "S-2", "S-1", "Hoy"]} label="Asistencia" />
        </div>
        <div className="card">
          <h3>Cobertura por ministerio</h3>
          <Barras datos={[100, 75, 60, 90, 80]} max={100} color="#4ebe96" etiquetas={["Aseo", "Sonido", "Medios", "Cocina", "Niños"]} label="Cobertura por ministerio" />
        </div>
      </div>
    </>
  );
}

function VistaDev() {
  const [pendientes, setPendientes] = useState(["Pedro Gil", "Laura Mejía", "Andrés Rey"]);
  return (
    <>
      <div className="card ancla">
        <div>
          <small className="eyebrow">Estado de la app</small>
          <h2>Todo en orden</h2>
        </div>
        <div className="pct pct--sm">Estable<small>0 incidentes abiertos</small></div>
      </div>
      <div className="stats">
        <div className="card stat"><b>38</b><span>Usuarios activos hoy</span></div>
        <div className="card stat"><b>2</b><span>Errores últimas 24 h</span></div>
        <div className="card stat"><b>{pendientes.length}</b><span>Solicitudes de acceso</span></div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Errores de la semana</h3>
          <Barras datos={[1, 0, 3, 1, 0, 2, 2]} max={4} color="#f0616d" etiquetas={["L", "M", "X", "J", "V", "S", "D"]} label="Errores de la semana" />
        </div>
        <div className="card">
          <h3>Solicitudes de acceso</h3>
          {pendientes.map((n) => (
            <div className="row" key={n}>
              <div>{n}</div>
              <button className="mini" onClick={() => setPendientes((p) => p.filter((x) => x !== n))}>Aprobar</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function Inicio({ rol, nombre }: Props) {
  return (
    <div className="inicio">
      <header className="top">
        <div>
          <small className="eyebrow">Próximo servicio · domingo 26 oct · 08:00 y 10:00</small>
          <h1>Hola, {nombre}</h1>
        </div>
        <Bandeja />
      </header>

      <section className="comun">
        <div className="card">
          <h3>Anuncios recientes</h3>
          <div className="row"><div>Ensayo viernes</div></div>
          <div className="row"><div>Cambio en Culto 2</div></div>
        </div>
      </section>

      {rol === "te" && <VistaSiervo />}
      {rol === "le" && <VistaLider />}
      {rol === "ad" && <VistaPastor />}
      {rol === "dev" && <VistaDev />}
    </div>
  );
}