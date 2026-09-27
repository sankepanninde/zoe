import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: string[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Visión General',
    icon: 'space_dashboard',
    roles: ['ADMIN', 'LEADER', 'TECHNICIAN', 'SUPER_ADMIN'],
  },
  {
    to: '/calendar',
    label: 'Cronograma',
    icon: 'graphic_eq',
    roles: ['ADMIN', 'LEADER', 'SUPER_ADMIN'],
  },
  {
    to: '/my-schedule',
    label: 'Mis Turnos',
    icon: 'person',
    roles: ['TECHNICIAN', 'LEADER', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    to: '/team',
    label: 'Equipo',
    icon: 'groups',
    roles: ['ADMIN', 'LEADER', 'SUPER_ADMIN'],
  },
  {
    to: '/availability',
    label: 'Streaming',
    icon: 'podium',
    roles: ['ADMIN', 'LEADER', 'SUPER_ADMIN'],
  },
];

export function SoundDock() {
  const { user } = useAuth();
  const userRole = user?.role ?? 'TECHNICIAN';

  // Filtrar los items según el rol del usuario
  const navItems = ALL_NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="fixed left-6 top-1/2 z-50 hidden -translate-y-1/2 lg:block">
      <nav className="dock-sheen flex flex-col items-center gap-4 rounded-full px-2.5 py-4 transition-all duration-300">
        {/* Logo */}
        <Link
          to="/"
          title={user?.church?.name ?? 'Inicio'}
          className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/25 transition-transform active:scale-95"
        >
          <span
            className="material-symbols-outlined fill"
            style={{ fontSize: 20 }}
          >
            church
          </span>
        </Link>

        <div className="my-0.5 h-px w-6 bg-slate-200/80" />

        {/* Items principales */}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={item.label}
            className={({ isActive }) =>
              `group relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'border border-blue-200/60 bg-blue-50 text-blue-600 shadow-[0_0_20px_-3px_rgba(37,99,235,0.35)]'
                  : 'text-slate-400 hover:bg-white/80 hover:text-slate-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined transition-transform group-hover:scale-110"
                  style={{ fontSize: 21 }}
                >
                  {item.icon}
                </span>
                {isActive && (
                  <span className="absolute -right-0.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="my-0.5 h-px w-6 bg-slate-200/80" />

        {/* Ajustes */}
        <NavLink
          to="/settings"
          title="Configuración"
          className={({ isActive }) =>
            `group flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-90 ${
              isActive
                ? 'border border-blue-200/60 bg-blue-50 text-blue-600'
                : 'text-slate-400 hover:bg-white/80 hover:text-slate-700'
            }`
          }
        >
          <span
            className="material-symbols-outlined transition-transform group-hover:rotate-45"
            style={{ fontSize: 20 }}
          >
            tune
          </span>
        </NavLink>
      </nav>
    </aside>
  );
}