'use client';

import { useState } from 'react';
import {
  Layers,
  Building2,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Filter,
} from 'lucide-react';

interface BranchData {
  id: string;
  name: string;
  region: string;
  supervisor: string;
  salesTeamCount: number;
  outletsCount: number;
  targetOmsetRp: number;
  realizationOmsetRp: number;
  achievementPercent: number;
  oosRatePercent: number;
  returRatePercent: number;
  syncLatencyMs: number;
  lastSync: string;
  status: 'online' | 'syncing' | 'delayed';
}

const BRANCHES_DATA: BranchData[] = [
  {
    id: 'HUB-BDG',
    name: 'Hub Jawa Barat (Bandung)',
    region: 'Jawa Barat',
    supervisor: 'Irwan Setiawan, S.E.',
    salesTeamCount: 18,
    outletsCount: 385,
    targetOmsetRp: 420000000,
    realizationOmsetRp: 470400000,
    achievementPercent: 112,
    oosRatePercent: 2.1,
    returRatePercent: 0.8,
    syncLatencyMs: 18,
    lastSync: 'Baru saja',
    status: 'online',
  },
  {
    id: 'HUB-JKT',
    name: 'Hub DKI Jakarta & Banten',
    region: 'Jabodetabek',
    supervisor: 'Hendro Wijaya',
    salesTeamCount: 24,
    outletsCount: 512,
    targetOmsetRp: 550000000,
    realizationOmsetRp: 539000000,
    achievementPercent: 98,
    oosRatePercent: 3.4,
    returRatePercent: 1.2,
    syncLatencyMs: 24,
    lastSync: '1 menit lalu',
    status: 'online',
  },
  {
    id: 'HUB-SBY',
    name: 'Hub Jawa Timur (Surabaya)',
    region: 'Jawa Timur',
    supervisor: 'Agus Santoso',
    salesTeamCount: 16,
    outletsCount: 340,
    targetOmsetRp: 360000000,
    realizationOmsetRp: 374400000,
    achievementPercent: 104,
    oosRatePercent: 4.8,
    returRatePercent: 0.9,
    syncLatencyMs: 31,
    lastSync: '2 menit lalu',
    status: 'online',
  },
  {
    id: 'HUB-SMG',
    name: 'Hub Jawa Tengah (Semarang)',
    region: 'Jawa Tengah',
    supervisor: 'Bambang Triatmojo',
    salesTeamCount: 12,
    outletsCount: 245,
    targetOmsetRp: 250000000,
    realizationOmsetRp: 232500000,
    achievementPercent: 93,
    oosRatePercent: 2.9,
    returRatePercent: 0.6,
    syncLatencyMs: 29,
    lastSync: '4 menit lalu',
    status: 'online',
  },
  {
    id: 'HUB-MDN',
    name: 'Hub Sumatera Utara (Medan)',
    region: 'Sumatera',
    supervisor: 'Rahmat Hidayat',
    salesTeamCount: 10,
    outletsCount: 198,
    targetOmsetRp: 200000000,
    realizationOmsetRp: 178000000,
    achievementPercent: 89,
    oosRatePercent: 8.5,
    returRatePercent: 1.8,
    syncLatencyMs: 64,
    lastSync: '6 menit lalu',
    status: 'delayed',
  },
];

