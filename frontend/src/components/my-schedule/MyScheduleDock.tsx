import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';
import { getInitials } from '@/lib/utils';

export function MyScheduleDock() {
  const { user } = useAuth();

  return (
    <aside className="glass-dock fixed left-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center rounded-full border border-white/90 px-2.5 py-4 md:flex">
      {/* Brand */}
      <Link
        to="/"
        title={user?.church?.name ?? 'Campus Central'}
        className="group flex h-11 w-11 items-center justify-center rounded-full text-blue-600 transition-all duration-200 hover:bg-slate-100/80"
      >
        <span
          className="material-symbols-outlined transition-transform group-hover:scale-110"
          style={{ fontSize: 22 }}
        >
          church
        </span>
      </Link>

      <div className="my-3 h-px w-6 bg-slate-300/40" />

      {/* Nav principal */}
      <nav className="flex flex-col items-center gap-2">
        {/* Activo: Mis Turnos */}
        <NavLink
          to="/my-schedule"
          title="Mis Turnos & Calendario"
          className={({ isActive }) =>
            isActive
              ? 'specular-glow relative flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-transform active:scale-95'
              : 'flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100/70 hover:text-blue-600'
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                calendar_month
              </span>
              {isActive && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              )}
            </>
          )}
        </NavLink>

        {/* Cronograma admin */}
        <NavLink
          to="/calendar"
          title="Cronograma general"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100/70 hover:text-blue-600"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            tune
          </span>
        </NavLink>

        {/* Equipo */}
        <NavLink
          to="/team"
          title="Equipo de audio"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100/70 hover:text-blue-600"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            group
          </span>
        </NavLink>

        {/* Disponibilidad */}
        <NavLink
          to="/availability"
          title="Input lists & escenas"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100/70 hover:text-blue-600"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            auto_stories
          </span>
        </NavLink>
      </nav>

      <div className="my-3 h-px w-6 bg-slate-300/40" />

      {/* Bottom */}
      <div className="flex flex-col items-center gap-2">
        <NavLink
          to="/settings"
          title="Configuración"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100/70 hover:text-blue-600"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            settings
          </span>
        </NavLink>

        {/* Avatar */}
        <div
          title={user?.name ?? 'Perfil'}
          className="mt-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-bold text-blue-700 ring-2 ring-blue-500/30 transition-all hover:ring-blue-500"
        >
          {getInitials(user?.name ?? 'U')}
        </div>
      </div>
    </aside>
  );
}