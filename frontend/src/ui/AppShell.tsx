import { useState } from "react";
import type { ReactNode } from "react";
import { AppNav, navPorRol } from "./AppNav";
import type { RolVista } from "./PanelRol";

/* Pantalla principal: monta el menú del rol y muestra la sección activa.
   Cada sección se pasa como elemento en `vistas`, así que esta pieza solo enruta;
   no conoce los datos de cada pantalla. */

export interface AppShellProps {
  rol: RolVista;
  /** Sección con la que abre. Si no pertenece al rol, abre en Inicio. */
  inicial?: string;
  /** Contenido de cada sección, por id del menú (inicio, disp, bandeja, …). */
  vistas: Record<string, ReactNode>;
  label?: string;
}

export function AppShell({ rol, inicial = "inicio", vistas, label = "Principal" }: AppShellProps) {
  const items = navPorRol(rol);
  const ids = items.map((i) => i.id);
  const [activo, setActivo] = useState(ids.includes(inicial) ? inicial : "inicio");

  const contenido = vistas[activo] ?? (
    <p className="k-muted">Esta sección todavía no está lista.</p>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", minHeight: "100vh" }}>
      <AppNav items={items} activo={activo} onNavegar={setActivo} label={label} />
      <main style={{ minWidth: 0, padding: "28px clamp(16px, 4vw, 40px)", display: "block" }}>
        {contenido}
      </main>
    </div>
  );
}
