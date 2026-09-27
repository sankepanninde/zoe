import { BadgeCheck, Church, AlertCircle } from 'lucide-react';
import type { Service } from '@/types';
import { cn } from '@/lib/utils';

interface SoundMetricsProps {
  services: Service[];
}

export function SoundMetrics({ services }: SoundMetricsProps) {
  const allAssignments = services.flatMap((s) => s.assignments ?? []);
  const confirmed = allAssignments.filter((a) => a.status === 'CONFIRMED').length;
  const total = allAssignments.length;
  const coverage = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  const sundays = new Set(
    services
      .filter((s) => new Date(s.date).getDay() === 0)
      .map((s) => s.date.split('T')[0])
  ).size;
  const totalServices = services.length;

  const pending = allAssignments.filter((a) => a.status === 'PENDING').length;

  return (
    <section className="mb-9 grid grid-cols-1 gap-5 md:grid-cols-3">
      {/* Métrica 1: Cobertura */}
      <div className="flex items-center gap-4 rounded-2xl border border-white/85 bg-gradient-to-br from-white/85 to-white/65 p-4 shadow-[0_10px_30px_-5px_rgba(148,163,184,0.15)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_0_rgba(148,163,184,0.2)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-50 text-emerald-600">
          <BadgeCheck className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cobertura Técnica
            </span>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-xs font-bold',
                coverage >= 90
                  ? 'border-emerald-200/50 bg-emerald-50 text-emerald-600'
                  : coverage >= 70
                    ? 'border-amber-200/50 bg-amber-50 text-amber-600'
                    : 'border-red-200/50 bg-red-50 text-red-600'
              )}
            >
              {coverage}% {coverage >= 90 ? 'Óptimo' : coverage >= 70 ? 'Regular' : 'Bajo'}
            </span>
          </div>
          <div className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
            {confirmed}{' '}
            <span className="text-sm font-normal text-slate-400">
              / {total} Puestos Cubiertos
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all',
                coverage >= 90 ? 'bg-emerald-500' : coverage >= 70 ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${coverage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Métrica 2: Cultos */}
      <div className="flex items-center gap-4 rounded-2xl border border-white/85 bg-gradient-to-br from-white/85 to-white/65 p-4 shadow-[0_10px_30px_-5px_rgba(148,163,184,0.15)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_0_rgba(148,163,184,0.2)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200/60 bg-blue-50 text-blue-600">
          <Church className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cultos Programados
          </span>
          <div className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
            {sundays} Domingos{' '}
            <span className="text-sm font-normal text-slate-400">
              • {totalServices} Servicios Técnicos
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Este mes
          </p>
        </div>
      </div>

      {/* Métrica 3: Atención */}
      <div
        className={cn(
          'flex items-center gap-4 rounded-2xl border p-4 shadow-[0_10px_30px_-5px_rgba(148,163,184,0.15)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_0_rgba(148,163,184,0.2)]',
          pending > 0
            ? 'border-red-200/60 bg-gradient-to-r from-white/80 to-red-50/40'
            : 'border-white/85 bg-gradient-to-br from-white/85 to-white/65'
        )}
      >
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
            pending > 0
              ? 'border-red-200/60 bg-red-50 text-red-600'
              : 'border-emerald-200/60 bg-emerald-50 text-emerald-600'
          )}
        >
          <AlertCircle className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                pending > 0 ? 'text-red-600' : 'text-emerald-600'
              )}
            >
              {pending > 0 ? 'Atención Inmediata' : 'Todo Confirmado'}
            </span>
            {pending > 0 && (
              <span className="rounded-full bg-red-100/70 px-2 py-0.5 text-[11px] font-bold text-red-700">
                {pending} {pending === 1 ? 'Vacante' : 'Vacantes'}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-base font-bold tracking-tight text-slate-900">
            {pending > 0 ? `${pending} puestos por cubrir` : 'Sin puestos vacantes'}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {pending > 0
              ? 'Técnicos por confirmar asistencia'
              : 'Todos los técnicos confirmaron'}
          </p>
        </div>
      </div>
    </section>
  );
}