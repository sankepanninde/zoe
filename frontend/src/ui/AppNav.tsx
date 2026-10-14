import type { ReactNode } from "react";
import type { RolVista } from "./PanelRol";

/* Navegación principal: barra lateral de iconos en escritorio y barra inferior en celular.
   Las secciones dependen del rol; la app decide cuál es la activa. */

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

const svg = (d: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const iconos = {
  inicio: svg(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  turnos: svg(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>),
  anuncios: svg(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 20a2 2 0 0 1-3.4 0" /></>),
  ministerio: svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" /></>),
  cronograma: svg(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M8 14h2M14 14h2M8 18h2" /></>),
  iglesia: svg(<><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" /></>),
  personas: svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  plataforma: svg(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
  bandeja: svg(<><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z" /></>),
  disp: svg(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M9 15l2 2 4-4" /></>),
};

/** Secciones de cada rol. Siervo: sus turnos. Líder: su ministerio. Pastor: toda la iglesia. */
export function navPorRol(rol: RolVista): NavItem[] {
  const inicio = { id: "inicio", label: "Inicio", icon: iconos.inicio };
  const disp = { id: "disp", label: "Disponibilidad", icon: iconos.disp };
  const bandeja = { id: "bandeja", label: "Bandeja", icon: iconos.bandeja };
  const anuncios = { id: "anuncios", label: "Anuncios", icon: iconos.anuncios };
  if (rol === "TE") {
    return [inicio, disp, { id: "turnos", label: "Mis turnos", icon: iconos.turnos }, bandeja, anuncios];
  }
  if (rol === "LE") {
    return [
      inicio,
      { id: "ministerio", label: "Mi ministerio", icon: iconos.ministerio },
      { id: "cronograma", label: "Cronograma", icon: iconos.cronograma },
      disp,
      bandeja,
      anuncios,
    ];
  }
  return [
    inicio,
    { id: "cronograma", label: "Cronograma", icon: iconos.cronograma },
    disp,
    { id: "iglesia", label: "Iglesia", icon: iconos.iglesia },
    { id: "personas", label: "Personas", icon: iconos.personas },
    bandeja,
    anuncios,
  ];
}

export interface AppNavProps {
  items: NavItem[];
  activo: string;
  onNavegar: (id: string) => void;
  /** Nombre accesible del menú. */
  label?: string;
}

export function AppNav({ items, activo, onNavegar, label = "Principal" }: AppNavProps) {
  return (
    <nav className="k-nav" aria-label={label}>
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              aria-label={it.label}
              aria-current={activo === it.id ? "page" : undefined}
              onClick={() => onNavegar(it.id)}
            >
              {it.icon}
              <span className="k-nav__tip">{it.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
