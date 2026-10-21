import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppNav, navPorRol } from "./AppNav";
import { useAuth } from "@/stores/auth.store";
import type { RolVista } from "./PanelRol";

export function AppShell() {
  const { user } = useAuth();
  // Determinar el rol del usuario
  const rol: RolVista = user?.role === "ADMIN" ? "AD" : user?.role === "LEADER" ? "LE" : "TE";
  
  const items = navPorRol(rol);
  const navigate = useNavigate();
  const location = useLocation();
  const [fijo, setFijo] = useState(false);

  // Mapeo de los IDs del menú nuevo a las rutas reales
  const pathToId: Record<string, string> = {
    "/": "inicio",
    "/availability": "disp",
    "/calendar": "cronograma",
    "/my-schedule": "turnos",
    "/team": "personas",
    "/settings": "iglesia",
  };
  
  const idToPath: Record<string, string> = {
    inicio: "/",
    disp: "/availability",
    cronograma: "/calendar",
    turnos: "/my-schedule",
    personas: "/team",
    iglesia: "/settings",
    bandeja: "/team",
    anuncios: "/",
    ministerio: "/team",
  };

  const activo = pathToId[location.pathname] || "inicio";

  const handleNavegar = (id: string) => {
    const path = idToPath[id];
    if (path) navigate(path);
  };

  return (
    <div className="fey-shell" style={{ paddingLeft: fijo ? 280 : 0 }}>
      <AppNav 
        items={items} 
        activo={activo} 
        onNavegar={handleNavegar} 
        onFijadoChange={setFijo} 
      />
      <main style={{ minWidth: 0, padding: "40px clamp(16px, 4vw, 48px)" }}>
        <Outlet /> {/* Aquí se renderizan las páginas */}
      </main>
    </div>
  );
}