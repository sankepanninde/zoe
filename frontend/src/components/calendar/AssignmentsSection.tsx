import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus, Trash2, Check, X, Clock, Loader2, Users } from 'lucide-react';
import { getApiError } from '@/lib/api';
import { listUsers } from '@/lib/users.api';
import { listMyMinistries, listMinistries } from '@/lib/ministries.api';
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '@/lib/services.api';
import { useAuth } from '@/stores/auth.store';
import { cn, getInitials } from '@/lib/utils';
import type { Service, ServiceAssignment } from '@/types';

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

const statusConfig = {
  PENDING: {
    label: 'Pendiente',
    color: 'bg-warning-light text-warning-dark',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmado',
    color: 'bg-success-light text-success-dark',
    icon: Check,
  },
  REJECTED: {
    label: 'Rechazado',
    color: 'bg-danger-light text-danger-dark',
    icon: X,
  },
};

interface AssignmentsSectionProps {
  service: Service;
  readOnly?: boolean;
  onUpdate: () => void;
}

export function AssignmentsSection({
  service,
  readOnly = false,
  onUpdate,
}: AssignmentsSectionProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMinistryId, setSelectedMinistryId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  // ===========================================
  // QUERIES
  // ===========================================

  // Todos los ministerios (para admin) o solo los que lidera (para líder)
  const { data: allMinistries = [] } = useQuery({
    queryKey: ['ministries'],
    queryFn: listMinistries,
    enabled: isAdmin,
  });

  const { data: myMinistries = [] } = useQuery({
    queryKey: ['ministries', 'mine'],
    queryFn: listMyMinistries,
    enabled: !isAdmin,
  });

  // Ministerios que este user PUEDE asignar
  const availableMinistries = useMemo(() => {
    if (isAdmin) return allMinistries;
    return myMinistries.filter((m) => m.isLeader);
  }, [isAdmin, allMinistries, myMinistries]);

  // Auto-seleccionar si solo hay 1 ministerio disponible
  const effectiveMinistryId = useMemo(() => {
    if (selectedMinistryId) return selectedMinistryId;
    if (availableMinistries.length === 1) return availableMinistries[0]!.id;
    return '';
  }, [selectedMinistryId, availableMinistries]);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(true),
  });

  // Filtrar usuarios por ministerio seleccionado
  const availableUsers = useMemo(() => {
    return users.filter((u) => {
      // Ya está asignado a este servicio
      if (service.assignments.some((a) => a.userId === u.id)) return false;

      // Si hay ministerio seleccionado, solo mostrar técnicos de ese ministerio
      if (effectiveMinistryId) {
        const belongs = u.ministries?.some(
          (um) => um.ministry.id === effectiveMinistryId
        );
        if (!belongs) return false;
      }

      return true;
    });
  }, [users, service.assignments, effectiveMinistryId]);

  // Filtrar asignaciones visibles según ministerios del líder
  const visibleAssignments = useMemo(() => {
    if (isAdmin) return service.assignments;

    const myMinistryIds = myMinistries
      .filter((m) => m.isLeader)
      .map((m) => m.id);

    // Un líder ve solo asignaciones de sus ministerios (o sin ministerio)
    return service.assignments.filter((a) => {
      if (!a.ministryId) return true; // legacy sin ministerio
      return myMinistryIds.includes(a.ministryId);
    });
  }, [isAdmin, myMinistries, service.assignments]);

  // ===========================================
  // MUTATIONS
  // ===========================================

  const addMutation = useMutation({
    mutationFn: () =>
      createAssignment(service.id, {
        userId: selectedUserId,
        position: selectedPosition,
        ministryId: effectiveMinistryId || null,
      }),
    onSuccess: () => {
      toast.success('Técnico asignado');
      setShowAddForm(false);
      setSelectedUserId('');
      setSelectedPosition('');
      setSelectedMinistryId('');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onUpdate();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAssignment(service.id, id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onUpdate();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssignment(service.id, id),
    onSuccess: () => {
      toast.success('Asignación eliminada');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onUpdate();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const handleAdd = () => {
    if (!selectedUserId || !selectedPosition) {
      toast.error('Selecciona una persona y una posición');
      return;
    }
    addMutation.mutate();
  };

  const confirmedCount = visibleAssignments.filter(
    (a) => a.status === 'CONFIRMED'
  ).length;

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="border-t border-border pt-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-foreground-muted" />
          <h4 className="text-sm font-semibold text-foreground">
            Equipo asignado
          </h4>
          {visibleAssignments.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {confirmedCount}/{visibleAssignments.length}
            </span>
          )}
          {!isAdmin && (
            <span className="rounded-full bg-warning-light px-2 py-0.5 text-[10px] font-bold text-warning-dark">
              Solo tus ministerios
            </span>
          )}
        </div>

        {!readOnly && !showAddForm && availableUsers.length > 0 && availableMinistries.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Asignar
          </button>
        )}
      </div>

      {/* Lista vacía */}
      {visibleAssignments.length === 0 && !showAddForm && (
        <div className="rounded-xl border border-dashed border-border bg-surface-elevated/40 p-4 text-center">
          <p className="text-xs text-foreground-muted">
            {isAdmin
              ? 'Nadie asignado todavía. Agrega al primer técnico.'
              : 'No hay asignaciones de tus ministerios aún.'}
          </p>
        </div>
      )}

      {/* Lista de asignaciones */}
      <div className="space-y-2">
                {visibleAssignments.map((assignment) => (
          <AssignmentRow
            key={assignment.id}
            assignment={assignment}
            readOnly={readOnly}
            onUpdateStatus={(status) =>
              updateMutation.mutate({ id: assignment.id, status })
            }
            onDelete={() => deleteMutation.mutate(assignment.id)}
            isUpdating={updateMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />
        ))}
      </div>

      {/* Formulario agregar */}
      {showAddForm && (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="space-y-2">
            {/* Selector de ministerio (si hay más de 1) */}
            {availableMinistries.length > 1 && (
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                  Ministerio
                </label>
                <select
                  value={selectedMinistryId}
                  onChange={(e) => {
                    setSelectedMinistryId(e.target.value);
                    setSelectedUserId('');
                  }}
                  className="zoe-input !py-2 text-sm"
                >
                  <option value="">Selecciona ministerio...</option>
                  {availableMinistries.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de usuario */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                Persona
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="zoe-input !py-2 text-sm"
                disabled={availableMinistries.length > 1 && !effectiveMinistryId}
              >
                <option value="">
                  {availableMinistries.length > 1 && !effectiveMinistryId
                    ? 'Primero elige un ministerio...'
                    : 'Selecciona una persona...'}
                </option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.position ? `· ${u.position}` : ''}
                  </option>
                ))}
              </select>
              {effectiveMinistryId && availableUsers.length === 0 && (
                <p className="mt-1.5 text-[11px] text-warning-dark">
                  No hay técnicos disponibles en este ministerio
                </p>
              )}
            </div>

            {/* Posición */}
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="zoe-input !py-2 text-sm"
            >
              <option value="">Selecciona una posición...</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedUserId('');
                  setSelectedPosition('');
                  setSelectedMinistryId('');
                }}
                className="zoe-btn-secondary flex-1 !py-2 text-xs"
                disabled={addMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={addMutation.isPending}
                className="zoe-btn-primary flex-1 !py-2 text-xs"
              >
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  'Asignar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {availableUsers.length === 0 && !showAddForm && visibleAssignments.length > 0 && (
        <p className="mt-3 text-center text-xs text-foreground-subtle">
          Todos los técnicos están asignados
        </p>
      )}
    </div>
  );
}

