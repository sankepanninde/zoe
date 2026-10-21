import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { RolVista } from "./PanelRol";
import "./AppNav.css";

/* Navegación Fey.
   Escritorio: panel flotante que aparece al pasar el mouse por el borde izquierdo
   (lengüeta) y se oculta al salir. Clic en la lengüeta lo fija y empuja el contenido.
   Celular: barra inferior con cuatro secciones y "Más" para el resto. */

export interface NavItem {
  id: string;
  label: string;
  grupo: "Mi espacio" | "Equipo" | "Comunicación";
}

/** Secciones de cada rol. Siervo: sus turnos. Líder: su ministerio. Pastor: toda la iglesia. */
export function navPorRol(rol: RolVista): NavItem[] {
  const inicio: NavItem = { id: "inicio", label: "Inicio", grupo: "Mi espacio" };
  const disp: NavItem = { id: "disp", label: "Disponibilidad", grupo: "Mi espacio" };
  const bandeja: NavItem = { id: "bandeja", label: "Bandeja", grupo: "Comunicación" };
  const anuncios: NavItem = { id: "anuncios", label: "Anuncios", grupo: "Comunicación" };
  if (rol === "TE") {
    return [inicio, disp, { id: "turnos", label: "Mis turnos", grupo: "Equipo" }, bandeja, anuncios];
  }
  if (rol === "LE") {
    return [
      inicio,
      disp,
      { id: "ministerio", label: "Mi ministerio", grupo: "Equipo" },
      { id: "cronograma", label: "Cronograma", grupo: "Equipo" },
      bandeja,
      anuncios,
    ];
  }
  return [
    inicio,
    disp,
    { id: "cronograma", label: "Cronograma", grupo: "Equipo" },
    { id: "iglesia", label: "Iglesia", grupo: "Equipo" },
    { id: "personas", label: "Personas", grupo: "Equipo" },
    bandeja,
    anuncios,
  ];
}

const ANCHO_ESCRITORIO = 900;
const MOVIL_PRIMARIOS = 4;

export interface AppNavProps {
  items: NavItem[];
  activo: string;
  onNavegar: (id: string) => void;
  /** Avisa al contenedor cuando el menú está fijo en escritorio (para correr el contenido). */
  onFijadoChange?: (fijo: boolean) => void;
  label?: string;
}

export function AppNav({ items, activo, onNavegar, onFijadoChange, label = "Principal" }: AppNavProps) {
  const [abierto, setAbierto] = useState(false);
  const [fijado, setFijado] = useState(false);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [movil, setMovil] = useState(() => window.innerWidth < ANCHO_ESCRITORIO);
  const cierre = useRef<number | null>(null);

  useEffect(() => {
    const ajustar = () => setMovil(window.innerWidth < ANCHO_ESCRITORIO);
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  useEffect(() => {
    onFijadoChange?.(fijado && !movil);
  }, [fijado, movil, onFijadoChange]);

  useEffect(() => () => { if (cierre.current) window.clearTimeout(cierre.current); }, []);

  const abrir = () => {
    if (cierre.current) window.clearTimeout(cierre.current);
    setAbierto(true);
  };
  const cerrar = () => {
    if (fijado) return;
    cierre.current = window.setTimeout(() => setAbierto(false), 300);
  };
  const fijar = () => { setFijado(true); setAbierto(true); };
  const soltar = () => { setFijado(false); setAbierto(false); };
  const teclaFijar = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fijar(); }
  };

  if (movil) {
    const primarios = items.slice(0, MOVIL_PRIMARIOS);
    const resto = items.slice(MOVIL_PRIMARIOS);
    return (
      <>
        <nav className="fey-tabs" aria-label={label}>
          {primarios.map((it) => (
            <button
              key={it.id}
              type="button"
              className="fey-tab"
              aria-current={activo === it.id ? "page" : undefined}
              onClick={() => onNavegar(it.id)}
            >
              {it.label}
            </button>
          ))}
          {resto.length > 0 && (
            <button type="button" className="fey-tab" aria-expanded={hojaAbierta} onClick={() => setHojaAbierta((v) => !v)}>
              Más
            </button>
          )}
        </nav>
        {hojaAbierta && (
          <div className="fey-hoja" role="dialog" aria-label="Más secciones">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                className="fey-item"
                aria-current={activo === it.id ? "page" : undefined}
                onClick={() => { onNavegar(it.id); setHojaAbierta(false); }}
              >
                {it.label}
              </button>
            ))}
            <button type="button" className="fey-cerrar" onClick={() => setHojaAbierta(false)}>Cerrar</button>
          </div>
        )}
      </>
    );
  }

  const grupos = (["Mi espacio", "Equipo", "Comunicación"] as const)
    .map((g) => ({ nombre: g, items: items.filter((i) => i.grupo === g) }))
    .filter((g) => g.items.length > 0);
  const visible = abierto || fijado;

  return (
    <>
      <div className="fey-borde" aria-hidden="true" onMouseEnter={abrir} />
      {!fijado && (
        <div
          className="fey-lengueta"
          role="button"
          tabIndex={0}
          aria-label="Mostrar menú"
          onMouseEnter={abrir}
          onClick={fijar}
          onKeyDown={teclaFijar}
        />
      )}
      <nav
        className={`fey-panel${visible ? " is-abierto" : ""}`}
        aria-label={label}
        onMouseEnter={abrir}
        onMouseLeave={cerrar}
      >
        <div className="fey-marca">
          <span className="fey-punto" aria-hidden="true" />
          Gestión eclesial
          {fijado && (
            <button type="button" className="fey-colapsar" aria-label="Ocultar menú" onClick={soltar}>‹</button>
          )}
        </div>
        {grupos.map((g) => (
          <div key={g.nombre}>
            <span className="fey-grp">{g.nombre}</span>
            {g.items.map((it) => (
              <button
                key={it.id}
                type="button"
                className="fey-item"
                aria-current={activo === it.id ? "page" : undefined}
                onClick={() => onNavegar(it.id)}
              >
                {it.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}
