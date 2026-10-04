import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, Download } from 'lucide-react';
import { SoundMetrics } from '@/components/sound/SoundMetrics';
import { WeeklyView } from '@/components/sound/WeeklyView';
import { SoundHeader, type ViewMode } from '@/components/sound/SoundHeader';
import { SundayCard } from '@/components/sound/SundayCard';
import { TechnicianSummaryCard } from '@/components/sound/TechnicianSummaryCard';
import { ServiceModal } from '@/components/calendar/ServiceModal';
import { listServices, listServiceTypes } from '@/lib/services.api';
import { useAuth } from '@/stores/auth.store';
import type { Service } from '@/types';

export function SoundSchedule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => listServices(),
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: listServiceTypes,
  });

  // Derivar el servicio seleccionado desde la lista fresca (evita copias congeladas)
  const selectedService: Service | null = useMemo(
    () =>
      selectedServiceId
        ? services.find((s) => s.id === selectedServiceId) ?? null
        : null,
    [selectedServiceId, services]
  );
  // Lunes de la semana actual
const weekStart = useMemo(() => {
  const d = new Date(currentDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}, [currentDate]);

  const monthServices = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return services.filter((s) => {
      const d = new Date(s.date);
      return d.getUTCFullYear() === year && d.getUTCMonth() === month;
    });
  }, [services, currentDate]);

  const filteredServices = useMemo(() => {
    if (filterMode === 'all') return monthServices;
    return monthServices.filter((s) =>
      s.assignments?.some((a) => a.userId === user?.id)
    );
  }, [monthServices, filterMode, user?.id]);

  const sundays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const sundayDates: Date[] = [];
    const d = new Date(firstDay);
    while (d <= lastDay) {
      if (d.getDay() === 0) sundayDates.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return sundayDates.map((sundayDate) => ({
      date: sundayDate,
      services: filteredServices.filter((s) => {
        const sd = new Date(s.date);
        return (
          sd.getUTCDate() === sundayDate.getDate() &&
          sd.getUTCMonth() === sundayDate.getMonth() &&
          sd.getUTCFullYear() === sundayDate.getFullYear()
        );
      }),
      isNext:
        sundayDate >= today &&
        sundayDate.getTime() - today.getTime() < 7 * 86400000,
    }));
  }, [filteredServices, currentDate]);

  const techniciansSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        position: string;
        shifts: { label: string; isNext?: boolean }[];
      }
    >();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredServices.forEach((s) => {
      const day = new Date(s.date).getUTCDate();
      const isMorning = parseInt(s.startTime.split(':')[0] ?? '0', 10) < 14;
      const label = `Dom ${String(day).padStart(2, '0')} (${isMorning ? 'M' : 'T'})`;
      const isNext =
        new Date(s.date) >= today &&
        new Date(s.date).getTime() - today.getTime() < 7 * 86400000;

      s.assignments.forEach((a) => {
        if (!map.has(a.userId)) {
          map.set(a.userId, {
            id: a.userId,
            name: a.user.name,
            position: a.position,
            shifts: [],
          });
        }
        const entry = map.get(a.userId);
        if (entry && !entry.shifts.some((sh) => sh.label === label)) {
          entry.shifts.push({ label, isNext });
        }
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.shifts.length - a.shifts.length)
      .slice(0, 4);
  }, [filteredServices]);

  const currentLabel = useMemo(() => {
  if (viewMode === 'weekly') {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) =>
      new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(d);
    return `${fmt(weekStart)} – ${fmt(end)}`;
  }
  if (viewMode === 'yearly') {
    return String(currentDate.getFullYear());
  }
  return new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);
}, [currentDate, viewMode, weekStart]);

  const handlePrev = () => {
  setCurrentDate((d) => {
    if (viewMode === 'weekly') {
      const nd = new Date(d);
      nd.setDate(nd.getDate() - 7);
      return nd;
    }
    if (viewMode === 'yearly') {
      return new Date(d.getFullYear() - 1, 0, 1);
    }
    return new Date(d.getFullYear(), d.getMonth() - 1, 1);
  });
};

