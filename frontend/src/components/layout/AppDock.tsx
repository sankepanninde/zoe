import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';
import { cn, getInitials } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: string[];
  badge?: 'emerald' | 'amber' | 'violet' | 'rose';
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Inicio',
    icon: 'dashboard',
    roles: ['ADMIN', 'LEADER', 'TECHNICIAN', 'SUPER_ADMIN'],
  },
  {
    to: '/calendar',
    label: 'Cronograma',
    icon: 'equalizer',
    roles: ['ADMIN', 'LEADER', 'SUPER_ADMIN'],
    badge: 'emerald',
  },
  {
    to: '/calendar/sundays',
    label: 'Domingos',
    icon: 'event_available',
    roles: ['ADMIN', 'LEADER', 'SUPER_ADMIN'],
    badge: 'amber',
  },
  {
    to: '/my-schedule',
    label: 'Mis Turnos',
    icon: 'assignment_turned_in',
    roles: ['TECHNICIAN', 'LEADER', 'ADMIN', 'SUPER_ADMIN'],
    badge: 'violet',
  },
];

const badgeColors: Record<string, string> = {
  emerald: 'bg-emerald-500 shadow-[0_0_6px_#059669]',
  amber: 'bg-amber-500 shadow-[0_0_6px_#D97706]',
  violet: 'bg-violet-500 shadow-[0_0_6px_#7C3AED]',
  rose: 'bg-rose-500 shadow-[0_0_6px_#E11D48]',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  LEADER: 'Líder',
  TECHNICIAN: 'Técnico',
};

export function AppDock() {
  const { user, logout } = useAuth();
  const userRole = user?.role ?? 'TECHNICIAN';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // Cerrar al hacer click en una opción
  const handleClose = () => setMenuOpen(false);

  const navItems = ALL_NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="fixed left-4 top-4 bottom-4 z-50 hidden w-16 select-none flex-col items-center justify-between rounded-3xl border border-slate-700/60 bg-[#0F172A]/95 py-5 shadow-2xl shadow-slate-950/40 ring-1 ring-white/10 backdrop-blur-2xl lg:flex">
      {/* ============ TOP: Logo + Nav ============ */}
      <div className="flex w-full flex-col items-center gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="group relative"
          title={user?.church?.name ?? 'Inicio'}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 p-[1.5px] shadow-lg shadow-blue-500/20 transition-transform duration-200 hover:scale-105 active:scale-95">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0F172A]">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontSize: 20 }}
              >
                church
              </span>
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0F172A]" />
        </Link>

        <div className="h-px w-6 bg-slate-700/60" />

        {/* Nav */}
        <nav className="flex w-full flex-col items-center gap-2">
          {navItems.map((item) => (
            <div key={item.to} className="relative flex items-center">
              <NavLink
                to={item.to}
                end={item.to === '/' || item.to === '/calendar'}
                title={item.label}
                className={({ isActive }) =>
                  cn(
                    'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                    isActive
                      ? 'z-10 bg-blue-600 text-white shadow-[0_0_18px_rgba(37,99,235,0.45)] ring-1 ring-blue-300/40'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="material-symbols-outlined transition-transform group-hover:scale-105"
                      style={{
                        fontSize: 20,
                        fontVariationSettings: isActive
                          ? "'FILL' 1"
                          : "'FILL' 0",
                      }}
                    >
                      {item.icon}
                    </span>

                    {/* Badge dot */}
                    {item.badge && !isActive && (
                      <span
                        className={cn(
                          'absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full',
                          badgeColors[item.badge]
                        )}
                      />
                    )}

                    {/* Tooltip al hover */}
                    <span
                      className={cn(
                        'pointer-events-none absolute left-14 flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-700/80 bg-[#0F172A]/95 px-3 py-1.5 text-[11px] font-medium tracking-tight text-white opacity-0 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl transition-all',
                        'translate-x-1 group-hover:translate-x-0 group-hover:opacity-100'
                      )}
                    >
                      {isActive && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400 shadow-[0_0_6px_#60A5FA]" />
                      )}
                      <span className="text-slate-200">{item.label}</span>
                      {isActive && (
                        <span className="ml-0.5 rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-300">
                          Activo
                        </span>
                      )}
                    </span>
                  </>
                )}
              </NavLink>
            </div>
          ))}
        </nav>
      </div>

      {/* ============ BOTTOM: Notif + Avatar ============ */}
      <div className="flex w-full flex-col items-center gap-3">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-800/80 hover:text-white"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
          >
            notifications
          </span>
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-[#0F172A]" />
        </button>

        {/* Avatar con menú dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            title={user?.name ?? 'Usuario'}
            className={cn(
              'group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-[10px] font-bold text-white ring-2 transition-transform duration-200 hover:scale-105',
              menuOpen ? 'ring-blue-400' : 'ring-slate-600/80'
            )}
          >
            {getInitials(user?.name ?? 'U')}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0F172A] shadow-[0_0_4px_#10B981]" />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="animate-fade-in absolute bottom-0 left-14 z-50 w-72 overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0F172A] shadow-2xl ring-1 ring-white/10">
              {/* Header: usuario */}
              <div className="flex items-center gap-3 border-b border-slate-700/60 px-4 py-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-sm font-bold text-white ring-2 ring-blue-500/40">
                  {getInitials(user?.name ?? 'U')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {user?.name ?? 'Usuario'}
                  </p>
                  <p className="truncate text-xs text-blue-400">
                    {roleLabels[userRole] ?? userRole}
                  </p>
                </div>
              </div>

              {/* Opciones */}
              <div className="py-2">
                <Link
                  to="/settings"
                  onClick={handleClose}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-slate-400"
                      style={{ fontSize: 18 }}
                    >
                      person
                    </span>
                    Mi Perfil
                  </span>
                  <span className="rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Admin
                  </span>
                </Link>

                <Link
                  to="/settings"
                  onClick={handleClose}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
                >
                  <span
                    className="material-symbols-outlined text-slate-400"
                    style={{ fontSize: 18 }}
                  >
                    settings
                  </span>
                  Configuración de Cuenta
                </Link>
              </div>

              {/* Cerrar sesión */}
              <div className="border-t border-slate-700/60 p-2">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18 }}
                  >
                    logout
                  </span>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}