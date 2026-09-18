import { useAuth } from '@/stores/auth.store';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const church = user?.church;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-foreground-subtle">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{church?.name ?? '—'}</p>
          <p className="text-xs text-foreground-subtle">
            Plan: <span className="font-medium uppercase">{church?.plan ?? 'FREE'}</span>
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-sm font-semibold text-primary-700">
          {church?.name?.charAt(0).toUpperCase() ?? 'Z'}
        </div>
      </div>
    </header>
  );
}