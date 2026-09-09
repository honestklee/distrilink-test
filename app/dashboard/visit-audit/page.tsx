'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Cookies from 'js-cookie';
import { CalendarDays, ClipboardCheck, MapPin, Search, UserCheck } from 'lucide-react';
import {
  getStoredVisitLogs,
  normalizeVisitDate,
  STORAGE_SYNC_EVENT,
  OutletVisitLog,
} from '@/lib/storage';
import { UserSession } from '@/types/auth';

const SESSION_KEY = 'user_session';
const emptySubscribe = () => () => {};
const pageSize = 8;

export default function VisitAuditPage() {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [visitLogs, setVisitLogs] = useState<OutletVisitLog[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const activeArea = user?.area || 'All';

  useEffect(() => {
    const syncData = () => setVisitLogs(getStoredVisitLogs());
    syncData();
    window.addEventListener(STORAGE_SYNC_EVENT, syncData);
    return () => window.removeEventListener(STORAGE_SYNC_EVENT, syncData);
  }, []);

  const scopedVisitLogs = useMemo(() => {
    return visitLogs.filter(
      (log) => activeArea === 'All' || log.area.toLowerCase() === activeArea.toLowerCase()
    );
  }, [activeArea, visitLogs]);

  const dateFilteredVisitLogs = useMemo(() => {
    return scopedVisitLogs.filter(
      (log) => !selectedDate || normalizeVisitDate(log.date) === selectedDate
    );
  }, [scopedVisitLogs, selectedDate]);

  const filteredVisitLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return dateFilteredVisitLogs.filter(
      (log) =>
        !query ||
        log.outletName.toLowerCase().includes(query) ||
        log.salesName.toLowerCase().includes(query) ||
        log.area.toLowerCase().includes(query)
    );
  }, [dateFilteredVisitLogs, search]);

  const totalPages = Math.max(1, Math.ceil(filteredVisitLogs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedVisitLogs = filteredVisitLogs.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );
  const totalOrderValue = dateFilteredVisitLogs.reduce(
    (total, log) => total + (Number(log.orderValueRp) || 0),
    0
  );

  if (!isClient || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Memuat audit kunjungan...</p>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Audit Kunjungan Salesman
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor hasil kunjungan outlet, catatan lapangan, dan nilai taking order salesman.
              </p>
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
          <MapPin className="w-3.5 h-3.5" /> Wilayah: {activeArea}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500">Total Kunjungan Tercatat</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{dateFilteredVisitLogs.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {selectedDate ? `Tanggal ${selectedDate}` : `Area ${activeArea}`}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500">Total Nilai Taking Order</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            Rp {totalOrderValue.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dari seluruh kunjungan wilayah</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500">Salesman Aktif di Audit</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
            {new Set(dateFilteredVisitLogs.map((log) => log.salesId)).size}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Berdasarkan log kunjungan</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" /> Hasil Audit Kunjungan Outlet
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nama toko, tanggal, nilai taking order, wilayah, salesman, dan catatan kunjungan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <label className="relative flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span className="sr-only">Filter tanggal kunjungan</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent outline-none text-xs text-slate-700"
                aria-label="Filter tanggal kunjungan"
              />
            </label>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari toko atau salesman..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Nama Toko</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Salesman</th>
                <th className="p-3.5">Wilayah</th>
                <th className="p-3.5 text-right">Nilai Taking Order</th>
                <th className="p-3.5">Catatan Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedVisitLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    Belum ada hasil kunjungan{selectedDate ? ` pada ${selectedDate}` : ''} di wilayah {activeArea}.
                  </td>
                </tr>
              ) : (
                paginatedVisitLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{log.outletName}</p>
                      <p className="text-[10px] text-slate-400">{log.outletId}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-600" /> {log.date}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{log.salesName}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                        {log.area}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-700">
                      Rp {Number(log.orderValueRp).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs">{log.notes || 'Tidak ada catatan.'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredVisitLogs.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
            <span>
              Menampilkan {(safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, filteredVisitLogs.length)} dari {filteredVisitLogs.length} kunjungan
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:pointer-events-none"
              >
                Sebelumnya
              </button>
              <span className="font-semibold text-slate-700">{safePage} / {totalPages}</span>
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:pointer-events-none"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
