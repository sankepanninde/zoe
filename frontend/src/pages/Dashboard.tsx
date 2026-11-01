import { Inicio } from '@/pages/Inicio';
import type { RolVista } from '@/pages/Inicio';
import { useAuth } from '@/stores/auth.store';

function rolDeUsuario(role?: string): RolVista {
  if (role === 'LEADER') return 'le';
  if (role === 'ADMIN') return 'ad';
  if (role === 'DEV') return 'dev';
  return 'te';
}

export function Dashboard() {
  const { user } = useAuth();
  return <Inicio rol={rolDeUsuario(user?.role)} nombre={user?.name?.split(' ')[0] ?? ''} />;
}