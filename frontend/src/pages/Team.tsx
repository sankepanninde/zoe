import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Trash2,
  Edit,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserModal } from '@/components/team/UserModal';
import { listUsers, deleteUser } from '@/lib/users.api';
import { listMinistries } from '@/lib/ministries.api';
import { getApiError } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
import type { User, UserRole } from '@/types';

// ===========================================
// LABELS
// ===========================================

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  LEADER: 'Líder',
  TECHNICIAN: 'Técnico',
};

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-primary-100 text-primary-700',
  LEADER: 'bg-warning-light text-warning-dark',
  TECHNICIAN: 'bg-success-light text-success-dark',
};

// ===========================================
// PAGE
// ===========================================

export function Team() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterMinistry, setFilterMinistry] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);

  // Queries
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', showInactive],
    queryFn: () => listUsers(!showInactive),
  });

  const { data: ministries = [] } = useQuery({
    queryKey: ['ministries'],
    queryFn: listMinistries,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('Usuario desactivado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // Filtros
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = !filterRole || u.role === filterRole;

      const matchesMinistry =
        !filterMinistry ||
        (u.ministries ?? []).some((um) => um.ministry.id === filterMinistry);

      return matchesSearch && matchesRole && matchesMinistry;
    });
  }, [users, search, filterRole, filterMinistry]);

  // Handlers
  const handleDelete = (user: User) => {
    if (!confirm(`¿Desactivar a ${user.name}? Podrás reactivarlo luego.`)) return;
    deleteMutation.mutate(user.id);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    setModalOpen(false);
    setSelectedUser(null);
  };

  const stats = {
    total: users.length,
    leaders: users.filter((u) => u.ministries?.some((m) => m.isLeader)).length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    active: users.filter((u) => u.active).length,
  };

  return (
    <AppLayout title="Equipo" subtitle="Personas que sirven en tu iglesia">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} tone="primary" />
          <StatCard label="Activos" value={stats.active} tone="success" />
          <StatCard label="Líderes" value={stats.leaders} tone="warning" />
          <StatCard label="Admins" value={stats.admins} tone="purple" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="zoe-input pl-9"
              />
            </div>

            <select
              value={filterMinistry}
              onChange={(e) => setFilterMinistry(e.target.value)}
              className="zoe-filter-select"
            >
              <option value="">Todos los ministerios</option>
              {ministries.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="zoe-filter-select"
            >
              <option value="">Todos los roles</option>
              <option value="ADMIN">Administradores</option>
              <option value="LEADER">Líderes</option>
              <option value="TECHNICIAN">Técnicos</option>
            </select>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground-muted">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border"
              />
              Mostrar inactivos
            </label>
          </div>

          <button onClick={handleOpenCreate} className="zoe-btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="zoe-card flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="zoe-card flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
              {search || filterRole || filterMinistry
                ? 'No hay resultados'
                : 'Sin usuarios todavía'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-foreground-muted">
              {search || filterRole || filterMinistry
                ? 'Prueba con otra búsqueda o filtro.'
                : 'Agrega a las personas que sirven en tu iglesia.'}
            </p>
            {!search && !filterRole && !filterMinistry && (
              <button onClick={handleOpenCreate} className="zoe-btn-primary mt-5">
                <Plus className="h-4 w-4" />
                Agregar el primero
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={() => handleOpenEdit(user)}
                onDelete={() => handleDelete(user)}
              />
            ))}
          </div>
        )}
      </div>

      <UserModal
        open={modalOpen}
        user={selectedUser}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleSuccess}
      />
    </AppLayout>
  );
}

// ===========================================
// STAT CARD
// ===========================================

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'warning' | 'purple';
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success-light text-success-dark',
    warning: 'bg-warning-light text-warning-dark',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="zoe-card !p-3.5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            tones[tone]
          )}
        >
          <Users className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
            {label}
          </p>
          <p className="font-display text-xl font-semibold leading-tight tabular-nums text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// USER CARD
// ===========================================

function UserCard({
  user,
  onEdit,
  onDelete,
}: {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ministries = user.ministries ?? [];

  return (
    <div
      className={cn(
        'zoe-card group relative !p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow',
        !user.active && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
            user.active
              ? 'bg-primary text-white'
              : 'bg-foreground-subtle/20 text-foreground-subtle'
          )}
        >
          {getInitials(user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{user.name}</p>
          <span
            className={cn(
              'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              roleColors[user.role as UserRole]
            )}
          >
            {roleLabels[user.role as UserRole]}
          </span>
          {!user.active && (
            <span className="ml-1.5 inline-block rounded-full bg-foreground-subtle/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
              Inactivo
            </span>
          )}
        </div>
      </div>

      {/* Contacto */}
      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{user.phone}</span>
          </div>
        )}
      </div>

      {/* Ministerios */}
      {ministries.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {ministries.map((um) => (
            <span
              key={um.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: um.ministry.color }}
            >
              {um.isLeader && <Crown className="h-2.5 w-2.5" />}
              {um.ministry.name}
              {um.position && (
                <span className="opacity-80">· {um.position}</span>
              )}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-3 border-t border-border pt-3">
          <span className="text-[10px] italic text-foreground-subtle">
            Sin ministerios asignados
          </span>
        </div>
      )}

      {/* Acciones */}
      <div className="mt-3 flex gap-2 border-t border-border pt-3 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-elevated py-1.5 text-xs font-medium text-foreground hover:bg-border"
        >
          <Edit className="h-3 w-3" />
          Editar
        </button>
        {user.active && (
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}