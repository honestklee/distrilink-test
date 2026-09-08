'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';

import salesRepsRaw from '@/data/sales-reps.json';
import initialStopsRaw from '@/data/route-stops.json';
import {
  getStoredRouteStops,
  setStoredRouteStops,
  getStoredActivityLogs,
  addActivityLogItem,
  getStoredSalesReps,
  setStoredSalesReps,
  STORAGE_SYNC_EVENT,
  RouteStop,
  SalesPerson,
  ActivityLogItem,
} from '@/lib/storage';

const STOP_MAP_POSITIONS: Record<string, { x: number; y: number; svgX: number; svgY: number }> = {
  'STP-01': { x: 14, y: 74, svgX: 84, svgY: 222 },
  'STP-02': { x: 29, y: 58, svgX: 174, svgY: 174 },
  'STP-03': { x: 45, y: 43, svgX: 270, svgY: 129 },
  'STP-04': { x: 61, y: 32, svgX: 366, svgY: 96 },
  'STP-05': { x: 77, y: 20, svgX: 462, svgY: 60 },
  'STP-06': { x: 89, y: 38, svgX: 534, svgY: 114 },
};

export default function RouteTrackingPage() {
  const [selectedSalesId, setSelectedSalesId] = useState('SLM-001');
  const [stops, setStops] = useState<RouteStop[]>(initialStopsRaw as RouteStop[]);
  const [salesList, setSalesList] = useState<SalesPerson[]>(salesRepsRaw as SalesPerson[]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [activeModalStop, setActiveModalStop] = useState<RouteStop | null>(null);
  const [modalAction, setModalAction] = useState<'checkin' | 'checkout' | null>(null);
  const [modalNote, setModalNote] = useState('');
  const [modalOrderValue, setModalOrderValue] = useState('');
  const [feedbackToast, setFeedbackToast] = useState('');

  // Sync with persistent localStorage
  useEffect(() => {
    const syncData = () => {
      setStops(getStoredRouteStops());
      setSalesList(getStoredSalesReps());
      setActivityLogs(getStoredActivityLogs());
    };

    syncData();
    window.addEventListener(STORAGE_SYNC_EVENT, syncData);
    return () => window.removeEventListener(STORAGE_SYNC_EVENT, syncData);
  }, []);

  const currentSales = salesList.find((s) => s.id === selectedSalesId) || salesList[0];

  // Full Planned Sequential Route Corridor
  const fullPlannedRouteD = 'M 84 222 L 174 174 L 270 129 L 366 96 L 462 60 L 534 114';

  // Traversed route path: connects completed stops and active in-progress stop
  const visitedStopsList = stops.filter((s) => s.status === 'completed' || s.status === 'in_progress');
  const traversedRouteD =
    visitedStopsList.length >= 2
      ? visitedStopsList.reduce((acc, s, idx) => {
          const pt = STOP_MAP_POSITIONS[s.id];
          if (!pt) return acc;
          return idx === 0 ? `M ${pt.svgX} ${pt.svgY}` : `${acc} L ${pt.svgX} ${pt.svgY}`;
        }, '')
      : '';

  // Calculated metrics
  const completedCount = stops.filter((s) => s.status === 'completed').length;
  const inProgressCount = stops.filter((s) => s.status === 'in_progress').length;
  const totalStops = stops.length;
  const progressPercent = Math.round(((completedCount + inProgressCount * 0.5) / totalStops) * 100);
  const totalOrderGenerated = stops.reduce((acc, s) => acc + (s.orderValueRp || 0), 0);

  // Handle Check-in
  const handleOpenCheckIn = (stop: RouteStop) => {
    setActiveModalStop(stop);
    setModalAction('checkin');
    setModalNote('');
  };

  // Handle Check-out
  const handleOpenCheckOut = (stop: RouteStop) => {
    setActiveModalStop(stop);
    setModalAction('checkout');
    setModalNote(stop.notes || '');
    setModalOrderValue(stop.orderValueRp ? String(stop.orderValueRp) : '750000');
  };

  const handleConfirmAction = () => {
    if (!activeModalStop || !modalAction) return;

    const currentTimeStr =
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';

    let updatedStops: RouteStop[] = [];

    if (modalAction === 'checkin') {
      updatedStops = stops.map((s) =>
        s.id === activeModalStop.id
          ? {
              ...s,
              status: 'in_progress' as const,
              actualCheckIn: currentTimeStr,
              notes: modalNote || 'Sales telah check-in di outlet sesuai geotag.',
            }
          : s
      );
      setStops(updatedStops);
      setStoredRouteStops(updatedStops);

      // Add activity log
      addActivityLogItem({
        id: `LOG-${Date.now()}`,
        title: `Check-in ${activeModalStop.outletName}`,
        detail: `${currentTimeStr} • Geotag radius 14m (Valid)`,
        type: 'checkin',
        time: currentTimeStr,
      });

      // Update salesman live status
      const updatedSales = salesList.map((sales) =>
        sales.id === selectedSalesId
          ? {
              ...sales,
              currentStatus: `Sedang di ${activeModalStop.outletName}`,
              lastPing: currentTimeStr,
            }
          : sales
      );
      setSalesList(updatedSales);
      setStoredSalesReps(updatedSales);

      setFeedbackToast(`Check-in berhasil di ${activeModalStop.outletName} (${currentTimeStr})`);
    } else if (modalAction === 'checkout') {
      const orderVal = Number(modalOrderValue) || 0;
      updatedStops = stops.map((s) =>
        s.id === activeModalStop.id
          ? {
              ...s,
              status: 'completed' as const,
              actualCheckOut: currentTimeStr,
              durationMinutes: 38,
              orderValueRp: orderVal,
              notes: modalNote || 'Kunjungan selesai dan taking order berhasil dicatat.',
            }
          : s
      );
      setStops(updatedStops);
      setStoredRouteStops(updatedStops);

      // Add activity log
      addActivityLogItem({
        id: `LOG-${Date.now()}`,
        title: `Check-out ${activeModalStop.outletName}`,
        detail: `${currentTimeStr} • Kunjungan selesai, PO: Rp ${orderVal.toLocaleString('id-ID')}`,
        type: 'checkout',
        time: currentTimeStr,
      });

      // Update salesman live status
      const updatedSales = salesList.map((sales) =>
        sales.id === selectedSalesId
          ? {
              ...sales,
              currentStatus: 'Menuju titik rute berikutnya',
              lastPing: currentTimeStr,
            }
          : sales
      );
      setSalesList(updatedSales);
      setStoredSalesReps(updatedSales);

      setFeedbackToast(
        `Check-out berhasil di ${activeModalStop.outletName}. PO: Rp ${orderVal.toLocaleString('id-ID')}`
      );
    }

    setActiveModalStop(null);
    setModalAction(null);
    setTimeout(() => setFeedbackToast(''), 4000);
  };

  return (
    <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 font-sans">
      {/* Toast notification */}
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
                Pemantauan rute harian, kepatuhan jadwal check-in/check-out outlet, dan pelacakan GPS realtime
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Sales Selector & Date */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Sales:</span>
            <select
              value={selectedSalesId}
              onChange={(e) => setSelectedSalesId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              {salesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.area})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800">07 Sep 2026</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">Hari Ini</span>
          </div>
        </div>
      </div>

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
                {currentSales.area}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
              <span>{currentSales.vehicle} ({currentSales.plateNumber})</span>
              <span>•</span>
              <span className="text-blue-300">{currentSales.phone}</span>
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{currentSales.currentStatus}</span>
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
            <p className="text-sm font-bold text-white mt-0.5">{currentSales.batteryLevel}% (Stabil)</p>
          </div>

          <div className="bg-white/5 rounded-2xl px-4 py-2.5 border border-white/10">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>Sinyal GPS Satelit</span>
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
            <span>Realisasi Kunjungan</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {completedCount} <span className="text-xs text-slate-400 font-normal">/ {totalStops} outlet</span>
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / totalStops) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Efektivitas Rute Harian</span>
            <Route className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{progressPercent}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Target selesai: 17:00 WIB</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Nilai Order Di Rute</span>
            <Store className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            Rp {(totalOrderGenerated / 1000000).toFixed(2)} jt
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">2 PO Taking Order Terverifikasi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Estimasi Jarak Tempuh</span>
            <Navigation className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">18.4 km</p>
          <p className="text-[11px] text-slate-400 mt-1">Odometer terhitung via GPS Guard</p>
        </div>
      </div>

      {/* Main Grid: Left = Interactive Daily Itinerary, Right = Simulated Map & Live Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Daily Itinerary List (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Urutan Rute Kunjungan Harian ({stops.length} Titik)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sales melakukan check-in saat tiba di radius outlet dan check-out setelah taking order
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              Rute Reguler Senin
            </span>
          </div>

          {/* Stops List */}
          <div className="divide-y divide-slate-100 p-3 sm:p-4 space-y-3">
            {stops.map((stop) => {
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
                          <span>Jadwal: {stop.scheduledTime}</span>
                          {stop.durationMinutes && (
                            <>
                              <span>•</span>
                              <span className="text-blue-700 font-semibold">Durasi: {stop.durationMinutes} menit</span>
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
            })}
          </div>
        </div>

        {/* Right: Simulated Interactive Map & Live Timeline (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Simulated Route Map Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>Simulasi Peta Geospasial Rute</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Satelit
              </span>
            </div>

            {/* Stylized Simulated Map Surface */}
            <div className="relative h-80 bg-gradient-to-br from-slate-100 via-slate-200/80 to-blue-50/70 overflow-hidden flex items-center justify-center p-4">
              {/* Grid Lines to simulate map coordinate mesh */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #3b82f6 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
                  backgroundSize: '24px 24px, 48px 48px, 48px 48px',
                }}
              />

              {/* Realistic Connected Route Simulation SVG */}
              <svg
                viewBox="0 0 600 300"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Layer 1: Road Base Corridor (Clean arterial road) */}
                <path
                  d={fullPlannedRouteD}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Layer 2: Road Inner Surface */}
                <path
                  d={fullPlannedRouteD}
                  fill="none"
                  stroke="#f8fafc"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Layer 3: Planned / Future Route Guide (Dashed slate) */}
                <path
                  d={fullPlannedRouteD}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Layer 4: Visited / Completed Route Line (Solid Emerald Green) */}
                {traversedRouteD && (
                  <>
                    <path
                      d={traversedRouteD}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={traversedRouteD}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.8"
                    />
                  </>
                )}
              </svg>

              {/* Dynamic Map Pins for all 6 stops */}
              {stops.map((stop) => {
                const pos = STOP_MAP_POSITIONS[stop.id] || { x: 50, y: 50, svgX: 300, svgY: 150 };
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
                      if (isInProgress) {
                        handleOpenCheckOut(stop);
                      } else if (stop.status === 'waiting') {
                        handleOpenCheckIn(stop);
                      }
                    }}
                    title={`${stop.outletName} (${isCompleted ? 'Selesai Dikunjungi' : isInProgress ? 'Sedang Dikunjungi' : 'Menunggu Kunjungan'})`}
                  >
                    {/* Animated Radar Pulse for active in-progress visit */}
                    {isInProgress && (
                      <div className="absolute -inset-2.5 rounded-full bg-blue-500/35 animate-ping pointer-events-none" />
                    )}

                    {/* Pin Marker Circle */}
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

                    {/* Pin Label Badge */}
                    <span
                      className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap pointer-events-none transition-all ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
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

              {/* Map Floating Info Badge */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl shadow-md border border-slate-200 text-xs text-slate-700 z-30">
                <p className="font-bold text-slate-900">Area Wilayah: Bandung Kota</p>
                <p className="text-[10px] text-slate-500">Koordinat GPS: -6.9084, 107.6022</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Anti-Mock GPS Aktif (Sensor Fisik)
              </span>
              <span className="font-semibold text-blue-700">Rute Terverifikasi</span>
            </div>
          </div>

          {/* Timeline Aktivitas Lapangan */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Log Aktivitas Harian Sales</span>
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

      {/* Action Modal (Check-in / Check-out) */}
      {activeModalStop && modalAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  modalAction === 'checkin' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {modalAction === 'checkin' ? <Play className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {modalAction === 'checkin' ? 'Konfirmasi Check-in Kunjungan' : 'Konfirmasi Check-out & Selesai'}
                </h3>
                <p className="text-xs text-slate-500">{activeModalStop.outletName}</p>
              </div>
            </div>

            {/* Geotag guard confirmation */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>GPS Sales terverifikasi dalam radius 22 meter dari geotag toko (Valid).</span>
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
                  Catatan Kunjungan / Evaluasi Display:
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
