'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  BarChart3,
  ShoppingCart,
  MapPin,
  Route,
  PackageX,
  Layers,
  LogOut,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useMemo, useSyncExternalStore } from 'react';
import { UserSession } from '@/types/auth';

const SESSION_KEY = 'user_session';
const emptySubscribe = () => () => {};

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const user = useMemo<UserSession | null>(() => {
    if (!isClient) return null;
    const session = Cookies.get(SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session) as UserSession;
    } catch {
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

  const managementNavItems = [
    {
      name: 'Monitoring & Supervisi',
      href: '/dashboard',
      icon: BarChart3,
      badge: 'Supervisor',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      name: 'Smart Data Consolidator',
      href: '/dashboard/consolidator',
      icon: Layers,
      badge: 'Add-On Multi-Hub',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
  ];

  const salesNavItems = [
    {
      name: 'Taking Order & Promo',
      href: '/dashboard/taking-order',
      icon: ShoppingCart,
      badge: 'SFA Mobile',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      name: 'Geotag & NOO',
      href: '/dashboard/outlets',
      icon: MapPin,
      badge: 'Anti-Fraud',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      name: 'Rute & Live Tracking',
      href: '/dashboard/tracking',
      icon: Route,
      badge: 'GPS Live',
      badgeColor: 'bg-violet-100 text-violet-700',
    },
    {
      name: 'Pesanan Tanpa Kunjungan (OOS)',
      href: '/dashboard/oos-orders',
      icon: PackageX,
      badge: 'Stok & Backorder',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
  ];

  const userInitial = user?.firstName ? user.firstName[0].toUpperCase() : 'U';

  const sidebarContent = (
    <div className="h-full w-full max-w-full flex flex-col justify-between bg-white text-slate-800 overflow-hidden">
      {/* Brand & App Info Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-2xl text-white shadow-xs group-hover:shadow-blue-500/20 transition">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition">
                  Distrilink SAP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Sales Force & Distribution Suite
              </p>
            </div>
          </Link>

          {/* Close button on mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Tutup sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Sub-badge */}
        <div className="mt-3.5 flex items-center justify-between px-2.5 py-1.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-700 font-semibold">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-blue-600" />
            SFA Multi-Branch
          </span>
          <span className="text-[10px] bg-blue-200/70 px-1.5 py-0.5 rounded text-blue-800 font-bold">
            v1.0.4
          </span>
        </div>
      </div>

      {/* Navigation Groups (Scrollable) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-4 space-y-6">
        {/* Group 1: Supervisi & Konsolidasi */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Supervisi & Konsolidasi
            </span>
            <ShieldCheck className="w-3 h-3 text-slate-400" />
          </div>
          <nav className="space-y-1">
            {managementNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span
                    className={`shrink-0 ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : `${item.badgeColor} border border-slate-200/50`
                    }`}
                  >
                    {item.badge}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Group 2: Operasional Sales Lapangan */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operasional Sales Lapangan
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </div>
          <nav className="space-y-1">
            {salesNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span
                    className={`shrink-0 ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : `${item.badgeColor} border border-slate-200/50`
                    }`}
                  >
                    {item.badge}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer: SAP Status & User Info */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-3">
        {/* SAP Sync Status */}
        <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200/80 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">SAP Sync: Online</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">ERP Connected</span>
        </div>

        {/* User Session & Logout */}
        <div className="flex items-center justify-between gap-2 p-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.image}
                alt={user.firstName}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {userInitial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Memuat...'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                @{user?.username || 'supervisor'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
            title="Keluar dari akun"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (lg+) */}
      <aside className="hidden lg:flex w-72 min-w-[18rem] max-w-[18rem] h-screen sticky top-0 border-r border-slate-200/80 shrink-0 z-30 bg-white overflow-hidden flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar (<lg) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <aside className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 bg-white overflow-hidden flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
