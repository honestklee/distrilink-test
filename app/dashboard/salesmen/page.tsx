'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import Cookies from 'js-cookie';
import {
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Bike,
  Target,
  MapPin,
  Sparkles,
  BatteryCharging,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { SalesmanController, SalesmanRegistrationForm } from '@/controllers/salesman.controller';
import { SalesPerson } from '@/services/sales.service';
import { STORAGE_SYNC_EVENT } from '@/services/storage.service';
import Pagination from '@/components/dashboard/Pagination';
import { UserSession } from '@/types/auth';

const SESSION_KEY = 'user_session';
const emptySubscribe = () => () => {};

export default function SalesmenPage() {
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

  const userArea = user?.area;

  const [salesmen, setSalesmen] = useState<SalesPerson[]>([]);
  const [metrics, setMetrics] = useState({
    totalSalesmen: 0,
    activeOnRoute: 0,
    areasCount: 0,
    avgVisitsPlanned: 20,
  });

  const [search, setSearch] = useState('');
  const [customSelectedArea, setCustomSelectedArea] = useState<string | null>(null);
  const selectedArea = customSelectedArea ?? (userArea && userArea !== 'All' ? userArea : 'All');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [customFormArea, setCustomFormArea] = useState<string | null>(null);
  const formArea = customFormArea ?? (userArea && userArea !== 'All' ? userArea : 'Bandung Kota');
  const [formPhone, setFormPhone] = useState('');
  const [formVehicle, setFormVehicle] = useState('Motor Honda Vario 160');
  const [formPlate, setFormPlate] = useState('');
  const [formVisits, setFormVisits] = useState('20');
  const [formTargetOmset, setFormTargetOmset] = useState('8500000');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize data on mount and on storage events
  useEffect(() => {
    const refreshData = () => {
      const data = SalesmanController.getSalesmen();
      setSalesmen(data);
      setMetrics(SalesmanController.getMetrics(userArea));
    };

    refreshData();
    window.addEventListener(STORAGE_SYNC_EVENT, refreshData);
    return () => window.removeEventListener(STORAGE_SYNC_EVENT, refreshData);
  }, [userArea]);

  // Filter list by search query and area
  const filteredSalesmen = salesmen.filter((rep) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      q === '' ||
      rep.name.toLowerCase().includes(q) ||
      rep.id.toLowerCase().includes(q) ||
      rep.plateNumber.toLowerCase().includes(q);
    const matchArea = selectedArea === 'All' || rep.area === selectedArea;
    return matchSearch && matchArea;
  });

  // Paginated list
  const { items: paginatedSalesmen, totalPages, totalItems } =
    SalesmanController.getPaginatedSalesmen(filteredSalesmen, currentPage, itemsPerPage);

  const handleRegisterSalesman = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const formData: SalesmanRegistrationForm = {
      name: formName,
      username: formUsername,
      password: formPassword,
      area: formArea,
      phone: formPhone,
      vehicle: formVehicle,
      plateNumber: formPlate,
      kunjunganPlanned: formVisits,
      targetOmsetRp: formTargetOmset,
    };

    const validation = SalesmanController.validateRegistration(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = SalesmanController.register(formData);
      setIsSubmitting(false);

      if (res.success && res.data) {
        setToastMessage(
          `Salesman ${res.data.name} (${res.data.id}) berhasil didaftarkan! Kredensial Login SFA: Username: "${res.data.username || res.data.id}" • Password: "${res.data.password || 'password123'}"`
        );

        // Reset form
        setFormName('');
        setFormUsername('');
        setFormPassword('password123');
        setShowPassword(false);
        setFormPhone('');
        setFormPlate('');
        setFormVisits('20');
        setFormTargetOmset('8500000');
        setCustomFormArea(null);
        setFormErrors({});

        // Auto hide toast
        setTimeout(() => setToastMessage(''), 7000);
      } else {
        setToastMessage(res.error || 'Terjadi kesalahan saat mendaftar.');
        setTimeout(() => setToastMessage(''), 5000);
      }
    }, 400);
  };

  return (
    <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Pendaftaran & Manajemen Salesman
            </h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[11px] font-bold">
              Supervisor Module
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registrasi personil sales lapangan baru, penugasan wilayah operasional rute, armada kendaraan, dan target performa SAP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            SAP HR & SFA Connected
          </span>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Salesman Terdaftar</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {metrics.totalSalesmen} Personil
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Terdata di database SFA</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Salesman Aktif Rute</span>
            <Bike className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {metrics.activeOnRoute} Aktif
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">Operasional di lapangan</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Wilayah Operasional</span>
            <MapPin className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-extrabold text-violet-600 mt-2">
            {metrics.areasCount} Area
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cakupan cabang distribusi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Rata-rata Target Kunjungan</span>
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">
            {metrics.avgVisitsPlanned} Toko/Hari
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Standar ritase harian</p>
        </div>
      </div>

      {/* Main Grid: Form Left, Table Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Registration Form (Col 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Form Pendaftaran Salesman</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftarkan akun sales baru untuk penugasan lapangan
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              Otorisasi SPV
            </span>
          </div>

          <form onSubmit={handleRegisterSalesman} className="space-y-3.5 text-xs">
            {/* Nama Lengkap */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap Salesman: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Rian Ramadhan"
                value={formName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormName(val);
                  if (!formUsername || formUsername === formName.toLowerCase().replace(/\s+/g, '_')) {
                    setFormUsername(val.toLowerCase().replace(/\s+/g, '_'));
                  }
                }}
                className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none transition ${
                  formErrors.name ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                }`}
                required
              />
              {formErrors.name && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Kredensial Akun Login SFA Mobile */}
            <div className="p-3 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border border-indigo-100 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[11px]">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kredensial Akun Login SFA Mobile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                    Username Login: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: sales_rian"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className={`w-full p-2 bg-white border rounded-xl outline-none transition font-mono text-xs ${
                      formErrors.username ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                    required
                  />
                  {formErrors.username && (
                    <p className="text-[10px] text-rose-600 mt-1">{formErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                    Password Akun: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 4 karakter"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className={`w-full p-2 pr-8 bg-white border rounded-xl outline-none transition font-mono text-xs ${
                        formErrors.password ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-[10px] text-rose-600 mt-1">{formErrors.password}</p>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Salesman akan menggunakan username dan password ini untuk login ke aplikasi operasional lapangan.
              </p>
            </div>

            {/* Wilayah Penugasan & No. Telepon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Wilayah Penugasan: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formArea}
                  onChange={(e) => setCustomFormArea(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="Bandung Kota">Bandung Kota</option>
                  <option value="Bandung Barat">Bandung Barat</option>
                  <option value="Cimahi">Cimahi</option>
                  <option value="Bandung Timur">Bandung Timur</option>
                  <option value="Soreang">Soreang</option>
                  <option value="Bandung Selatan">Bandung Selatan</option>
                  <option value="Sumedang">Sumedang</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor HP / WhatsApp: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="0812-XXXX-XXXX"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none transition ${
                    formErrors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                  }`}
                  required
                />
                {formErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Jenis Kendaraan & Nomor Polisi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Armada Kendaraan: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formVehicle}
                  onChange={(e) => setFormVehicle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="Motor Honda Vario 160">Motor Honda Vario 160</option>
                  <option value="Motor Yamaha NMAX">Motor Yamaha NMAX</option>
                  <option value="Motor Honda Beat">Motor Honda Beat</option>
                  <option value="Motor Honda PCX">Motor Honda PCX</option>
                  <option value="Mobil Box GrandMax">Mobil Box GrandMax</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Polisi: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: D 5421 KLM"
                  value={formPlate}
                  onChange={(e) => setFormPlate(e.target.value)}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none uppercase transition ${
                    formErrors.plateNumber ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                  }`}
                  required
                />
                {formErrors.plateNumber && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.plateNumber}</p>
                )}
              </div>
            </div>

            {/* Target Kunjungan & Target Omset */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Kunjungan: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={formVisits}
                    onChange={(e) => setFormVisits(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-bold"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                    Toko/Hari
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Omset (Rp): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={100000}
                  step={100000}
                  value={formTargetOmset}
                  onChange={(e) => setFormTargetOmset(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-bold text-indigo-700"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
              <p className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Integrasi Otomatis SFA
              </p>
              <p className="text-[10px] text-indigo-700 leading-relaxed">
                Salesman yang didaftarkan akan otomatis terhubung ke sistem <strong>Live Tracking Rute</strong> dan <strong>Monitoring Supervisi Kinerja</strong>.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Mendaftarkan Salesman...' : 'Daftarkan Salesman Baru'}</span>
            </button>
          </form>
        </div>

        {/* Right: Salesman Directory with Pagination (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Direktori Salesman Terdaftar ({filteredSalesmen.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Database personil lapangan, status operasional, dan alokasi kendaraan
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari ID, nama, plat..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-indigo-500 w-36 sm:w-44"
                  />
                </div>

                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setCustomSelectedArea(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="All">Semua Wilayah</option>
                  <option value="Bandung Kota">Bandung Kota</option>
                  <option value="Bandung Barat">Bandung Barat</option>
                  <option value="Cimahi">Cimahi</option>
                  <option value="Bandung Timur">Bandung Timur</option>
                  <option value="Soreang">Soreang</option>
                  <option value="Bandung Selatan">Bandung Selatan</option>
                  <option value="Sumedang">Sumedang</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">ID & Nama</th>
                    <th className="p-3">Akun Login SFA</th>
                    <th className="p-3">Wilayah & Armada</th>
                    <th className="p-3">Kontak</th>
                    <th className="p-3 text-center">Status Baterai / GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSalesmen.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Tidak ada data salesman yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedSalesmen.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <span className="font-mono text-[11px] font-semibold text-indigo-600">
                            {item.id}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="space-y-0.5 font-mono text-[11px]">
                            <p className="text-slate-800 font-semibold">
                              User: <span className="text-indigo-700 font-bold">{item.username || item.id.toLowerCase()}</span>
                            </p>
                            <p className="text-slate-500">
                              Pass: <span className="text-slate-700 font-medium">{item.password || 'password123'}</span>
                            </p>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-[10px] mb-1">
                            {item.area}
                          </span>
                          <p className="text-slate-600 font-medium">{item.vehicle}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">{item.plateNumber}</p>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{item.phone}</span>
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <BatteryCharging className="w-3 h-3 text-emerald-600" />
                            <span>{item.batteryLevel}%</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px] mx-auto" title={item.currentStatus}>
                            {item.currentStatus}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>
    </main>
  );
}
