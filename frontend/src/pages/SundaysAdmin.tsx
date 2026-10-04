import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  CalendarDays,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppDock } from '@/components/layout/AppDock';
import { ServiceModal } from '@/components/calendar/ServiceModal';
import { listServices, listServiceTypes, seedYear } from '@/lib/services.api';
import { useAuth } from '@/stores/auth.store';
import type { Service } from '@/types';
import { cn } from '@/lib/utils';

type FilterMode = 'all' | 'vacant' | 'partial' | 'complete';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DOW_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function SundaysAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [year, setYear] = useState(new Date().getFullYear());
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // ============ QUERIES ============
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['services', 'sundays', year],
    queryFn: () =>
      listServices({ from: `${year}-01-01`, to: `${year}-12-31` }),
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: listServiceTypes,
  });

  const selectedService: Service | null = useMemo(
    () => (selectedServiceId ? services.find((s) => s.id === selectedServiceId) ?? null : null),
    [selectedServiceId, services]
  );

  // ============ DATA ============
  const sundayServices = useMemo(
    () => services.filter((s) => new Date(s.date).getUTCDay() === 0),
    [services]
  );

  const groupedMonths = useMemo(() => {
    const byMonth = new Map<number, Map<string, Service[]>>();

    sundayServices.forEach((s) => {
      const d = new Date(s.date);
      const month = d.getUTCMonth();
      const key = s.date.split('T')[0]!;

      if (!byMonth.has(month)) byMonth.set(month, new Map());
      const dayMap = byMonth.get(month)!;
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push(s);
    });

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a - b)
      .map(([monthIndex, dayMap]) => ({
        monthIndex,
        monthName: MONTH_NAMES[monthIndex]!,
        days: Array.from(dayMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([dateKey, svcs]) => {
            const sorted = [...svcs].sort((a, b) => a.startTime.localeCompare(b.startTime));
            const assigned = sorted.filter((s) => s.assignments.length > 0).length;
            return {
              dateKey,
              dateObj: new Date(sorted[0]!.date),
              services: sorted,
              assignedCount: assigned,
              totalCount: sorted.length,
            };
          }),
      }));
  }, [sundayServices]);

  const filteredMonths = useMemo(
    () =>
      groupedMonths
        .map((m) => ({
          ...m,
          days: m.days.filter((d) => {
            if (filterMode === 'all') return true;
            if (filterMode === 'vacant') return d.assignedCount === 0;
            if (filterMode === 'partial') return d.assignedCount > 0 && d.assignedCount < d.totalCount;
            if (filterMode === 'complete') return d.assignedCount === d.totalCount;
            return true;
          }),
        }))
        .filter((m) => m.days.length > 0),
    [groupedMonths, filterMode]
  );

  const stats = useMemo(() => {
    const totalDays = groupedMonths.reduce((a, m) => a + m.days.length, 0);
    const totalSlots = sundayServices.length;
    const filled = sundayServices.filter((s) => s.assignments.length > 0).length;
    const coverage = totalSlots > 0 ? Math.round((filled / totalSlots) * 100) : 0;
    return { totalDays, totalSlots, filled, coverage };
  }, [sundayServices, groupedMonths]);

  // ============ HANDLERS ============
  const handleGenerate = async () => {
    if (!confirm(`¿Generar los domingos de ${year}? Los que ya existan no se duplicarán.`)) return;
    setGenerating(true);
    try {
      const res = await seedYear(year);
      toast.success(
        `✅ ${res.servicesCreated} servicios creados · ${res.servicesSkipped} ya existían`
      );
      await refetch();
    } catch (err) {
      toast.error('Error al generar: ' + (err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenService = (service: Service) => {
    setSelectedServiceId(service.id);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedServiceId(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['services'] });
    handleCloseModal();
  };

  // ============ RENDER ============
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 antialiased">
      <AppDock />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-8 md:py-8 lg:py-10 lg:pl-24 lg:pr-10">
        {/* ============ HEADER ============ */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Administración de Domingos</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{user?.church?.name ?? 'Mi iglesia'}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Domingos {year}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Asigna técnicos a los 2 turnos de cada domingo. Todo pre-generado, solo rellena las vacantes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Year selector */}
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setYear((y) => y - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                ←
              </button>
              <span className="px-2 text-sm font-bold text-slate-900">{year}</span>
              <button
                type="button"
                onClick={() => setYear((y) => y + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                →
              </button>
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generar año {year}
            </button>
          </div>
        </header>

        {/* ============ STATS ============ */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Domingos" value={stats.totalDays} icon="event" tone="blue" />
          <StatCard label="Turnos totales" value={stats.totalSlots} icon="schedule" tone="violet" />
          <StatCard label="Turnos cubiertos" value={stats.filled} icon="check" tone="emerald" />
          <StatCard label="Cobertura" value={`${stats.coverage}%`} icon="trending_up" tone="amber" />
        </section>

        {/* ============ FILTERS ============ */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'all', label: 'Todos' },
              { key: 'vacant', label: 'Vacantes' },
              { key: 'partial', label: 'Parciales' },
              { key: 'complete', label: 'Completos' },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterMode(f.key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
                filterMode === f.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ============ CONTENT ============ */}
        {isLoading ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filteredMonths.length === 0 ? (
          <EmptyState year={year} onGenerate={handleGenerate} generating={generating} />
        ) : (
          <div className="space-y-6">
            {filteredMonths.map((month) => (
              <MonthSection
                key={month.monthIndex}
                monthName={month.monthName}
                days={month.days}
                onServiceClick={handleOpenService}
              />
            ))}
          </div>
        )}
      </main>

      <ServiceModal
        open={modalOpen}
        service={selectedService}
        initialDate={null}
        serviceTypes={serviceTypes}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

// ===========================================
// SUB-COMPONENTES
// ===========================================

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: string;
  tone: 'blue' | 'violet' | 'emerald' | 'amber';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="text-xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}

interface MonthSectionProps {
  monthName: string;
  days: Array<{
    dateKey: string;
    dateObj: Date;
    services: Service[];
    assignedCount: number;
    totalCount: number;
  }>;
  onServiceClick: (s: Service) => void;
}

function MonthSection({ monthName, days, onServiceClick }: MonthSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{monthName}</h2>
        <span className="text-xs font-semibold text-slate-500">
          {days.length} {days.length === 1 ? 'domingo' : 'domingos'}
        </span>
      </div>

      <div className="space-y-3">
        {days.map((day) => (
          <SundayRow
            key={day.dateKey}
            dateKey={day.dateKey}
            dateObj={day.dateObj}
            services={day.services}
            assignedCount={day.assignedCount}
            totalCount={day.totalCount}
            onServiceClick={onServiceClick}
          />
        ))}
      </div>
    </section>
  );
}

interface SundayRowProps {
  dateKey: string;
  dateObj: Date;
  services: Service[];
  assignedCount: number;
  totalCount: number;
  onServiceClick: (s: Service) => void;
}

function SundayRow({
  dateKey,
  dateObj,
  services,
  assignedCount,
  totalCount,
  onServiceClick,
}: SundayRowProps) {
  const dayNum = dateObj.getUTCDate();
  const dow = DOW_SHORT[dateObj.getUTCDay()];
  const monthShort = new Intl.DateTimeFormat('es-CO', { month: 'short' })
    .format(dateObj)
    .replace('.', '');

  const isComplete = assignedCount === totalCount;
  const isVacant = assignedCount === 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3 transition hover:border-blue-200 hover:bg-blue-50/30 md:flex-row md:items-center md:gap-4">
      {/* Fecha */}
      <div className="flex items-center gap-3 md:w-32">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            {dow}
          </span>
          <span className="text-xl font-bold leading-none text-slate-900">{dayNum}</span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
            {monthShort}
          </span>
        </div>
        <div className="md:hidden">
          <StatusPill assigned={assignedCount} total={totalCount} />
        </div>
      </div>

      {/* Turnos */}
      <div className="grid flex-1 gap-2 sm:grid-cols-2">
        {services.map((svc) => (
          <ServiceSlot key={svc.id} service={svc} onClick={() => onServiceClick(svc)} />
        ))}
        {services.length < 2 && (
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-3 py-2.5 text-[11px] font-medium text-slate-400">
            Sin turno registrado
          </div>
        )}
      </div>

      {/* Status */}
      <div className="hidden md:block">
        <StatusPill assigned={assignedCount} total={totalCount} />
      </div>
    </div>
  );
}

function StatusPill({ assigned, total }: { assigned: number; total: number }) {
  if (assigned === total && total > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Completo
      </span>
    );
  }
  if (assigned === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200">
        <AlertCircle className="h-3 w-3" />
        Vacante
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
      <AlertCircle className="h-3 w-3" />
      {assigned}/{total}
    </span>
  );
}

function ServiceSlot({ service, onClick }: { service: Service; onClick: () => void }) {
  const hour = parseInt(service.startTime.split(':')[0] ?? '0', 10);
  const isFirst = hour < 14;
  const assigned = service.assignments.length;
  const isEmpty = assigned === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group/slot flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
        isEmpty
          ? 'border-dashed border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold',
              isFirst ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
            )}
          >
            {isFirst ? '1' : '2'}
          </span>
          <span className="text-xs font-bold text-slate-900">
            {service.startTime} – {service.endTime}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="h-3 w-3" />
          <span className="truncate">
            {isEmpty ? (
              <span className="italic text-slate-400">Sin asignar · click para asignar</span>
            ) : (
              service.assignments.map((a) => a.user.name.split(' ')[0]).join(', ')
            )}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'flex h-7 min-w-7 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-bold',
          isEmpty ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white'
        )}
      >
        <Users className="h-3 w-3" />
        {assigned}
      </div>
    </button>
  );
}

function EmptyState({
  year,
  onGenerate,
  generating,
}: {
  year: number;
  onGenerate: () => void;
  generating: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50">
        <CalendarDays className="h-7 w-7 text-blue-600" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">
        No hay domingos para {year}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Genera automáticamente los 52 domingos del año con sus 2 turnos
        (07:00 y 10:00). Después solo asignas técnicos.
      </p>
      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:opacity-60"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Generar domingos {year}
      </button>
    </div>
  );
}