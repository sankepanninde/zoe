import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Settings,
  Users,
  User,
  Layers,
  Inbox,
  Megaphone,
  LogOut,
} from 'lucide-react';
import { AppNav } from '@/ui/AppNav';
import { useAuth } from '@/stores/auth.store';
import '@/ui/kit.css';
import '@/ui/AppNav.css';

// Las opciones sin página todavía van a '/' (inicio) hasta que existan sus rutas.
const RUTAS = [
  { id: 'inicio', label: 'Inicio', path: '/', grupo: 'Mi espacio', icono: LayoutDashboard },
  { id: 'disponibilidad', label: 'Disponibilidad', path: '/availability', grupo: 'Mi espacio', icono: CalendarCheck },
  { id: 'mis-turnos', label: 'Mis turnos', path: '/my-schedule', grupo: 'Mi espacio', icono: CalendarDays },
  { id: 'cronograma', label: 'Cronograma', path: '/calendar', grupo: 'Equipo', icono: CalendarRange },
  { id: 'mi-ministerio', label: 'Mi ministerio', path: '/', grupo: 'Equipo', icono: User },
  { id: 'ministerios', label: 'Ministerios', path: '/', grupo: 'Equipo', icono: Layers },
  { id: 'equipo', label: 'Equipo', path: '/team', grupo: 'Equipo', icono: Users },
  { id: 'bandeja', label: 'Bandeja', path: '/', grupo: 'Comunicación', icono: Inbox },
  { id: 'anuncios', label: 'Anuncios', path: '/', grupo: 'Comunicación', icono: Megaphone },
  { id: 'ajustes', label: 'Ajustes', path: '/settings', grupo: 'Mi espacio', icono: Settings },
  { id: 'salir', label: 'Salir', path: '/login', grupo: 'Mi espacio', icono: LogOut },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const activo = RUTAS.find((r) => r.path === pathname)?.id ?? 'inicio';
  const items = RUTAS.map(({ id, label, grupo, icono }) => ({ id, label, grupo, icono }));

  const nombre = user?.name ?? '';
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  const usuario = { nombre, rol: user?.role ?? '', iniciales };

  return (
    <div className="fey-shell">
      <AppNav
        items={items}
        activo={activo}
        onNavegar={(id) => {
          const destino = RUTAS.find((r) => r.id === id);
          if (destino) navigate(destino.path);
        }}
        usuario={usuario}
        iglesia={user?.church?.name}
        label="Gestión eclesial"
      />
      <main style={{ minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}