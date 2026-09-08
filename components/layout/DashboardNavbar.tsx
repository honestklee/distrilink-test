'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { UserSession } from '@/types/auth';
import {
  Menu,
  LogOut,
  Sparkles,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

const SESSION_KEY = 'user_session';
const emptySubscribe = () => () => {};

interface DashboardNavbarProps {
  onToggleSidebar?: () => void;
}

const PAGE_TITLES: Record<string, { title: string; category: string }> = {
  '/dashboard': { title: 'Monitoring & Supervisi', category: 'Supervisi & Analisa' },
  '/dashboard/consolidator': { title: 'Smart Data Consolidator', category: 'Supervisi & Konsolidasi' },
  '/dashboard/taking-order': { title: 'Taking Order & Promo', category: 'Operasional Sales Lapangan' },
  '/dashboard/outlets': { title: 'Geotag & NOO Outlets', category: 'Operasional Sales Lapangan' },
  '/dashboard/tracking': { title: 'Rute & Live Tracking', category: 'Operasional Sales Lapangan' },
  '/dashboard/oos-orders': { title: 'Pesanan Tanpa Kunjungan (OOS)', category: 'Operasional Sales Lapangan' },
};

export default function DashboardNavbar({ onToggleSidebar }: DashboardNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Retrieve user session
  const user = useMemo<UserSession | null>(() => {
    if (!isClient) return null;
    const session = Cookies.get(SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session) as UserSession;
    } catch {
      Cookies.remove(SESSION_KEY);
      return null;
    }
  }, [isClient]);

  const handleLogout = () => {
    Cookies.remove(SESSION_KEY);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
    router.push('/login');
  };

  const userInitial = user?.firstName ? user.firstName[0].toUpperCase() : 'U';
  const pageMeta = PAGE_TITLES[pathname] || { title: 'Dashboard', category: 'Distrilink SAP' };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Toggle & Page Context */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar Toggle Button */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer shrink-0"
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Logo (hidden on lg since sidebar is visible) */}
            <Link href="/dashboard" className="lg:hidden flex items-center gap-2 shrink-0">
              <div className="p-1.5 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-xl text-white">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">Distrilink</span>
            </Link>

            {/* Desktop Breadcrumb & Current Page Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs min-w-0">
              <span className="text-slate-400 font-medium whitespace-nowrap">{pageMeta.category}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="font-bold text-slate-800 truncate">{pageMeta.title}</span>
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0 whitespace-nowrap">
                <Sparkles className="w-2.5 h-2.5 text-blue-500" /> Live Monitoring
              </span>
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* SAP Online Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-700">SAP Sync Online</span>
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              {user?.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt={user.firstName}
                  className="w-8 h-8 rounded-full object-cover shadow-xs border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInitial}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user ? `${user.firstName} ${user.lastName}` : 'Memuat...'}
                </p>
                <p className="text-[11px] text-slate-400">@{user?.username || 'supervisor'}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200/80 text-xs font-semibold transition shadow-2xs cursor-pointer"
              title="Keluar dari akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
