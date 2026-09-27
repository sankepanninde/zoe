import { useMemo } from 'react';
import type { Service, ServiceAssignment } from '@/types';
import { cn } from '@/lib/utils';

interface YearlyMatrixProps {
  year: number;
  services: Service[];
  userId: string;
  onDayClick: (service: Service) => void;
}

interface DayInfo {
  day: number;
  service?: Service;
  assignment?: ServiceAssignment;
  isFirstShift?: boolean;
  dow: number; // 0=Dom, 6=Sáb, otros=días especiales
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
      const monthServices = services.filter((s) => {
        const d = new Date(s.date);
        return d.getUTCMonth() === monthIndex && d.getUTCFullYear() === year;
      });

      const byDate = new Map<string, DayInfo>();

      monthServices.forEach((s) => {
        const dateObj = new Date(s.date);
        const dow = dateObj.getUTCDay();
        const dateKey = s.date.split('T')[0]!;
        const hour = parseInt(s.startTime.split(':')[0] ?? '0', 10);
        const isFirstShift = hour < 14;
        const assignment = s.assignments.find((a) => a.userId === userId);

        if (!byDate.has(dateKey)) {
          byDate.set(dateKey, {
            day: dateObj.getUTCDate(),
            service: s,
            assignment,
            isFirstShift,
            dow,
          });
        }
      });

      const hasWeekdaySpecials = Array.from(byDate.values()).some(
        (info) => info.dow !== 0 && info.dow !== 6
      );

      const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
      const daysInMonth: DayInfo[] = [];

      for (let day = 1; day <= lastDay.getUTCDate(); day++) {
        const d = new Date(Date.UTC(year, monthIndex, day));
        const dow = d.getUTCDay();
        const dateKey = d.toISOString().slice(0, 10);
        const info = byDate.get(dateKey);

        const isWeekend = dow === 0 || dow === 6;
        const isSpecial = info !== undefined && !isWeekend;

        if (isWeekend || isSpecial) {
          daysInMonth.push(info ?? { day, dow });
        }
      }

      const weeks = new Map<
        number,
        { special?: DayInfo; sat?: DayInfo; sun?: DayInfo }
      >();

      daysInMonth.forEach((info) => {
        const d = new Date(Date.UTC(year, monthIndex, info.day));
        const weekNum = getWeekNumber(d);

        if (!weeks.has(weekNum)) {
          weeks.set(weekNum, {});
        }
        const week = weeks.get(weekNum)!;

        if (info.dow === 6) week.sat = info;
        else if (info.dow === 0) week.sun = info;
        else week.special = info;
      });

      const rows = Array.from(weeks.entries())
        .sort(([a], [b]) => a - b)
        .map(([, week]) => ({
          special: week.special,
          sat: week.sat,
          sun: week.sun,
        }));

      return {
        name: monthName,
        monthIndex,
        totalAssignments: monthServices.length,
        hasWeekdaySpecials,
        rows,
      };
    });
  }, [services, userId, year]);

  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {monthsData.map((month) => {
        const isCurrentMonth =
          month.monthIndex === currentMonth && year === currentYear;
        const isPastMonth =
          year < currentYear ||
          (year === currentYear && month.monthIndex < currentMonth);

        return (
          <MonthCard
            key={month.monthIndex}
            month={month}
            isCurrentMonth={isCurrentMonth}
            isPastMonth={isPastMonth}
            onDayClick={onDayClick}
          />
        );
      })}
    </section>
  );
}

// ===========================================
// UTILIDAD: Número de semana ISO
// ===========================================

function getWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// ===========================================
// TARJETA DE MES
// ===========================================

