import { NavLink } from 'react-router-dom';
import {
  Calendar,
  LayoutDashboard,
  Users,
  Clock,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth.store';

const navItems = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'Cronograma', icon: Calendar },
  { to: '/team', label: 'Equipo', icon: Users },
  { to: '/availability', label: 'Disponibilidad', icon: Clock },
  { to: '/settings', label: 'Ajustes', icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      {/* Logo — nombre de la iglesia */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary">
          <span className="font-display text-lg font-bold text-white">
            {user?.church?.name?.charAt(0).toUpperCase() ?? 'Z'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-foreground">
            {user?.church?.name ?? 'Zoe'}
          </p>
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Powered by Zoe
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground-muted hover:bg-surface-elevated hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
            <p className="truncate text-xs text-foreground-subtle">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}