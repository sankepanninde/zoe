import { AppLayout } from '@/components/layout/AppLayout';

export function Availability() {
  return (
    <AppLayout title="Disponibilidad" subtitle="Días disponibles del equipo">
      <div className="zoe-card">
        <p className="text-sm text-foreground-muted">Próximamente: disponibilidad del equipo.</p>
      </div>
    </AppLayout>
  );
}