export default function ConsolidatorPage() {
  const [branches, setBranches] = useState<BranchData[]>(BRANCHES_DATA);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Consolidated national aggregates
  const filteredBranches = branches.filter(
    (b) => selectedRegion === 'All' || b.region === selectedRegion
  );

  const totalNationalRevenue = filteredBranches.reduce((acc, b) => acc + b.realizationOmsetRp, 0);
  const totalNationalTarget = filteredBranches.reduce((acc, b) => acc + b.targetOmsetRp, 0);
  const nationalAchievement = Math.round((totalNationalRevenue / (totalNationalTarget || 1)) * 100);
  const totalNationalOutlets = filteredBranches.reduce((acc, b) => acc + b.outletsCount, 0);
  const totalNationalSalesForce = filteredBranches.reduce((acc, b) => acc + b.salesTeamCount, 0);
  const avgOosRate = (
    filteredBranches.reduce((acc, b) => acc + b.oosRatePercent, 0) / (filteredBranches.length || 1)
  ).toFixed(1);

  const handleSyncAllBranches = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setBranches((prev) =>
        prev.map((b) => ({
          ...b,
          lastSync: 'Baru saja',
          status: 'online',
          syncLatencyMs: Math.floor(Math.random() * 20) + 15,
        }))
      );
      setIsSyncingAll(false);
      setToastMessage('Konsolidasi data 5 Hub distributor nasional berhasil disinkronkan!');
      setTimeout(() => setToastMessage(''), 4000);
    }, 1200);
  };

  const handleExportConsolidatedReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID Cabang,Nama Hub,Region,Supervisor,Outlet,Target (Rp),Realisasi (Rp),Pencapaian (%),OOS (%)\n' +
      filteredBranches
        .map(
          (b) =>
            `${b.id},"${b.name}",${b.region},"${b.supervisor}",${b.outletsCount},${b.targetOmsetRp},${b.realizationOmsetRp},${b.achievementPercent}%,${b.oosRatePercent}%`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Konsolidasi_Nasional_SAP_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Laporan konsolidasi nasional berhasil diunduh (Format CSV/Excel)');
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Smart Portal Data Consolidator (Add-On)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Enterprise Multi-Hub
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pemusatan dan konsolidasi data penjualan, stok depo, dan audit kinerja dari seluruh cabang distributor se-Indonesia
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSyncAllBranches}
            disabled={isSyncingAll}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold transition shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Mengonsolidasi Data...' : 'Sinkronkan Semua Cabang'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportConsolidatedReport}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Laporan Konsolidasi</span>
          </button>
        </div>
      </div>

      {/* Regional Selector & Sync Latency Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">Filter Wilayah Regional:</span>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="All">Seluruh Indonesia (5 Hub)</option>
            <option value="Jawa Barat">Jawa Barat</option>
            <option value="Jabodetabek">Jabodetabek & Banten</option>
            <option value="Jawa Timur">Jawa Timur</option>
            <option value="Jawa Tengah">Jawa Tengah</option>
            <option value="Sumatera">Sumatera</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="text-slate-800 font-semibold">5 dari 5 Cabang Terkoneksi</strong>
          </span>
          <span>•</span>
          <span>Rata-rata Latency: <strong className="text-blue-700 font-mono">28ms</strong></span>
          <span>•</span>
          <span>Backend: <strong className="text-slate-700">SAP S/4HANA Cloud</strong></span>
        </div>
      </div>

      {/* KPI Cards: Consolidated National Figures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Omset Nasional Terkonsolidasi</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            Rp {(totalNationalRevenue / 1000000000).toFixed(2)} Miliar
          </p>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Pencapaian: {nationalAchievement}% dari target</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Outlet Terdaftar Nasional</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {totalNationalOutlets.toLocaleString('id-ID')} toko
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Terverifikasi koordinat geotag</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Kekuatan Salesman Lapangan</span>
            <Globe className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-700 mt-1">
            {totalNationalSalesForce} salesman
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Aktif rute harian serentak</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Rasio Out of Stock (OOS) Rata-rata</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{avgOosRate}%</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Di bawah ambang batas toleransi (5%)</p>
        </div>
      </div>

      {/* Automated Smart AI Insights & Cross-Hub Stock Transfer Recommendations */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Smart Consolidator AI Insights & Optimasi Antar Cabang</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>🚀 Rekomendasi Transfer Stok Antar-Depo</span>
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Hub Surabaya mengalami lonjakan permintaan Minyak Goreng (+28%). Disarankan mengalihkan 250 karton dari surplus stok Hub Semarang untuk mencegah OOS.
            </p>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>🏆 Top Performer Cabang Bulan Ini</span>
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Hub Jawa Barat (Bandung)</strong> mencatat pencapaian tertinggi (112% dari target) berkat penetrasi program diskon volume grosir sembako.
            </p>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
            <p className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>⚠️ Perhatian Khusus Rantai Pasok</span>
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Hub Medan (Sumatera)</strong> memiliki tingkat OOS 8.5% akibat keterlambatan kontainer antar pulau. Estimasi kapal sandar: 09 September 2026.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Branch Performance Comparison Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Matriks Performa Antar Cabang / Distributor ({filteredBranches.length} Hub)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan pencapaian target, rasio stok kosong, tim sales, dan status sinkronisasi
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
            Terkonsolidasi Otomatis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Hub Cabang</th>
                <th className="p-3.5">Supervisor PIC</th>
                <th className="p-3.5 text-center">Tim Sales & Outlet</th>
                <th className="p-3.5 text-right">Target Omset</th>
                <th className="p-3.5 text-right">Realisasi Omset</th>
                <th className="p-3.5 text-center">Pencapaian</th>
                <th className="p-3.5 text-center">Rasio OOS</th>
                <th className="p-3.5 text-center">Koneksi ERP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBranches.map((branch) => {
                const isOverTarget = branch.achievementPercent >= 100;
                return (
                  <tr key={branch.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{branch.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {branch.id} • Wilayah {branch.region}
                      </p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{branch.supervisor}</p>
                      <p className="text-[10px] text-slate-400">Sync: {branch.lastSync}</p>
                    </td>

                    <td className="p-3.5 text-center">
                      <p className="font-bold text-slate-800">{branch.salesTeamCount} Sales</p>
                      <p className="text-[10px] text-slate-500">{branch.outletsCount} Outlet</p>
                    </td>

                    <td className="p-3.5 text-right font-medium text-slate-600">
                      Rp {(branch.targetOmsetRp / 1000000).toFixed(0)} jt
                    </td>

                    <td className="p-3.5 text-right font-bold text-slate-900">
                      Rp {(branch.realizationOmsetRp / 1000000).toFixed(1)} jt
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isOverTarget
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isOverTarget ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-amber-600" />
                        )}
                        {branch.achievementPercent}%
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`font-semibold ${
                          branch.oosRatePercent > 5 ? 'text-rose-600 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {branch.oosRatePercent}%
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {branch.syncLatencyMs}ms
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
