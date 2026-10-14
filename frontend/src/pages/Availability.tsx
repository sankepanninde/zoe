import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  listMyAvailability,
  toggleDay,
  clearMonth,
} from '@/lib/availability.api';
import { getApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DOW_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function AvailabilityPage() {
  const queryClient = useQueryClient();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['availability', 'me', year, month],
    queryFn: () => listMyAvailability(year, month),
  });

  // Map de fecha (YYYY-MM-DD) → estado
  const statusMap = useMemo(() => {
    const map = new Map<string, { available: boolean; reason: string | null }>();
    records.forEach((r) => {
      const key = r.date.split('T')[0]!;
      map.set(key, { available: r.available, reason: r.reason });
    });
    return map;
  }, [records]);

  // Toggle con optimistic update
  const toggleMutation = useMutation({
    mutationFn: toggleDay,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['availability', 'me', year, month],
      });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearMonth(year, month),
    onSuccess: () => {
      toast.success('Mes reiniciado');
      queryClient.invalidateQueries({
        queryKey: ['availability', 'me', year, month],
      });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // Generar días del mes actual (con offsets)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDow = firstDay.getDay(); // 0 = Domingo

    const days: (Date | null)[] = [];

    // Rellenar días del mes anterior (para alinear)
    for (let i = 0; i < startDow; i++) {
      days.push(null);
    }

    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [year, month]);

  // Stats
  const stats = useMemo(() => {
    let available = 0;
    let unavailable = 0;
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= lastDay; i++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const s = statusMap.get(key);
      if (s?.available === true) available++;
      else if (s?.available === false) unavailable++;
    }

    const unmarked = lastDay - available - unavailable;
    return { available, unavailable, unmarked, total: lastDay };
  }, [statusMap, year, month]);

  const handleDayClick = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const current = statusMap.get(dateStr);

    // Ciclo de 3 estados:
    // Sin marcar → No disponible → Disponible → Sin marcar
    let nextAvailable: boolean;
    if (!current) {
      nextAvailable = false; // Marca como no disponible primero
    } else if (current.available === false) {
      nextAvailable = true; // Cambia a disponible
    } else {
      // Está disponible → limpiar (no podemos eliminar con upsert, así que
      // simplemente marcamos como disponible de nuevo; para limpiar el usuario
      // debe usar el botón de limpiar mes)
      nextAvailable = false; // Vuelve a no disponible
    }

    toggleMutation.mutate({
      date: dateStr,
      available: nextAvailable,
    });
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <AppLayout
      title="Disponibilidad"
      subtitle="Marca los días en que puedes servir"
    >
      <div className="space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-primary-200/50 bg-primary-50/40 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Info className="h-4 w-4" />
          </div>
          <div className="min-w-0 text-sm text-foreground-muted">
            <p className="font-semibold text-foreground">
              ¿Cómo funciona?
            </p>
            <p className="mt-0.5">
              Marca con <span className="font-semibold text-rose-600">rojo</span> los
              días en que <strong>no puedes servir</strong>. Los días sin marcar se
              asumen disponibles. Tu líder verá esta info y la usará para asignarte
              turnos.
            </p>
          </div>
        </div>

        {/* Header con navegación */}
        <div className="zoe-card flex flex-col gap-4 !p-4 sm:flex-row sm:items-center sm:justify-between sm:!p-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface-elevated hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="min-w-[160px] text-center font-display text-lg font-bold tracking-tight text-foreground">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface-elevated hover:text-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isCurrentMonth && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                Mes actual
              </span>
            )}
            {records.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Borrar toda tu disponibilidad de este mes?')) {
                    clearMutation.mutate();
                  }
                }}
                disabled={clearMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
              >
                {clearMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Reiniciar mes
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox
            label="Disponible"
            value={stats.available}
            tone="emerald"
          />
          <StatBox
            label="No disponible"
            value={stats.unavailable}
            tone="rose"
          />
          <StatBox label="Sin marcar" value={stats.unmarked} tone="slate" />
        </div>

        {/* Calendario */}
        <div className="zoe-card !p-4 sm:!p-5">
          {/* Días de la semana */}
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-foreground-subtle">
            {DOW_LABELS.map((d) => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Grilla */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const status = statusMap.get(dateKey);
                const isToday = dateKey === todayKey;

                let bgClass = 'bg-surface hover:bg-surface-elevated';
                let textClass = 'text-foreground';
                let dot = null;

                if (status?.available === true) {
                  bgClass = 'bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-200';
                  textClass = 'text-emerald-800 font-semibold';
                  dot = <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />;
                } else if (status?.available === false) {
                  bgClass = 'bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-200';
                  textClass = 'text-rose-800 font-semibold';
                  dot = <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-rose-500" />;
                }

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => handleDayClick(date)}
                    disabled={toggleMutation.isPending}
                    className={cn(
                      'relative flex aspect-square items-center justify-center rounded-xl border text-sm transition-all active:scale-95',
                      bgClass,
                      textClass,
                      isToday
                        ? 'border-primary-300 ring-2 ring-primary/30'
                        : 'border-border/60',
                      toggleMutation.isPending && 'cursor-wait opacity-70'
                    )}
                    title={
                      status?.reason
                        ? `No disponible: ${status.reason}`
                        : status?.available === true
                          ? 'Disponible'
                          : status?.available === false
                            ? 'No disponible'
                            : 'Sin marcar'
                    }
                  >
                    <span className="relative z-10">{date.getDate()}</span>
                    {dot}
                  </button>
                );
              })}
            </div>
          )}

          {/* Leyenda */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 border-t border-border pt-4 text-xs">
            <Legend color="emerald" label="Disponible" />
            <Legend color="rose" label="No disponible" />
            <Legend color="slate" label="Sin marcar (disponible)" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ===========================================
// SUB-COMPONENTES
// ===========================================

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'rose' | 'slate';
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-surface-elevated text-foreground-muted border-border',
  };

  return (
    <div className={cn('rounded-2xl border p-3.5', tones[tone])}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: 'emerald' | 'rose' | 'slate'; label: string }) {
  const colors = {
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-400',
  };
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2.5 w-2.5 rounded-full', colors[color])} />
      <span className="text-foreground-muted">{label}</span>
    </div>
  );
}