import { NavLink } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

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
    to: '/calendar/sundays',
    label: 'Domingos',
    icon: 'event_available',
    roles: ['ADMIN', 'LEADER', 'SUPER_ADMIN'],
  },
  {
    to: '/my-schedule',
    label: 'Mis Turnos',
    icon: 'assignment_turned_in',
    roles: ['TECHNICIAN', 'LEADER', 'ADMIN', 'SUPER_ADMIN'],
  },
];

export function MobileBottomNav() {
  const { user } = useAuth();
  const userRole = user?.role ?? 'TECHNICIAN';

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
    </nav>
  );
}