import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TechnicianSummaryCardProps {
  name: string;
  position: string;
  shifts: { label: string; isNext?: boolean }[];
  color?: 'blue' | 'emerald';
}

export function TechnicianSummaryCard({
  name,
  position,
  shifts,
  color = 'blue',
}: TechnicianSummaryCardProps) {
  const colorClasses = {
    blue: {
      avatar: 'bg-blue-100 text-blue-700',
      badge: 'bg-blue-50 text-blue-700 border-blue-100',
      badgeNext: 'bg-blue-600 text-white border-blue-600',
    },
    emerald: {
      avatar: 'bg-emerald-100 text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      badgeNext: 'bg-emerald-600 text-white border-emerald-600',
    },
  }[color];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white bg-white/70 p-4 shadow-sm transition-colors hover:bg-white">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ring-blue-500/20',
            colorClasses.avatar
          )}
        >
          {getInitials(name)}
        </div>
        <div className="min-w-0">
          <h4 className="truncate text-xs font-bold text-slate-900">{name}</h4>
          <p className="truncate text-[11px] text-slate-500">{position}</p>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Domingos Asignados:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {shifts.length === 0 ? (
            <span className="text-[11px] text-slate-400">Sin turnos</span>
          ) : (
            shifts.map((shift, i) => (
              <span
                key={i}
                className={cn(
                  'rounded-md border px-2 py-0.5 text-[11px] font-medium',
                  shift.isNext ? colorClasses.badgeNext : colorClasses.badge
                )}
              >
                {shift.label}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}