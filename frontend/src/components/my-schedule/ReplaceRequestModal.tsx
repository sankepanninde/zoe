import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Service } from '@/types';

interface ReplaceRequestModalProps {
  open: boolean;
  service: Service;
  onClose: () => void;
}

const REASONS = [
  'Viaje fuera de la ciudad',
  'Compromiso familiar',
  'Motivo de salud',
  'Compromiso laboral',
  'Otro (escribe abajo)',
];

export function ReplaceRequestModal({
  open,
  service,
  onClose,
}: ReplaceRequestModalProps) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    const finalReason =
      reason === 'Otro (escribe abajo)' ? customReason : reason;

    if (!finalReason.trim()) {
      toast.error('Selecciona o escribe un motivo');
      return;
    }

    // TODO: Fase 2 - enviar notificación al líder vía backend
    toast.success('Solicitud enviada al líder del ministerio');
    setReason('');
    setCustomReason('');
    onClose();
  };

  const fullDate = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(service.date));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-panel w-full max-w-md rounded-3xl p-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            Solicitar Reemplazo
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info del servicio */}
        <p className="mb-4 text-xs text-slate-500">
          Servicio:{' '}
          <strong className="capitalize text-slate-700">{fullDate}</strong> •{' '}
          {service.startTime} hrs
        </p>

        {/* Motivos */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Motivo
          </label>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200/60 bg-white/60 px-3 py-2 transition-colors hover:bg-white"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-3.5 w-3.5 accent-blue-600"
                />
                <span className="text-xs font-medium text-slate-700">{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Motivo personalizado */}
        {reason === 'Otro (escribe abajo)' && (
          <div className="mb-4">
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Describe el motivo..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-white/60"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700"
          >
            <Send className="h-3.5 w-3.5" />
            Enviar Solicitud
          </button>
        </div>
      </div>
    </div>
  );
}