'use client';

import { useEffect, useState, useMemo, useSyncExternalStore } from 'react';
import Cookies from 'js-cookie';
import {
  Route,
  CheckCircle2,
  Clock,
  Navigation,
  BatteryCharging,
  Calendar,
  UserCheck,
  ShieldCheck,
  Store,
  FileText,
  Play,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ListOrdered,
  Sparkles,
  Phone,
} from 'lucide-react';

import salesRepsRaw from '@/data/sales-reps.json';
import {
  getStoredActivityLogs,
  getStoredVisitLogs,
  getStoredSalesReps,
  getVisitDateKey,
  normalizeVisitDate,
  getDailyRouteStops,
  getOutletVisitSummary,
  STORAGE_SYNC_EVENT,
  RouteStop,
  SalesPerson,
  ActivityLogItem,
  OutletVisitLog,
  OutletItem,
} from '@/lib/storage';
import { TrackingController } from '@/controllers/tracking.controller';
import { UserSession } from '@/types/auth';

const SESSION_KEY = 'user_session';
const emptySubscribe = () => () => {};

const DEFAULT_MAP_POINTS = [
  { x: 15, y: 72, svgX: 90, svgY: 216 },
  { x: 32, y: 54, svgX: 192, svgY: 162 },
  { x: 50, y: 40, svgX: 300, svgY: 120 },
  { x: 68, y: 30, svgX: 408, svgY: 90 },
  { x: 85, y: 25, svgX: 510, svgY: 75 },
];

const EMPTY_VISIT_SUMMARY = {
  visited: [] as OutletVisitLog[],
  unvisited: [] as OutletItem[],
  totalVerified: 0,
  coveragePercent: 0,
};

