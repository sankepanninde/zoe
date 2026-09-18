import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/stores/auth.store';
import { getApiError } from '@/lib/api';

const churchSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
});

type ChurchForm = z.infer<typeof churchSchema>;

export function Settings() {
  const { user, updateChurch } = useAuth();
  const church = user?.church;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ChurchForm>({
    resolver: zodResolver(churchSchema),
    defaultValues: {
      name: church?.name ?? '',
      phone: church?.phone ?? '',
      email: church?.email ?? '',
      address: church?.address ?? '',
    },
  });

  const onSubmit = async (data: ChurchForm) => {
    setSaving(true);
    try {
      await updateChurch({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
      });
      toast.success('Iglesia actualizada correctamente');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Ajustes" subtitle="Configuración de tu iglesia">
      <div className="space-y-6">
        <div className="zoe-card">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Información de la iglesia
          </h3>
          <p className="mt-1 text-sm text-foreground-muted">
            Esta información aparece en tu app y en las notificaciones.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div>
              <label htmlFor="name" className="zoe-label">
                Nombre de la iglesia
              </label>
              <input id="name" type="text" {...register('name')} className="zoe-input" />
              {errors.name && (
                <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="phone" className="zoe-label">
                  Teléfono
                </label>
                <input id="phone" type="tel" {...register('phone')} className="zoe-input" />
              </div>
              <div>
                <label htmlFor="email" className="zoe-label">
                  Email de contacto
                </label>
                <input id="email" type="email" {...register('email')} className="zoe-input" />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="zoe-label">
                Dirección
              </label>
              <input id="address" type="text" {...register('address')} className="zoe-input" />
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="zoe-btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}