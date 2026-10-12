import { useRef, useState } from 'react';
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
  Camera,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/stores/auth.store';
import { getApiError, api } from '@/lib/api';
import { updateOwnProfile, uploadAvatar, deleteAvatar } from '@/lib/users.api';
import { getInitials } from '@/lib/utils';

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
  const { user, updateChurch, updateUser } = useAuth();
  const church = user?.church;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const userMinistries = user?.ministries ?? [];

  // ============ AVATAR ============
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success('Foto actualizada');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const removeAvatarMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success('Foto eliminada');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 5 MB.');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    avatarMutation.mutate(file);

    // Limpiar el input para permitir subir el mismo archivo otra vez
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      updateUser(updatedUser);
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
        {/* AVATAR */}
        {/* ============================================ */}
        <div className="zoe-card">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Mi foto
          </h3>
          <p className="mt-1 text-sm text-foreground-muted">
            Se mostrará en el cronograma y en tus turnos. Máximo 5 MB (JPG, PNG o WebP).
          </p>

          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            {/* Vista previa */}
            <div className="relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-24 w-24 rounded-2xl object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
                  {getInitials(user?.name ?? 'U')}
                </div>
              )}

              {avatarMutation.isPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarMutation.isPending}
                className="zoe-btn-primary"
              >
                {avatarMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    {user?.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
                  </>
                )}
              </button>

              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={() => removeAvatarMutation.mutate()}
                  disabled={removeAvatarMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
                >
                  {removeAvatarMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Eliminar foto
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

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