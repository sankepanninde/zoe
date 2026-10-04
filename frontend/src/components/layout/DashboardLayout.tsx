import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import { getInitials } from '@/lib/utils';
import { AppDock } from './AppDock';
import { MobileNav } from './MobileNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
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
        {/* DOCK FLOTANTE OSCURO */}
        {/* ============================================ */}
        <AppDock />

        {/* ============================================ */}
        {/* MAIN CONTENT */}
        {/* ============================================ */}
        <main className="flex min-w-0 flex-1 flex-col gap-6 lg:pl-20">
          {/* HEADER */}
          <header className="flex flex-col gap-4 pt-1 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <MobileNav />
              <div className="min-w-0 flex-1">
                {/* Breadcrumb */}
                <div className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wide text-foreground-subtle">
                  <span className="truncate">
                    {church?.name ?? 'Mi iglesia'}
                  </span>
                  <span className="inline-block h-1 w-1 rounded-full bg-foreground-subtle" />
                  <span className="capitalize">{dateStr}</span>
                </div>

                {/* Title */}
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
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

          {/* Contenido */}
          <div className="space-y-5 pb-6">{children}</div>
        </main>
      </div>
    </div>
  );
}