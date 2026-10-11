import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  Lock,
  Shield,
  User as UserIcon,
  Crown,
  Church,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/stores/auth.store';
import { getApiError, api } from '@/lib/api';
import { updateOwnProfile } from '@/lib/users.api';

// ===========================================
// SCHEMAS
// ===========================================

const profileSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

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
    message: 'La nueva debe ser distinta a la actual',
    path: ['newPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

// ===========================================
// COMPONENTE
// ===========================================

export function Settings() {
  const { user, updateChurch } = useAuth();
  const church = user?.church;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const userMinistries = user?.ministries ?? [];

  // ============ FORM: PERFIL ============
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfileForm,
    formState: { errors: profileErrors, isDirty: profileIsDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      updateOwnProfile({
        name: data.name,
        phone: data.phone || null,
      }),
    onSuccess: (updatedUser) => {
      toast.success('Perfil actualizado');
      // Actualizamos el store con el usuario actualizado
      useAuth.setState((state) => ({ user: { ...state.user!, ...updatedUser } }));
      resetProfileForm({
        name: updatedUser.name,
        phone: updatedUser.phone ?? '',
      });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmitProfile = (data: ProfileForm) => {
    profileMutation.mutate(data);
  };

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
      toast.success('Iglesia actualizada');
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
      setTimeout(() => {
        localStorage.removeItem('zoe_access_token');
        window.location.href = '/login';
      }, 2000);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // ============ RENDER ============
  return (
    <AppLayout title="Ajustes" subtitle="Configuración de tu cuenta">
      <div className="space-y-6">
        {/* ============================================ */}
        {/* MI PERFIL */}
        {/* ============================================ */}
        <div className="zoe-card">
          <div className="flex items-start gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Mi Perfil
              </h3>
              <p className="mt-0.5 text-sm text-foreground-muted">
                Información básica de tu cuenta
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmitProfile(onSubmitProfile)}
            className="mt-5 space-y-5"
          >
            <div>
              <label htmlFor="profile-name" className="zoe-label">
                Nombre completo
              </label>
              <input
                id="profile-name"
                type="text"
                {...registerProfile('name')}
                className="zoe-input"
              />
              {profileErrors.name && (
                <p className="mt-1.5 text-xs text-danger">
                  {profileErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="profile-phone" className="zoe-label">
                <Phone className="mr-1.5 inline h-3.5 w-3.5" />
                Teléfono
              </label>
              <input
                id="profile-phone"
                type="tel"
                {...registerProfile('phone')}
                placeholder="+57 300 1234567"
                className="zoe-input"
              />
              {profileErrors.phone && (
                <p className="mt-1.5 text-xs text-danger">
                  {profileErrors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="zoe-label">
                <Mail className="mr-1.5 inline h-3.5 w-3.5" />
                Correo electrónico
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="zoe-input disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:opacity-70"
              />
              <p className="mt-1.5 text-xs text-foreground-subtle">
                Para cambiar tu correo, contacta a un administrador.
              </p>
            </div>

            <div className="flex justify-end border-t border-border pt-5">
              <button
                type="submit"
                disabled={profileMutation.isPending || !profileIsDirty}
                className="zoe-btn-primary"
              >
                {profileMutation.isPending ? (
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
        {/* MIS MINISTERIOS */}
        {/* ============================================ */}
        <div className="zoe-card">
          <div className="flex items-start gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Mis Ministerios
              </h3>
              <p className="mt-0.5 text-sm text-foreground-muted">
                Ministerios donde sirves en la iglesia
              </p>
            </div>
          </div>

          {userMinistries.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-surface-elevated/40 p-4 text-center text-sm text-foreground-muted">
              Aún no estás asignado a ningún ministerio. Habla con tu líder.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {userMinistries.map((um) => (
                <div
                  key={um.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated/30 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: um.ministry.color }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 20 }}
                      >
                        {um.ministry.icon || 'groups'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-foreground">
                          {um.ministry.name}
                        </p>
                        {um.isLeader && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-dark">
                            <Crown className="h-2.5 w-2.5" />
                            Líder
                          </span>
                        )}
                      </div>
                      {um.position && (
                        <p className="mt-0.5 text-xs text-foreground-muted">
                          {um.position}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* CONFIGURACIÓN DE LA IGLESIA (solo admins) */}
        {/* ============================================ */}
        {isAdmin && (
          <div className="zoe-card">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Church className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Información de la Iglesia
                </h3>
                <p className="mt-0.5 text-sm text-foreground-muted">
                  Esta información aparece en tu app y en las notificaciones.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmitChurch(onSubmitChurch)}
              className="mt-5 space-y-5"
            >
              <div>
                <label htmlFor="church-name" className="zoe-label">
                  Nombre de la iglesia
                </label>
                <input
                  id="church-name"
                  type="text"
                  {...registerChurch('name')}
                  className="zoe-input"
                />
                {churchErrors.name && (
                  <p className="mt-1.5 text-xs text-danger">
                    {churchErrors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="church-phone" className="zoe-label">
                    <Phone className="mr-1.5 inline h-3.5 w-3.5" />
                    Teléfono
                  </label>
                  <input
                    id="church-phone"
                    type="tel"
                    {...registerChurch('phone')}
                    className="zoe-input"
                  />
                </div>
                <div>
                  <label htmlFor="church-email" className="zoe-label">
                    <Mail className="mr-1.5 inline h-3.5 w-3.5" />
                    Email de contacto
                  </label>
                  <input
                    id="church-email"
                    type="email"
                    {...registerChurch('email')}
                    className="zoe-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="church-address" className="zoe-label">
                  <MapPin className="mr-1.5 inline h-3.5 w-3.5" />
                  Dirección
                </label>
                <input
                  id="church-address"
                  type="text"
                  {...registerChurch('address')}
                  className="zoe-input"
                />
              </div>

              <div className="flex justify-end border-t border-border pt-5">
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
        )}

        {/* ============================================ */}
        {/* SEGURIDAD */}
        {/* ============================================ */}
        <div className="zoe-card">
          <div className="flex items-start gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Seguridad de mi cuenta
              </h3>
              <p className="mt-0.5 text-sm text-foreground-muted">
                Cambia tu contraseña regularmente para mantener tu cuenta segura.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmitPassword((data) => passwordMutation.mutate(data))}
            className="mt-5 space-y-5"
          >
            <div>
              <label htmlFor="current-pwd" className="zoe-label">
                <Lock className="mr-1.5 inline h-3.5 w-3.5" />
                Contraseña actual
              </label>
              <input
                id="current-pwd"
                type="password"
                {...registerPassword('currentPassword')}
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
                <label htmlFor="new-pwd" className="zoe-label">
                  Nueva contraseña
                </label>
                <input
                  id="new-pwd"
                  type="password"
                  {...registerPassword('newPassword')}
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
                <label htmlFor="confirm-pwd" className="zoe-label">
                  Confirmar nueva
                </label>
                <input
                  id="confirm-pwd"
                  type="password"
                  {...registerPassword('confirmPassword')}
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
                <strong>Importante:</strong> al cambiar tu contraseña, se cerrará
                la sesión en todos tus dispositivos por seguridad.
              </p>
            </div>

            <div className="flex justify-end border-t border-border pt-5">
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