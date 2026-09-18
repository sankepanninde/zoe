import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import { Plus, Calendar as CalendarIcon, CheckCircle2, Clock, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { listServices, listServiceTypes } from '@/lib/services.api';
import { ServiceModal } from '@/components/calendar/ServiceModal';
import type { Service } from '@/types';
import { cn } from '@/lib/utils';

export function Calendar() {
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [initialDate, setInitialDate] = useState<string | null>(null);
  const [filterTypeId, setFilterTypeId] = useState<string>('');

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: listServiceTypes,
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => listServices(),
  });

  const filteredServices = useMemo(() => {
    if (!filterTypeId) return services;
    return services.filter((s) => s.serviceTypeId === filterTypeId);
  }, [services, filterTypeId]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = filteredServices.filter((s) => new Date(s.date) >= today);
    const confirmed = filteredServices.filter((s) => s.status === 'CONFIRMED');
    const pending = filteredServices.filter((s) => s.status === 'PENDING');
    return {
      total: filteredServices.length,
      upcoming: upcoming.length,
      confirmed: confirmed.length,
      pending: pending.length,
    };
  }, [filteredServices]);

  const events: EventInput[] = useMemo(
  () =>
    filteredServices.map((s) => ({
      id: s.id,
      title: s.title ? `${s.serviceType.name} · ${s.title}` : s.serviceType.name,
      start: `${s.date.split('T')[0]}T${s.startTime}:00`,
      end: `${s.date.split('T')[0]}T${s.endTime}:00`,
      backgroundColor: s.serviceType.color,
      borderColor: s.serviceType.color,
      textColor: '#ffffff',
      extendedProps: { service: s, icon: s.serviceType.icon },
    })),
  [filteredServices]
);

  const handleDateSelect = (arg: DateSelectArg) => {
    setSelectedService(null);
    setInitialDate(arg.startStr.slice(0, 10));
    setModalOpen(true);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const svc = arg.event.extendedProps.service as Service;
    setSelectedService(svc);
    setInitialDate(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedService(null);
    setInitialDate(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['services'] });
    handleCloseModal();
  };

  const renderEventContent = (arg: EventContentArg) => {
  const icon = arg.event.extendedProps.icon as string | undefined;
  const service = arg.event.extendedProps.service as Service;
  const assignedCount = service.assignments?.length ?? 0;
  const confirmedCount =
    service.assignments?.filter((a) => a.status === 'CONFIRMED').length ?? 0;

  return (
    <div className="flex w-full items-center gap-1 overflow-hidden px-1.5">
      {icon && <span className="shrink-0 text-[10px] leading-none">{icon}</span>}
      {arg.timeText && (
        <span className="shrink-0 text-[10px] font-bold tabular-nums">
          {arg.timeText}
        </span>
      )}
      <span className="truncate text-[11px] font-semibold leading-tight">
        {arg.event.title}
      </span>
    </div>
  );
};

  return (
    <AppLayout title="Cronograma" subtitle="Servicios y asignaciones del equipo">
      <div className="flex h-full flex-col gap-4 p-6">
        {/* Stats compactas */}
        <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={CalendarIcon}
            label="Servicios"
            value={stats.total}
            color="primary"
          />
          <StatCard icon={Clock} label="Próximos" value={stats.upcoming} color="warning" />
          <StatCard
            icon={CheckCircle2}
            label="Confirmados"
            value={stats.confirmed}
            color="success"
          />
          <StatCard icon={Clock} label="Pendientes" value={stats.pending} color="muted" />
        </div>

        {/* Barra de acciones */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle" />
              <select
                value={filterTypeId}
                onChange={(e) => setFilterTypeId(e.target.value)}
                className="zoe-filter-select pl-9"
              >
                <option value="">Todos los tipos</option>
                {serviceTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              {serviceTypes.slice(0, 4).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilterTypeId(filterTypeId === t.id ? '' : t.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                    filterTypeId === t.id
                      ? 'border-transparent text-white'
                      : 'border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground'
                  )}
                  style={filterTypeId === t.id ? { backgroundColor: t.color } : undefined}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: filterTypeId === t.id ? '#ffffff' : t.color,
                    }}
                  />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedService(null);
              setInitialDate(new Date().toISOString().slice(0, 10));
              setModalOpen(true);
            }}
            className="zoe-btn-primary"
          >
            <Plus className="h-4 w-4" />
            Nuevo servicio
          </button>
        </div>

        {/* Calendario — ocupa el espacio restante */}
        <div className="zoe-card zoe-calendar min-h-0 flex-1 animate-fade-in overflow-hidden !p-4">
          {isLoading ? (
            <CalendarSkeleton />
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={esLocale}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listMonth',
              }}
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                list: 'Lista',
              }}
              events={events}
              eventContent={renderEventContent}
              editable={false}
              selectable
              selectMirror
              dayMaxEvents={3}
              weekends
              firstDay={1}
              height="100%"
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              eventDisplay="block"
              fixedWeekCount={false}
              showNonCurrentDates={true}
            />
          )}
        </div>
      </div>

      <ServiceModal
        open={modalOpen}
        service={selectedService}
        initialDate={initialDate}
        serviceTypes={serviceTypes}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </AppLayout>
  );
}

// ===========================================
// COMPONENTES AUXILIARES
// ===========================================

interface StatCardProps {
  icon: typeof CalendarIcon;
  label: string;
  value: number;
  color: 'primary' | 'success' | 'warning' | 'muted';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorStyles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    muted: 'bg-foreground-muted/10 text-foreground-muted',
  };

  return (
    <div className="zoe-card !p-3.5 transition-all hover:shadow-glow">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            colorStyles[color]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
            {label}
          </p>
          <p className="font-display text-xl font-semibold leading-tight tabular-nums text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-10 w-32 animate-pulse rounded-xl bg-surface-elevated" />
        <div className="h-10 w-56 animate-pulse rounded-xl bg-surface-elevated" />
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-elevated" />
      </div>
      <div className="grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-xl bg-border">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`h-${i}`} className="h-10 animate-pulse bg-surface-elevated" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={`d-${i}`} className="animate-pulse bg-surface" />
        ))}
      </div>
    </div>
  );
}