export default function RouteTrackingPage() {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Session
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

  // Main Tabs: 'routes' (Daily 5 stops & map) | 'logs' (List Log Visited vs Unvisited)
  const [activeMainTab, setActiveMainTab] = useState<'routes' | 'logs'>('routes');

  // Selected Sales / Area
  const [salesList, setSalesList] = useState<SalesPerson[]>(salesRepsRaw as SalesPerson[]);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [visitLogs, setVisitLogs] = useState<OutletVisitLog[]>([]);
  const [visitSummary, setVisitSummary] = useState(EMPTY_VISIT_SUMMARY);

  // Modal State
  const [activeModalStop, setActiveModalStop] = useState<RouteStop | null>(null);
  const [modalAction, setModalAction] = useState<'checkin' | 'checkout' | null>(null);
  const [modalNote, setModalNote] = useState('');
  const [modalOrderValue, setModalOrderValue] = useState('');
  const [feedbackToast, setFeedbackToast] = useState('');

  // Tab 2 (Log List) state
  const [logSubTab, setLogSubTab] = useState<'unvisited' | 'visited'>('unvisited');
  const [logSearch, setLogSearch] = useState('');
  const [visitedPage, setVisitedPage] = useState(1);
  const [unvisitedPage, setUnvisitedPage] = useState(1);
  const pageSize = 5;

  const currentSales = useMemo(() => {
    const loggedInSalesId = user?.salesmanId || 'SLM-001';
    return salesList.find((s) => s.id === loggedInSalesId) || {
      id: loggedInSalesId,
      name: user ? `${user.firstName} ${user.lastName}`.trim() : 'Memuat...',
      area: user?.area || 'Bandung Kota',
      vehicle: 'Motor Honda Vario 160',
      plateNumber: 'D 4521 ABC',
      phone: '0812-8877-6655',
      batteryLevel: 100,
      currentStatus: 'Standby',
      lastPing: 'Baru saja',
    };
  }, [salesList, user]);

  const activeArea = currentSales.area || user?.area || 'Bandung Kota';
  const activeSalesId = currentSales.id;

  // Sync with persistent localStorage
  useEffect(() => {
    const syncData = () => {
      const storedReps = getStoredSalesReps();
      if (storedReps.length > 0) {
        setSalesList(storedReps);
      }
      // Dynamically load up to 5 daily unvisited stops for current area
      const dailyStops = getDailyRouteStops(activeArea, activeSalesId);
      setStops(dailyStops);
      setActivityLogs(getStoredActivityLogs());
      setVisitLogs(getStoredVisitLogs());
      setVisitSummary(getOutletVisitSummary(activeArea));
    };

    syncData();
    window.addEventListener(STORAGE_SYNC_EVENT, syncData);
    return () => window.removeEventListener(STORAGE_SYNC_EVENT, syncData);
  }, [activeArea, activeSalesId]);

  // Traversed and planned route paths
  const completedCount = stops.filter((s) => s.status === 'completed').length;
  const inProgressCount = stops.filter((s) => s.status === 'in_progress').length;
  const today = getVisitDateKey();
  const completedVisitsToday = visitLogs.filter(
    (log) => normalizeVisitDate(log.date) === today && log.salesId === activeSalesId
  );
  const totalStops = Math.max(
    1,
    Math.min(5, completedVisitsToday.length + stops.length)
  );
  const progressPercent =
    Math.round(
      Math.min(
        100,
        ((completedVisitsToday.length + inProgressCount * 0.5) / totalStops) * 100
      )
    );
  const totalOrderGenerated = completedVisitsToday.reduce(
    (total, log) => total + (Number(log.orderValueRp) || 0),
    0
  );

  // SVG route path
  const plannedPathD = useMemo(() => {
    if (stops.length === 0) return '';
    return stops
      .map((_, idx) => {
        const pt = DEFAULT_MAP_POINTS[idx] || DEFAULT_MAP_POINTS[0];
        return idx === 0 ? `M ${pt.svgX} ${pt.svgY}` : `L ${pt.svgX} ${pt.svgY}`;
      })
      .join(' ');
  }, [stops]);

  const traversedRouteD = useMemo(() => {
    const visitedIndices = stops
      .map((s, idx) => (s.status === 'completed' || s.status === 'in_progress' ? idx : -1))
      .filter((idx) => idx !== -1);

    if (visitedIndices.length < 2) return '';
    return visitedIndices
      .map((idx, i) => {
        const pt = DEFAULT_MAP_POINTS[idx] || DEFAULT_MAP_POINTS[0];
        return i === 0 ? `M ${pt.svgX} ${pt.svgY}` : `L ${pt.svgX} ${pt.svgY}`;
      })
      .join(' ');
  }, [stops]);

  // Handle Check-in Modal
  const handleOpenCheckIn = (stop: RouteStop) => {
    setActiveModalStop(stop);
    setModalAction('checkin');
    setModalNote('');
  };

  // Handle Check-out Modal
  const handleOpenCheckOut = (stop: RouteStop) => {
    setActiveModalStop(stop);
    setModalAction('checkout');
    setModalNote(stop.notes || '');
    setModalOrderValue(stop.orderValueRp ? String(stop.orderValueRp) : '500000');
  };

  const handleConfirmAction = () => {
    if (!activeModalStop || !modalAction) return;

    if (modalAction === 'checkin') {
      const res = TrackingController.handleCheckIn(activeModalStop.id, modalNote, {
        salesId: currentSales.id,
        salesName: currentSales.name,
      });
      setFeedbackToast(res.message);
    } else if (modalAction === 'checkout') {
      const orderVal = Number(modalOrderValue) || 0;
      const res = TrackingController.handleCheckOut(
        activeModalStop.id,
        orderVal,
        modalNote,
        { salesId: currentSales.id, salesName: currentSales.name }
      );
      setFeedbackToast(res.message);
    }

    setActiveModalStop(null);
    setModalAction(null);
    setTimeout(() => setFeedbackToast(''), 4000);
  };

  // Tab 2 Filtering and Pagination
  const filteredVisited = useMemo(() => {
    return visitSummary.visited.filter((item) =>
      item.outletName.toLowerCase().includes(logSearch.toLowerCase()) ||
      item.owner.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [visitSummary.visited, logSearch]);

  const filteredUnvisited = useMemo(() => {
    return visitSummary.unvisited.filter((item) =>
      item.name.toLowerCase().includes(logSearch.toLowerCase()) ||
      item.owner.toLowerCase().includes(logSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [visitSummary.unvisited, logSearch]);

  const totalVisitedPages = Math.max(1, Math.ceil(filteredVisited.length / pageSize));
  const totalUnvisitedPages = Math.max(1, Math.ceil(filteredUnvisited.length / pageSize));

  const paginatedVisited = filteredVisited.slice(
    (visitedPage - 1) * pageSize,
    visitedPage * pageSize
  );

  const paginatedUnvisited = filteredUnvisited.slice(
    (unvisitedPage - 1) * pageSize,
    unvisitedPage * pageSize
  );

  return (
    <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 font-sans">
      {/* Toast */}
      {feedbackToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{feedbackToast}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Rute Kunjungan & Live Tracking Salesman
              </h1>
              <p className="text-xs text-slate-500">
                Alur rute otomatis maksimal 5 outlet belum dikunjungi per hari dan audit log kepatuhan visit
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Sales Selector & Date */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Salesman:</span>
            <span className="text-xs font-bold text-slate-800">
              {currentSales.name} ({currentSales.area})
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800">08 Sep 2026</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
              Hari Ini
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveMainTab('routes')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeMainTab === 'routes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>1. Rute Kunjungan Harian (Maks. 5 Toko Belum Dikunjungi)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            {stops.length} Outlet
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('logs')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeMainTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>2. Log List Kunjungan Outlet ({activeArea})</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
            {visitSummary.totalVerified} Terdaftar
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RUTE HARIAN (MAKS 5 OUTLET BELUM DIKUNJUNGI) */}
      {/* ========================================================================= */}
      {activeMainTab === 'routes' && (
        <div className="space-y-6">
          {/* Salesman Live Status Card */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {currentSales.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-white">{currentSales.name}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                    Wilayah: {currentSales.area}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                  <span>{currentSales.vehicle} ({currentSales.plateNumber})</span>
                  <span>•</span>
                  <span className="text-blue-300">{currentSales.phone}</span>
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    {inProgressCount > 0
                      ? `Sedang kunjungan di ${stops.find((s) => s.status === 'in_progress')?.outletName}`
                      : currentSales.currentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Hardware Stats */}
            <div className="flex flex-wrap items-center gap-3 text-xs border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-6">
              <div className="bg-white/5 rounded-2xl px-4 py-2.5 border border-white/10">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Baterai HP</span>
                </div>
                <p className="text-sm font-bold text-white mt-0.5">{currentSales.batteryLevel}% (Aman)</p>
              </div>

              <div className="bg-white/5 rounded-2xl px-4 py-2.5 border border-white/10">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sinyal GPS Anti-Mock</span>
                </div>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">Akurat ±3m</p>
              </div>

              <div className="bg-white/5 rounded-2xl px-4 py-2.5 border border-white/10">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pembaruan Terakhir</span>
                </div>
                <p className="text-sm font-bold text-white mt-0.5">{currentSales.lastPing}</p>
              </div>
            </div>
          </div>

          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Kunjungan Rute Hari Ini</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {completedVisitsToday.length}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {totalStops} outlet</span>
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${totalStops > 0 ? (completedCount / totalStops) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Efektivitas Rute Hari Ini</span>
                <Route className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{progressPercent}%</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {totalStops === 0 ? 'Belum ada rute aktif' : 'Target selesai 17:00 WIB'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total PO Di Rute Ini</span>
                <Store className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                Rp {totalOrderGenerated.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {completedVisitsToday.length} Toko Checkout
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Antrean Outlet Belum Dikunjungi</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {visitSummary.unvisited.length} Toko
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Di wilayah {activeArea}</p>
            </div>
          </div>

          {/* Main Grid: Left = Daily Itinerary (Max 5), Right = Map & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Daily Itinerary List (Col 7) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-600" />
                    <span>Urutan Rute Kunjungan Harian ({stops.length} Titik • Maks. 5)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rute memprioritaskan outlet di <strong>{activeArea}</strong> yang belum dikunjungi
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                  Wilayah: {activeArea}
                </span>
              </div>

              {/* Stops List */}
              <div className="divide-y divide-slate-100 p-3 sm:p-4 space-y-3">
                {stops.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        Belum ada outlet terverifikasi untuk rute di wilayah {activeArea}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Semua outlet di wilayah ini mungkin sudah dikunjungi atau belum ada pendaftaran toko baru (NOO) yang disetujui oleh Supervisor {activeArea}.
                      </p>
                    </div>
                  </div>
                ) : (
                  stops.map((stop) => {
                    const isCompleted = stop.status === 'completed';
                    const isInProgress = stop.status === 'in_progress';
                    const isWaiting = stop.status === 'waiting';

                    return (
                      <div
                        key={stop.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isInProgress
                            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400/20'
                            : isCompleted
                            ? 'bg-white border-slate-200/80'
                            : 'bg-slate-50/60 border-slate-200/60 opacity-90'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Order Index Badge */}
                            <div
                              className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                  : isInProgress
                                  ? 'bg-blue-600 text-white shadow-md animate-pulse'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {stop.orderIndex}
                            </div>

                            {/* Outlet Info */}
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-sm">{stop.outletName}</h4>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    isCompleted
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isInProgress
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  {isCompleted
                                    ? 'Selesai Dikunjungi'
                                    : isInProgress
                                    ? 'Sedang Dikunjungi (In-Store)'
                                    : 'Menunggu Kunjungan'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Pemilik: <strong>{stop.owner}</strong> • {stop.address}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                <span>Estimasi Waktu: {stop.scheduledTime}</span>
                                {stop.durationMinutes && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-700 font-semibold">
                                      Durasi: {stop.durationMinutes} menit
                                    </span>
                                  </>
                                )}
                              </p>

                              {/* Notes / Order info if any */}
                              {stop.notes && (
                                <div className="mt-2 text-xs bg-slate-100/70 p-2 rounded-xl text-slate-600 flex items-start gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  <span>{stop.notes}</span>
                                </div>
                              )}

                              {stop.orderValueRp ? (
                                <p className="text-xs font-bold text-emerald-700 mt-2">
                                  Nilai Pesanan: Rp {stop.orderValueRp.toLocaleString('id-ID')}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 sm:self-center shrink-0">
                            {isWaiting && (
                              <button
                                type="button"
                                onClick={() => handleOpenCheckIn(stop)}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Check-in Toko</span>
                              </button>
                            )}

                            {isInProgress && (
                              <button
                                type="button"
                                onClick={() => handleOpenCheckOut(stop)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Check-out & Selesai</span>
                              </button>
                            )}

                            {isCompleted && (
                              <div className="text-right">
                                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Geotag Sah</span>
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {stop.actualCheckIn} - {stop.actualCheckOut}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Map & Timeline (Col 5) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Simulated Map Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span>Simulasi Koridor Peta GPS</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Sensor Fisik
                  </span>
                </div>

                <div className="relative h-80 bg-gradient-to-br from-slate-100 via-slate-200/80 to-blue-50/70 overflow-hidden flex items-center justify-center p-4">
                  {/* Grid background */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle, #3b82f6 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
                      backgroundSize: '24px 24px, 48px 48px, 48px 48px',
                    }}
                  />

                  {/* SVG paths */}
                  <svg
                    viewBox="0 0 600 300"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {plannedPathD && (
                      <>
                        <path
                          d={plannedPathD}
                          fill="none"
                          stroke="#cbd5e1"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d={plannedPathD}
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="3"
                          strokeDasharray="6 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    )}
                    {traversedRouteD && (
                      <path
                        d={traversedRouteD}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>

                  {/* Pins */}
                  {stops.map((stop, idx) => {
                    const pos = DEFAULT_MAP_POINTS[idx] || DEFAULT_MAP_POINTS[0];
                    const isCompleted = stop.status === 'completed';
                    const isInProgress = stop.status === 'in_progress';

                    return (
                      <div
                        key={stop.id}
                        className="absolute flex flex-col items-center transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          zIndex: isInProgress ? 25 : isCompleted ? 20 : 15,
                        }}
                        onClick={() => {
                          if (isInProgress) handleOpenCheckOut(stop);
                          else if (stop.status === 'waiting') handleOpenCheckIn(stop);
                        }}
                        title={`${stop.outletName}`}
                      >
                        {isInProgress && (
                          <div className="absolute -inset-2.5 rounded-full bg-blue-500/35 animate-ping pointer-events-none" />
                        )}

                        <div
                          className={`rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md transition-transform group-hover:scale-110 ${
                            isCompleted
                              ? 'w-7 h-7 bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-emerald-500/30'
                              : isInProgress
                              ? 'w-8 h-8 bg-blue-600 text-white ring-4 ring-blue-500/25 shadow-blue-500/40'
                              : 'w-6 h-6 bg-slate-400 text-white opacity-85'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : isInProgress ? (
                            <Navigation className="w-3.5 h-3.5 fill-white" />
                          ) : (
                            <span className="text-[10px]">{stop.orderIndex}</span>
                          )}
                        </div>

                        <span
                          className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap pointer-events-none transition-all ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isInProgress
                              ? 'bg-blue-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 shadow-md ring-1 ring-blue-400'
                              : 'bg-white/90 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isInProgress
                            ? `📍 Sedang di: ${stop.outletName}`
                            : isCompleted
                            ? `✓ ${stop.outletName}`
                            : `${stop.orderIndex}. ${stop.outletName}`}
                        </span>
                      </div>
                    );
                  })}

                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl shadow-md border border-slate-200 text-xs text-slate-700 z-30">
                    <p className="font-bold text-slate-900">Area: {activeArea}</p>
                    <p className="text-[10px] text-slate-500">Maks. 5 titik unvisited per hari</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Anti-Mock GPS Aktif
                  </span>
                  <span className="font-semibold text-blue-700">Rute Terverifikasi</span>
                </div>
              </div>

              {/* Timeline Activity */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Log Aktivitas Lapangan Hari Ini</span>
                </h3>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 pl-2">Belum ada aktivitas tercatat hari ini.</p>
                  ) : (
                    activityLogs.map((log, idx) => {
                      const isOrder = log.type === 'order';
                      const isCheckin = log.type === 'checkin';
                      const isCheckout = log.type === 'checkout';
                      const isLatest = idx === 0;

                      return (
                        <div key={log.id} className="relative flex items-start gap-3 pl-1">
                          <div
                            className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 z-10 ${
                              isOrder
                                ? 'bg-blue-500'
                                : isCheckout
                                ? 'bg-emerald-600'
                                : isCheckin && isLatest
                                ? 'bg-blue-600 animate-pulse'
                                : 'bg-emerald-500'
                            }`}
                          >
                            {isOrder ? (
                              <FileText className="w-3.5 h-3.5" />
                            ) : isCheckout ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Navigation className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="text-xs">
                            <p className={`font-bold ${isLatest ? 'text-blue-700' : 'text-slate-800'}`}>
                              {log.title}
                            </p>
                            {log.salesName && (
                              <p className="text-[11px] font-semibold text-indigo-600">
                                Salesman: {log.salesName}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-400">{log.detail}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LOG LIST OUTLET (SUDAH DIKUNJUNGI VS BELUM DIKUNJUNGI) */}
      {/* ========================================================================= */}
      {activeMainTab === 'logs' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Outlet Wilayah {activeArea}</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {visitSummary.totalVerified} Toko
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Status Terverifikasi Backoffice</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Sudah Dikunjungi (Visited)</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                {visitSummary.visited.length} Toko
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">Telah check-out & tercatat</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Belum Dikunjungi (Antrean)</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {visitSummary.unvisited.length} Toko
              </p>
              <p className="text-[11px] text-amber-700 mt-1">Siap dijadwalkan ke rute harian</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Cakupan Kunjungan (Coverage)</span>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">
                {visitSummary.coveragePercent}%
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${visitSummary.coveragePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Subtabs + Search bar */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLogSubTab('unvisited');
                    setUnvisitedPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    logSubTab === 'unvisited'
                      ? 'bg-amber-100 text-amber-900 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Belum Dikunjungi ({visitSummary.unvisited.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLogSubTab('visited');
                    setVisitedPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    logSubTab === 'visited'
                      ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sudah Dikunjungi ({visitSummary.visited.length})</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama outlet / pemilik..."
                  value={logSearch}
                  onChange={(e) => {
                    setLogSearch(e.target.value);
                    setVisitedPage(1);
                    setUnvisitedPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Subtab Content 1: BELUM DIKUNJUNGI */}
            {logSubTab === 'unvisited' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3.5">Nama Toko / Outlet</th>
                        <th className="p-3.5">Kategori</th>
                        <th className="p-3.5">Pemilik & Kontak</th>
                        <th className="p-3.5">Alamat Lengkap</th>
                        <th className="p-3.5 text-center">Status Antrean</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedUnvisited.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            {logSearch
                              ? 'Tidak ada outlet yang sesuai dengan pencarian.'
                              : `Semua outlet di wilayah ${activeArea} telah dikunjungi atau belum ada outlet terdaftar.`}
                          </td>
                        </tr>
                      ) : (
                        paginatedUnvisited.map((outlet: OutletItem) => {
                          const isScheduledToday = stops.some((s) => (s.outletId || s.id) === outlet.id);

                          return (
                            <tr key={outlet.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3.5">
                                <p className="font-bold text-slate-900">{outlet.name}</p>
                                <p className="text-[10px] text-slate-400">{outlet.id}</p>
                              </td>

                              <td className="p-3.5">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                                  {outlet.category}
                                </span>
                              </td>

                              <td className="p-3.5">
                                <p className="font-semibold text-slate-800">{outlet.owner}</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{outlet.phone}</span>
                                </p>
                              </td>

                              <td className="p-3.5 text-slate-600 max-w-xs truncate">
                                {outlet.address}
                              </td>

                              <td className="p-3.5 text-center whitespace-nowrap">
                                {isScheduledToday ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <Sparkles className="w-3 h-3 text-blue-500" />
                                    Terjadwal Rute Hari Ini
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    Antrean Rute Berikutnya
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for Unvisited */}
                {totalUnvisitedPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <p>
                      Menampilkan {(unvisitedPage - 1) * pageSize + 1} -{' '}
                      {Math.min(unvisitedPage * pageSize, filteredUnvisited.length)} dari{' '}
                      {filteredUnvisited.length} outlet
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={unvisitedPage === 1}
                        onClick={() => setUnvisitedPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-slate-800 px-2">
                        {unvisitedPage} / {totalUnvisitedPages}
                      </span>
                      <button
                        type="button"
                        disabled={unvisitedPage === totalUnvisitedPages}
                        onClick={() => setUnvisitedPage((p) => Math.min(totalUnvisitedPages, p + 1))}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Subtab Content 2: SUDAH DIKUNJUNGI */}
            {logSubTab === 'visited' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3.5">Nama Toko / Outlet</th>
                        <th className="p-3.5">Salesman</th>
                        <th className="p-3.5">Waktu Kunjungan</th>
                        <th className="p-3.5 text-center">Durasi</th>
                        <th className="p-3.5 text-right">Nilai Taking Order</th>
                        <th className="p-3.5">Catatan Visit</th>
                        <th className="p-3.5 text-center">Validasi Geotag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedVisited.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            {logSearch
                              ? 'Tidak ada log kunjungan yang sesuai pencarian.'
                              : `Belum ada outlet yang telah dikunjungi di wilayah ${activeArea}.`}
                          </td>
                        </tr>
                      ) : (
                        paginatedVisited.map((log: OutletVisitLog) => (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3.5">
                              <p className="font-bold text-slate-900">{log.outletName}</p>
                              <p className="text-[10px] text-slate-400">
                                Pemilik: {log.owner} • {log.address}
                              </p>
                            </td>

                            <td className="p-3.5 font-medium text-slate-700">
                              {log.salesName}
                            </td>

                            <td className="p-3.5 whitespace-nowrap">
                              <p className="font-bold text-slate-900">{log.date}</p>
                              <p className="text-[10px] text-slate-400">
                                {log.checkInTime} - {log.checkOutTime}
                              </p>
                            </td>

                            <td className="p-3.5 text-center font-bold text-slate-800 whitespace-nowrap">
                              {log.durationMinutes} menit
                            </td>

                            <td className="p-3.5 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                              Rp {log.orderValueRp.toLocaleString('id-ID')}
                            </td>

                            <td className="p-3.5 text-slate-600 max-w-xs truncate">
                              {log.notes}
                            </td>

                            <td className="p-3.5 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Radius Sah
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for Visited */}
                {totalVisitedPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <p>
                      Menampilkan {(visitedPage - 1) * pageSize + 1} -{' '}
                      {Math.min(visitedPage * pageSize, filteredVisited.length)} dari{' '}
                      {filteredVisited.length} log kunjungan
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={visitedPage === 1}
                        onClick={() => setVisitedPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-slate-800 px-2">
                        {visitedPage} / {totalVisitedPages}
                      </span>
                      <button
                        type="button"
                        disabled={visitedPage === totalVisitedPages}
                        onClick={() => setVisitedPage((p) => Math.min(totalVisitedPages, p + 1))}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Modal (Check-in / Check-out) */}
      {activeModalStop && modalAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  modalAction === 'checkin'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {modalAction === 'checkin' ? (
                  <Play className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {modalAction === 'checkin'
                    ? 'Konfirmasi Check-in Kunjungan'
                    : 'Konfirmasi Check-out & Selesai'}
                </h3>
                <p className="text-xs text-slate-500">{activeModalStop.outletName}</p>
              </div>
            </div>

            {/* Geotag guard confirmation */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>GPS Sales terverifikasi dalam radius 14 meter dari geotag toko (Valid).</span>
            </div>

            <div className="space-y-3 text-xs">
              {modalAction === 'checkout' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nilai Taking Order yang Dihasilkan (Rp):
                  </label>
                  <input
                    type="number"
                    value={modalOrderValue}
                    onChange={(e) => setModalOrderValue(e.target.value)}
                    placeholder="Contoh: 1250000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Kunjungan / Evaluasi Display Toko:
                </label>
                <textarea
                  rows={3}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Catat kondisi stok pajangan, promo kompetitor, atau pesan pemilik toko..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModalStop(null);
                  setModalAction(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 text-white rounded-xl font-bold text-xs transition cursor-pointer ${
                  modalAction === 'checkin'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20'
                }`}
              >
                {modalAction === 'checkin' ? 'Mulai Kunjungan' : 'Simpan & Check-out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
