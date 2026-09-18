import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Loader2, Church, User as UserIcon } from 'lucide-react';
import { useAuth, type RegisterData } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const step1Schema = z.object({
  churchName: z.string().min(2, 'El nombre es requerido').max(100),
  churchSlug: z
    .string()
    .min(2, 'El identificador es requerido')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
});

const step2Schema = z.object({
  name: z.string().min(2, 'Tu nombre es requerido').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
  phone: z.string().max(20).optional(),
});

const fullSchema = step1Schema.merge(step2Schema);
type RegisterFormData = z.infer<typeof fullSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

export function Register() {
  const navigate = useNavigate();
  const { register: registerUser, loading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      churchName: '',
      churchSlug: '',
      name: '',
      email: '',
      password: '',
      phone: '',
    },
    mode: 'onChange',
  });


  // Auto-generar slug al escribir el nombre (solo si el usuario no lo ha tocado)
  const handleChurchNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('churchName', value);
    setValue('churchSlug', generateSlug(value), { shouldValidate: true });
  };

  const nextStep = async () => {
    const valid = await trigger(['churchName', 'churchSlug']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const payload: RegisterData = {
        churchName: data.churchName,
        churchSlug: data.churchSlug,
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      };
      await registerUser(payload);
      toast.success('¡Bienvenido a Zoe! Tu iglesia ha sido creada.');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la cuenta');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* LADO IZQUIERDO — BRANDING */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-12 lg:flex">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <span className="font-display text-2xl font-bold text-white">Z</span>
          </div>
          <span className="font-display text-2xl font-semibold text-white">Zoe</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-5xl font-semibold leading-tight text-white">
            Empieza a organizar tu iglesia hoy.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/80">
            14 días gratis. Sin tarjeta de crédito. Cancela cuando quieras.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          © 2026 Zoe · Hecho con ♥ para la iglesia
        </div>
      </div>

      {/* LADO DERECHO — FORMULARIO */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <span className="font-display text-3xl font-semibold text-foreground">Zoe</span>
          </div>

          {/* Indicador de paso */}
          <div className="mb-8 flex items-center gap-3">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
              step >= 1 ? 'bg-primary text-white' : 'bg-surface-elevated text-foreground-muted'
            )}>
              1
            </div>
            <div className={cn(
              'h-0.5 flex-1 rounded-full transition-colors',
              step >= 2 ? 'bg-primary' : 'bg-border'
            )} />
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
              step >= 2 ? 'bg-primary text-white' : 'bg-surface-elevated text-foreground-muted'
            )}>
              2
            </div>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-foreground">
              {step === 1 ? 'Cuéntanos de tu iglesia' : 'Crea tu cuenta'}
            </h1>
            <p className="mt-2 text-sm text-foreground-muted">
              {step === 1
                ? 'Empecemos por lo básico. Puedes cambiar esto después.'
                : 'Serás el administrador principal de esta iglesia.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="churchName" className="zoe-label">
                    Nombre de la iglesia
                  </label>
                  <div className="relative">
                    <Church className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                    <input
                      id="churchName"
                      type="text"
                      placeholder="Iglesia Centro de Avivamiento"
                      {...register('churchName')}
                      onChange={handleChurchNameChange}
                      className="zoe-input pl-10"
                    />
                  </div>
                  {errors.churchName && (
                    <p className="mt-1.5 text-xs text-danger">{errors.churchName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="churchSlug" className="zoe-label">
                    Identificador único
                  </label>
                  <input
                    id="churchSlug"
                    type="text"
                    placeholder="iglesia-avivamiento"
                    {...register('churchSlug')}
                    className="zoe-input"
                  />
                  <p className="mt-1.5 text-xs text-foreground-subtle">
                    Se usará en tu URL: <span className="font-mono">zoe.app/{watch('churchSlug') || 'tu-iglesia'}</span>
                  </p>
                  {errors.churchSlug && (
                    <p className="mt-1.5 text-xs text-danger">{errors.churchSlug.message}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="zoe-btn-primary w-full"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label htmlFor="name" className="zoe-label">
                    Tu nombre completo
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                    <input
                      id="name"
                      type="text"
                      placeholder="Kevin Gómez"
                      {...register('name')}
                      className="zoe-input pl-10"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="zoe-label">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@iglesia.com"
                    {...register('email')}
                    className="zoe-input"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="zoe-label">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    {...register('password')}
                    className="zoe-input"
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-danger">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="zoe-label">
                    Teléfono <span className="text-foreground-subtle">(opcional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+57 300 1234567"
                    {...register('phone')}
                    className="zoe-input"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="zoe-btn-secondary flex-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="zoe-btn-primary flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        Crear iglesia
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-8 text-center text-sm text-foreground-muted">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}