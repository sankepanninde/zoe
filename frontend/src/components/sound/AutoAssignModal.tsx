import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, X, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getApiError } from '@/lib/api';
import { autoAssign, type AutoAssignResult } from '@/lib/services.api';

interface AutoAssignModalProps {
  open: boolean;
  year: number;
  month: number;
  monthName: string;
  onClose: () => void;
}

export function AutoAssignModal({
  open,
  year,
  month,
  monthName,
  onClose,
}: AutoAssignModalProps) {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<AutoAssignResult | null>(null);

  const previewMutation = useMutation({
    mutationFn: () => autoAssign({ year, month, dryRun: true }),
    onSuccess: (data) => setPreview(data),
    onError: (err) => toast.error(getApiError(err)),
  });

  const applyMutation = useMutation({
    mutationFn: () => autoAssign({ year, month, dryRun: false }),
    onSuccess: (data) => {
      toast.success(
        `✅ ${data.summary.assignmentsCreated} asignaciones creadas`
      );
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onClose();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Auto-asignar {monthName}
              </h3>
              <p className="text-xs text-foreground-muted">
                El sistema sugiere asignaciones respetando rotación y posiciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground-subtle hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!preview ? (
            // Estado inicial: botón para generar preview
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-12 w-12 text-violet-500" />
              <h4 className="mt-4 text-lg font-bold text-foreground">
                Generar propuesta
              </h4>
              <p className="mt-2 max-w-md text-sm text-foreground-muted">
                El sistema asignará técnicos a cada posición respetando:
                rotación justa, sus posiciones, y sin repetir en el mismo día.
                Solo llena vacantes — las asignaciones existentes se respetan.
              </p>
              <button
                onClick={() => previewMutation.mutate()}
                disabled={previewMutation.isPending}
                className="zoe-btn-primary mt-6"
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Ver propuesta
                  </>
                )}
              </button>
            </div>
          ) : (
            // Preview generado
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatBox
                  label="Servicios"
                  value={preview.summary.servicesProcessed}
                  tone="primary"
                />
                <StatBox
                  label="A asignar"
                  value={preview.summary.assignmentsCreated}
                  tone="violet"
                />
                <StatBox
                  label="Ya cubiertos"
                  value={preview.summary.positionsSkipped}
                  tone="emerald"
                />
                <StatBox
                  label="Sin candidatos"
                  value={preview.summary.positionsUnassigned}
                  tone="amber"
                />
              </div>

              {/* Preview por servicio */}
              <div className="space-y-3">
                {preview.preview.map((svc) => {
                  if (svc.assignments.length === 0 && svc.unassigned.length === 0) {
                    return null;
                  }
                  return (
                    <div
                      key={svc.serviceId}
                      className="rounded-xl border border-border bg-surface-elevated/30 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {svc.title ?? svc.serviceTypeName}
                          </p>
                          <p className="text-[11px] text-foreground-muted">
                            {new Date(svc.date + 'T00:00:00').toLocaleDateString(
                              'es-CO',
                              {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              }
                            )}{' '}
                            · {svc.startTime}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {svc.shift === 'MORNING' ? 'MAÑANA' : 'TARDE'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {svc.assignments.map((a, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="font-semibold text-foreground">
                              {a.position}
                            </span>
                            <span className="text-foreground-muted">→</span>
                            <span className="text-foreground">
                              {a.userName}
                            </span>
                          </div>
                        ))}
                        {svc.unassigned.map((u, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            <span className="font-semibold text-amber-700">
                              {u.position}
                            </span>
                            <span className="text-foreground-muted">
                              — {u.reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-surface px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="zoe-btn-secondary"
            disabled={applyMutation.isPending}
          >
            {preview ? 'Cerrar' : 'Cancelar'}
          </button>

          {preview && preview.summary.assignmentsCreated > 0 && (
            <button
              type="button"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
              className="zoe-btn-primary"
            >
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Aplicar {preview.summary.assignmentsCreated} asignaciones
                </>
              )}
            </button>
          )}

          {preview && preview.summary.assignmentsCreated === 0 && (
            <div className="text-xs text-foreground-muted">
              No hay asignaciones nuevas para crear
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// SUB-COMPONENTE: StatBox
// ===========================================

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'primary' | 'violet' | 'emerald' | 'amber';
}) {
  const tones = {
    primary: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className={`rounded-xl p-3 ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}