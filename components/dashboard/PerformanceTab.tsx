'use client';

import {
  CheckCircle2, TrendingUp, CreditCard, AlertTriangle,
  Search, MapPin, RotateCcw,
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import PerformanceGraph from '@/components/dashboard/PerformanceGraph';
import SalesPieChart from '@/components/dashboard/SalesPieChart';
import SalesTable from '@/components/dashboard/SalesTable';
import { SalesData } from '@/types/sales';
import { DashboardSummary } from '@/hooks/useDashboardLogic';

interface Props {
  summary: DashboardSummary;
  filteredSales: SalesData[];
  periodSalesList: SalesData[];
  userArea: string | undefined;
  search: string;
  onSearchChange: (value: string) => void;
  onResetFilters: () => void;
}

export default function PerformanceTab({
  summary,
  filteredSales,
  periodSalesList,
  userArea,
  search,
  onSearchChange,
  onResetFilters,
}: Props) {
  return (
    <div className="space-y-6">
      {/* KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Realisasi Visit"
          value={`${summary.totalVisit} visit`}
          icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
          variant="blue"
          trend={{
            value: `${Math.round((summary.totalVisit / (summary.totalPlanned || 1)) * 100)}%`,
            isPositive: true,
            label: 'dari rencana',
          }}
          subtitle={`Target: ${summary.totalPlanned}`}
        />

        <StatCard
          title="Rata-rata Efektivitas"
          value={`${summary.avgEffectiveness}%`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          variant="emerald"
          trend={{
            value: summary.avgEffectiveness >= 80 ? 'Optimal' : 'Perlu Evaluasi',
            isPositive: summary.avgEffectiveness >= 75,
          }}
          subtitle={`${filteredSales.length} salesman`}
        />

        <StatCard
          title="Total Nilai Order"
          value={`Rp ${(summary.totalOrderRp / 1_000_000).toFixed(1)} jt`}
          icon={<CreditCard className="w-5 h-5 text-violet-600" />}
          variant="violet"
          trend={{ value: 'Aktif', isPositive: true, label: 'omset tercatat' }}
          subtitle={`Rp ${summary.totalOrderRp.toLocaleString('id-ID')}`}
        />

        <StatCard
          title="Kendala Order (OOS)"
          value={`${summary.totalOos} insiden`}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          variant="rose"
          trend={{
            value: summary.totalOos > 0 ? 'Perhatian' : 'Aman',
            isPositive: summary.totalOos === 0,
            label: 'out of stock',
          }}
          subtitle="Perlu restock gudang"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex">
          <div className="w-full">
            <PerformanceGraph data={filteredSales} />
          </div>
        </div>
        <div className="lg:col-span-5 flex">
          <div className="w-full">
            <SalesPieChart data={periodSalesList} />
          </div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama sales..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition"
          />
        </div>

        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-bold">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            Wilayah Otorisasi: {userArea || 'Semua Wilayah'}
          </span>

          {search && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Sales Table */}
      <SalesTable data={filteredSales} onResetFilters={onResetFilters} />
    </div>
  );
}
