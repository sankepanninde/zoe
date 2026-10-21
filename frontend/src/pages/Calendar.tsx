import { AppLayout } from '@/components/layout/AppLayout';
import { Cronograma } from '@/ui/Cronograma';

/* Ruta /calendar: muestra el cronograma con el diseño Fey dentro del layout de la app.
   Los datos aún son de ejemplo; se conectan después a listServices. */
export function Calendar() {
  return (
    <AppLayout title="Cronograma" subtitle="Servicios y asignaciones del equipo">
      <Cronograma />
    </AppLayout>
  );
}