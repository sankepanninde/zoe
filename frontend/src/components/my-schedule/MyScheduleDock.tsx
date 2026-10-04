import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  tooltip?: string;
  badge?: 'emerald' | 'amber' | 'violet' | 'rose' | null;
  active?: boolean;
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Inicio',
    icon: 'dashboard',
    tooltip: 'Inicio / Dashboard',
  },
  {
    to: '/calendar',
    label: 'Sonido & Producción',
    icon: 'equalizer',
    tooltip: 'Sonido & Producción',
    active: true,
  },
  {
    to: '/team',
    label: 'Equipo',
    icon: 'group',
    tooltip: 'CRM & Consolidación',
    badge: 'emerald',
  },
  {
    to: '/availability',
    label: 'Disponibilidad',
    icon: 'holiday_village',
    tooltip: 'Grupos Pequeños / Casas de Fe',
    badge: 'amber',
  },
  {
    to: '/my-schedule',
    label: 'Mis Turnos',
    icon: 'assignment_turned_in',
    tooltip: 'Voluntarios General',
    badge: 'violet',
  },
];

export function MyScheduleDock() {
  const { user } = useAuth();

  const badgeColors: Record<string, string> = {
    emerald: 'bg-[#059669] shadow-[0_0_8px_#059669]',
    amber: 'bg-[#D97706] shadow-[0_0_8px_#D97706]',
    violet: 'bg-[#7C3AED] shadow-[0_0_8px_#7C3AED]',
    rose: 'bg-[#E11D48] shadow-[0_0_8px_#E11D48]',
  };

  return (
    <aside
      className="fixed left-6 top-6 bottom-6 z-50 hidden w-20 select-none flex-col items-center justify-between rounded-3xl border border-slate-700/60 bg-[#0F172A]/90 py-6 shadow-2xl shadow-slate-950/40 ring-1 ring-white/10 backdrop-blur-2xl lg:flex"
    >
      {/* TOP: Logo + Navegación */}
      <div className="flex w-full flex-col items-center gap-6">
        {/* Logo */}
        <Link to="/" className="group relative cursor-pointer" title={user?.church?.name ?? 'Inicio'}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 p-[1.5px] shadow-lg shadow-blue-500/20 transition-transform duration-300 hover:scale-105 active:scale-95">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0F172A]">
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#ffffff' }}>
                church
              </span>
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#0F172A]" />
        </Link>

        <div className="h-px w-8 bg-slate-700/60" />

        {/* Nav */}
        <nav className="flex w-full flex-col items-center gap-3 px-2">
          {navItems.map((item) => (
            <div key={item.to} className="relative flex items-center">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                title={item.label}
                className={({ isActive }) =>
                  cn(
                    'group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200',
                    isActive
                      ? 'z-10 bg-blue-600 text-white shadow-[0_0_24px_rgba(37,99,235,0.5)] ring-1 ring-blue-300/40'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="material-symbols-outlined transition-transform group-hover:scale-105"
                      style={{
                        fontSize: 24,
                        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {item.icon}
                    </span>

                    {/* Badge dot (solo si NO está activo y tiene badge) */}
                    {item.badge && !isActive && (
                      <span
                        className={cn(
                          'absolute right-2.5 top-2.5 h-2 w-2 rounded-full',
                          badgeColors[item.badge]
                        )}
                      />
                    )}

                    {/* Tooltip flotante al hacer hover */}
                    <span
                      className={cn(
                        'pointer-events-none absolute left-16 flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-700/80 bg-[#0F172A]/95 px-3.5 py-1.5 text-xs font-medium tracking-tight text-white opacity-0 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl transition-all',
                        'translate-x-1 group-hover:translate-x-0 group-hover:opacity-100'
                      )}
                    >
                      {isActive && (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400 shadow-[0_0_8px_#60A5FA]" />
                      )}
                      <span className="text-slate-200">{item.tooltip ?? item.label}</span>
                      {isActive && (
                        <span className="ml-1 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
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

      {/* BOTTOM: Notifications, Settings, Avatar */}
      <div className="flex w-full flex-col items-center gap-4 px-2">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-800/80 hover:text-white"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            notifications
          </span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E11D48] ring-2 ring-[#0F172A]" />
        </button>

        {/* Settings */}
        <NavLink
          to="/settings"
          aria-label="Configuración"
          className={({ isActive }) =>
            cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
              isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
            )
          }
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            settings
          </span>
        </NavLink>

        <div className="h-px w-8 bg-slate-700/60" />

        {/* Avatar con iniciales + status online */}
        <div
          title={user?.name ?? 'Usuario'}
          className="group relative cursor-pointer"
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white ring-2 ring-slate-600/80 p-[1px] transition-transform duration-200 group-hover:scale-105">
            {getInitials(user?.name ?? 'U')}
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#0F172A] shadow-[0_0_6px_#10B981]" />
        </div>
      </div>
    </aside>
  );
}