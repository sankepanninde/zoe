import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/stores/auth.store';

const loginFormSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Bienvenido a Zoe');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ============================================
          LADO IZQUIERDO — BRANDING
          ============================================ */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-12 lg:flex">
        {/* Círculos decorativos */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        {/* Logo arriba */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <span className="font-display text-2xl font-bold text-white">Z</span>
            </div>
            <span className="font-display text-2xl font-semibold text-white">Zoe</span>
          </div>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-5xl font-semibold leading-tight text-white">
            Vida para tu iglesia.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/80">
            Organiza tu equipo, agenda tus servicios y sirve con excelencia desde un solo lugar.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-white/60">
          © 2026 Zoe · Hecho con ♥ para la iglesia
        </div>
      </div>

      {/* ============================================
          LADO DERECHO — FORMULARIO
          ============================================ */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo en móvil */}
          <div className="mb-10 lg:hidden">
            <span className="font-display text-3xl font-semibold text-foreground">Zoe</span>
          </div>

          {/* Encabezado */}
          <div className="mb-10">
            <h1 className="font-display text-4xl font-semibold text-foreground">
              Bienvenido de vuelta
            </h1>
            <p className="mt-3 text-foreground-muted">
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
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
                  placeholder="tu@iglesia.com"
                  {...register('email')}
                  className="zoe-input pl-10"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="zoe-label">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="mb-1.5 text-xs font-medium text-primary hover:underline"
                  onClick={() => toast.info('Función próximamente')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="zoe-input pl-10 pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted hover:text-foreground"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="zoe-btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Link a registro */}
          <div className="mt-8 text-center text-sm text-foreground-muted">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Crea tu iglesia
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}