interface MonthCardProps {
  month: {
    name: string;
    monthIndex: number;
    totalAssignments: number;
    hasWeekdaySpecials: boolean;
    rows: Array<{ special?: DayInfo; sat?: DayInfo; sun?: DayInfo }>;
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
  const gridCols = month.hasWeekdaySpecials ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <article
      className={cn(
        'glass-card group relative flex flex-col justify-between rounded-3xl border p-4 transition-all hover:border-white',
        isCurrentMonth
          ? 'glass-card-active z-20 border-2 border-blue-500/40 lg:-translate-y-1'
          : 'border-white/80',
        isPastMonth && 'opacity-90 hover:opacity-100'
      )}
    >
      {isCurrentMonth && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="specular-glow flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-300" />
            Mes en Curso • Activo
          </span>
        </div>
      )}

      <div>
        <div
          className={cn(
            'mb-2.5 flex items-center justify-between border-b pb-2',
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
              'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
              month.totalAssignments > 0
                ? isCurrentMonth
                  ? 'bg-blue-100 font-bold text-blue-700'
                  : 'bg-blue-50 text-blue-600'
                : 'bg-slate-100 text-slate-400'
            )}
          >
            {month.totalAssignments} turnos
          </span>
        </div>

        <div
          className={cn(
            'mb-1.5 grid text-center text-[11px] font-medium uppercase tracking-wider',
            gridCols
          )}
        >
          {month.hasWeekdaySpecials && (
            <span className="font-semibold text-amber-700">Jue</span>
          )}
          <span className="text-slate-500">Sáb</span>
          <span className="font-semibold text-slate-700">Dom</span>
        </div>

        <div className="space-y-1.5">
          {month.rows.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-slate-400">
              Sin turnos
            </p>
          ) : (
            month.rows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={cn(
                  'grid items-center gap-1 rounded-xl text-center',
                  gridCols,
                  row.special && 'border border-amber-300/30 bg-amber-50/25 p-0.5'
                )}
              >
                {month.hasWeekdaySpecials && (
                  <DayCell
                    info={row.special}
                    onClick={onDayClick}
                    variant="special"
                  />
                )}
                <DayCell info={row.sat} onClick={onDayClick} variant="normal" />
                <DayCell
                  info={row.sun}
                  onClick={onDayClick}
                  variant="highlight"
                />
              </div>
            ))
          )}
        </div>
      </div>

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
// CELDA DE DÍA
// ===========================================

interface DayCellProps {
  info?: DayInfo;
  onClick: (service: Service) => void;
  variant: 'special' | 'normal' | 'highlight';
}

function DayCell({ info, onClick, variant }: DayCellProps) {
  if (!info) {
    return <span className="py-1 text-[11px] text-slate-300">—</span>;
  }

  if (!info.service) {
    return (
      <span className="py-1 text-sm font-normal text-slate-400">
        {info.day}
      </span>
    );
  }

  const isFirst = info.isFirstShift;
  const isPending = info.assignment?.status === 'PENDING';
  const isRejected = info.assignment?.status === 'REJECTED';

  const bgClass = isRejected
    ? 'bg-red-500 text-white'
    : isFirst
      ? 'bg-blue-600 text-white shadow-sm'
      : 'bg-emerald-600 text-white shadow-sm';

  const isCurrent =
    variant === 'highlight' &&
    info.isFirstShift &&
    info.assignment?.status === 'CONFIRMED';

  return (
    <div className="group/day relative flex items-center justify-center">
      <button
        onClick={() => info.service && onClick(info.service)}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg py-1 text-[11px] font-semibold leading-tight transition-all hover:scale-105',
          bgClass,
          isCurrent && 'specular-glow font-bold'
        )}
      >
        <span>{info.day}</span>
        <span className="text-[9px] font-bold opacity-90">
          {isFirst ? '1.º' : '2.º'}
        </span>
        {isPending && (
          <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-amber-400 ring-2 ring-white" />
        )}
      </button>

      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white bg-white/95 px-3 py-1.5 opacity-0 shadow-xl backdrop-blur-xl transition-opacity group-hover/day:opacity-100">
        <span className="text-[11px] font-semibold text-slate-800">
          {isFirst ? '1.er' : '2.º'} Servicio •{' '}
          {info.assignment?.position.split('(')[0]?.trim() ?? 'Servicio'}
        </span>
      </div>
    </div>
  );
}