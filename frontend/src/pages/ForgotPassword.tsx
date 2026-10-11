import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api, getApiError } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.post('/auth/forgot-password', { email: data.email });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

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
            Recupera tu acceso.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/80">
            Te enviaremos un link seguro a tu correo para que puedas crear una nueva
            contraseña en minutos.
          </p>
        </div>

        <div className="text-xs text-white/60">
          © {new Date().getFullYear()} Zoe · Sistema de gestión ministerial
        </div>

        {/* Blobs decorativos */}
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Panel derecho con el form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link
            to="/login"
            className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al inicio de sesión
          </Link>

          {mutation.isSuccess ? (
            // Estado: email enviado ✅
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
                Revisa tu correo
              </h2>
              <p className="mt-2 text-sm text-foreground-muted">
                Si el email existe, te enviamos un link para restablecer tu
                contraseña. Expira en 1 hora.
              </p>

              <div className="mt-6 rounded-2xl border border-border bg-surface-elevated/60 p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                  ¿No llega el correo?
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-foreground-muted">
                  <li>• Revisa la carpeta de spam o promociones</li>
                  <li>• Confirma que tu correo esté bien escrito</li>
                  <li>• Puedes intentarlo de nuevo en unos minutos</li>
                </ul>
              </div>

              <Link
                to="/login"
                className="zoe-btn-primary mt-6 inline-flex w-full items-center justify-center"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            // Estado: formulario
            <>
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                  ¿Olvidaste tu contraseña?
                </h2>
                <p className="mt-2 text-sm text-foreground-muted">
                  Escríbenos tu correo y te enviaremos un link para crear una
                  nueva contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label htmlFor="email" className="zoe-label">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      {...register('email')}
                      placeholder="tu@email.com"
                      className="zoe-input pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-danger">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="zoe-btn-primary w-full"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar link de recuperación'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-foreground-subtle">
                ¿Recordaste tu contraseña?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}