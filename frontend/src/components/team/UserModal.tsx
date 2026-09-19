import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { getApiError } from '@/lib/api';
import { createUser, updateUser } from '@/lib/users.api';
import type { User } from '@/types';

const userFormSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido').max(100),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72)
    .optional()
    .or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'LEADER', 'TECHNICIAN']),
  position: z.string().max(50).optional().or(z.literal('')),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const POSITIONS = [
  'FOH (Front of House)',
  'Monitores',
  'Streaming',
  'Multimedia',
  'Iluminación',
  'Guitarra',
  'Bajo',
  'Batería',
  'Teclado',
  'Voz Principal',
  'Coro',
];

export function UserModal({ open, user, onClose, onSuccess }: UserModalProps) {
  const isEditing = Boolean(user);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'TECHNICIAN',
      position: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          password: '',
          phone: user.phone ?? '',
          role: user.role as 'ADMIN' | 'LEADER' | 'TECHNICIAN',
          position: user.position ?? '',
        });
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          phone: '',
          role: 'TECHNICIAN',
          position: '',
        });
      }
    }
  }, [open, user, reset]);

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) =>
      createUser({
        name: data.name,
        email: data.email,
        password: data.password!,
        phone: data.phone || null,
        role: data.role,
        position: data.position || null,
      }),
    onSuccess: () => {
      toast.success('Técnico creado');
      onSuccess();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) =>
      updateUser(user!.id, {
        name: data.name,
        phone: data.phone || null,
        role: data.role,
        position: data.position || null,
      }),
    onSuccess: () => {
      toast.success('Técnico actualizado');
      onSuccess();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmit = (data: UserFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      if (!data.password || data.password.length < 8) {
        toast.error('La contraseña es requerida (mínimo 8 caracteres)');
        return;
      }
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="zoe-card w-full max-w-lg animate-fade-in !p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {isEditing ? 'Editar técnico' : 'Nuevo técnico'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground-subtle hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="zoe-label">Nombre completo</label>
              <input
                type="text"
                {...register('name')}
                placeholder="Juan Pérez"
                className="zoe-input"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="zoe-label">Teléfono</label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="+57 300 1234567"
                className="zoe-input"
              />
            </div>
          </div>

          <div>
            <label className="zoe-label">Email</label>
            <input
              type="email"
              {...register('email')}
              placeholder="juan@iglesia.com"
              disabled={isEditing}
              className="zoe-input disabled:cursor-not-allowed disabled:opacity-60"
            />
            {isEditing && (
              <p className="mt-1.5 text-xs text-foreground-subtle">
                El email no se puede cambiar
              </p>
            )}
            {errors.email && (
              <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>
            )}
          </div>

          {!isEditing && (
            <div>
              <label className="zoe-label">Contraseña temporal</label>
              <input
                type="password"
                {...register('password')}
                placeholder="Mínimo 8 caracteres"
                className="zoe-input"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="zoe-label">Rol</label>
              <select {...register('role')} className="zoe-input">
                <option value="TECHNICIAN">Técnico</option>
                <option value="LEADER">Líder</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div>
              <label className="zoe-label">Posición</label>
              <select {...register('position')} className="zoe-input">
                <option value="">Sin asignar</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
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
                'Crear técnico'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}