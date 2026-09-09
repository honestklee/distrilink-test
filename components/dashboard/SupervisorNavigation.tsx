'use client';

import { BarChart3, Building2, Package, ShieldCheck, ShoppingCart } from 'lucide-react';

export type SupervisorTab = 'performance' | 'outlets' | 'stock' | 'approvals' | 'orders';

interface SupervisorNavigationProps {
  activeTab: SupervisorTab;
  onTabChange: (tab: SupervisorTab) => void;
  outletCount: number;
  pendingApprovalCount: number;
  orderCount: number;
}

const tabs: Array<{
  id: SupervisorTab;
  label: string;
  icon: typeof BarChart3;
  count?: keyof Pick<SupervisorNavigationProps, 'outletCount' | 'pendingApprovalCount' | 'orderCount'>;
}> = [
  { id: 'performance', label: '1. Analisa Performa Salesman', icon: BarChart3 },
  { id: 'outlets', label: '2. Monitoring Pesanan Tanpa Kunjungan', icon: Building2, count: 'outletCount' },
  { id: 'stock', label: '3. Monitoring Stok Gudang & Depo', icon: Package },
  { id: 'approvals', label: '4. Meja Persetujuan Supervisi', icon: ShieldCheck, count: 'pendingApprovalCount' },
  { id: 'orders', label: '5. Monitoring Pesanan Masuk (Live PO SAP)', icon: ShoppingCart, count: 'orderCount' },
];

export default function SupervisorNavigation({
  activeTab,
  onTabChange,
  outletCount,
  pendingApprovalCount,
  orderCount,
}: SupervisorNavigationProps) {
  const counts = { outletCount, pendingApprovalCount, orderCount };

  return (
    <nav className="flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar" aria-label="Navigasi dashboard supervisor">
      {tabs.map(({ id, label, icon: Icon, count }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
          {count && counts[count] > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${id === 'approvals' ? 'bg-rose-500 text-white animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
              {counts[count]}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
