import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, getApiError } from '@/lib/api';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Mínimo 8 caracteres').max(72),
    confirmPassword: z.string().min(8, 'Confirma la contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      // Redirigir al login tras 2s
      setTimeout(() => navigate('/login'), 2000);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  // Token inválido
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-light">
            <AlertTriangle className="h-7 w-7 text-danger" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
            Link inválido
          </h2>
          <p className="mt-2 text-sm text-foreground-muted">
            El link de recuperación no es válido o está incompleto.
          </p>
          <Link to="/forgot-password" className="zoe-btn-primary mt-6 inline-flex">
            Solicitar un nuevo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Panel izquierdo con branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary-700 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20">
            <span className="font-display text-xl font-bold text-white">Z</span>
          </div>
          <span className="font-display text-2xl font-bold text-white">Zoe</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
            Crea tu nueva contraseña.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/80">
            Elige una contraseña segura que puedas recordar. Después podrás iniciar
            sesión normalmente.
          </p>
        </div>

        <div className="text-xs text-white/60">
          © {new Date().getFullYear()} Zoe · Sistema de gestión ministerial
        </div>

        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Panel derecho con el form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {mutation.isSuccess ? (
            // Estado: contraseña actualizada ✅
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
                ¡Contraseña actualizada!
              </h2>
              <p className="mt-2 text-sm text-foreground-muted">
                Te estamos redirigiendo al login...
              </p>
              <div className="mt-6">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          ) : (
            // Estado: formulario
            <>
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                  Nueva contraseña
                </h2>
                <p className="mt-2 text-sm text-foreground-muted">
                  Elige una contraseña segura de al menos 8 caracteres.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label htmlFor="newPassword" className="zoe-label">
                    <Lock className="mr-1.5 inline h-3.5 w-3.5" />
                    Nueva contraseña
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    autoFocus
                    {...register('newPassword')}
                    placeholder="Mínimo 8 caracteres"
                    className="zoe-input"
                  />
                  {errors.newPassword && (
                    <p className="mt-1.5 text-xs text-danger">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="zoe-label">
                    <Lock className="mr-1.5 inline h-3.5 w-3.5" />
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    placeholder="Repite la contraseña"
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
                    <strong>Recuerda:</strong> después de cambiarla, se cerrará la
                    sesión en otros dispositivos por seguridad.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="zoe-btn-primary w-full"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar contraseña'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-foreground-subtle">
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Volver al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}