const handleNext = () => {
  setCurrentDate((d) => {
    if (viewMode === 'weekly') {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + 7);
      return nd;
    }
    if (viewMode === 'yearly') {
      return new Date(d.getFullYear() + 1, 0, 1);
    }
    return new Date(d.getFullYear(), d.getMonth() + 1, 1);
  });
};

  const handleNewService = () => {
    setSelectedServiceId(null);
    setInitialDate(new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  };

  const handleAddServiceForDate = (date: string) => {
    setSelectedServiceId(null);
    setInitialDate(date);
    setModalOpen(true);
  };

  const handleServiceClick = (service: Service) => {
    setSelectedServiceId(service.id);
    setInitialDate(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedServiceId(null);
    setInitialDate(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['services'] });
    handleCloseModal();
  };

  const hasServices = filteredServices.length > 0;
  const totalActiveTechs = new Set(
    filteredServices.flatMap((s) => s.assignments.map((a) => a.userId))
  ).size;

  return (
    <div className="sound-schedule-body flex min-h-screen bg-[#F8FAFC] text-slate-800 antialiased">
     <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 pt-6 pb-28 transition-all md:px-8 md:pt-8 md:pb-28 lg:py-10 lg:pl-24 lg:pr-10">
        <SoundHeader
          churchName={user?.church?.name}
          currentLabel={currentLabel}
          filterMode={filterMode}
          viewMode={viewMode}
          onFilterChange={setFilterMode}
          onViewChange={setViewMode}
          onPrev={handlePrev}
          onNext={handleNext}
          onNewService={handleNewService}
        />

        <SoundMetrics services={filteredServices} />

        {isLoading ? (
  <div className="glass-sheen flex items-center justify-center rounded-3xl py-20">
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
  </div>
) : !hasServices && viewMode !== 'weekly' ? (
  <div className="glass-sheen flex flex-col items-center justify-center rounded-3xl py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
      <Users className="h-6 w-6 text-blue-600" />
    </div>
    <h3 className="mt-4 text-lg font-bold text-slate-900">
      Sin servicios este mes
    </h3>
    <p className="mt-1 max-w-sm text-sm text-slate-500">
      {filterMode === 'mine'
        ? 'No tienes turnos asignados este mes.'
        : 'Aún no hay servicios programados. Crea el primero para empezar.'}
    </p>
    {filterMode === 'all' && (
      <button
        onClick={handleNewService}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700"
      >
        + Crear servicio
      </button>
    )}
  </div>
) : viewMode === 'weekly' ? (
  <WeeklyView
    weekStart={weekStart}
    services={filteredServices}
    onServiceClick={handleServiceClick}
    onAddService={handleAddServiceForDate}
  />
) : viewMode === 'yearly' ? (
  <div className="glass-sheen flex flex-col items-center justify-center rounded-3xl py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
      <span className="material-symbols-outlined text-blue-600" style={{ fontSize: 28 }}>
        calendar_month
      </span>
    </div>
    <h3 className="mt-4 text-lg font-bold text-slate-900">
      Vista Anual — Próximamente
    </h3>
    <p className="mt-1 max-w-sm text-sm text-slate-500">
      Estamos construyendo la vista anual con resumen de meses y estadísticas
      de cobertura.
    </p>
  </div>
) : (
  <>
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-blue-600"
          style={{ fontSize: 20 }}
        >
          view_agenda
        </span>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Roster de Domingos —{' '}
          <span className="capitalize">{currentLabel}</span>
        </h2>
      </div>
      <span className="hidden rounded-full border border-slate-200/60 bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 sm:inline-block">
        Consola Principal DiGiCo SD12 • Waves SoundGrid • Red Dante Activa
      </span>
    </div>

    <section className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-2">
      {sundays.map((sunday) => (
        <SundayCard
          key={sunday.date.toISOString()}
          date={sunday.date}
          services={sunday.services}
          onServiceClick={handleServiceClick}
          onAddService={handleAddServiceForDate}
          isNextSunday={sunday.isNext}
        />
      ))}
    </section>

    <section className="glass-sheen rounded-3xl p-6 transition-all duration-300 md:p-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              badge
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Resumen de Servidores del Mes y Turnos Activos
            </h3>
            <p className="text-xs text-slate-500">
              ¿Cuándo sirve cada técnico? Registro de asignaciones
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            {totalActiveTechs} Técnicos Activos
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="text-xs font-medium text-emerald-600">
            Asistencia confirmada
          </span>
        </div>
      </div>

      {techniciansSummary.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-400">
          Aún no hay técnicos asignados este mes
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {techniciansSummary.map((tech, i) => (
            <TechnicianSummaryCard
              key={tech.id}
              name={tech.name}
              position={tech.position}
              shifts={tech.shifts}
              color={i % 2 === 0 ? 'blue' : 'emerald'}
            />
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-slate-400"
            style={{ fontSize: 18 }}
          >
            verified_user
          </span>
          <span>
            Sincronización con consola DiGiCo SD12 y protocolo Shure Axient
            Digital activa.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400">
            Última actualización: Hoy{' '}
            {new Date().toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 font-semibold text-blue-600 transition-colors hover:bg-blue-100">
            <Download className="h-4 w-4" />
            Exportar Reporte PDF
          </button>
        </div>
      </div>
    </section>
  </>
)}
      </main>

      <ServiceModal
        open={modalOpen}
        service={selectedService}
        initialDate={initialDate}
        serviceTypes={serviceTypes}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}