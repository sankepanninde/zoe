import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, X, Crown, Check } from 'lucide-react';
import { getApiError } from '@/lib/api';
import { createUser, updateUser } from '@/lib/users.api';
import { listMinistries } from '@/lib/ministries.api';
import { cn } from '@/lib/utils';
import type { Ministry, User, UserMinistryInput } from '@/types';

// ===========================================
// SCHEMA BASE
// ===========================================

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
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ===========================================
// COMPONENTE
// ===========================================

export function UserModal({ open, user, onClose, onSuccess }: UserModalProps) {
  const isEditing = Boolean(user);

  // Estado para ministerios (fuera de react-hook-form por complejidad)
  const [selectedMinistries, setSelectedMinistries] = useState<
    Record<string, { isLeader: boolean; position: string }>
  >({});

  const { data: ministries = [], isLoading: loadingMinistries } = useQuery({
    queryKey: ['ministries'],
    queryFn: listMinistries,
    enabled: open,
  });

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
    },
  });

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          password: '',
          phone: user.phone ?? '',
          role: user.role as 'ADMIN' | 'LEADER' | 'TECHNICIAN',
        });
        // Pre-cargar ministerios del user
        const map: Record<string, { isLeader: boolean; position: string }> = {};
        (user.ministries ?? []).forEach((um) => {
          map[um.ministry.id] = {
            isLeader: um.isLeader,
            position: um.position ?? '',
          };
        });
        setSelectedMinistries(map);
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          phone: '',
          role: 'TECHNICIAN',
        });
        setSelectedMinistries({});
      }
    }
  }, [open, user, reset]);

  // ===========================================
  // TOGGLE MINISTERIO
  // ===========================================

  const toggleMinistry = (m: Ministry) => {
    setSelectedMinistries((prev) => {
      const next = { ...prev };
      if (next[m.id]) {
        delete next[m.id];
      } else {
        next[m.id] = { isLeader: false, position: '' };
      }
      return next;
    });
  };

  const toggleLeader = (ministryId: string) => {
    setSelectedMinistries((prev) => ({
      ...prev,
      [ministryId]: {
        ...prev[ministryId]!,
        isLeader: !prev[ministryId]!.isLeader,
      },
    }));
  };

  const setPosition = (ministryId: string, position: string) => {
    setSelectedMinistries((prev) => ({
      ...prev,
      [ministryId]: { ...prev[ministryId]!, position },
    }));
  };

  // ===========================================
  // MUTATIONS
  // ===========================================

  const buildMinistriesPayload = (): UserMinistryInput[] =>
    Object.entries(selectedMinistries).map(([ministryId, data]) => ({
      ministryId,
      isLeader: data.isLeader,
      position: data.position.trim() || null,
    }));

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) =>
      createUser({
        name: data.name,
        email: data.email,
        password: data.password!,
        phone: data.phone || null,
        role: data.role,
        ministries: buildMinistriesPayload(),
      }),
    onSuccess: () => {
      toast.success('Usuario creado');
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
        ministries: buildMinistriesPayload(),
      }),
    onSuccess: () => {
      toast.success('Usuario actualizado');
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
  const selectedCount = Object.keys(selectedMinistries).length;

  if (!open) return null;

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="zoe-card flex max-h-[90vh] w-full max-w-2xl animate-fade-in flex-col !p-0">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {isEditing ? 'Editar usuario' : 'Nuevo usuario'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground-subtle hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* FORM (scrollable) */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {/* Nombre + Teléfono */}
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
                  <p className="mt-1.5 text-xs text-danger">
                    {errors.name.message}
                  </p>
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

            {/* Email */}
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
                <p className="mt-1.5 text-xs text-danger">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Contraseña (solo crear) */}
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
                  <p className="mt-1.5 text-xs text-danger">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}

            {/* Rol */}
            <div>
              <label className="zoe-label">Rol</label>
              <select {...register('role')} className="zoe-input">
                <option value="TECHNICIAN">Técnico</option>
                <option value="LEADER">Líder</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {/* MINISTERIOS */}
            <div className="border-t border-border pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <label className="zoe-label !mb-0">
                    Ministerios
                  </label>
                  <p className="text-xs text-foreground-subtle">
                    Selecciona los ministerios donde sirve esta persona
                  </p>
                </div>
                {selectedCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {loadingMinistries ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : ministries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-surface-elevated/50 p-4 text-center text-xs text-foreground-subtle">
                  No hay ministerios configurados. Contacta al administrador.
                </p>
              ) : (
                <div className="space-y-2">
                  {ministries.map((m) => {
                    const selected = !!selectedMinistries[m.id];
                    const data = selectedMinistries[m.id];
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'rounded-xl border transition-all',
                          selected
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border bg-surface hover:border-border/80'
                        )}
                      >
                        {/* Row: checkbox + name */}
                        <button
                          type="button"
                          onClick={() => toggleMinistry(m)}
                          className="flex w-full items-center gap-3 p-3 text-left"
                        >
                          <div
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all',
                              selected
                                ? 'border-primary bg-primary text-white'
                                : 'border-border'
                            )}
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </div>

                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: m.color }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 16 }}
                            >
                              {m.icon || 'groups'}
                            </span>
                          </div>

                          <span className="flex-1 text-sm font-medium text-foreground">
                            {m.name}
                          </span>
                        </button>

                        {/* Expanded options cuando está seleccionado */}
                        {selected && data && (
                          <div className="space-y-2 border-t border-border/60 px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleLeader(m.id)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all',
                                  data.isLeader
                                    ? 'bg-warning-light text-warning-dark'
                                    : 'bg-surface-elevated text-foreground-subtle hover:bg-border'
                                )}
                              >
                                <Crown className="h-3 w-3" />
                                {data.isLeader ? 'Es líder' : 'Marcar como líder'}
                              </button>
                            </div>

                            <input
                              type="text"
                              value={data.position}
                              onChange={(e) => setPosition(m.id, e.target.value)}
                              placeholder="Posición (ej: FOH, Monitores, Streaming)"
                              className="zoe-input !py-1.5 !text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 border-t border-border bg-surface-elevated/30 px-6 py-4">
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
                'Crear usuario'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}