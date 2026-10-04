import { Outlet } from 'react-router-dom';
import { AppDock } from './AppDock';
import { MobileBottomNav } from './MobileBottomNav';

export function AppShell() {
  return (
    <>
      <AppDock />
      <MobileBottomNav />
      <Outlet />
    </>
  );
}