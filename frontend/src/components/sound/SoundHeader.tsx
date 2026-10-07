import { Plus, ChevronLeft, ChevronRight, Share2, Eye } from 'lucide-react';

export type ViewMode = 'weekly' | 'monthly' | 'yearly';

interface SoundHeaderProps {
  churchName?: string;
  currentLabel: string;
  filterMode: 'all' | 'mine';
  viewMode: ViewMode;
  readOnly?: boolean;
  onFilterChange: (mode: 'all' | 'mine') => void;
  onViewChange: (mode: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onNewService: () => void;
}

export function SoundHeader({
  churchName,
  currentLabel,
  filterMode,
  viewMode,
  readOnly = false,
  onFilterChange,
  onViewChange,
  onPrev,
  onNext,
  onNewService,
}: SoundHeaderProps) {
  const views: { key: ViewMode; label: string }[] = [
    { key: 'weekly', label: 'Semanal' },
    { key: 'monthly', label: 'Mensual' },
    { key: 'yearly', label: 'Anual' },
  ];

  return (
    <header className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
            {churchName ?? 'Campus Central'} • {currentLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              volume_up
            </span>
            Consolas FOH, IEM & Microfonía
          </span>
          {readOnly && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              <Eye className="h-3 w-3" />
              Solo lectura
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Cronograma de Sonido
        </h1>
        <p className="mt-0.5 text-sm font-normal text-slate-500">
          {readOnly
            ? 'Vista de consulta — consulta quién sirve cada domingo'
            : 'Asignación técnica, consola, parches y disponibilidad'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
        {/* Filtro Ver Todos / Mis Turnos */}
        <div className="glass-sheen flex items-center gap-1 rounded-full p-1 shadow-sm">
          <button
            onClick={() => onFilterChange('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterMode === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ver Todos
          </button>
          <button
            onClick={() => onFilterChange('mine')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterMode === 'mine'
                ? 'bg-white font-semibold text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Mis Turnos
          </button>
        </div>

        {/* Vistas: Semanal / Mensual / Anual */}
        <div className="glass-sheen flex items-center gap-1 rounded-full p-1 shadow-sm">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => onViewChange(v.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === v.key
                  ? 'bg-white font-semibold text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Navegación */}
        <div className="glass-sheen flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600">
          <button
            onClick={onPrev}
            className="flex items-center transition-colors hover:text-blue-600"
            title="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[90px] text-center capitalize">{currentLabel}</span>
          <button
            onClick={onNext}
            className="flex items-center transition-colors hover:text-blue-600"
            title="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Compartir */}
        <button
          type="button"
          onClick={() => alert('Compartir roster próximamente')}
          className="glass-sheen hidden items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-white active:scale-95 sm:inline-flex"
        >
          <Share2 className="h-4 w-4 text-slate-500" />
          Compartir Roster
        </button>

        {/* CTA principal — SOLO si no es readOnly */}
        {!readOnly && (
          <button
            onClick={onNewService}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nuevo Servicio
          </button>
        )}
      </div>
    </header>
  );
}