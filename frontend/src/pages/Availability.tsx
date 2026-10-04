import { AppLayout } from '@/components/layout/AppLayout';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export function Availability() {
  return (
    <AppLayout title="Disponibilidad" subtitle="Días disponibles del equipo">
      <div className="zoe-card">
        <p className="text-sm text-foreground-muted">Próximamente: disponibilidad del equipo.</p>
      </div>
    </AppLayout>
  );
}