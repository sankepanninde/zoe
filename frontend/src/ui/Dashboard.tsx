import { useMemo, useRef, useState } from "react";
import "./dashboard.css";
import { PanelRol, rolNombre } from "./PanelRol";
import type { DatosRol, RolVista } from "./PanelRol";
import { Barra, DetalleAnuncio, Lista, ordenar, Resumen } from "./Announcements";
import type { Announcement, Filter } from "./Announcements";
import { NuevoAnuncio } from "./NuevoAnuncio";
import { Banner } from "./Banner";
import type { NuevoAnuncioData } from "./NuevoAnuncio";
import {
  Borradores, Hoy, Inscripciones, PeticionesRestringidas, Proximos, TablaIglesias,
} from "./Bloques";
import type { Borrador, Evento, HoyItem, IglesiaResumen, Inscripcion, Peticion } from "./Bloques";

export interface DashboardProps {
  iglesia: string;
  iniciales: string;
  anuncios: Announcement[];
  eventos: Evento[];
  hoy?: HoyItem[];
  /** Anuncios publicados en los últimos 7 días, para la tendencia. */
  tendencia?: number[];
  /** Si se pasa, el encabezado muestra Técnico / Líder / Admin y el panel de cada rol. */
  roles?: { datos: Record<RolVista, DatosRol>; onAsignar?: (personaId: string) => void };
  /** Rol del usuario que entra. Si se pasa, no aparece el selector de roles: cada persona ve solo su panel. */
  rolFijo?: RolVista;
  /** Muestra esqueletos mientras llegan los datos. */
  cargando?: boolean;
  inscripciones: Inscripcion[];
  borradores: Borrador[];
  /** Peticiones de oración. Todos los roles las ven. La restricción de datos va también en el servidor. */
  peticiones?: Peticion[];
  /** Solo con roles = false. Con roles, "Nuevo" lo ve solo el rol Líder. */
  puedePublicar?: boolean;
  /** Vista de administración general. Si no se pasa, el selector no aparece. */
  general?: { iglesias: IglesiaResumen[]; administradores: number };
  /** Si la carga inicial falla, muestra el aviso con botón para reintentar. */
  errorCarga?: string | null;
  onReintentar?: () => void;
  /** Admin dev: muestra solo la vista General, sin el selector ni el contenido de cada iglesia. */
  soloGeneral?: boolean;
  onMarcarLeido: (id: string) => void;
  onMarcarTodoLeido: () => void;
  /** Si falla, debe lanzar un error: el dashboard muestra el aviso y conserva el texto. */
  onComentar: (anuncioId: string, texto: string) => void | Promise<void>;
  /** Si falla, debe lanzar un error: el formulario se queda abierto con los datos. */
  onCrearAnuncio: (data: NuevoAnuncioData) => void | Promise<void>;
  /** Cierra la sesión. Si no se pasa, el botón Salir no aparece. */
  onSalir?: () => void;
  onConfirmarTurno?: (turnoId: string) => void;
  onRechazarTurno?: (turnoId: string) => void;
}

type Pestana = "insc" | "borr" | "oracion";

/**
 * Panel completo, con la estructura y estilos de dashboard.html.
 * Recibe datos y callbacks del padre; no decide nada por su cuenta.
 */
