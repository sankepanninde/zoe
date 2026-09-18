import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/stores/auth.store';
import { listServices, listServiceTypes } from '@/lib/services.api';
import { listUsers } from '@/lib/users.api';
import { cn, formatDate, getInitials } from '@/lib/utils';
import type { Service } from '@/types';

export function Dashboard() {
  const { user } = useAuth();

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => listServices(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(true),
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: listServiceTypes,
  });

  // Estadísticas reales
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = services
      .filter((s) => new Date(s.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const confirmed = services.filter((s) => s.status === 'CONFIRMED');
    const pending = services.filter((s) => s.status === 'PENDING');

    // Asignaciones pendientes de confirmar
    const pendingAssignments = services.flatMap((s) =>
      (s.assignments ?? []).filter((a) => a.status === 'PENDING')
    );

    // Próximos 4 servicios
    const nextServices = upcoming.slice(0, 4);

    return {
      total: services.length,
      upcoming: upcoming.length,
      confirmed: confirmed.length,
      pending: pending.length,
      pendingAssignments: pendingAssignments.length,
      nextServices,
    };
  }, [services]);

  // Servicios por tipo (para la gráfica de barras)
  const servicesByType = useMemo(() => {
    const counts: Record<string, { name: string; color: string; count: number }> = {};
    services.forEach((s) => {
      const key = s.serviceTypeId;
      if (!counts[key]) {
        counts[key] = {
          name: s.serviceType.name,
          color: s.serviceType.color,
          count: 0,
        };
      }
      counts[key]!.count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [services]);

  const totalForBars = servicesByType.reduce((acc, t) => acc + t.count, 0) || 1;
  const maxCount = Math.max(...servicesByType.map((t) => t.count), 1);

  // Equipo por rol
  const teamStats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      leaders: users.filter((u) => u.role === 'LEADER').length,
      technicians: users.filter((u) => u.role === 'TECHNICIAN').length,
    };
  }, [users]);

  const trialEndsAt = user?.church?.trialEndsAt;

  return (
    <DashboardLayout>
      {/* Banner de trial */}
      {trialEndsAt && (
        <div className="flex flex-col items-start gap-3 rounded-3xl border border-primary-200/60 bg-primary-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Estás en tu prueba gratuita
              </p>
              <p className="text-xs text-foreground-muted">
                Vence el {formatDate(trialEndsAt)}
              </p>
            </div>
          </div>
          <Link
            to="/settings"
            className="zoe-btn-secondary !py-2 !text-xs whitespace-nowrap"
          >
            Ver planes
          </Link>
        </div>
      )}

      {/* ============================================ */}
      {/* FILA 1: KPI CARDS */}
      {/* ============================================ */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Servicios del mes */}
        <article className="flex flex-col justify-between rounded-3xl border border-border/60 bg-surface p-6 shadow-soft">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground-subtle">
                Servicios
                <br />
                agendados
              </h2>
              <span className="rounded-2xl bg-primary-50 px-3.5 py-1 text-xs font-bold text-primary-700">
                {stats.upcoming} próximos
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                {stats.total}
              </span>
              <span className="text-sm font-medium text-foreground-muted">
                en total
              </span>
            </div>

            {/* Mini gráfica de barras por tipo */}
            <div className="mt-4 flex h-20 items-end gap-2">
              {servicesByType.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-xs text-foreground-subtle">
                  Sin servicios todavía
                </div>
              ) : (
                servicesByType.map((t) => {
                  const h = Math.max((t.count / maxCount) * 100, 12);
                  return (
                    <div
                      key={t.name}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                    >
                      <div
                        className="w-full rounded-md transition-all"
                        style={{
                          height: `${h}%`,
                          backgroundColor: t.color,
                          opacity: 0.85,
                        }}
                      />
                      <span className="truncate text-[9px] font-medium text-foreground-subtle">
                        {t.name.split(' ')[0]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="text-foreground-muted">Distribución por tipo</span>
            <span className="font-semibold text-primary">
              {serviceTypes.length} tipos activos
            </span>
          </div>
        </article>

        {/* Card 2: Estado del cronograma */}
        <article className="flex flex-col justify-between rounded-3xl border border-border/60 bg-surface p-6 shadow-soft">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground-subtle">
                Estado del
                <br />
                cronograma
              </h2>
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-2xl px-3.5 py-1 text-xs font-bold',
                  stats.pending > 0
                    ? 'bg-warning-light text-warning-dark'
                    : 'bg-success-light text-success-dark'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    stats.pending > 0 ? 'bg-warning' : 'bg-success'
                  )}
                />
                {stats.pending > 0 ? 'Atención' : 'Al día'}
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                {stats.confirmed}
              </span>
              <span className="text-xl font-bold text-foreground-subtle">
                / {stats.total}
              </span>
              <span className="ml-1 text-sm font-medium text-foreground-muted">
                confirmados
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-[11px] text-foreground-subtle">
                <span>Progreso de confirmación</span>
                <span className="font-semibold text-foreground">
                  {stats.total > 0
                    ? Math.round((stats.confirmed / stats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{
                    width: `${
                      stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Mini stats */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between rounded-2xl bg-surface-elevated/60 px-3 py-2">
                <span className="text-xs font-semibold text-foreground-muted">
                  Pendientes
                </span>
                <span className="text-xs font-bold text-warning-dark">
                  {stats.pending}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-surface-elevated/60 px-3 py-2">
                <span className="text-xs font-semibold text-foreground-muted">
                  Asignaciones
                </span>
                <span className="text-xs font-bold text-primary">
                  {stats.pendingAssignments}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="text-foreground-muted">Próximos 7 días</span>
            <span className="font-semibold text-success">+ {stats.upcoming}</span>
          </div>
        </article>

        {/* Card 3: Equipo */}
        <article className="flex flex-col justify-between rounded-3xl border border-border/60 bg-surface p-6 shadow-soft">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground-subtle">
                Equipo y
                <br />
                voluntarios
              </h2>
              <span className="flex items-center gap-1.5 rounded-2xl bg-success-light px-3.5 py-1 text-xs font-bold text-success-dark">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Activo
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                {teamStats.total}
              </span>
              <span className="text-sm font-medium text-foreground-muted">
                personas en el equipo
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between rounded-2xl bg-surface-elevated/60 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Técnicos
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground-muted">
                  {teamStats.technicians}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-surface-elevated/60 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-xs font-semibold text-foreground">
                    Admins
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground-muted">
                  {teamStats.admins}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-surface-elevated/60 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  <span className="text-xs font-semibold text-foreground">
                    Líderes
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground-muted">
                  {teamStats.leaders}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-surface-elevated/60 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-xs font-semibold text-foreground">
                    Activos
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground-muted">
                  {users.filter((u) => u.active).length}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="text-foreground-muted">Cobertura ministerial</span>
            <Link
              to="/team"
              className="flex items-center gap-1 font-semibold text-primary hover:text-primary-700"
            >
              Ver equipo
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </article>
      </section>

      {/* ============================================ */}
      {/* FILA 2 */}
      {/* ============================================ */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 4: Distribución de servicios */}
        <article className="flex flex-col justify-between rounded-3xl border border-border/60 bg-surface p-6 shadow-soft">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Servicios por tipo
                </h2>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  Distribución de tus eventos
                </p>
              </div>
              <span className="rounded-2xl bg-surface-elevated px-3 py-1 text-xs font-medium text-foreground-muted">
                Total
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="font-display text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {stats.total}
                </span>
                <p className="mt-0.5 text-xs font-medium text-foreground-muted">
                  servicios agendados
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 rounded-2xl bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  <TrendingUp className="h-3 w-3" />
                  {serviceTypes.length} tipos
                </span>
              </div>
            </div>

            {/* Barras por tipo */}
            <div className="mt-6 space-y-3">
              {servicesByType.length === 0 ? (
                <p className="py-6 text-center text-xs text-foreground-subtle">
                  Sin datos todavía
                </p>
              ) : (
                servicesByType.map((t) => {
                  const pct = Math.round((t.count / totalForBars) * 100);
                  return (
                    <div key={t.name}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.name}
                        </span>
                        <span className="font-bold text-foreground-muted">
                          {t.count} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: t.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="text-foreground-muted">Tipo más frecuente</span>
            <span className="font-bold text-primary">
              {servicesByType[0]?.name ?? '—'}
            </span>
          </div>
        </article>

        {/* Card 5: Próximos servicios (listado) */}
        <article className="flex flex-col justify-between rounded-3xl border border-border/60 bg-surface p-6 shadow-soft">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Próximos servicios
                </h2>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  Tu agenda de esta semana
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-2xl bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                En vivo
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {stats.nextServices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface-elevated/40 p-6 text-center">
                  <CalendarIcon className="mx-auto h-6 w-6 text-foreground-subtle" />
                  <p className="mt-2 text-xs text-foreground-muted">
                    No hay servicios próximos
                  </p>
                  <Link
                    to="/calendar"
                    className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    Crear el primero →
                  </Link>
                </div>
              ) : (
                stats.nextServices.map((svc, idx) => (
                  <ServiceRow key={svc.id} service={svc} isFirst={idx === 0} />
                ))
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="text-foreground-muted">Agenda general</span>
            <Link
              to="/calendar"
              className="flex items-center gap-1 font-semibold text-primary hover:text-primary-700"
            >
              Ver calendario
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </article>

        {/* Card 6: Asignaciones pendientes */}
        <article className="flex flex-col justify-between rounded-3xl border border-border/60 bg-surface p-6 shadow-soft">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Confirmaciones
                </h2>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  Asignaciones por confirmar
                </p>
              </div>
              <div className="text-foreground-subtle">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="font-display text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {stats.pendingAssignments}
                </span>
                <p className="mt-0.5 text-xs font-medium text-foreground-muted">
                  pendientes de responder
                </p>
              </div>
            </div>

            {/* Lista de personas con asignaciones pendientes */}
            <div className="mt-5 space-y-2.5">
              {stats.pendingAssignments === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-success-light/40 p-5 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-success" />
                  <p className="mt-2 text-xs font-semibold text-success-dark">
                    ¡Todo confirmado!
                  </p>
                  <p className="mt-0.5 text-[11px] text-foreground-muted">
                    No hay asignaciones pendientes
                  </p>
                </div>
              ) : (
                <PendingAssignmentsList services={services} />
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="text-foreground-muted">Estado general</span>
            <span
              className={cn(
                'font-semibold',
                stats.pendingAssignments === 0 ? 'text-success' : 'text-warning-dark'
              )}
            >
              {stats.pendingAssignments === 0 ? 'Completo' : 'Requiere atención'}
            </span>
          </div>
        </article>
      </section>
    </DashboardLayout>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface ServiceRowProps {
  service: Service;
  isFirst?: boolean;
}

function ServiceRow({ service, isFirst }: ServiceRowProps) {
  const date = new Date(service.date);
  const dayNum = date.getDate();
  const monthStr = new Intl.DateTimeFormat('es-CO', { month: 'short' })
    .format(date)
    .replace('.', '')
    .toUpperCase();
  const weekday = new Intl.DateTimeFormat('es-CO', { weekday: 'short' })
    .format(date)
    .slice(0, 3)
    .toUpperCase();

  const confirmed = (service.assignments ?? []).filter(
    (a) => a.status === 'CONFIRMED'
  ).length;
  const total = (service.assignments ?? []).length;

  return (
    <Link
      to="/calendar"
      className={cn(
        'flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-surface-elevated/60',
        isFirst
          ? 'border border-primary-100/50 bg-primary-50/40'
          : 'bg-surface-elevated/40'
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl',
          isFirst
            ? 'bg-primary text-white'
            : 'border border-border bg-surface text-foreground'
        )}
      >
        <span
          className={cn(
            'text-[9px] font-bold leading-none tracking-wider',
            !isFirst && 'text-foreground-subtle'
          )}
        >
          {dayNum} {monthStr}
        </span>
        <span className="mt-0.5 text-xs font-black leading-tight">
          {weekday}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-xs font-bold text-foreground">
            {service.serviceType.icon} {service.serviceType.name}
          </h3>
          {isFirst && (
            <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success-dark">
              Próximo
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-foreground-muted">
          {service.startTime} · {service.location ?? 'Sin ubicación'}
          {total > 0 && ` · ${confirmed}/${total} confirmados`}
        </p>
      </div>
    </Link>
  );
}

interface PendingAssignmentsListProps {
  services: Service[];
}

function PendingAssignmentsList({ services }: PendingAssignmentsListProps) {
  const pending = services
    .flatMap((s) =>
      (s.assignments ?? [])
        .filter((a) => a.status === 'PENDING')
        .map((a) => ({ ...a, service: s }))
    )
    .sort((a, b) => new Date(a.service.date).getTime() - new Date(b.service.date).getTime())
    .slice(0, 3);

  return (
    <>
      {pending.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 rounded-2xl bg-warning-light/30 px-3 py-2.5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-light text-[10px] font-bold text-warning-dark">
            {getInitials(p.user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {p.user.name}
            </p>
            <p className="truncate text-[10px] text-foreground-muted">
              {p.position} · {p.service.serviceType.name}
            </p>
          </div>
          <Clock className="h-3.5 w-3.5 shrink-0 text-warning" />
        </div>
      ))}
      {pending.length > 0 && (
        <Link
          to="/calendar"
          className="block text-center text-xs font-semibold text-primary hover:underline"
        >
          Ver todas las pendientes →
        </Link>
      )}
    </>
  );
}