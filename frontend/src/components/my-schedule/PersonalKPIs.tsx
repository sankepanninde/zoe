interface PersonalKPIsProps {
  totalAssigned: number;
  compliance: number;
  frequency: string;
}

export function PersonalKPIs({
  totalAssigned,
  compliance,
  frequency,
}: PersonalKPIsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* KPI 1: Total Asignados */}
      <div className="glass-subpanel flex min-w-[120px] flex-col justify-center rounded-2xl px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Total Asignados
        </span>
        <span className="mt-0.5 text-lg font-bold text-blue-600">
          {totalAssigned} Turnos
        </span>
      </div>

      {/* KPI 2: Cumplimiento */}
      <div className="glass-subpanel flex min-w-[120px] flex-col justify-center rounded-2xl px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Cumplimiento
        </span>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              compliance >= 90
                ? 'bg-emerald-500'
                : compliance >= 70
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
          />
          <span className="text-lg font-bold text-slate-900">{compliance}%</span>
        </div>
      </div>

      {/* KPI 3: Frecuencia */}
      <div className="glass-subpanel flex min-w-[130px] flex-col justify-center rounded-2xl px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Frecuencia
        </span>
        <span className="mt-0.5 text-lg font-bold text-slate-900">
          {frequency}
        </span>
      </div>
    </div>
  );
}