import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: string[];
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
  },
  {
    to: '/my-schedule',
    label: 'Mis Turnos',
    icon: 'assignment_turned_in',
    roles: ['TECHNICIAN', 'LEADER', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    to: '/availability',
    label: 'Disponible',
    icon: 'event_busy',
    roles: ['TECHNICIAN', 'LEADER', 'ADMIN', 'SUPER_ADMIN'],
  },
];

export function MobileBottomNav() {
  const { user, logout } = useAuth();
  const userRole = user?.role ?? 'TECHNICIAN';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex select-none items-center justify-around border-t border-slate-700/60 bg-[#0F172A]/95 px-2 pt-2 shadow-[0_-4px_20px_rgba(15,23,42,0.3)] ring-1 ring-white/5 backdrop-blur-2xl lg:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/' || item.to === '/calendar'}
          className={({ isActive }) =>
            cn(
              'group relative flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 transition-all',
              isActive ? 'text-blue-400' : 'text-slate-400'
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-2xl transition-all',
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_16px_rgba(37,99,235,0.5)]'
                    : 'group-active:bg-slate-800/80'
                )}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 22,
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-tight transition-colors',
                  isActive ? 'text-blue-400' : 'text-slate-500'
                )}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}

      {/* AVATAR + MENÚ */}
      <div className="relative flex-1" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex min-w-[64px] w-full flex-col items-center gap-1 rounded-2xl px-2 py-1.5"
        >
          <span
            className={cn(
              'block rounded-full ring-2 transition-all',
              menuOpen ? 'ring-blue-400' : 'ring-slate-600/80'
            )}
          >
            <Avatar
              name={user?.name ?? 'U'}
              avatarUrl={user?.avatarUrl}
              size="md"
            />
          </span>
          <span className="text-[10px] font-semibold tracking-tight text-slate-400">
            Perfil
          </span>
        </button>

        {menuOpen && (
          <div className="animate-fade-in absolute bottom-full right-2 mb-2 w-60 overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0F172A] shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center gap-3 border-b border-slate-700/60 px-4 py-3">
              <Avatar
                name={user?.name ?? 'U'}
                avatarUrl={user?.avatarUrl}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {user?.name ?? 'Usuario'}
                </p>
                <p className="truncate text-[10px] text-blue-400">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="py-1">
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
              >
                <span
                  className="material-symbols-outlined text-slate-400"
                  style={{ fontSize: 18 }}
                >
                  settings
                </span>
                Ajustes
              </Link>
            </div>

            <div className="border-t border-slate-700/60 p-2">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/20"
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
    </nav>
  );
}