import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, X, Plus, Trash2 } from 'lucide-react';
import { getApiError } from '@/lib/api';
import {
  listRequirements,
  bulkUpsertRequirements,
  type RequirementInput,
} from '@/lib/services.api';
import type { ServiceType } from '@/types';

const PRESET_POSITIONS = [
  'FOH (Front of House)',
  'Monitores',
  'Streaming',
  'Multimedia',
  'Iluminación',
  'Voz Principal',
  'Guitarra',
  'Bajo',
  'Batería',
  'Teclado',
];

interface RequirementsModalProps {
  open: boolean;
  serviceType: ServiceType | null;
  onClose: () => void;
}

export function RequirementsModal({
  open,
  serviceType,
  onClose,
}: RequirementsModalProps) {
  const queryClient = useQueryClient();
  const [morning, setMorning] = useState<RequirementInput[]>([]);
  const [afternoon, setAfternoon] = useState<RequirementInput[]>([]);

  const { data: existing = [], isLoading } = useQuery({
    queryKey: ['position-requirements', serviceType?.id],
    queryFn: () => listRequirements(serviceType!.id),
    enabled: open && !!serviceType,
  });

  // Cargar los existentes al abrir
  useEffect(() => {
    if (!open) return;
    const m: RequirementInput[] = [];
    const a: RequirementInput[] = [];
    for (const r of existing) {
      const item = { position: r.position, count: r.count };
      if (r.shift === 'MORNING') m.push(item);
      else a.push(item);
    }
    setMorning(m);
    setAfternoon(a);
  }, [open, existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!serviceType) return;
      await bulkUpsertRequirements({
        serviceTypeId: serviceType.id,
        shift: 'MORNING',
        requirements: morning,
      });
      await bulkUpsertRequirements({
        serviceTypeId: serviceType.id,
        shift: 'AFTERNOON',
        requirements: afternoon,
      });
    },
    onSuccess: () => {
      toast.success('Requisitos guardados');
      queryClient.invalidateQueries({ queryKey: ['position-requirements'] });
      onClose();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (!open || !serviceType) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Requisitos de personal
            </h3>
            <p className="text-xs text-foreground-muted">
              {serviceType.icon} {serviceType.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground-subtle hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <ShiftEditor
                label="☀️ 1er Turno (Mañana)"
                description="Servicios que empiezan antes de las 2 PM"
                items={morning}
                onChange={setMorning}
              />

              <ShiftEditor
                label="🌙 2do Turno (Tarde)"
                description="Servicios que empiezan después de las 2 PM"
                items={afternoon}
                onChange={setAfternoon}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-surface px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="zoe-btn-secondary"
            disabled={saveMutation.isPending}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            className="zoe-btn-primary"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar requisitos'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// SUB-COMPONENTE: Editor por turno
// ===========================================

function ShiftEditor({
  label,
  description,
  items,
  onChange,
}: {
  label: string;
  description: string;
  items: RequirementInput[];
  onChange: (items: RequirementInput[]) => void;
}) {
  const [newPosition, setNewPosition] = useState('');

  const addItem = () => {
    const pos = newPosition || PRESET_POSITIONS[0]!;
    if (items.some((i) => i.position === pos)) {
      return;
    }
    onChange([...items, { position: pos, count: 1 }]);
    setNewPosition('');
  };

  const updateItem = (idx: number, updates: Partial<RequirementInput>) => {
    onChange(
      items.map((item, i) => (i === idx ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-2xl border border-border bg-surface-elevated/30 p-4">
      <div className="mb-3">
        <h4 className="font-semibold text-foreground">{label}</h4>
        <p className="text-xs text-foreground-muted">{description}</p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface/50 p-4 text-center text-xs text-foreground-subtle">
          Sin requisitos definidos para este turno
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2"
            >
              <select
                value={item.position}
                onChange={(e) => updateItem(idx, { position: e.target.value })}
                className="zoe-input !py-1.5 flex-1 text-sm"
              >
                {PRESET_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                max={20}
                value={item.count}
                onChange={(e) =>
                  updateItem(idx, { count: parseInt(e.target.value, 10) || 1 })
                }
                className="zoe-input !w-16 !py-1.5 text-center text-sm"
              />

              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <select
          value={newPosition || PRESET_POSITIONS[0]}
          onChange={(e) => setNewPosition(e.target.value)}
          className="zoe-input !py-1.5 flex-1 text-sm"
        >
          {PRESET_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir
        </button>
      </div>
    </div>
  );
}