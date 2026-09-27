import { CheckCircle2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateAssignment } from '@/lib/services.api';
import { getApiError } from '@/lib/api';
import type { Service } from '@/types';
import { cn } from '@/lib/utils';

interface NextShiftCardProps {
  service: Service;
  userId: string;
  onRefresh: () => void;
  onRequestReplace: () => void;
}

export function NextShiftCard({
  service,
  userId,
  onRefresh,
  onRequestReplace,
}: NextShiftCardProps) {
  const myAssignment = service.assignments.find((a) => a.userId === userId);
  if (!myAssignment) return null;

  const isConfirmed = myAssignment.status === 'CONFIRMED';

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAssignment(service.id, myAssignment.id, { status: 'CONFIRMED' }),
    onSuccess: () => {
      toast.success('Asistencia confirmada');
      onRefresh();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const dateObj = new Date(service.date);
  const fullDate = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(dateObj);

  const dateCapitalized =
    fullDate.charAt(0).toUpperCase() + fullDate.slice(1);

  const startHour = parseInt(service.startTime.split(':')[0] ?? '0', 10);
  const isFirst = startHour < 14;
  const arrivalTime = service.soundCheckTime ?? service.startTime;

  return (
    <section
      aria-label="Próximo Turno Inmediato"
      className="mb-7"
    >
      <div className="glass-card flex flex-col justify-between gap-4 rounded-2xl border border-white/95 px-5 py-3.5 shadow-sm transition-all hover:border-white xl:flex-row xl:items-center">
        {/* Izquierda: indicador + info */}
        <div className="flex flex-wrap items-center gap-3.5 sm:flex-nowrap">
          <div className="relative flex flex-shrink-0 items-center justify-center">
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-emerald-400 opacity-60" />
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="rounded-full bg-emerald-100/50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Próximo Servicio
            </span>
            <p className="text-sm text-slate-800">
              <strong className="font-semibold">{dateCapitalized}</strong> •{' '}
              <span className="font-medium text-blue-600">
                {arrivalTime} (Prueba de Sonido)
              </span>{' '}
              — Culto {service.startTime}
            </p>
          </div>
        </div>

        {/* Medio: Rol */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-slate-50/90 px-3 py-1.5 text-[11px] font-medium text-slate-800">
            <span
              className="material-symbols-outlined text-blue-600"
              style={{ fontSize: 16 }}
            >
              tune
            </span>
            Rol:{' '}
            <span className="font-semibold text-blue-600">
              {myAssignment.position}
            </span>
          </span>
        </div>

        {/* Derecha: acciones */}
        <div className="flex flex-shrink-0 items-center gap-2.5">
          <button
            type="button"
            className="glass-pill inline-flex items-center gap-1.5 rounded-full border border-white/90 px-3.5 py-1.5 text-[11px] font-medium text-slate-800 shadow-sm transition-all hover:bg-white hover:text-blue-600"
          >
            <span
              className="material-symbols-outlined text-slate-500"
              style={{ fontSize: 16 }}
            >
              equalizer
            </span>
            Input List ({service.inputListCount ?? 24} ch)
          </button>

          {!isConfirmed ? (
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              type="button"
              className="specular-glow inline-flex transform items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
              >
                check_circle
              </span>
              {updateMutation.isPending ? 'Confirmando...' : 'Confirmar Asistencia'}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirmado
            </span>
          )}
        </div>
      </div>
    </section>
  );
}