import { useConnection } from '@/stores/connection.store';

export function ColdStartBanner() {
  const isWakingUp = useConnection((s) => s.isWakingUp);

  if (!isWakingUp) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="mx-4 max-w-md animate-in zoom-in-95 rounded-3xl border border-white/80 bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Icono animado */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
            <div className="absolute inset-2 animate-pulse rounded-full bg-blue-500/30" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 26 }}
              >
                cloud_sync
              </span>
            </div>
          </div>

          {/* Título */}
          <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">
            Despertando el servidor...
          </h3>

          {/* Subtítulo */}
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Esto tarda unos segundos la primera vez del día.
            <br />
            En cuanto responda, todo irá rápido.
          </p>

          {/* Barra de progreso indeterminada */}
          <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400" />
          </div>

          {/* Nota pequeña */}
          <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Render · Servidor en frío
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}