import { useAuth } from '@/stores/auth.store';
import { MobileNav } from './MobileNav';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const church = user?.church;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="truncate text-xs text-foreground-subtle">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        <div className="text-right">
          <p className="truncate text-sm font-medium text-foreground">
            {church?.name ?? '—'}
          </p>
          <p className="text-xs text-foreground-subtle">
            Plan:{' '}
            <span className="font-medium uppercase">{church?.plan ?? 'FREE'}</span>
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-sm font-semibold text-primary-700">
          {church?.name?.charAt(0).toUpperCase() ?? 'Z'}
        </div>
      </div>
    </header>
  );
}