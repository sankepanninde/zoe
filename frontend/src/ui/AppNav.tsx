import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Church, ChevronDown, Home, LogOut, MessageSquare, Users } from "lucide-react";
import "./AppNav.css";

/* Navegación Fey: barra de iconos fija a la izquierda (escritorio).
   Cerrada muestra el logo y los iconos de los grupos abiertos; abierta muestra
   el nombre de la iglesia, los grupos plegables y el usuario con cerrar sesión.
   Celular: barra inferior con "Más". */

export interface NavItem {
  id: string;
  label: string;
  grupo: "Mi espacio" | "Equipo" | "Comunicación";
  icono?: LucideIcon;
}

export interface UsuarioNav {
  nombre: string;
  rol: string;
  iniciales: string;
}

export interface AppNavProps {
  items: NavItem[];
  activo: string;
  onNavegar: (id: string) => void;
  usuario?: UsuarioNav;
  iglesia?: string;
  label?: string;
}

const MOVIL_BREAKPOINT = 900;
const MOVIL_PRIMARIOS = 4;
const GRUPOS = ["Mi espacio", "Equipo", "Comunicación"] as const;
// Ajustes y Salir no van en los grupos: están en la zona del usuario.
const FUERA_DE_GRUPOS = ["ajustes", "salir"];
const ICONO_GRUPO = {
  "Mi espacio": Home,
  "Equipo": Users,
  "Comunicación": MessageSquare,
} as const;

function Item({ it, activo, onNavegar }: { it: NavItem; activo: string; onNavegar: (id: string) => void }) {
  const Icono = it.icono;
  return (
    <button
      type="button"
      className="fey-item"
      title={it.label}
      aria-current={activo === it.id ? "page" : undefined}
      onClick={() => onNavegar(it.id)}
    >
      {Icono && <Icono size={20} strokeWidth={1.75} aria-hidden="true" />}
      <span>{it.label}</span>
    </button>
  );
}

export function AppNav({ items, activo, onNavegar, usuario, iglesia, label = "Principal" }: AppNavProps) {
  const [movil, setMovil] = useState(() => window.innerWidth < MOVIL_BREAKPOINT);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [plegados, setPlegados] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const ajustar = () => setMovil(window.innerWidth < MOVIL_BREAKPOINT);
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  const principales = items.filter((i) => !FUERA_DE_GRUPOS.includes(i.id));
  const ajustes = items.find((i) => i.id === "ajustes");
  const salir = items.find((i) => i.id === "salir");

  if (movil) {
    const primarios = principales.slice(0, MOVIL_PRIMARIOS);
    const hayMas = items.length > primarios.length;
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
          {hayMas && (
            <button type="button" className="fey-tab" aria-expanded={hojaAbierta} onClick={() => setHojaAbierta((v) => !v)}>
              Más
            </button>
          )}
        </nav>
        {hojaAbierta && (
          <div className="fey-hoja" role="dialog" aria-label="Más secciones">
            {items.map((it) => (
              <Item
                key={it.id}
                it={it}
                activo={activo}
                onNavegar={(id) => { onNavegar(id); setHojaAbierta(false); }}
              />
            ))}
            <button type="button" className="fey-cerrar" onClick={() => setHojaAbierta(false)}>Cerrar</button>
          </div>
        )}
      </>
    );
  }

  const grupos = GRUPOS.map((g) => ({
    nombre: g,
    items: principales.filter((i) => i.grupo === g),
  })).filter((g) => g.items.length > 0);

  return (
    <nav className="fey-rail" aria-label={label}>
      <div className="fey-marca">
        <span className="fey-logo" aria-hidden="true"><Church size={20} strokeWidth={1.75} /></span>
        <span className="fey-marca-txt">{iglesia || "Mi iglesia"}</span>
      </div>

      {grupos.map((g) => {
        const abierto = plegados[g.nombre] ?? g.items.some((i) => i.id === activo);
        return (
          <div key={g.nombre} className="fey-grupo">
            <button
              type="button"
              className="fey-grp-head"
              aria-expanded={abierto}
              title={g.nombre}
              onClick={() => setPlegados((s) => ({ ...s, [g.nombre]: !abierto }))}
            >
              {(() => { const Icono = ICONO_GRUPO[g.nombre]; return <Icono size={20} strokeWidth={1.75} aria-hidden="true" />; })()}
              <span className="fey-grp-txt">{g.nombre}</span>
              <ChevronDown className={`fey-chev${abierto ? "" : " is-cerrado"}`} size={14} aria-hidden="true" />
            </button>
            {abierto && g.items.map((it) => (
              <Item key={it.id} it={it} activo={activo} onNavegar={onNavegar} />
            ))}
          </div>
        );
      })}

      <div className="fey-cuenta">
        <button
          type="button"
          className="fey-usuario"
          title="Ajustes"
          aria-current={activo === ajustes?.id ? "page" : undefined}
          onClick={() => ajustes && onNavegar(ajustes.id)}
        >
          <span className="fey-avatar" aria-hidden="true">{usuario?.iniciales ?? ""}</span>
          <span className="fey-usuario-txt">
            <b>{usuario?.nombre ?? ""}</b>
            <small>{usuario?.rol ?? ""}</small>
          </span>
        </button>
        {salir && (
          <button
            type="button"
            className="fey-salir-btn"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={() => onNavegar(salir.id)}
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </nav>
  );
}