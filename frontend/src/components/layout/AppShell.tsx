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

type Rol = 'siervo' | 'lider' | 'pastor' | 'dev';

// Ajustar el valor 'DEVELOPER' al nombre real del rol en el backend.
function rolDeUsuario(role?: string): Rol {
  if (role === 'LEADER') return 'lider';
  if (role === 'ADMIN') return 'pastor';
  if (role === 'DEV') return 'dev';
  return 'siervo';
}

// Las opciones sin página todavía van a '/' (inicio) hasta que existan sus rutas.
const RUTAS = [
  { id: 'inicio', label: 'Inicio', path: '/', grupo: 'Mi espacio', icono: LayoutDashboard, roles: ['siervo', 'lider', 'pastor', 'dev'] },
  { id: 'disponibilidad', label: 'Disponibilidad', path: '/availability', grupo: 'Mi espacio', icono: CalendarCheck, roles: ['siervo', 'lider', 'pastor', 'dev'] },
  { id: 'mis-turnos', label: 'Mis turnos', path: '/my-schedule', grupo: 'Mi espacio', icono: CalendarDays, roles: ['siervo', 'dev'] },
  { id: 'cronograma', label: 'Cronograma', path: '/calendar', grupo: 'Equipo', icono: CalendarRange, roles: ['lider', 'pastor', 'dev'] },
  { id: 'mi-ministerio', label: 'Mi ministerio', path: '/', grupo: 'Equipo', icono: User, roles: ['lider', 'dev'] },
  { id: 'ministerios', label: 'Ministerios', path: '/', grupo: 'Equipo', icono: Layers, roles: ['pastor', 'dev'] },
  { id: 'equipo', label: 'Equipo', path: '/team', grupo: 'Equipo', icono: Users, roles: ['pastor', 'dev'] },
  { id: 'bandeja', label: 'Bandeja', path: '/', grupo: 'Comunicación', icono: Inbox, roles: ['siervo', 'lider', 'pastor', 'dev'] },
  { id: 'anuncios', label: 'Anuncios', path: '/', grupo: 'Comunicación', icono: Megaphone, roles: ['siervo', 'lider', 'pastor', 'dev'] },
  { id: 'ajustes', label: 'Ajustes', path: '/settings', grupo: 'Mi espacio', icono: Settings, roles: ['siervo', 'lider', 'pastor', 'dev'] },
  { id: 'salir', label: 'Salir', path: '/login', grupo: 'Mi espacio', icono: LogOut, roles: ['siervo', 'lider', 'pastor', 'dev'] },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const rol = rolDeUsuario(user?.role);

  const rutasDelRol = RUTAS.filter((r) => (r.roles as readonly Rol[]).includes(rol));
  const activo = RUTAS.find((r) => r.path === pathname)?.id ?? 'inicio';
  const items = rutasDelRol.map(({ id, label, grupo, icono }) => ({ id, label, grupo, icono }));

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
          if (id === 'salir') {
            void logout().then(() => navigate('/login', { replace: true }));
            return;
          }
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