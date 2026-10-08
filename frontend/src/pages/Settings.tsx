import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Save, Lock, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/stores/auth.store';
import { getApiError, api } from '@/lib/api';

// ===========================================
// SCHEMAS
// ===========================================

const churchSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
});

type ChurchForm = z.infer<typeof churchSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres').max(72),
    confirmPassword: z.string().min(8, 'Confirma la contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser distinta a la actual',
    path: ['newPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

// ===========================================
// COMPONENTE
// ===========================================

export function Settings() {
  const { user, updateChurch } = useAuth();
  const church = user?.church;

  // ============ FORM: IGLESIA ============
  const [savingChurch, setSavingChurch] = useState(false);

  const {
    register: registerChurch,
    handleSubmit: handleSubmitChurch,
    formState: { errors: churchErrors, isDirty: churchIsDirty },
  } = useForm<ChurchForm>({
    resolver: zodResolver(churchSchema),
    defaultValues: {
      name: church?.name ?? '',
      phone: church?.phone ?? '',
      email: church?.email ?? '',
      address: church?.address ?? '',
    },
  });

  const onSubmitChurch = async (data: ChurchForm) => {
    setSavingChurch(true);
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
      setSavingChurch(false);
    }
  };

  // ============ FORM: CONTRASEÑA ============
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      await api.patch('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast.success('Contraseña actualizada. Vuelve a iniciar sesión.');
      resetPasswordForm();
      // Dar tiempo al usuario de leer el mensaje antes de redirigir
      setTimeout(() => {
        localStorage.removeItem('zoe_access_token');
        window.location.href = '/login';
      }, 2000);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmitPassword = (data: PasswordForm) => {
    passwordMutation.mutate(data);
  };

  // ============ RENDER ============
  return (
    <AppLayout title="Ajustes" subtitle="Configuración de tu iglesia y cuenta">
      <div className="space-y-6">
        {/* ============================================ */}
        {/* IGLESIA */}
        {/* ============================================ */}
        <div className="zoe-card">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Información de la iglesia
          </h3>
          <p className="mt-1 text-sm text-foreground-muted">
            Esta información aparece en tu app y en las notificaciones.
          </p>

          <form onSubmit={handleSubmitChurch(onSubmitChurch)} className="mt-6 space-y-5">
            <div>
              <label htmlFor="name" className="zoe-label">
                Nombre de la iglesia
              </label>
              <input id="name" type="text" {...registerChurch('name')} className="zoe-input" />
              {churchErrors.name && (
                <p className="mt-1.5 text-xs text-danger">{churchErrors.name.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="phone" className="zoe-label">
                  Teléfono
                </label>
                <input id="phone" type="tel" {...registerChurch('phone')} className="zoe-input" />
              </div>
              <div>
                <label htmlFor="email" className="zoe-label">
                  Email de contacto
                </label>
                <input id="email" type="email" {...registerChurch('email')} className="zoe-input" />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="zoe-label">
                Dirección
              </label>
              <input id="address" type="text" {...registerChurch('address')} className="zoe-input" />
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <button
                type="submit"
                disabled={savingChurch || !churchIsDirty}
                className="zoe-btn-primary"
              >
                {savingChurch ? (
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

        {/* ============================================ */}
        {/* SEGURIDAD — CAMBIAR MI CONTRASEÑA */}
        {/* ============================================ */}
        <div className="zoe-card">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Seguridad de mi cuenta
              </h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Cambia tu contraseña regularmente para mantener tu cuenta segura.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="mt-6 space-y-5">
            <div>
              <label htmlFor="currentPassword" className="zoe-label">
                <Lock className="mr-1.5 inline h-3.5 w-3.5" />
                Contraseña actual
              </label>
              <input
                id="currentPassword"
                type="password"
                {...registerPassword('currentPassword')}
                placeholder="Tu contraseña actual"
                autoComplete="current-password"
                className="zoe-input"
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1.5 text-xs text-danger">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className="zoe-label">
                  Nueva contraseña
                </label>
                <input
                  id="newPassword"
                  type="password"
                  {...registerPassword('newPassword')}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  className="zoe-input"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1.5 text-xs text-danger">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="zoe-label">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword('confirmPassword')}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  className="zoe-input"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-danger">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-warning-light bg-warning-light/40 p-3">
              <p className="text-xs text-warning-dark">
                <strong>Importante:</strong> al cambiar tu contraseña, se cerrará la sesión
                en todos los demás dispositivos por seguridad.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="zoe-btn-primary"
              >
                {passwordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Cambiar contraseña
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