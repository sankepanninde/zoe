import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Settings,
  Plus,
  HelpCircle,
  LogOut,
  Search,
  Church,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import { cn, getInitials } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'Cronograma', icon: Calendar },
  { to: '/team', label: 'Equipo', icon: Users },
  { to: '/availability', label: 'Disponibilidad', icon: Clock },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const church = user?.church;

  const today = new Date();
  const dateStr = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(today);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-4 md:p-6 lg:p-7">
        {/* ============================================ */}
        {/* SIDEBAR FLOTANTE */}
        {/* ============================================ */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-16 shrink-0 flex-col items-center justify-between rounded-3xl border border-border/60 bg-surface py-6 shadow-soft md:flex md:top-6 md:h-[calc(100vh-3rem)] md:w-20 md:top-6 lg:top-7 lg:h-[calc(100vh-3.5rem)]">
          {/* TOP */}
          <div className="flex w-full flex-col items-center gap-5">
            {/* Logo */}
            <Link
              to="/"
              aria-label={church?.name ?? 'Inicio'}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 transition hover:bg-primary-600"
            >
              <Church className="h-6 w-6" strokeWidth={1.8} />
            </Link>

            {/* Quick Add */}
            <Link
              to="/calendar"
              aria-label="Nuevo servicio"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary transition hover:bg-primary-100"
            >
              <Plus className="h-5 w-5" strokeWidth={2.2} />
            </Link>

            <div className="my-1 h-px w-8 bg-border" />

            {/* Nav */}
            <nav className="flex w-full flex-col items-center gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    cn(
                      'flex h-11 w-11 items-center justify-center rounded-xl transition-all',
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-foreground-subtle hover:bg-surface-elevated hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.9} />
                </NavLink>
              ))}
            </nav>
          </div>

          {/* BOTTOM */}
          <div className="flex w-full flex-col items-center gap-3">
            <NavLink
              to="/settings"
              aria-label="Ajustes"
              className={({ isActive }) =>
                cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-foreground-subtle hover:bg-surface-elevated hover:text-foreground'
                )
              }
            >
              <Settings className="h-5 w-5" strokeWidth={1.9} />
            </NavLink>

            <button
              type="button"
              aria-label="Ayuda"
              onClick={() => alert('Centro de ayuda próximamente')}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground-subtle transition hover:bg-surface-elevated hover:text-foreground"
            >
              <HelpCircle className="h-5 w-5" strokeWidth={1.9} />
            </button>

            <button
              type="button"
              aria-label="Cerrar sesión"
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground-subtle transition hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.9} />
            </button>

            {/* Avatar */}
            <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
              {getInitials(user?.name ?? 'Z')}
            </div>
          </div>
        </aside>

        {/* ============================================ */}
        {/* MAIN CONTENT */}
        {/* ============================================ */}
        <main className="flex min-w-0 flex-1 flex-col gap-6">
          {/* HEADER */}
          <header className="flex flex-col gap-4 pt-1 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              {/* Breadcrumb */}
              <div className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wide text-foreground-subtle">
                <span className="truncate">{church?.name ?? 'Mi iglesia'}</span>
                <span className="inline-block h-1 w-1 rounded-full bg-foreground-subtle" />
                <span className="capitalize">{dateStr}</span>
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                Resumen General
              </h1>

              {/* Pills */}
              <div className="mt-3 flex items-center gap-2">
                <button className="rounded-full border border-primary-200/60 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700 shadow-sm transition hover:bg-primary-100">
                  Vista General
                </button>
                <button className="rounded-full bg-surface-elevated px-4 py-1.5 text-xs font-medium text-foreground-muted transition hover:bg-border">
                  Mi ministerio
                </button>
              </div>
            </div>

            {/* Right side: search + user */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden lg:block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                <input
                  type="text"
                  placeholder="Buscar personas, eventos..."
                  className="w-64 rounded-full border border-border/80 bg-surface py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-foreground-subtle shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 md:w-72"
                />
              </div>

              {/* User pill */}
              <div className="flex items-center gap-2.5 rounded-full border border-border/80 bg-surface py-1.5 pl-1.5 pr-4 shadow-soft">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {getInitials(user?.name ?? 'U')}
                </div>
                <span className="hidden max-w-[120px] truncate text-xs font-semibold text-foreground sm:inline">
                  {user?.name}
                </span>
              </div>
            </div>
          </header>

          {/* Contenido del Dashboard */}
          <div className="space-y-5 pb-6">{children}</div>
        </main>
      </div>
    </div>
  );
}