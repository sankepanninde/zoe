import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Lock, ShieldAlert } from 'lucide-react';
import { api, getApiError } from '@/lib/api';
import { useAuth } from '@/stores/auth.store';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Escribe la contraseña temporal que te dieron'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres').max(72),
    confirmPassword: z.string().min(8, 'Confirma la contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva debe ser distinta a la actual',
    path: ['newPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export function MustChangePasswordModal() {
  const { user, logout } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      await api.patch('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: async () => {
      toast.success('¡Contraseña actualizada! Entra de nuevo con tu nueva contraseña.');
      // Cerrar sesión para que entre con la nueva
      setTimeout(async () => {
        await logout();
      }, 1500);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmit = (data: PasswordForm) => {
    mutation.mutate(data);
  };

  if (!user?.mustChangePassword) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg animate-fade-in rounded-3xl border border-slate-700 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning-light text-warning-dark">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                Cambia tu contraseña
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Por seguridad, debes crear tu propia contraseña antes de continuar.
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          <div>
            <label className="zoe-label">
              <Lock className="mr-1.5 inline h-3.5 w-3.5" />
              Contraseña temporal (la que te dieron)
            </label>
            <input
              type="password"
              {...register('currentPassword')}
              placeholder="Tu contraseña temporal"
              autoComplete="current-password"
              autoFocus
              className="zoe-input"
            />
            {errors.currentPassword && (
              <p className="mt-1.5 text-xs text-danger">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="zoe-label">Nueva contraseña</label>
            <input
              type="password"
              {...register('newPassword')}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className="zoe-input"
            />
            {errors.newPassword && (
              <p className="mt-1.5 text-xs text-danger">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="zoe-label">Confirmar nueva contraseña</label>
            <input
              type="password"
              {...register('confirmPassword')}
              placeholder="Repite la nueva contraseña"
              autoComplete="new-password"
              className="zoe-input"
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-danger">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-warning-light bg-warning-light/40 p-3">
            <p className="text-xs text-warning-dark">
              <strong>Nota:</strong> al cambiar tu contraseña, se cerrará la sesión.
              Vuelve a entrar con tu nueva contraseña.
            </p>
          </div>

          <div className="flex gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => logout()}
              disabled={mutation.isPending}
              className="zoe-btn-secondary flex-1"
            >
              Cerrar sesión
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="zoe-btn-primary flex-1"
            >
              {mutation.isPending ? (
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
  );
}