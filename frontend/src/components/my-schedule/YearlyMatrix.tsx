import { useMemo } from 'react';
import type { Service, ServiceAssignment } from '@/types';
import { cn } from '@/lib/utils';

interface YearlyMatrixProps {
  year: number;
  services: Service[];
  userId: string;
  onDayClick: (service: Service) => void;
}

interface DayRow {
  dateKey: string;
  date: Date;
  services: Service[];
  myAssignment: ServiceAssignment | null;
  myService: Service | null;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DOW_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function YearlyMatrix({
  year,
  services,
  userId,
  onDayClick,
}: YearlyMatrixProps) {
  const today = new Date();
  const currentMonth = today.getUTCMonth();
  const currentYear = today.getUTCFullYear();

  const monthsData = useMemo(() => {
    return MONTH_NAMES.map((monthName, monthIndex) => {
      // Servicios del mes
      const monthServices = services.filter((s) => {
        const d = new Date(s.date);
        return (
          d.getUTCMonth() === monthIndex && d.getUTCFullYear() === year
        );
      });

      // Agrupar por fecha (1 fecha = 1 fila)
      const byDate = new Map<string, Service[]>();
      monthServices.forEach((s) => {
        const key = s.date.split('T')[0]!;
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key)!.push(s);
      });

      const days: DayRow[] = Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateKey, svcs]) => {
          const sorted = [...svcs].sort((a, b) =>
            a.startTime.localeCompare(b.startTime)
          );
          // Buscar si el user tiene alguna asignación ese día
          let myAssignment: ServiceAssignment | null = null;
          let myService: Service | null = null;
          for (const s of sorted) {
            const found = s.assignments.find((a) => a.userId === userId);
            if (found) {
              myAssignment = found;
              myService = s;
              break;
            }
          }
          return {
            dateKey,
            date: new Date(sorted[0]!.date),
            services: sorted,
            myAssignment,
            myService,
          };
        });

      // Contar SOLO los turnos del usuario este mes
      const myTotal = days.filter((d) => d.myAssignment).length;

      return {
        name: monthName,
        monthIndex,
        totalMine: myTotal,
        days,
        hasServices: days.length > 0,
      };
    });
  }, [services, userId, year]);

  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {monthsData.map((month) => (
        <MonthCard
          key={month.monthIndex}
          month={month}
          isCurrentMonth={
            month.monthIndex === currentMonth && year === currentYear
          }
          isPastMonth={
            year < currentYear ||
            (year === currentYear && month.monthIndex < currentMonth)
          }
          onDayClick={onDayClick}
        />
      ))}
    </section>
  );
}

// ===========================================
// TARJETA DE MES
// ===========================================

interface MonthCardProps {
  month: {
    name: string;
    monthIndex: number;
    totalMine: number;
    days: DayRow[];
    hasServices: boolean;
  };
  isCurrentMonth: boolean;
  isPastMonth: boolean;
  onDayClick: (service: Service) => void;
}

