import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Settings,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import { cn, getInitials } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'Cronograma', icon: Calendar },
  { to: '/team', label: 'Equipo', icon: Users },
  { to: '/availability', label: 'Disponibilidad', icon: Clock },
  { to: '/settings', label: 'Ajustes', icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Cerrar al navegar
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground transition hover:bg-surface-elevated lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Drawer */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel lateral */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface shadow-2xl lg:hidden">
            {/* Header del drawer */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary">
                  <span className="font-display text-lg font-bold text-white">
                    {user?.church?.name?.charAt(0).toUpperCase() ?? 'Z'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {user?.church?.name ?? 'Zoe'}
                  </p>
                  <p className="truncate text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
                    Powered by Zoe
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="shrink-0 rounded-lg p-1.5 text-foreground-subtle transition hover:bg-surface-elevated hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Botón Nuevo servicio */}
            <div className="p-3">
              <NavLink
                to="/calendar"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-600"
              >
                <Plus className="h-4 w-4" />
                Nuevo servicio
              </NavLink>
            </div>

            {/* Navegación */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-foreground-muted hover:bg-surface-elevated hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Footer con usuario */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-3 rounded-xl px-3 py-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {getInitials(user?.name ?? 'U')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-foreground-subtle">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}