import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Trash2, X } from 'lucide-react';
import { getApiError } from '@/lib/api';
import {
  createService,
  updateService,
  deleteService,
} from '@/lib/services.api';
import type { Service, ServiceType } from '@/types';

const serviceFormSchema = z
  .object({
    serviceTypeId: z.string().min(1, 'Selecciona un tipo de servicio'),
    title: z.string().max(120).optional().or(z.literal('')),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
    location: z.string().max(100).optional().or(z.literal('')),
    notes: z.string().max(500).optional().or(z.literal('')),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'La hora de fin debe ser mayor a la de inicio',
    path: ['endTime'],
  });

type ServiceFormData = z.infer<typeof serviceFormSchema>;

interface ServiceModalProps {
  open: boolean;
  service: Service | null;
  initialDate: string | null;
  serviceTypes: ServiceType[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ServiceModal({
  open,
  service,
  initialDate,
  serviceTypes,
  onClose,
  onSuccess,
}: ServiceModalProps) {
  const isEditing = Boolean(service);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      serviceTypeId: '',
      title: '',
      date: '',
      startTime: '19:00',
      endTime: '21:00',
      location: '',
      notes: '',
    },
  });

  // Resetear el formulario al abrir/cerrar
  useEffect(() => {
    if (open) {
      if (service) {
        reset({
          serviceTypeId: service.serviceTypeId,
          title: service.title ?? '',
          date: service.date.split('T')[0],
          startTime: service.startTime,
          endTime: service.endTime,
          location: service.location ?? '',
          notes: service.notes ?? '',
        });
      } else {
        reset({
          serviceTypeId: serviceTypes[0]?.id ?? '',
          title: '',
          date: initialDate ?? new Date().toISOString().slice(0, 10),
          startTime: '19:00',
          endTime: '21:00',
          location: '',
          notes: '',
        });
      }
    }
  }, [open, service, initialDate, serviceTypes, reset]);

  const createMutation = useMutation({
    mutationFn: (data: ServiceFormData) =>
      createService({
        serviceTypeId: data.serviceTypeId,
        title: data.title || null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location || null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      toast.success('Servicio creado');
      onSuccess();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ServiceFormData) =>
      updateService(service!.id, {
        serviceTypeId: data.serviceTypeId,
        title: data.title || null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location || null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      toast.success('Servicio actualizado');
      onSuccess();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteService(service!.id),
    onSuccess: () => {
      toast.success('Servicio eliminado');
      onSuccess();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmit = (data: ServiceFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (!service) return;
    if (!confirm('¿Eliminar este servicio? Esta acción no se puede deshacer.')) return;
    deleteMutation.mutate();
  };

  const isLoading =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="zoe-card w-full max-w-lg animate-fade-in !p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {isEditing ? 'Editar servicio' : 'Nuevo servicio'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground-subtle hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          {/* Tipo de servicio */}
          <div>
            <label className="zoe-label">Tipo de servicio</label>
            <select {...register('serviceTypeId')} className="zoe-input">
              <option value="">Selecciona...</option>
              {serviceTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
            {errors.serviceTypeId && (
              <p className="mt-1.5 text-xs text-danger">{errors.serviceTypeId.message}</p>
            )}
          </div>

          {/* Título opcional */}
          <div>
            <label className="zoe-label">
              Título <span className="text-foreground-subtle">(opcional)</span>
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="Ej: Culto de jóvenes especial"
              className="zoe-input"
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-danger">{errors.title.message}</p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="zoe-label">Fecha</label>
            <input type="date" {...register('date')} className="zoe-input" />
            {errors.date && (
              <p className="mt-1.5 text-xs text-danger">{errors.date.message}</p>
            )}
          </div>

          {/* Hora inicio / fin */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="zoe-label">Hora inicio</label>
              <input type="time" {...register('startTime')} className="zoe-input" />
              {errors.startTime && (
                <p className="mt-1.5 text-xs text-danger">{errors.startTime.message}</p>
              )}
            </div>
            <div>
              <label className="zoe-label">Hora fin</label>
              <input type="time" {...register('endTime')} className="zoe-input" />
              {errors.endTime && (
                <p className="mt-1.5 text-xs text-danger">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className="zoe-label">
              Ubicación <span className="text-foreground-subtle">(opcional)</span>
            </label>
            <input
              type="text"
              {...register('location')}
              placeholder="Sede Principal"
              className="zoe-input"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="zoe-label">
              Notas <span className="text-foreground-subtle">(opcional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Notas internas del servicio"
              className="zoe-input resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between gap-3 border-t border-border pt-4">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="zoe-btn-ghost !text-danger hover:!bg-danger/10"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="zoe-btn-secondary"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button type="submit" className="zoe-btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : isEditing ? (
                  'Guardar cambios'
                ) : (
                  'Crear servicio'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}