import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { MyScheduleDock } from '@/components/my-schedule/MyScheduleDock';
import { YearlyMatrix } from '@/components/my-schedule/YearlyMatrix';
import { NextShiftCard } from '@/components/my-schedule/NextShiftCard';
import { ReplaceRequestModal } from '@/components/my-schedule/ReplaceRequestModal';
import { ServiceModal } from '@/components/calendar/ServiceModal';
import { listMyServices, listServiceTypes } from '@/lib/services.api';
import { useAuth } from '@/stores/auth.store';
import type { Service } from '@/types';

export function MySchedule() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [nextShiftService, setNextShiftService] = useState<Service | null>(null);

  const { data: myServices = [], isLoading, refetch } = useQuery({
    queryKey: ['services', 'me'],
    queryFn: () => listMyServices(),
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: listServiceTypes,
  });

  // KPIs personales
  const kpis = useMemo(() => {
    const thisYear = myServices.filter(
      (s) => new Date(s.date).getUTCFullYear() === year
    );

    const totalAssigned = thisYear.length;
    const confirmed = thisYear.filter((s) =>
      s.assignments.find(
        (a) => a.userId === user?.id && a.status === 'CONFIRMED'
      )
    ).length;

    const compliance =
      totalAssigned > 0 ? Math.round((confirmed / totalAssigned) * 100) : 100;

    return { totalAssigned, compliance };
  }, [myServices, year, user?.id]);

  // Próximo servicio
  const nextShift = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      myServices
        .filter((s) => new Date(s.date) >= today)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )[0] ?? null
    );
  }, [myServices]);

  const handleDayClick = (service: Service) => {
    setSelectedService(service);
    setServiceModalOpen(true);
  };

  const handleRequestReplace = () => {
    if (!nextShift) return;
    setNextShiftService(nextShift);
    setReplaceModalOpen(true);
  };

  const firstName = user?.name?.split(' ')[0] ?? 'Servidor';
  const churchName = user?.church?.name ?? 'Campus Central';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F8F9FF] text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Ambient Light Atmosphere */}
      <div className="ambient-glow pointer-events-none fixed inset-0 z-0" />
      <div className="pointer-events-none fixed -top-40 right-10 z-0 h-[600px] w-[600px] rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none fixed top-1/2 -left-32 z-0 h-[500px] w-[500px] rounded-full bg-blue-100/30 blur-3xl" />

      {/* Dock */}
      <MyScheduleDock />

      {/* Main */}
      <main className="relative z-10 mx-auto w-full max-w-[1580px] py-8 pr-4 pl-0 transition-all sm:pr-8 md:pl-28">
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        <header className="mb-6 pt-2">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              {/* Breadcrumb */}
              <div className="mb-1.5 flex items-center gap-2 text-xs font-medium tracking-wide text-slate-500">
                <span className="inline-flex items-center gap-1.5 font-medium text-blue-600">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}
                  >
                    church
                  </span>
                  {churchName}
                </span>
                <span className="text-slate-300">•</span>
                <span>Sonido & Producción</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-800">Autogestión</span>
              </div>

              {/* Título */}
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Mis Turnos & Calendario Inteligente
              </h1>
              <p className="mt-0.5 max-w-2xl text-sm text-slate-500">
                Hola <span className="font-semibold text-slate-800">{firstName}</span>, tu
                calendario anual adaptativo focalizado en días de servicio activo.
              </p>
            </div>

            {/* Controles derecha */}
            <div className="flex items-center gap-3 self-start lg:self-end">
              {/* Año */}
              <div className="glass-pill inline-flex items-center gap-1 rounded-full border border-white/80 px-2 py-1">
                <button
                  onClick={() => setYear((y) => y - 1)}
                  aria-label="Año anterior"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-sm font-semibold text-slate-800">
                  {year}
                </span>
                <button
                  onClick={() => setYear((y) => y + 1)}
                  aria-label="Año siguiente"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Sync */}
              <button
                type="button"
                className="glass-pill inline-flex items-center gap-1.5 rounded-full border border-white/90 px-3.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition-all hover:bg-white hover:text-blue-600"
              >
                <span
                  className="material-symbols-outlined text-blue-600"
                  style={{ fontSize: 16 }}
                >
                  sync
                </span>
                <span>Sincronizado hoy</span>
              </button>
            </div>
          </div>
        </header>

        {/* ============================================ */}
        {/* HERO: PRÓXIMO TURNO */}
        {/* ============================================ */}
        {isLoading ? (
          <div className="glass-card flex items-center justify-center rounded-2xl py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : nextShift && user?.id ? (
          <NextShiftCard
            service={nextShift}
            userId={user.id}
            onRefresh={() => refetch()}
            onRequestReplace={handleRequestReplace}
          />
        ) : (
          <div className="glass-card flex items-center justify-center rounded-2xl border border-white/95 px-5 py-4 text-sm text-slate-500">
            No tienes servicios próximos
          </div>
        )}

        {/* ============================================ */}
        {/* TOOLBAR: Filtros y Leyenda */}
        {/* ============================================ */}
        <section className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-3">
            {/* Switcher */}
            <div className="glass-pill inline-flex items-center rounded-full border border-white/80 p-1 shadow-sm">
              <button
                type="button"
                className="specular-glow inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-blue-600 transition-all"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
                Días de Servicio (Sáb/Dom)
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16 }}
                >
                  calendar_view_week
                </span>
                Semana Completa
              </button>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Mostrando fines de semana + servicios especiales
            </span>
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full border border-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-800">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-500/20" />
                <span>1.er Servicio</span>
              </span>
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full border border-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-800">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-500/20" />
                <span>2.º Servicio</span>
              </span>
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full border border-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span>Libre</span>
              </span>
            </div>

            <div className="mx-1 hidden h-5 w-px bg-slate-300/50 sm:block" />

            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-blue-50/60 px-3 py-1 text-[11px] font-medium text-slate-800">
              <span
                className="material-symbols-outlined text-blue-600"
                style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span>
                <strong>{kpis.totalAssigned} Turnos</strong> anuales • {kpis.compliance}% Asistencia
              </span>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* MATRIZ 12 MESES */}
        {/* ============================================ */}
        {isLoading ? (
          <div className="glass-card flex items-center justify-center rounded-3xl py-20">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : myServices.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center rounded-3xl py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              Aún no tienes asignaciones
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Cuando el líder de tu ministerio te asigne a un servicio,
              aparecerá aquí.
            </p>
          </div>
        ) : (
          <YearlyMatrix
            year={year}
            services={myServices}
            userId={user?.id ?? ''}
            onDayClick={handleDayClick}
          />
        )}

        {/* ============================================ */}
        {/* FOOTER */}
        {/* ============================================ */}
        <footer className="glass-card mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/90 p-4 shadow-sm sm:p-5 md:flex-row">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20 }}
              >
                swap_horizontal_circle
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                ¿Necesitas permutar o ceder un turno?
              </p>
              <p className="text-xs text-slate-500">
                Puedes solicitar un reemplazo con los otros operadores de sala.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRequestReplace}
              type="button"
              className="glass-pill inline-flex items-center gap-2 rounded-full border border-white/90 px-4 py-2 text-xs font-medium text-slate-800 shadow-sm transition-all hover:bg-white hover:text-blue-600"
            >
              <span
                className="material-symbols-outlined text-blue-600"
                style={{ fontSize: 18 }}
              >
                published_with_changes
              </span>
              <span>Solicitar Reemplazo</span>
            </button>
            <button
              type="button"
              className="glass-pill inline-flex items-center gap-2 rounded-full border border-white/90 px-4 py-2 text-xs font-medium text-slate-800 shadow-sm transition-all hover:bg-white hover:text-blue-600"
            >
              <span
                className="material-symbols-outlined text-emerald-600"
                style={{ fontSize: 18 }}
              >
                calendar_add_on
              </span>
              <span>Sincronizar Google / Apple (.ics)</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Modales */}
      {nextShiftService && (
        <ReplaceRequestModal
          open={replaceModalOpen}
          service={nextShiftService}
          onClose={() => {
            setReplaceModalOpen(false);
            setNextShiftService(null);
          }}
        />
      )}

      <ServiceModal
        open={serviceModalOpen}
        service={selectedService}
        initialDate={null}
        serviceTypes={serviceTypes}
        onClose={() => {
          setServiceModalOpen(false);
          setSelectedService(null);
        }}
        onSuccess={() => {
          refetch();
          setServiceModalOpen(false);
          setSelectedService(null);
        }}
      />
    </div>
  );
}