// ===========================================
// FILA DE ASIGNACIÓN
// ===========================================

interface AssignmentRowProps {
  assignment: ServiceAssignment;
  readOnly?: boolean;
  onUpdateStatus: (status: string) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function AssignmentRow({
  assignment,
  readOnly = false,
  onUpdateStatus,
  onDelete,
  isUpdating,
  isDeleting,
}: AssignmentRowProps) {
  const config = statusConfig[assignment.status];
  const StatusIcon = config.icon;
  const isBusy = isUpdating || isDeleting;

  return (
    <div className="group flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-2 transition-colors hover:border-border-strong">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-[10px] font-bold text-primary-700">
        {getInitials(assignment.user.name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-semibold text-foreground">
            {assignment.user.name}
          </p>
          {assignment.ministry && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
              style={{ backgroundColor: assignment.ministry.color }}
            >
              {assignment.ministry.name}
            </span>
          )}
        </div>
        <p className="truncate text-[10px] text-foreground-muted">
          {assignment.position}
        </p>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          'flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase',
          config.color
        )}
      >
        <StatusIcon className="h-2.5 w-2.5" />
        {config.label}
      </span>

            {/* Acciones */}
      {!readOnly && (
        <div className="flex shrink-0 items-center gap-0.5">
        {assignment.status !== 'CONFIRMED' && (
          <button
            type="button"
            onClick={() => onUpdateStatus('CONFIRMED')}
            disabled={isBusy}
            className="rounded p-1 text-success hover:bg-success-light disabled:opacity-50"
            title="Confirmar"
          >
            <Check className="h-3 w-3" />
          </button>
        )}
        {assignment.status !== 'REJECTED' && (
          <button
            type="button"
            onClick={() => onUpdateStatus('REJECTED')}
            disabled={isBusy}
            className="rounded p-1 text-danger hover:bg-danger-light disabled:opacity-50"
            title="Rechazar"
          >
            <X className="h-3 w-3" />
          </button>
        )}
                <button
          type="button"
          onClick={onDelete}
          disabled={isBusy}
          className="rounded p-1 text-foreground-subtle opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100 disabled:opacity-50"
          title="Eliminar"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      )}
    </div>
  );
}