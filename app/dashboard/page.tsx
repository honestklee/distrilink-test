'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import salesRaw from '@/data/sales.json';
import { SalesData } from '@/types/sales';
import { UserSession } from '@/types/auth';

import StatCard from '@/components/dashboard/StatCard';
import PerformanceGraph from '@/components/dashboard/PerformanceGraph';
import SalesPieChart from '@/components/dashboard/SalesPieChart';
import SalesTable from '@/components/dashboard/SalesTable';

import {
  Search,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  MapPin,
  Calendar,
  BarChart3,
  Building2,
  Package,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

const SESSION_KEY = 'user_session';
const emptySubscribe = () => () => {};

// Supervisor: Outlet Profiling Data
interface OutletProfile {
  id: string;
  name: string;
  owner: string;
  area: string;
  category: string;
  creditLimitRp: number;
  currentReceivableRp: number;
  paymentCompliancePercent: number;
  riskGrade: 'A' | 'B' | 'C';
  avgMonthlyOrderRp: number;
  lastOrderDate: string;
  auditStatus: 'Clean' | 'Perlu Follow-up' | 'Over Limit';
}

const OUTLET_PROFILES_DATA: OutletProfile[] = [
  {
    id: 'OUT-BDG-001',
    name: 'Toko Sumber Berkah',
    owner: 'Haji Ahmad',
    area: 'Bandung Kota',
    category: 'Grosir Sembako',
    creditLimitRp: 25000000,
    currentReceivableRp: 6800000,
    paymentCompliancePercent: 98,
    riskGrade: 'A',
    avgMonthlyOrderRp: 18500000,
    lastOrderDate: '07 Sep 2026',
    auditStatus: 'Clean',
  },
  {
    id: 'OUT-BDG-002',
    name: 'Warung Bu Siti',
    owner: 'Siti Rohayati',
    area: 'Bandung Barat',
    category: 'Toko Kelontong',
    creditLimitRp: 10000000,
    currentReceivableRp: 4200000,
    paymentCompliancePercent: 92,
    riskGrade: 'A',
    avgMonthlyOrderRp: 8200000,
    lastOrderDate: '06 Sep 2026',
    auditStatus: 'Clean',
  },
  {
    id: 'OUT-BDG-003',
    name: 'Minimarket Barokah Mandiri',
    owner: 'Rudi Hartono',
    area: 'Cimahi',
    category: 'Minimarket Mandiri',
    creditLimitRp: 30000000,
    currentReceivableRp: 28500000,
    paymentCompliancePercent: 74,
    riskGrade: 'B',
    avgMonthlyOrderRp: 22000000,
    lastOrderDate: '05 Sep 2026',
    auditStatus: 'Perlu Follow-up',
  },
  {
    id: 'OUT-BDG-004',
    name: 'Toko Harapan Jaya',
    owner: 'Bambang Sudiro',
    area: 'Soreang',
    category: 'Grosir Sembako',
    creditLimitRp: 20000000,
    currentReceivableRp: 19800000,
    paymentCompliancePercent: 68,
    riskGrade: 'C',
    avgMonthlyOrderRp: 14500000,
    lastOrderDate: '01 Sep 2026',
    auditStatus: 'Over Limit',
  },
  {
    id: 'OUT-BDG-005',
    name: 'Kios Rezeki Baru',
    owner: 'Hj. Aminah',
    area: 'Bandung Timur',
    category: 'Toko Kelontong',
    creditLimitRp: 8000000,
    currentReceivableRp: 1500000,
    paymentCompliancePercent: 96,
    riskGrade: 'A',
    avgMonthlyOrderRp: 6700000,
    lastOrderDate: '04 Sep 2026',
    auditStatus: 'Clean',
  },
];

// Supervisor: Warehouse & Depo Stock Monitoring Data
interface WarehouseStockItem {
  sku: string;
  name: string;
  category: string;
  depoStock: number;
  safetyStock: number;
  reorderPoint: number;
  unit: string;
  status: 'Aman' | 'Kritis' | 'Habis';
  daysOfInventory: number;
  fastMovingRank: number;
}

const WAREHOUSE_STOCKS_DATA: WarehouseStockItem[] = [
  {
    sku: 'SKU-001',
    name: 'Minyak Goreng Rose Brand 2L',
    category: 'Sembako',
    depoStock: 140,
    safetyStock: 50,
    reorderPoint: 80,
    unit: 'pouch',
    status: 'Aman',
    daysOfInventory: 12,
    fastMovingRank: 1,
  },
  {
    sku: 'SKU-002',
    name: 'Beras Premium Pandan Wangi 5kg',
    category: 'Sembako',
    depoStock: 0,
    safetyStock: 30,
    reorderPoint: 45,
    unit: 'sak',
    status: 'Habis',
    daysOfInventory: 0,
    fastMovingRank: 2,
  },
  {
    sku: 'SKU-003',
    name: 'Kopi Kapal Api Special Mix (Renteng)',
    category: 'Minuman',
    depoStock: 220,
    safetyStock: 60,
    reorderPoint: 100,
    unit: 'renteng',
    status: 'Aman',
    daysOfInventory: 18,
    fastMovingRank: 3,
  },
  {
    sku: 'SKU-004',
    name: 'Susu Ultra Milk UHT 1L Full Cream',
    category: 'Minuman',
    depoStock: 0,
    safetyStock: 25,
    reorderPoint: 40,
    unit: 'kotak',
    status: 'Habis',
    daysOfInventory: 0,
    fastMovingRank: 4,
  },
  {
    sku: 'SKU-005',
    name: 'Gula Pasir Gulaku Tebu 1kg',
    category: 'Sembako',
    depoStock: 8,
    safetyStock: 20,
    reorderPoint: 35,
    unit: 'bungkus',
    status: 'Kritis',
    daysOfInventory: 2,
    fastMovingRank: 5,
  },
  {
    sku: 'SKU-006',
    name: 'Teh Botol Sosro Kotak 250ml (Karton)',
    category: 'Minuman',
    depoStock: 60,
    safetyStock: 20,
    reorderPoint: 30,
    unit: 'karton',
    status: 'Aman',
    daysOfInventory: 9,
    fastMovingRank: 6,
  },
];

// Supervisor Approval Requests
interface ApprovalItem {
  id: string;
  type: 'NOO' | 'Discount' | 'Retur';
  title: string;
  submitter: string;
  detail: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: 'APV-001',
    type: 'NOO',
    title: 'Pendaftaran Outlet Baru: Minimarket Barokah (Cimahi)',
    submitter: 'Andi Pratama (Sales)',
    detail: 'Pengecekan geotag GPS telah lolos validasi otomatis 18 meter dari lokasi toko.',
    date: '06 Sep 2026 16:30',
    status: 'pending',
  },
  {
    id: 'APV-002',
    type: 'Discount',
    title: 'Diskon Tambahan Grosir Khusus 12% (> Rp 5.000.000)',
    submitter: 'Budi Santoso (Sales)',
    detail: 'Pengajuan diskon kuota grosir untuk Toko Sumber Berkah pembelian 80 pouch minyak.',
    date: '07 Sep 2026 09:30',
    status: 'pending',
  },
  {
    id: 'APV-003',
    type: 'Retur',
    title: 'Klaim Retur Barang Rusak: Minyak Bocor (2 Pouch)',
    submitter: 'Siti Rahmawati (Sales)',
    detail: 'Toko Sumber Berkah meminta penggantian barang lot rusak segel pabrik.',
    date: '07 Sep 2026 10:15',
    status: 'pending',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Supervisor Active Tab: 'performance' | 'outlets' | 'stock' | 'approvals'
  const [activeSupervisorTab, setActiveSupervisorTab] = useState<
    'performance' | 'outlets' | 'stock' | 'approvals'
  >('performance');

  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('All');
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [toastMsg, setToastMsg] = useState('');

  const salesList: SalesData[] = salesRaw;

  // Retrieve user session without cascading renders
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

  // Auth guard redirect if no session
  useEffect(() => {
    if (isClient && !Cookies.get(SESSION_KEY)) {
      router.push('/login');
    }
  }, [isClient, router]);

  // Distinct areas
  const areas = ['All', ...Array.from(new Set(salesList.map((item) => item.area)))];

  // Filtered sales list
  const filteredSales = useMemo(() => {
    return salesList.filter((item) => {
      const matchSearch = item.nama_sales.toLowerCase().includes(search.toLowerCase());
      const matchArea = selectedArea === 'All' || item.area === selectedArea;
      return matchSearch && matchArea;
    });
  }, [search, selectedArea, salesList]);

  // Aggregate statistics
  const summary = useMemo(() => {
    const totalPlanned = filteredSales.reduce((acc, curr) => acc + curr.kunjungan_planned, 0);
    const totalVisit = filteredSales.reduce((acc, curr) => acc + curr.kunjungan_realisasi, 0);
    const totalOrderRp = filteredSales.reduce((acc, curr) => acc + curr.total_order_rp, 0);
    const totalOos = filteredSales.reduce((acc, curr) => acc + curr.jumlah_order_oos, 0);
    const avgEffectiveness = filteredSales.length
      ? Math.round(
          filteredSales.reduce((acc, curr) => acc + curr.efektivitas_visit_persen, 0) /
            filteredSales.length
        )
      : 0;

    return { totalPlanned, totalVisit, totalOrderRp, totalOos, avgEffectiveness };
  }, [filteredSales]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedArea('All');
  };

  const handleApprovalAction = (id: string, action: 'approved' | 'rejected') => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
    const text = action === 'approved' ? 'disetujui' : 'ditolak';
    setToastMsg(`Pengajuan ${id} berhasil ${text} oleh Supervisor!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  if (!isClient || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Memuat Dashboard Analisa...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMsg}</p>
        </div>
      )}

      {/* Top Banner: Greeting & Period */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Monitoring, Supervisi & Dashboard Analisa
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Supervisor Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kendali terpusat untuk memantau performa salesman lapangan, profil keuangan outlet, dan stok gudang distribusi
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-600 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-slate-800">Periode Aktif: September 2026</span>
        </div>
      </div>

      {/* Supervisor Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSupervisorTab('performance')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSupervisorTab === 'performance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>1. Analisa Performa Salesman</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSupervisorTab('outlets')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSupervisorTab === 'outlets'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>2. Profil & Audit Outlet 360°</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSupervisorTab('stock')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSupervisorTab === 'stock'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>3. Monitoring Stok Gudang & Depo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSupervisorTab('approvals')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSupervisorTab === 'approvals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. Meja Persetujuan Supervisi</span>
          {approvals.filter((a) => a.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
              {approvals.filter((a) => a.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ANALISA PERFORMA SALESMAN (Original Core Features) */}
      {/* ========================================================================= */}
      {activeSupervisorTab === 'performance' && (
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
              value={`Rp ${(summary.totalOrderRp / 1000000).toFixed(1)} jt`}
              icon={<CreditCard className="w-5 h-5 text-violet-600" />}
              variant="violet"
              trend={{
                value: 'Aktif',
                isPositive: true,
                label: 'omset tercatat',
              }}
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

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 flex">
              <div className="w-full">
                <PerformanceGraph data={filteredSales} />
              </div>
            </div>

            <div className="lg:col-span-5 flex">
              <div className="w-full">
                <SalesPieChart data={filteredSales} />
              </div>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama sales..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2.5">
              <div className="flex flex-row items-center gap-2">
                <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Area:
                </span>

                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                >
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area === 'All' ? 'Semua Wilayah' : area}
                    </option>
                  ))}
                </select>
              </div>

              {(search || selectedArea !== 'All') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Sales Table */}
          <SalesTable data={filteredSales} onResetFilters={handleResetFilters} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROFIL & AUDIT OUTLET 360° */}
      {/* ========================================================================= */}
      {activeSupervisorTab === 'outlets' && (
        <div className="space-y-6">
          {/* Quick Metrics for Outlets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Limit Kredit Diberikan</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">Rp 93.000.000</p>
              <p className="text-[11px] text-emerald-600 mt-1">Terbagi ke 5 Outlet Binaan</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Piutang Berjalan (Outstanding)</span>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">Rp 60.800.000</p>
              <p className="text-[11px] text-slate-500 mt-1">Utilisasi Kredit: 65.3% (Aman)</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Kepatuhan Pembayaran Rata-rata</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">85.6%</p>
              <p className="text-[11px] text-amber-600 mt-1">1 Toko Mendekati Batas Plafon</p>
            </div>
          </div>

          {/* Outlets Profiling Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Daftar Profil Finansial & Audit Outlet</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supervisor memantau batas limit kredit, riwayat piutang berjalan, dan tingkat kepatuhan tempo toko
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
                Data Terverifikasi Backoffice
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Nama Toko / Outlet</th>
                    <th className="p-3.5">Wilayah & Kategori</th>
                    <th className="p-3.5 text-right">Plafon Kredit</th>
                    <th className="p-3.5 text-right">Piutang Aktif</th>
                    <th className="p-3.5 text-center">Kepatuhan TOP</th>
                    <th className="p-3.5 text-center">Skor Risiko</th>
                    <th className="p-3.5 text-center">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {OUTLET_PROFILES_DATA.map((item) => {
                    const isOverLimit = item.auditStatus === 'Over Limit';
                    const isWarning = item.auditStatus === 'Perlu Follow-up';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {item.id} • Pemilik: {item.owner}
                          </p>
                        </td>

                        <td className="p-3.5">
                          <span className="font-medium text-slate-800">{item.category}</span>
                          <span className="block text-[10px] text-slate-400">{item.area}</span>
                        </td>

                        <td className="p-3.5 text-right font-medium text-slate-700">
                          Rp {item.creditLimitRp.toLocaleString('id-ID')}
                        </td>

                        <td className="p-3.5 text-right font-bold text-slate-900">
                          Rp {item.currentReceivableRp.toLocaleString('id-ID')}
                        </td>

                        <td className="p-3.5 text-center font-bold text-slate-800">
                          {item.paymentCompliancePercent}%
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block w-6 h-6 rounded-full text-[11px] font-extrabold leading-6 ${
                              item.riskGrade === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.riskGrade === 'B'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.riskGrade}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isOverLimit
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isWarning
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.auditStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MONITORING STOK GUDANG & DEPO TERPUSAT */}
      {/* ========================================================================= */}
      {activeSupervisorTab === 'stock' && (
        <div className="space-y-6">
          {/* Stock Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total SKU Terdaftar di Depo</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">6 Produk FMCG</p>
              <p className="text-[11px] text-slate-400 mt-1">Gudang Distribusi Utama Bandung</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Produk Out of Stock (OOS)</span>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">2 SKU</p>
              <p className="text-[11px] text-rose-600 mt-1">Beras Pandan Wangi & Susu Ultra Milk</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">SKU Mendekati Reorder Point</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">1 SKU</p>
              <p className="text-[11px] text-amber-700 mt-1">Gula Pasir Gulaku (Sisa 8 bungkus)</p>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Monitoring Stok Gudang & Ambang Batas Keselamatan (Safety Stock)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supervisor memantau ketersediaan fisik, titik pemesanan ulang (ROP), dan estimasi ketahanan stok
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                Realtime Sync Depo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">SKU & Nama Produk</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5 text-center">Stok Fisik Depo</th>
                    <th className="p-3.5 text-center">Safety Stock</th>
                    <th className="p-3.5 text-center">Reorder Point (ROP)</th>
                    <th className="p-3.5 text-center">Ketahanan Stok</th>
                    <th className="p-3.5 text-center">Status Gudang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {WAREHOUSE_STOCKS_DATA.map((item) => {
                    const isHabis = item.status === 'Habis';
                    const isKritis = item.status === 'Kritis';
                    return (
                      <tr key={item.sku} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.sku}</p>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-medium">
                            {item.category}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {item.depoStock} {item.unit}
                          </span>
                        </td>

                        <td className="p-3.5 text-center text-slate-600 font-medium">
                          {item.safetyStock} {item.unit}
                        </td>

                        <td className="p-3.5 text-center text-slate-600 font-medium">
                          {item.reorderPoint} {item.unit}
                        </td>

                        <td className="p-3.5 text-center font-semibold text-slate-700">
                          {item.daysOfInventory > 0 ? `${item.daysOfInventory} Hari` : '0 Hari (OOS)'}
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isHabis
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isKritis
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MEJA PERSETUJUAN SUPERVISI (SUPERVISOR APPROVALS) */}
      {/* ========================================================================= */}
      {activeSupervisorTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Panel Pengesahan & Otorisasi Supervisor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Persetujuan terpusat untuk pendaftaran outlet baru (NOO), diskon pesanan di atas wewenang sales, dan klaim retur barang
              </p>
            </div>

            <div className="space-y-3">
              {approvals.map((item) => {
                const isPending = item.status === 'pending';
                const isApproved = item.status === 'approved';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-slate-50 border-slate-200'
                        : isApproved
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600 text-xs">{item.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                            {item.type}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{item.title}</span>
                        </div>

                        <p className="text-xs text-slate-600">{item.detail}</p>

                        <p className="text-[11px] text-slate-400">
                          Diajukan oleh: <strong>{item.submitter}</strong> • {item.date}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprovalAction(item.id, 'rejected')}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprovalAction(item.id, 'approved')}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui Otorisasi</span>
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {isApproved ? 'Telah Disetujui' : 'Telah Ditolak'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}