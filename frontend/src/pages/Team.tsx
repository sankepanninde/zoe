import { AppLayout } from '@/components/layout/AppLayout';

export function Team() {
  return (
    <AppLayout title="Equipo" subtitle="Técnicos y colaboradores">
      <div className="zoe-card">
        <p className="text-sm text-foreground-muted">Próximamente: gestión del equipo.</p>
      </div>
    </AppLayout>
  );
}