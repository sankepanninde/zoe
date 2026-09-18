import { Calendar, Users, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';

export function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'bienvenido';
  const trialEndsAt = user?.church?.trialEndsAt;

  return (
    <AppLayout title="Inicio" subtitle={formatDate(new Date(), { weekday: 'long' })}>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          ¡Hola, {firstName}! 👋
        </h1>
        <p className="mt-1.5 text-foreground-muted">
          Bienvenido a{' '}
          <span className="font-medium text-foreground">{user?.church?.name}</span>. Aquí tienes
          un resumen de tu iglesia.
        </p>
      </div>

      {trialEndsAt && (
        <div className="zoe-card mb-8 flex items-center justify-between border-primary-200 bg-primary-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Estás en tu prueba gratuita
              </p>
              <p className="text-xs text-foreground-muted">
                Vence el {formatDate(trialEndsAt)}
              </p>
            </div>
          </div>
          <Link to="/settings" className="zoe-btn-secondary">
            Ver planes
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          to="/calendar"
          icon={Calendar}
          title="Cronograma"
          description="Agenda y asigna servicios"
        />
        <DashboardCard
          to="/team"
          icon={Users}
          title="Equipo"
          description="Administra tus técnicos"
        />
        <DashboardCard
          to="/availability"
          icon={Clock}
          title="Disponibilidad"
          description="Marcas días no disponibles"
        />
      </div>

      <div className="zoe-card mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Próximos servicios
            </h3>
            <p className="mt-1 text-sm text-foreground-muted">
              Aún no hay servicios agendados.
            </p>
          </div>
          <Link to="/calendar" className="zoe-btn-primary">
            Crear el primero
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

interface DashboardCardProps {
  to: string;
  icon: typeof Calendar;
  title: string;
  description: string;
}

function DashboardCard({ to, icon: Icon, title, description }: DashboardCardProps) {
  return (
    <Link
      to={to}
      className="zoe-card group transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-glow"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-foreground-muted">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Ir ahora
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}