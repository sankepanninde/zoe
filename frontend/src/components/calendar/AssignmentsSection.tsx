import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus, Trash2, Check, X, Clock, Loader2, Users } from 'lucide-react';
import { getApiError } from '@/lib/api';
import { listUsers } from '@/lib/users.api';
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '@/lib/services.api';
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
  onUpdate: () => void;
}

export function AssignmentsSection({ service, onUpdate }: AssignmentsSectionProps) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(true),
  });

  const availableUsers = users.filter(
    (u) => !service.assignments.some((a) => a.userId === u.id)
  );

  const addMutation = useMutation({
    mutationFn: () =>
      createAssignment(service.id, {
        userId: selectedUserId,
        position: selectedPosition,
      }),
    onSuccess: () => {
      toast.success('Técnico asignado');
      setShowAddForm(false);
      setSelectedUserId('');
      setSelectedPosition('');
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

  const assignments = service.assignments;
  const confirmedCount = assignments.filter((a) => a.status === 'CONFIRMED').length;

  return (
    <div className="border-t border-border pt-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-foreground-muted" />
          <h4 className="text-sm font-semibold text-foreground">
            Equipo asignado
          </h4>
          {assignments.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {confirmedCount}/{assignments.length}
            </span>
          )}
        </div>

        {!showAddForm && availableUsers.length > 0 && (
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

      {/* Lista de asignaciones */}
      {assignments.length === 0 && !showAddForm && (
        <div className="rounded-xl border border-dashed border-border bg-surface-elevated/40 p-4 text-center">
          <p className="text-xs text-foreground-muted">
            Nadie asignado todavía. Agrega al primer técnico.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {assignments.map((assignment) => (
          <AssignmentRow
            key={assignment.id}
            assignment={assignment}
            onUpdateStatus={(status) =>
              updateMutation.mutate({ id: assignment.id, status })
            }
            onDelete={() => deleteMutation.mutate(assignment.id)}
            isUpdating={updateMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />
        ))}
      </div>

      {/* Formulario de agregar */}
      {showAddForm && (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="space-y-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="zoe-input !py-2 text-sm"
            >
              <option value="">Selecciona una persona...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.position ? `· ${u.position}` : ''}
                </option>
              ))}
            </select>

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

      {availableUsers.length === 0 && !showAddForm && assignments.length > 0 && (
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
  onUpdateStatus: (status: string) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function AssignmentRow({
  assignment,
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
        <p className="truncate text-xs font-semibold text-foreground">
          {assignment.user.name}
        </p>
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
    </div>
  );
}