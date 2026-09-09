'use client';

import { Calendar, ShieldCheck } from 'lucide-react';
import { UserSession } from '@/types/auth';

const MONTHS: [string, string][] = [
  ['01', 'Januari'], ['02', 'Februari'], ['03', 'Maret'],
  ['04', 'April'],   ['05', 'Mei'],      ['06', 'Juni'],
  ['07', 'Juli'],    ['08', 'Agustus'],  ['09', 'September'],
  ['10', 'Oktober'], ['11', 'November'], ['12', 'Desember'],
];

const YEARS = ['2025', '2026', '2027'];

interface Props {
  user: UserSession | null;
  periodMonth: string;
  periodYear: string;
  pendingCount: number;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
}

export default function DashboardBanner({
  user,
  periodMonth,
  periodYear,
  pendingCount,
  onMonthChange,
  onYearChange,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Title row + period picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Monitoring, Supervisi &amp; Dashboard Analisa
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
          <span className="font-semibold text-slate-800">Periode:</span>
          <select
            value={periodMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            aria-label="Pilih bulan dashboard"
          >
            {MONTHS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={periodYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            aria-label="Pilih tahun dashboard"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Territory RBAC banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-linear-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/90 rounded-2xl border border-indigo-200/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-indigo-950 text-sm">
                Wilayah Otorisasi Supervisi: {user?.area || 'Semua Wilayah'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200/70 text-indigo-900">
                Terisolasi RBAC Wilayah
              </span>
            </div>
            <p className="text-slate-600 mt-0.5">
              Anda mengotorisasi pengajuan toko baru (NOO), plafon kredit, dan pesanan taking order di area{' '}
              <strong>{user?.area || 'Wilayah Aktif'}</strong>. Pengajuan dari wilayah lain otomatis diarahkan ke supervisor cabang bersangkutan.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 sm:self-center">
          <span className="px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-[11px] font-bold text-indigo-700 shadow-2xs">
            {pendingCount} Tiket Perlu Tindakan
          </span>
        </div>
      </div>
    </div>
  );
}
