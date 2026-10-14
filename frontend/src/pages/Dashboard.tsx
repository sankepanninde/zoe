import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dashboard as KitDashboard } from '@/ui';
import type {
  DatosRol,
  RolVista,
  TurnoRol,
  FilaCronograma,
  DiaSemana,
} from '@/ui/PanelRol';
import { useAuth } from '@/stores/auth.store';
import { listServices } from '@/lib/services.api';
import { listUsers } from '@/lib/users.api';
import { getInitials } from '@/lib/utils';
import type { Service } from '@/types';

const DOW_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatCuando(dateStr: string, time: string): string {
  const d = new Date(dateStr);
  return `${DOW_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]} · ${time}`;
}

function mapEstado(s: string): 'pendiente' | 'confirmado' | 'rechazado' {
  if (s === 'CONFIRMED') return 'confirmado';
  if (s === 'REJECTED') return 'rechazado';
  return 'pendiente';
}

function buildMisTurnos(services: Service[], userId: string): TurnoRol[] {
  const out: TurnoRol[] = [];
  for (const s of services) {
    const a = s.assignments.find((x) => x.userId === userId);
    if (!a) continue;
    out.push({
      id: a.id,
      cuando: formatCuando(s.date, s.startTime),
      area: a.position,
      estado: mapEstado(a.status),
    });
  }
  return out.sort((a, b) => a.cuando.localeCompare(b.cuando)).slice(0, 6);
}

function buildCronograma(services: Service[]): FilaCronograma[] {
  const today = new Date();
  return services
    .filter((s) => new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((s) => {
      const confirmed = s.assignments.filter((a) => a.status === 'CONFIRMED').length;
      const total = s.assignments.length;
      const complete = total > 0 && confirmed === total;
      const nombres = s.assignments.map((a) => a.user.name.split(' ')[0]).join(' · ') || 'Sin asignar';
      return {
        id: s.id,
        cuando: formatCuando(s.date, s.startTime),
        estado: complete ? 'completo' : 'falta',
        faltan: complete ? undefined : Math.max(total - confirmed, 1),
        integrantes: nombres,
      };
    });
}

function buildSemana(services: Service[]): DiaSemana[] {
  const today = new Date();
  const next7 = new Date(today.getTime() + 7 * 86400000);
  const week = services.filter((s) => {
    const d = new Date(s.date);
    return d >= today && d <= next7;
  });

  const byDay = new Map<string, Service[]>();
  for (const s of week) {
    const key = s.date.split('T')[0]!;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(s);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, svcs]) => {
      const d = new Date(key);
      const total = svcs.reduce((acc, s) => acc + s.assignments.length, 0);
      const confirmed = svcs.reduce(
        (acc, s) => acc + s.assignments.filter((a) => a.status === 'CONFIRMED').length,
        0
      );
      return {
        dia: `${DOW_SHORT[d.getUTCDay()]} ${d.getUTCDate()}`,
        hora: svcs[0]?.startTime ?? '',
        ministerios: [{ nombre: 'Sonido', cubiertos: confirmed, total: total || 1 }],
      };
    });
}

export function Dashboard() {
  const { user } = useAuth();
  const rolKit: RolVista =
  user?.role === 'LEADER' ? 'LE' : user?.role === 'ADMIN' ? 'AD' : 'TE';

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => listServices(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(true),
  });

  const datosPorRol = useMemo<Record<RolVista, DatosRol>>(() => {
    const misTurnos = user?.id ? buildMisTurnos(services, user.id) : [];
    const cronograma = buildCronograma(services);
    const semana = buildSemana(services);
    const usuariosActivos = users.filter((u) => u.active).length;
    const sinCubrir = services.reduce(
      (acc, s) => acc + s.assignments.filter((a) => a.status === 'PENDING').length,
      0
    );

    const base: DatosRol = {
      nombre: user?.name ?? '',
      ministerio: 'Sonido',
      misTurnos,
      cronograma,
      disponibles: [],
      semana,
      sinCubrir,
      usuariosActivos,
      anunciosRecientes: [],
      actividad: [],
    };

    return { TE: base, LE: base, AD: base };
  }, [services, users, user]);

    return (
    <div
      className="k-app"
      style={{
        minHeight: '100vh',
        background: '#0C0E0D',
        color: '#ECEDEA',
        paddingLeft: '96px',
        paddingBottom: '96px',
      }}
    >
      <KitDashboard
        iglesia={user?.church?.name ?? 'Mi iglesia'}
        iniciales={getInitials(user?.name ?? 'U')}
        anuncios={[]}
        eventos={[]}
        hoy={[]}
        roles={{ datos: datosPorRol }}
        rolFijo={rolKit}
        inscripciones={[]}
        borradores={[]}
        onMarcarLeido={() => {}}
        onMarcarTodoLeido={() => {}}
        onComentar={() => {}}
        onCrearAnuncio={() => {}}
      />
    </div>
  );
}
