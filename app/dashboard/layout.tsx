'use client';

import { ReactNode, useState, useEffect, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { UserSession } from '@/types/auth';

const SESSION_KEY = 'user_session';
const emptySubscribe = () => () => {};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // RBAC route guard: salesmen cannot access supervisor-only pages
  useEffect(() => {
    if (!isClient) return;
    const session = Cookies.get(SESSION_KEY);
    if (!session) {
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(session) as UserSession;
      if (user.role === 'salesman') {
        const supervisorRoutes = ['/dashboard', '/dashboard/salesmen', '/dashboard/consolidator', '/dashboard/visit-audit'];
        if (supervisorRoutes.includes(pathname)) {
          router.replace('/dashboard/taking-order');
        }
      } else if (user.role === 'supervisor') {
        const salesmanRoutes = [
          '/dashboard/taking-order',
          '/dashboard/outlets',
          '/dashboard/tracking',
          '/dashboard/oos-orders',
        ];
        if (salesmanRoutes.includes(pathname)) {
          router.replace('/dashboard');
        }
      }
    } catch {
      router.replace('/login');
    }
  }, [isClient, pathname, router]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex font-sans">
      {/* Sidebar Navigation */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardNavbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <div className="flex-1 w-full">{children}</div>
      </div>
    </div>
  );
}
