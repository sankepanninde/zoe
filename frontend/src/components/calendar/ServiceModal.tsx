import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  Trash2,
  X,
  Clock,
  Sliders,
  Hash,
  Link as LinkIcon,
} from 'lucide-react';
import { getApiError } from '@/lib/api';
import {
  createService,
  updateService,
  deleteService,
} from '@/lib/services.api';
import { AssignmentsSection } from './AssignmentsSection';
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
    soundCheckTime: z.string().optional().or(z.literal('')),
    sceneName: z.string().max(100).optional().or(z.literal('')),
    patchName: z.string().max(100).optional().or(z.literal('')),
    inputListCount: z.coerce.number().int().positive().max(500).optional().or(z.literal(0)),
    setlistUrl: z.string().url('URL inválida').optional().or(z.literal('')),
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
      startTime: '09:00',
      endTime: '11:00',
      location: '',
      notes: '',
      soundCheckTime: '',
      sceneName: '',
      patchName: '',
      inputListCount: 24,
      setlistUrl: '',
    },
  });

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
          soundCheckTime: service.soundCheckTime ?? '',
          sceneName: service.sceneName ?? '',
          patchName: service.patchName ?? '',
          inputListCount: service.inputListCount ?? 24,
          setlistUrl: service.setlistUrl ?? '',
        });
      } else {
        reset({
          serviceTypeId: serviceTypes[0]?.id ?? '',
          title: '',
          date: initialDate ?? new Date().toISOString().slice(0, 10),
          startTime: '09:00',
          endTime: '11:00',
          location: 'Auditorio Principal',
          notes: '',
          soundCheckTime: '',
          sceneName: '',
          patchName: '',
          inputListCount: 24,
          setlistUrl: '',
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
        soundCheckTime: data.soundCheckTime || null,
        sceneName: data.sceneName || null,
        patchName: data.patchName || null,
        inputListCount: data.inputListCount || null,
        setlistUrl: data.setlistUrl || null,
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
        soundCheckTime: data.soundCheckTime || null,
        sceneName: data.sceneName || null,
        patchName: data.patchName || null,
        inputListCount: data.inputListCount || null,
        setlistUrl: data.setlistUrl || null,
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
    if (
      !window.confirm(
        '¿Eliminar este servicio? Se borrarán también todas las asignaciones.'
      )
    )
      return;
    deleteMutation.mutate();
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-fade-in">
        {/* Header sticky */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {isEditing ? 'Editar servicio' : 'Nuevo servicio'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground-subtle transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario con scroll */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
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
                <p className="mt-1.5 text-xs text-danger">
                  {errors.serviceTypeId.message}
                </p>
              )}
            </div>

            {/* Título */}
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
            </div>

            {/* Fecha */}
            <div>
              <label className="zoe-label">Fecha</label>
              <input type="date" {...register('date')} className="zoe-input" />
              {errors.date && (
                <p className="mt-1.5 text-xs text-danger">{errors.date.message}</p>
              )}
            </div>

            {/* Horas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="zoe-label">Hora inicio</label>
                <input type="time" {...register('startTime')} className="zoe-input" />
                {errors.startTime && (
                  <p className="mt-1.5 text-xs text-danger">
                    {errors.startTime.message}
                  </p>
                )}
              </div>
              <div>
                <label className="zoe-label">Hora fin</label>
                <input type="time" {...register('endTime')} className="zoe-input" />
                {errors.endTime && (
                  <p className="mt-1.5 text-xs text-danger">
                    {errors.endTime.message}
                  </p>
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
                placeholder="Auditorio Principal"
                className="zoe-input"
              />
            </div>

            {/* Campos técnicos */}
            <div className="rounded-xl border border-primary-200/40 bg-primary-50/30 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-700">
                <Sliders className="h-3.5 w-3.5" />
                Detalles técnicos de sonido
              </h4>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="zoe-label !text-xs">
                    <Clock className="mr-1 inline h-3 w-3" />
                    Prueba de sonido
                  </label>
                  <input
                    type="time"
                    {...register('soundCheckTime')}
                    className="zoe-input"
                  />
                </div>

                <div>
                  <label className="zoe-label !text-xs">
                    <Hash className="mr-1 inline h-3 w-3" />
                    Input List (canales)
                  </label>
                  <input
                    type="number"
                    {...register('inputListCount')}
                    placeholder="24"
                    className="zoe-input"
                  />
                </div>

                <div>
                  <label className="zoe-label !text-xs">Nombre de escena</label>
                  <input
                    type="text"
                    {...register('sceneName')}
                    placeholder="SD12_Culto_Main"
                    className="zoe-input"
                  />
                </div>

                <div>
                  <label className="zoe-label !text-xs">Patch / Stagebox</label>
                  <input
                    type="text"
                    {...register('patchName')}
                    placeholder="Stagebox A"
                    className="zoe-input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="zoe-label !text-xs">
                    <LinkIcon className="mr-1 inline h-3 w-3" />
                    URL del Setlist (opcional)
                  </label>
                  <input
                    type="url"
                    {...register('setlistUrl')}
                    placeholder="https://docs.google.com/..."
                    className="zoe-input"
                  />
                  {errors.setlistUrl && (
                    <p className="mt-1.5 text-xs text-danger">
                      {errors.setlistUrl.message}
                    </p>
                  )}
                </div>
              </div>
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

            {/* Asignaciones */}
            {isEditing && service && (
              <AssignmentsSection service={service} onUpdate={() => {}} />
            )}
          </div>

          {/* Footer sticky */}
          <div className="flex shrink-0 flex-col-reverse justify-between gap-3 border-t border-border bg-surface px-6 py-4 sm:flex-row">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Eliminar servicio
                  </>
                )}
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
              <button
                type="submit"
                className="zoe-btn-primary"
                disabled={isLoading}
              >
                {isLoading && !deleteMutation.isPending ? (
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