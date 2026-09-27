import { useMemo } from 'react';
import type { Service, ServiceAssignment } from '@/types';
import { cn, getInitials } from '@/lib/utils';

interface WeeklyViewProps {
  weekStart: Date;
  services: Service[];
  onServiceClick: (service: Service) => void;
  onAddService: (date: string) => void;
}

export function WeeklyView({
  weekStart,
  services,
  onServiceClick,
  onAddService,
}: WeeklyViewProps) {
  // Rango de la semana (lunes a domingo)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekLabel = `${weekStart.getDate()} al ${weekEnd.getDate()} de ${new Intl.DateTimeFormat(
    'es-CO',
    { month: 'long' }
  ).format(weekStart)}, ${weekStart.getFullYear()}`;

  // Filtrar servicios de esta semana
  const weekServices = useMemo(() => {
    const startMs = new Date(weekStart).setHours(0, 0, 0, 0);
    const endMs = new Date(weekStart).setHours(23, 59, 59, 999) + 6 * 86400000;

    return services
      .filter((s) => {
        const ts = new Date(s.date).getTime();
        return ts >= startMs && ts <= endMs;
      })
      .sort((a, b) => {
        const da = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (da !== 0) return da;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [services, weekStart]);

  // Agrupar por día
  const daysWithServices = useMemo(() => {
    const map = new Map<string, Service[]>();
    weekServices.forEach((s) => {
      const key = s.date.split('T')[0] ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return Array.from(map.entries()).map(([dateStr, svcList]) => ({
      date: new Date(dateStr + 'T12:00:00Z'),
      services: svcList,
    }));
  }, [weekServices]);

  const allAssignments = weekServices.flatMap((s) => s.assignments ?? []);
  const totalAssigned = allAssignments.length;
  const confirmed = allAssignments.filter((a) => a.status === 'CONFIRMED').length;
  const pending = allAssignments.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header de semana */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200/60 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Semana en curso
            </span>
            {pending > 0 && (
              <span className="rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                {pending} Vacante{pending !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Semana: <span className="capitalize">{weekLabel}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {weekServices.length}{' '}
            {weekServices.length === 1 ? 'servicio programado' : 'servicios programados'} •{' '}
            {confirmed}/{totalAssigned} confirmados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              sensors
            </span>
            Frecuencia RF Coordinada
          </span>
        </div>
      </div>

      {/* Contenido */}
      {daysWithServices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 py-16 text-center backdrop-blur">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <span className="material-symbols-outlined text-blue-600" style={{ fontSize: 28 }}>
              event_busy
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Sin servicios esta semana
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            No hay cultos ni eventos programados en este rango de fechas.
          </p>
          <button
            onClick={() =>
              onAddService(weekStart.toISOString().slice(0, 10))
            }
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              add
            </span>
            Agregar servicio
          </button>
        </div>
      ) : (
        daysWithServices.map((day) => (
          <DayBlock
            key={day.date.toISOString()}
            date={day.date}
            services={day.services}
            onServiceClick={onServiceClick}
            onAddService={onAddService}
          />
        ))
      )}

      {/* Footer de telemetría */}
      <footer className="glass-panel flex flex-col items-center justify-between gap-4 rounded-2xl px-6 py-4 lg:flex-row">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Consola Principal: DiGiCo SD12 en línea</span>
          </div>
          <span className="text-slate-300">•</span>
          <span>Shure Axient Digital: {weekServices.length} canales activos</span>
          <span className="text-slate-300">•</span>
          <span className="font-medium text-blue-600">
            Dante Red Primaria: 0.25ms (Sincronizado)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="glass-pill flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-white">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              history
            </span>
            Historial Semanal
          </button>
          <button className="glow-cobalt flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              picture_as_pdf
            </span>
            Exportar Roster Semanal PDF
          </button>
        </div>
      </footer>
    </div>
  );
}

// ===========================================
// BLOQUE DE DÍA
// ===========================================

interface DayBlockProps {
  date: Date;
  services: Service[];
  onServiceClick: (service: Service) => void;
  onAddService: (date: string) => void;
}

function DayBlock({ date, services, onServiceClick, onAddService }: DayBlockProps) {
  const morning = services.filter(
    (s) => parseInt(s.startTime.split(':')[0] ?? '0', 10) < 14
  );
  const afternoon = services.filter(
    (s) => parseInt(s.startTime.split(':')[0] ?? '0', 10) >= 14
  );

  const dayLabel = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  const dayNumber = date.getDate();
  const monthShort = new Intl.DateTimeFormat('es-CO', { month: 'short' })
    .format(date)
    .slice(0, 3)
    .toUpperCase();

  const totalAssignments = services.flatMap((s) => s.assignments ?? []);
  const pending = totalAssignments.filter((a) => a.status === 'PENDING').length;

  return (
    <section className="glass-panel flex flex-col gap-5 rounded-3xl p-6 lg:p-8">
      {/* Header del día */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200/60 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-col items-center justify-center rounded-2xl border border-blue-200/60 bg-blue-50 text-blue-600 shadow-sm">
            <span className="text-[9px] font-semibold uppercase leading-none tracking-wider">
              {monthShort}
            </span>
            <span className="text-[17px] font-bold leading-tight">
              {String(dayNumber).padStart(2, '0')}
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold capitalize text-slate-900">
                {dayLabel}
              </h3>
              {pending > 0 && (
                <span className="rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                  {pending} Vacante{pending !== 1 ? 's' : ''} Requerida{pending !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Jornada litúrgica principal • {services.length} servicio
              {services.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Grid 2 columnas: 1er Servicio | 2do Servicio */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* 1er Servicio */}
        {morning.length > 0 ? (
          morning.map((svc) => (
            <ServiceColumn
              key={svc.id}
              service={svc}
              label="1er Servicio"
              icon="light_mode"
              iconColor="text-amber-600"
              tagColor="border-amber-200/60 bg-amber-50 text-amber-800"
              onServiceClick={onServiceClick}
            />
          ))
        ) : (
          <EmptyColumn
            label="1er Servicio"
            icon="light_mode"
            iconColor="text-amber-600/60"
            onAdd={() => onAddService(date.toISOString().slice(0, 10))}
          />
        )}

        {/* 2do Servicio */}
        {afternoon.length > 0 ? (
          afternoon.map((svc) => (
            <ServiceColumn
              key={svc.id}
              service={svc}
              label="2do Servicio"
              icon="dark_mode"
              iconColor="text-indigo-600"
              tagColor="border-indigo-200/60 bg-indigo-50 text-indigo-900"
              onServiceClick={onServiceClick}
            />
          ))
        ) : (
          <EmptyColumn
            label="2do Servicio"
            icon="dark_mode"
            iconColor="text-indigo-600/60"
            onAdd={() => onAddService(date.toISOString().slice(0, 10))}
          />
        )}
      </div>
    </section>
  );
}

// ===========================================
// COLUMNA DE SERVICIO (detalle completo)
// ===========================================

interface ServiceColumnProps {
  service: Service;
  label: string;
  icon: string;
  iconColor: string;
  tagColor: string;
  onServiceClick: (service: Service) => void;
}

function ServiceColumn({
  service,
  label,
  icon,
  iconColor,
  tagColor,
  onServiceClick,
}: ServiceColumnProps) {
  const assignments = service.assignments ?? [];
  const confirmed = assignments.filter((a) => a.status === 'CONFIRMED').length;
  const total = assignments.length;
  const pending = assignments.filter((a) => a.status === 'PENDING').length;
  const complete = total > 0 && confirmed === total;

  return (
    <div
      onClick={() => onServiceClick(service)}
      className="glass-subwell flex cursor-pointer flex-col gap-4 rounded-3xl border border-white p-5 transition-all hover:border-blue-200 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold',
                tagColor
              )}
            >
              <span className={cn('material-symbols-outlined', iconColor)} style={{ fontSize: 16 }}>
                {icon}
              </span>
              {label}
            </span>
            <span className="text-base font-bold text-slate-900">
              {service.startTime} hrs
            </span>
          </div>
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-[10px] font-bold',
              complete
                ? 'border-emerald-200 bg-emerald-100/80 text-emerald-900'
                : 'border-amber-200/60 bg-amber-100/70 text-amber-900'
            )}
          >
            Capacidad: {confirmed}/{total || 4} Puestos
          </span>
        </div>

        {/* Info técnica */}
        <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200/50 bg-white/70 p-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-700">
            {service.soundCheckTime && (
              <>
                <span>
                  <strong>Prueba de Sonido:</strong> {service.soundCheckTime}
                </span>
                <span className="text-slate-300">•</span>
              </>
            )}
            <span>
              <strong>Inicio:</strong> {service.startTime}
            </span>
            {complete && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                    chat
                  </span>
                  Recordatorio WhatsApp ✓
                </span>
              </>
            )}
          </div>
          {service.sceneName && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                tune
              </span>
              Escena: {service.sceneName}
              {service.patchName && ` • Patch: ${service.patchName}`}
            </div>
          )}
        </div>

        {/* Chips de acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={(e) => e.stopPropagation()}
            className="glass-pill flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:text-blue-600"
          >
            🎵 Setlist
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="glass-pill flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:text-blue-600"
          >
            🎛️ Input List ({service.inputListCount ?? 24} ch)
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="glass-pill flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:text-blue-600"
          >
            📝 Bitácora
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-slate-200/60" />

      {/* Lista de asignaciones */}
      {assignments.length === 0 ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onServiceClick(service);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-red-200 bg-red-50/50 py-4 text-xs font-bold text-red-600 transition hover:bg-red-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add
          </span>
          Asignar operadores
        </button>
      ) : (
        <div className="flex flex-col gap-2.5">
          {assignments.map((a) => (
            <TechnicianRow key={a.id} assignment={a} />
          ))}
        </div>
      )}

      {/* Footer reserva */}
      {assignments.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/60 px-3 py-2">
          <div className="flex items-center gap-2 text-[11px]">
            <span>🛡️</span>
            <span className="font-semibold text-slate-700">Reserva:</span>
            <span className="text-slate-500">Por asignar</span>
          </div>
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[10px] font-medium',
              pending === 0
                ? 'border-emerald-200/50 bg-emerald-100/60 text-emerald-800'
                : 'border-amber-200/50 bg-amber-100/60 text-amber-800'
            )}
          >
            {pending === 0 ? 'Disponible • En guardia' : `${pending} pendientes`}
          </span>
        </div>
      )}
    </div>
  );
}

// ===========================================
// COLUMNA VACÍA (placeholder)
// ===========================================

interface EmptyColumnProps {
  label: string;
  icon: string;
  iconColor: string;
  onAdd: () => void;
}

function EmptyColumn({ label, icon, iconColor, onAdd }: EmptyColumnProps) {
  return (
    <div className="glass-subwell flex flex-col gap-4 rounded-3xl border border-dashed border-slate-200/80 bg-white/40 p-5">
      <div className="flex items-center gap-2">
        <span className={cn('material-symbols-outlined', iconColor)} style={{ fontSize: 16 }}>
          {icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <button
        onClick={onAdd}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 py-8 text-[11px] font-medium text-blue-600 transition hover:bg-blue-50/70"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          add_circle
        </span>
        Agregar {label.toLowerCase()}
      </button>
    </div>
  );
}

// ===========================================
// FILA DE TÉCNICO (estilo premium)
// ===========================================

function TechnicianRow({ assignment }: { assignment: ServiceAssignment }) {
  const isPending = assignment.status === 'PENDING';
  const isRejected = assignment.status === 'REJECTED';
  const isConfirmed = assignment.status === 'CONFIRMED';

  // Color del badge según la posición
  const positionColor = (() => {
    const p = assignment.position.toLowerCase();
    if (p.includes('foh') || p.includes('principal')) {
      return 'border-blue-100 bg-blue-50 text-blue-700';
    }
    if (p.includes('iem') || p.includes('monitor')) {
      return 'border-indigo-200/60 bg-purple-50 text-purple-700';
    }
    if (p.includes('rf') || p.includes('microfon')) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }
    if (p.includes('broadcast') || p.includes('stream')) {
      return 'border-blue-100 bg-sky-50 text-sky-700';
    }
    if (p.includes('guitarra') || p.includes('bajo') || p.includes('bater')) {
      return 'border-amber-200 bg-amber-50 text-amber-800';
    }
    return 'border-slate-200 bg-slate-100 text-slate-700';
  })();

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-2xl border p-3.5 shadow-sm transition-all',
        isPending
          ? 'border-amber-200/60 bg-amber-50/40'
          : isRejected
            ? 'border-red-200/60 bg-red-50/30'
            : 'border-slate-200/50 bg-white/80 hover:bg-white'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
            isPending
              ? 'border-amber-200 bg-amber-100 text-amber-800'
              : isRejected
                ? 'border-red-200 bg-red-100 text-red-700'
                : 'border-slate-200 bg-blue-100 text-blue-700'
          )}
        >
          {getInitials(assignment.user.name)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-900">
              {assignment.user.name}
            </span>
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 text-[10px] font-medium',
                positionColor
              )}
            >
              {assignment.position.split('(')[0]?.trim() || assignment.position}
            </span>
          </div>
          <p className="truncate text-[11px] text-slate-500">
            {assignment.position}
          </p>
        </div>
      </div>
      {isConfirmed && (
        <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-800">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            check_circle
          </span>
          Confirmado
        </span>
      )}
      {isPending && (
        <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-800">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            schedule
          </span>
          Pendiente
        </span>
      )}
      {isRejected && (
        <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-semibold text-red-700">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            cancel
          </span>
          Rechazado
        </span>
      )}
    </div>
  );
}