export function Dashboard({
  iglesia,
  iniciales,
  anuncios,
  eventos,
  hoy = [],
  tendencia,
  cargando = false,
  roles,
  rolFijo,
  inscripciones,
  borradores,
  peticiones,
  general,
  onMarcarLeido,
  onMarcarTodoLeido,
  onComentar,
  onCrearAnuncio,
  onSalir,
  onConfirmarTurno,
  onRechazarTurno,
  puedePublicar = false,
  soloGeneral = false,
  errorCarga = null,
  onReintentar,
}: DashboardProps) {
  const [vista, setVista] = useState<"iglesia" | "general">("iglesia");
  const vistaActual = soloGeneral ? "general" : vista;
  const [filtro, setFiltro] = useState<Filter>("todos");
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const focoPrevio = useRef<HTMLElement | null>(null);
  const [pestana, setPestana] = useState<Pestana>("insc");
  const [rolElegido, setRolSel] = useState<RolVista>("AD");
  const rolSel = rolFijo ?? rolElegido;
  const [error, setError] = useState<string | null>(null);
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);

  /* "Nuevo" lo ve solo el líder. Con roles depende del rol seleccionado; sin roles, de la prop. */
  const puedeNuevo = roles ? rolSel === "LE" || rolSel === "AD" : puedePublicar;

  const hoyItems = hoy.map((h) => ({ ...h, onVer: () => verHoy(h) }));

  /* Ver en "Hoy": cambia al rol indicado y baja a la sección del turno. */
  function verHoy(h: HoyItem) {
    if (h.rol && roles) setRolSel(h.rol);
    h.onVer?.();
    if (h.destino) {
      requestAnimationFrame(() =>
        document.getElementById(h.destino!)?.scrollIntoView({ behavior: "smooth", block: "center" })
      );
    }
  }

  const visibles = useMemo(() => ordenar(anuncios, filtro, texto), [anuncios, filtro, texto]);
  const detalle = anuncios.find((a) => a.id === abierto) ?? null;
  const pestanas: { id: Pestana; label: string }[] = [
    { id: "insc", label: "Cupos" },
    { id: "borr", label: "Borradores" },
    { id: "oracion", label: "Oración" },
  ];

  /* Con roles: el Siervo ve solo Oración; Líder y Pastor ven también Cupos y Borradores. */
  const pestanasVisibles = roles ? pestanas.filter((p) => p.id === "oracion" || rolSel !== "TE") : pestanas;
  const pestanaActiva = pestanasVisibles.some((p) => p.id === pestana) ? pestana : pestanasVisibles[0].id;

  const panelInfo = (
          <div>
            <div className="tabs" role="tablist" aria-label="Más información">
              {pestanasVisibles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={pestanaActiva === p.id}
                  onClick={() => setPestana(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {pestanaActiva === "insc" && (
              <div className="pane" style={{ marginTop: 16 }}>
                <Inscripciones items={inscripciones} />
              </div>
            )}

            {pestanaActiva === "borr" && (
              <div className="pane" style={{ marginTop: 16 }}>
                <Borradores items={borradores} />
              </div>
            )}

            {pestanaActiva === "oracion" && (
              <div className="pane" style={{ marginTop: 16 }}>
                <PeticionesRestringidas peticiones={peticiones ?? []} puedeVer={true} />
              </div>
            )}
          </div>
  );

  return (
    <div className="k-dash">
      <div className="wrap">
        <header className="top">
          <span className="mark">Gestión eclesial</span>
          <div className="who">
            {roles && !rolFijo && (
              <div className="seg" role="group" aria-label="Ver como">
                {(["TE", "LE", "AD"] as RolVista[]).map((r) => (
                  <button key={r} type="button" aria-pressed={rolSel === r} onClick={() => setRolSel(r)}>{rolNombre[r]}</button>
                ))}
              </div>
            )}
            {!roles && general && !soloGeneral && (
              <div className="seg" role="group" aria-label="Vista">
                <button type="button" aria-pressed={vista === "iglesia"} onClick={() => setVista("iglesia")}>Iglesia</button>
                <button type="button" aria-pressed={vista === "general"} onClick={() => setVista("general")}>General</button>
              </div>
            )}
            <span>{iglesia}</span>
            <span className="avatar" aria-hidden="true">{iniciales}</span>
            {onSalir && <button type="button" className="btn" onClick={onSalir}>Salir</button>}
          </div>
        </header>

        {errorCarga && (
          <div style={{ marginTop: 16 }}>
            <Banner tone="bad">
              <span>{errorCarga} </span>
              {onReintentar && <button type="button" onClick={onReintentar} style={{ background: "none", border: 0, padding: 0, color: "inherit", textDecoration: "underline", cursor: "pointer", font: "inherit" }}>Reintentar</button>}
            </Banner>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16 }}>
            <Banner tone="bad">
              <span>{error} </span>
              <button type="button" onClick={() => setError(null)} style={{ background: "none", border: 0, padding: 0, color: "inherit", textDecoration: "underline", cursor: "pointer", font: "inherit" }}>Cerrar</button>
            </Banner>
          </div>
        )}

        {roles ? (
          <>
            <Hoy items={hoyItems.filter((h) => !h.rol || h.rol === rolSel)} vacio="Nada pendiente por ahora." />
            <PanelRol
              key={rolSel}
              rol={rolSel}
              datos={roles.datos[rolSel]}
              onAsignar={roles.onAsignar}
              onConfirmar={onConfirmarTurno}
              onRechazar={onRechazarTurno}
            />
            <div className="cols" style={{ marginTop: 32 }}>
              <div className="col">
                <Barra
                  filtro={filtro}
                  onFiltro={setFiltro}
                  texto={texto}
                  onTexto={setTexto}
                  onMarcarTodo={onMarcarTodoLeido}
                  onNuevo={puedeNuevo ? () => {
                    focoPrevio.current = document.activeElement as HTMLElement;
                    setNuevo(true);
                  } : undefined}
                />
                <Lista
                  items={visibles}
                  onAbrir={(a) => {
                    focoPrevio.current = document.activeElement as HTMLElement;
                    setAbierto(a.id);
                    if (!a.leido) onMarcarLeido(a.id);
                  }}
                  onMarcarLeido={onMarcarLeido}
                />
              </div>
            </div>
            <div style={{ marginTop: 32 }}>
              {panelInfo}
            </div>
          </>
        ) : vistaActual === "iglesia" || !general ? (
          <>
            {cargando ? (
              <div className="stats" aria-busy="true" aria-label="Cargando resumen">
                {[0, 1, 2].map((i) => <div key={i} className="card skel" />)}
              </div>
            ) : (
              <Resumen items={anuncios} tendencia={tendencia} />
            )}
            <Proximos eventos={eventos} />

            <div className="cols">
              <div className="col">
                <Barra
                  filtro={filtro}
                  onFiltro={setFiltro}
                  texto={texto}
                  onTexto={setTexto}
                  onMarcarTodo={onMarcarTodoLeido}
                  onNuevo={puedeNuevo ? () => {
                    focoPrevio.current = document.activeElement as HTMLElement;
                    setNuevo(true);
                  } : undefined}
                />
                <Lista
                  items={visibles}
                  onAbrir={(a) => {
                    focoPrevio.current = document.activeElement as HTMLElement;
                    setAbierto(a.id);
                    if (!a.leido) onMarcarLeido(a.id);
                  }}
                  onMarcarLeido={onMarcarLeido}
                />
              </div>

              <aside className="col">
                <Hoy items={hoyItems} />

                {panelInfo}
              </aside>
            </div>
          </>
        ) : (
          <>
            <section className="stats" aria-label="Plataforma">
              <div className="card stat"><span className="n">{general.iglesias.length}</span><span className="label">Iglesias</span></div>
              <div className="card stat"><span className="n">{general.administradores}</span><span className="label">Administradores</span></div>
              <div className="card stat"><span className="n">{general.iglesias.filter((i) => !i.activa).length}</span><span className="label">Sin actividad</span></div>
            </section>
            <TablaIglesias items={general.iglesias} />
          </>
        )}
      </div>

      {detalle && (
        <DetalleAnuncio
          a={detalle}
          onCerrar={() => {
            setAbierto(null);
            requestAnimationFrame(() => focoPrevio.current?.focus());
          }}
          onComentar={async (t) => {
            try {
              await onComentar(detalle.id, t);
            } catch {
              setError("No pudimos enviar tu comentario. Tu texto sigue aquí; intenta de nuevo.");
              throw new Error("comentario");
            }
          }}
        />
      )}

      {nuevo && (
        <NuevoAnuncio
          error={errorNuevo}
          alcance={roles && rolSel === "LE" ? "ministerio" : "iglesia"}
          ministerio={roles ? roles.datos[rolSel].ministerio : ""}
          onCerrar={() => {
            setNuevo(false);
            setErrorNuevo(null);
            requestAnimationFrame(() => focoPrevio.current?.focus());
          }}
          onGuardar={async (data) => {
            try {
              await onCrearAnuncio(data);
            } catch {
              setErrorNuevo("No pudimos publicar el anuncio. Tus datos siguen aquí; intenta de nuevo.");
              return;
            }
            setErrorNuevo(null);
            setNuevo(false);
            setErrorNuevo(null);
            requestAnimationFrame(() => focoPrevio.current?.focus());
          }}
        />
      )}
    </div>
  );
}