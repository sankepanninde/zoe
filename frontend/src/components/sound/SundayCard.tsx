import type { Service, ServiceAssignment } from '@/types';
import { cn, getInitials } from '@/lib/utils';

interface SundayCardProps {
  date: Date;
  services: Service[];
  onServiceClick: (service: Service) => void;
  onAddService: (date: string) => void;
  isNextSunday?: boolean;
}

export function SundayCard({
  date,
  services,
  onServiceClick,
  onAddService,
  isNextSunday,
}: SundayCardProps) {
  const dayNumber = date.getDate();
  const fullDate = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

  const morning = services.filter(
    (s) => parseInt(s.startTime.split(':')[0] ?? '0', 10) < 14
  );
  const afternoon = services.filter(
    (s) => parseInt(s.startTime.split(':')[0] ?? '0', 10) >= 14
  );

  const allAssignments = services.flatMap((s) => s.assignments ?? []);
  const total = allAssignments.length;
  const pending = allAssignments.filter((a) => a.status === 'PENDING').length;

  const status = total === 0 ? 'empty' : pending > 0 ? 'pending' : 'complete';

  const cfg = {
    empty: {
      label: 'Sin asignar',
      color: 'border-slate-200 bg-slate-50 text-slate-500',
      dot: 'bg-slate-400',
    },
    pending: {
      label: `${pending} Vacante${pending !== 1 ? 's' : ''} Requerida${pending !== 1 ? 's' : ''}`,
      color: 'border-red-200 bg-red-50 text-red-700',
      dot: 'bg-red-500 animate-ping',
    },
    complete: {
      label: 'Completado',
      color: 'border-emerald-200/60 bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
    },
  }[status];

  return (
    <article
      className={cn(
        'glass-sheen rounded-3xl p-6 transition-all duration-300',
        isNextSunday && 'relative ring-2 ring-blue-500/30'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-12 w-12 flex-col items-center justify-center rounded-2xl font-bold',
              isNextSunday
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                : 'border border-slate-200/80 bg-white text-slate-800 shadow-sm'
            )}
          >
            <span
              className={cn(
                'text-[10px] font-semibold uppercase leading-none tracking-widest',
                isNextSunday ? 'text-blue-200' : 'text-slate-400'
              )}
            >
              DOM
            </span>
            <span
              className={cn(
                'text-lg leading-tight',
                isNextSunday ? 'text-white' : 'text-blue-600'
              )}
            >
              {String(dayNumber).padStart(2, '0')}
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold capitalize leading-snug text-slate-900">
                {fullDate}
              </h3>
              {isNextSunday && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  Próximo Domingo
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500">
              {services.length}{' '}
              {services.length === 1 ? 'servicio programado' : 'servicios programados'}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
            cfg.color
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
      </div>

      {/* Grid: Mañana | Tarde */}
      {services.length === 0 ? (
  <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
    <p className="text-xs text-slate-400">No hay servicios este domingo</p>
    <button
      onClick={() => onAddService(date.toISOString().slice(0, 10))}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        add
      </span>
      Agregar servicio
    </button>
  </div>
) : (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {morning.length > 0 && (
            <ServiceBlock
              label="1er Servicio"
              icon="wb_sunny"
              iconColor="text-amber-500"
              services={morning}
              onServiceClick={onServiceClick}
            />
          )}
          {afternoon.length > 0 && (
            <ServiceBlock
              label="2do Servicio"
              icon="dark_mode"
              iconColor="text-indigo-500"
              services={afternoon}
              onServiceClick={onServiceClick}
            />
          )}
        </div>
      )}
      {/* Botón Agregar otro servicio (solo si ya hay al menos uno) */}
      {services.length > 0 && (
        <button
          onClick={() => onAddService(date.toISOString().slice(0, 10))}
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-200 bg-blue-50/30 py-2.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50/70"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            add
          </span>
          Agregar otro servicio
        </button>
      )}
    </article>
  );
}

// ===========================================
// BLOQUE DE SERVICIO
// ===========================================

interface ServiceBlockProps {
  label: string;
  icon: string;
  iconColor: string;
  services: Service[];
  onServiceClick: (service: Service) => void;
}

function ServiceBlock({
  label,
  icon,
  iconColor,
  services,
  onServiceClick,
}: ServiceBlockProps) {
  return (
    <div>
      {services.map((service) => {
        const confirmed = (service.assignments ?? []).filter(
          (a) => a.status === 'CONFIRMED'
        ).length;
        const total = (service.assignments ?? []).length;
        const complete = total > 0 && confirmed === total;

        return (
          <div
            key={service.id}
            onClick={() => onServiceClick(service)}
            className="cursor-pointer rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm transition-all hover:border-blue-200 hover:bg-white hover:shadow-md"
          >
            {/* Header del servicio */}
            <div className="mb-3 border-b border-slate-100/80 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn('material-symbols-outlined', iconColor)}
                    style={{ fontSize: 18 }}
                  >
                    {icon}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {label}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {service.startTime}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 shadow-sm transition-colors hover:bg-white">
                    <span
                      className="material-symbols-outlined text-blue-600"
                      style={{ fontSize: 12 }}
                    >
                      music_note
                    </span>
                    Setlist
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 shadow-sm transition-colors hover:bg-white">
                    <span
                      className="material-symbols-outlined text-indigo-500"
                      style={{ fontSize: 12 }}
                    >
                      tune
                    </span>
                    Input List ({service.inputListCount ?? 24} ch)
                  </button>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px] font-bold',
                      complete
                        ? 'border-emerald-200/50 bg-emerald-50 text-emerald-600'
                        : 'border-red-200/50 bg-red-50 text-red-600'
                    )}
                  >
                    {confirmed}/{total || 4} {complete ? 'OK' : 'Puestos'}
                  </span>
                </div>
              </div>

              {service.soundCheckTime && (
                <p className="mt-1 flex items-center gap-1 pl-6 text-[10px] font-medium text-slate-400">
                  Prueba de Sonido: {service.soundCheckTime} • Culto: {service.startTime}
                </p>
              )}
              {service.sceneName && (
                <p className="mt-1 flex items-center gap-1 pl-6 text-[10px] font-medium text-blue-600">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                    tune
                  </span>
                  Escena: {service.sceneName}
                  {service.patchName && ` • Patch: ${service.patchName}`}
                </p>
              )}
            </div>

            {/* Técnicos */}
            {service.assignments.length === 0 ? (
              <button
                onClick={() => onServiceClick(service)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 py-3 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  manage_accounts
                </span>
                Gestionar servicio
              </button>
            ) : (
              <ul className="space-y-2.5">
                {service.assignments.map((a) => (
                  <AssignmentRow key={a.id} assignment={a} />
                ))}
              </ul>
            )}

            {/* Footer técnico de reserva */}
            {/* Footer técnico de reserva + botón editar */}
            {service.assignments.length > 0 && (
              <>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100/80 pt-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/70 px-3 py-1 shadow-sm">
                    <span
                      className="material-symbols-outlined text-blue-600"
                      style={{ fontSize: 14 }}
                    >
                      shield
                    </span>
                    <span className="text-[11px] font-medium text-slate-600">
                      Técnico de Reserva:
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700">
                      Por asignar
                    </span>
                  </div>
                  <button className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm transition-colors hover:bg-white">
                    <span
                      className="material-symbols-outlined text-slate-500"
                      style={{ fontSize: 13 }}
                    >
                      history_edu
                    </span>
                    Bitácora / Novedades
                  </button>
                </div>

                {/* Botón Editar — siempre visible */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onServiceClick(service);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200/60 bg-white py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    edit
                  </span>
                  Ver detalles / Editar servicio
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===========================================
// FILA DE ASIGNACIÓN
// ===========================================

function AssignmentRow({ assignment }: { assignment: ServiceAssignment }) {
  const isPending = assignment.status === 'PENDING';

  return (
    <li className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-1 ring-slate-200',
            isPending ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'
          )}
        >
          {getInitials(assignment.user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-800">
            {assignment.user.name}
          </p>
          <p className="truncate text-[10px] text-slate-400">
            {assignment.position}
          </p>
        </div>
      </div>
      {isPending ? (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
          Pendiente
        </span>
      ) : (
        <span
          className="material-symbols-outlined text-emerald-500"
          style={{ fontSize: 18 }}
        >
          check_circle
        </span>
      )}
    </li>
  );
}