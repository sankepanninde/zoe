import type { ReactNode } from 'react';
import { AppDock } from './AppDock';
import { Header } from './Header';

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AppLayout({ title, subtitle, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppDock />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} subtitle={subtitle} />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl animate-fade-in p-4 md:p-6 lg:pl-24 lg:pr-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}