function MonthCard({
  month,
  isCurrentMonth,
  isPastMonth,
  onDayClick,
}: MonthCardProps) {
  return (
    <article
      className={cn(
        'glass-card group relative flex flex-col rounded-3xl border p-4 transition-all hover:border-white',
        isCurrentMonth
          ? 'glass-card-active z-20 border-2 border-blue-500/40 lg:-translate-y-1'
          : 'border-white/80',
        isPastMonth && 'opacity-90 hover:opacity-100'
      )}
    >
      {isCurrentMonth && (
        <div className="absolute -top-3 left-1/2 z-30 -translate-x-1/2">
          <span className="specular-glow flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white whitespace-nowrap">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-300" />
            Mes en Curso
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        {/* Header del mes */}
        <div
          className={cn(
            'mb-3 flex items-center justify-between border-b pb-2',
            isCurrentMonth ? 'border-blue-500/20 pt-1' : 'border-slate-200/60'
          )}
        >
          <h2
            className={cn(
              'font-semibold',
              isCurrentMonth ? 'text-xl text-blue-600' : 'text-lg text-slate-900'
            )}
          >
            {month.name}
          </h2>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
              month.totalMine > 0
                ? isCurrentMonth
                  ? 'bg-blue-100 font-bold text-blue-700'
                  : 'bg-blue-50 text-blue-600'
                : 'bg-slate-100 text-slate-400'
            )}
          >
            {month.totalMine === 0
              ? 'Sin turnos'
              : `${month.totalMine} turno${month.totalMine !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Lista de días */}
        <div className="flex-1 space-y-1.5">
          {!month.hasServices ? (
            <p className="py-4 text-center text-[11px] text-slate-400">
              Sin servicios este mes
            </p>
          ) : (
            month.days.map((day) => (
              <DayRowItem
                key={day.dateKey}
                day={day}
                onClick={onDayClick}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer del mes */}
      <div
        className={cn(
          'mt-3 flex items-center justify-between border-t pt-2 text-[11px]',
          isCurrentMonth ? 'border-blue-500/20' : 'border-slate-200/40'
        )}
      >
        <span className="text-slate-500">Equipo de sonido</span>
        <span
          className={cn(
            'font-medium',
            isCurrentMonth
              ? 'text-blue-600'
              : isPastMonth
                ? 'text-emerald-600'
                : 'text-slate-500'
          )}
        >
          {isCurrentMonth
            ? 'En curso'
            : isPastMonth
              ? 'Cumplido ✓'
              : 'Programado'}
        </span>
      </div>
    </article>
  );
}

// ===========================================
// FILA DE DÍA
// ===========================================

interface DayRowItemProps {
  day: DayRow;
  onClick: (service: Service) => void;
}

function DayRowItem({ day, onClick }: DayRowItemProps) {
  const isMine = !!day.myAssignment && !!day.myService;
  const dowLabel = DOW_SHORT[day.date.getUTCDay()];
  const dayNum = day.date.getUTCDate();

  const isPending = day.myAssignment?.status === 'PENDING';
  const isRejected = day.myAssignment?.status === 'REJECTED';
  const isConfirmed = day.myAssignment?.status === 'CONFIRMED';

  // Primer servicio del día (para click cuando no es mío)
  const firstService = day.services[0]!;

  const handleClick = () => {
    onClick(isMine && day.myService ? day.myService : firstService);
  };

  if (isMine && day.myAssignment && day.myService) {
    // ─── Fila DESTACADA (mi turno) ───
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'group/row flex w-full items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all hover:scale-[1.01]',
          isConfirmed &&
            'border-emerald-300 bg-emerald-50/60 hover:border-emerald-400',
          isPending &&
            'border-blue-300 bg-blue-50/60 hover:border-blue-400',
          isRejected && 'border-red-300 bg-red-50/60 hover:border-red-400',
          !isPending &&
            !isConfirmed &&
            !isRejected &&
            'border-slate-300 bg-slate-50/60'
        )}
      >
        {/* Día */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-white shadow-sm',
            isConfirmed && 'bg-emerald-600',
            isPending && 'bg-blue-600',
            isRejected && 'bg-red-500',
            !isPending && !isConfirmed && !isRejected && 'bg-slate-500'
          )}
        >
          <span className="text-[9px] font-bold uppercase leading-none opacity-90">
            {dowLabel}
          </span>
          <span className="text-sm font-bold leading-tight">
            {String(dayNum).padStart(2, '0')}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900">
              {day.myService.startTime}
            </span>
            <span className="truncate text-[11px] font-medium text-slate-600">
              · {day.myAssignment.position}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                isConfirmed && 'bg-emerald-100 text-emerald-700',
                isPending && 'bg-amber-100 text-amber-700',
                isRejected && 'bg-red-100 text-red-700'
              )}
            >
              {isConfirmed && '✓ Confirmado'}
              {isPending && '● Pendiente'}
              {isRejected && '✕ Rechazado'}
              {!isConfirmed && !isPending && !isRejected && '· Sin confirmar'}
            </span>
          </div>
        </div>
      </button>
    );
  }

  // ─── Fila NORMAL (no es mi turno) ───
  return (
    <button
      type="button"
      onClick={handleClick}
      className="group/row flex w-full items-center gap-2.5 rounded-xl border border-slate-200/60 bg-white/40 p-2.5 text-left transition-all hover:border-slate-300 hover:bg-white/70"
    >
      {/* Día */}
      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <span className="text-[9px] font-bold uppercase leading-none">
          {dowLabel}
        </span>
        <span className="text-sm font-semibold leading-tight">
          {String(dayNum).padStart(2, '0')}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-600">
            {day.services.map((s) => s.startTime).join(' · ')}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] italic text-slate-400">
          {day.services.length === 1
            ? 'Sin tu turno'
            : `${day.services.length} servicios · sin tu turno`}
        </p>
      </div>
    </button>
  );
}