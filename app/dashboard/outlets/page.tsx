'use client';

import { useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Building2,
  CheckCircle2,
  PlusCircle,
  ExternalLink,
  Search,
  Camera,
  Navigation,
} from 'lucide-react';

interface OutletItem {
  id: string;
  name: string;
  owner: string;
  phone: string;
  category: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'Verified' | 'Pending Approval' | 'Rejected';
  registeredDate: string;
}

const INITIAL_OUTLETS: OutletItem[] = [
  {
    id: 'OUT-BDG-001',
    name: 'Toko Sumber Berkah',
    owner: 'Haji Ahmad',
    phone: '081234567890',
    category: 'Grosir Sembako',
    area: 'Bandung Kota',
    address: 'Jl. Asia Afrika No. 45, Bandung',
    latitude: -6.921852,
    longitude: 107.607185,
    status: 'Verified',
    registeredDate: '01 Sep 2026',
  },
  {
    id: 'OUT-BDG-002',
    name: 'Warung Bu Siti',
    owner: 'Siti Rohayati',
    phone: '081398765432',
    category: 'Toko Kelontong',
    area: 'Bandung Barat',
    address: 'Jl. Raya Cimareme No. 12, Padalarang',
    latitude: -6.868212,
    longitude: 107.498321,
    status: 'Verified',
    registeredDate: '03 Sep 2026',
  },
  {
    id: 'OUT-BDG-003',
    name: 'Minimarket Barokah',
    owner: 'Rudi Hartono',
    phone: '085712349988',
    category: 'Minimarket Mandiri',
    area: 'Cimahi',
    address: 'Jl. Amir Machmud No. 88, Cimahi',
    latitude: -6.872341,
    longitude: 107.542119,
    status: 'Pending Approval',
    registeredDate: '06 Sep 2026',
  },
  {
    id: 'OUT-BDG-004',
    name: 'Toko Harapan Jaya',
    owner: 'Bambang Sudiro',
    phone: '082188776655',
    category: 'Grosir Sembako',
    area: 'Soreang',
    address: 'Jl. Raya Soreang - Banjaran No. 104',
    latitude: -7.032115,
    longitude: 107.519822,
    status: 'Verified',
    registeredDate: '05 Sep 2026',
  },
];

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<OutletItem[]>(INITIAL_OUTLETS);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('All');
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);
  const [gpsValidationResult, setGpsValidationResult] = useState<{
    distanceMeter: number;
    isValid: boolean;
    timestamp: string;
  }>({
    distanceMeter: 18,
    isValid: true,
    timestamp: 'Baru saja',
  });

  // NOO Form State
  const [formName, setFormName] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCategory, setFormCategory] = useState('Toko Kelontong');
  const [formArea, setFormArea] = useState('Bandung Kota');
  const [formAddress, setFormAddress] = useState('');
  const [formLat, setFormLat] = useState(-6.917464);
  const [formLng, setFormLng] = useState(107.619123);
  const [successNotice, setSuccessNotice] = useState('');

  const handleSimulateGpsCheck = () => {
    setIsSimulatingGps(true);
    setTimeout(() => {
      // Simulate random distance within or outside 50m
      const dist = Math.floor(Math.random() * 60) + 10;
      setGpsValidationResult({
        distanceMeter: dist,
        isValid: dist <= 50,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
      setIsSimulatingGps(false);
    }, 800);
  };

  const handleDetectCurrentGps = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormLat(Number(pos.coords.latitude.toFixed(6)));
          setFormLng(Number(pos.coords.longitude.toFixed(6)));
        },
        () => {
          // Fallback sample coordinates
          setFormLat(-6.917464);
          setFormLng(107.619123);
        }
      );
    } else {
      setFormLat(-6.917464);
      setFormLng(107.619123);
    }
  };

  const handleRegisterOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `OUT-BDG-00${outlets.length + 1}`;
    const newOutlet: OutletItem = {
      id: newId,
      name: formName,
      owner: formOwner,
      phone: formPhone,
      category: formCategory,
      area: formArea,
      address: formAddress,
      latitude: formLat,
      longitude: formLng,
      status: 'Pending Approval',
      registeredDate: '07 Sep 2026',
    };

    setOutlets([newOutlet, ...outlets]);
    setSuccessNotice(`Outlet baru ${formName} (${newId}) berhasil didaftarkan! Menunggu verifikasi supervisor.`);
    setFormName('');
    setFormOwner('');
    setFormPhone('');
    setFormAddress('');
    setTimeout(() => setSuccessNotice(''), 5000);
  };

  const filteredOutlets = outlets.filter((o) => {
    const matchSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.owner.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchArea = selectedArea === 'All' || o.area === selectedArea;
    return matchSearch && matchArea;
  });

  return (
    <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 font-sans">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Geotagging & New Outlet Onboarding (NOO)
              </h1>
              <p className="text-xs text-slate-500">
                Pendaftaran toko baru dan verifikasi radius GPS fisik untuk mencegah order serta kunjungan fiktif
              </p>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Anti-Fraud GPS Guard Aktif</span>
        </div>
      </div>

      {/* 1. Live Geotagging Validator Widget */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Simulasi Validasi Geotagging Kunjungan Salesman</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem mencocokkan koordinat GPS perangkat sales dengan titik geotag toko (Toleransi Maksimal: 50 Meter).
            </p>
          </div>

          <button
            type="button"
            onClick={handleSimulateGpsCheck}
            disabled={isSimulatingGps}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSimulatingGps ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memindai GPS Satelit...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Uji Validasi Lokasi Sekarang</span>
              </>
            )}
          </button>
        </div>

        {/* Validation Status Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium block">Toko Target Check-in:</span>
            <span className="font-bold text-slate-800 text-xs mt-1 block">Toko Sumber Berkah (Bandung)</span>
            <span className="text-[10px] text-slate-400 font-mono">-6.921852, 107.607185</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium block">Posisi Salesman Saat Ini:</span>
            <span className="font-bold text-slate-800 text-xs mt-1 block">
              Jarak: {gpsValidationResult.distanceMeter} Meter dari Toko
            </span>
            <span className="text-[10px] text-slate-400">Diperbarui: {gpsValidationResult.timestamp}</span>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              gpsValidationResult.isValid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {gpsValidationResult.isValid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            )}
            <div>
              <span className="font-bold text-xs block">
                {gpsValidationResult.isValid ? 'VALID (Dalam Radius 50m)' : 'INVALID (Terlalu Jauh)'}
              </span>
              <span className="text-[11px] block mt-0.5">
                {gpsValidationResult.isValid
                  ? 'Kunjungan sah! Taking order dapat dilakukan.'
                  : 'Peringatan: Kunjungan di luar radius toko terdeteksi!'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: NOO Registration Form & Registered Outlets Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: New Outlet Onboarding (NOO) Form */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">Pendaftaran Outlet Baru (NOO)</h2>
          </div>
          <p className="text-xs text-slate-500">
            Salesman dapat mendaftarkan outlet baru langsung dari lapangan dengan koordinat GPS dan data lengkap pemilik.
          </p>

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleRegisterOutlet} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Toko / Outlet:</label>
              <input
                type="text"
                placeholder="Contoh: Toko Berkah Mandiri"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pemilik:</label>
                <input
                  type="text"
                  placeholder="Nama pemilik/PIC"
                  value={formOwner}
                  onChange={(e) => setFormOwner(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP:</label>
                <input
                  type="tel"
                  placeholder="0812xxxx"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Outlet:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Toko Kelontong">Toko Kelontong</option>
                  <option value="Grosir Sembako">Grosir Sembako</option>
                  <option value="Minimarket Mandiri">Minimarket Mandiri</option>
                  <option value="Kios Pasar">Kios Pasar</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Wilayah / Area:</label>
                <select
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Bandung Kota">Bandung Kota</option>
                  <option value="Bandung Barat">Bandung Barat</option>
                  <option value="Cimahi">Cimahi</option>
                  <option value="Bandung Timur">Bandung Timur</option>
                  <option value="Soreang">Soreang</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap:</label>
              <textarea
                rows={2}
                placeholder="Jalan, nomor, kelurahan, patokan lokasi..."
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                required
              />
            </div>

            {/* Geotagging Coordinates */}
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Koordinat GPS Geotagging
                </span>
                <button
                  type="button"
                  onClick={handleDetectCurrentGps}
                  className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold underline cursor-pointer"
                >
                  Deteksi Ulang
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
                <div>Lat: {formLat}</div>
                <div>Lng: {formLng}</div>
              </div>
            </div>

            {/* Photo upload mock */}
            <div className="p-3 border border-dashed border-slate-200 rounded-xl text-center space-y-1">
              <Camera className="w-5 h-5 text-slate-400 mx-auto" />
              <p className="text-[11px] text-slate-600 font-medium">Foto Depan Toko (Terverifikasi Geotag)</p>
              <p className="text-[10px] text-slate-400">Format JPG/PNG dengan watermark koordinat otomatis</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              Simpan & Ajukan Outlet Baru
            </button>
          </form>
        </div>

        {/* Right: Registered Outlets Directory */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Direktori Outlet Terdaftar ({filteredOutlets.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Database titik koordinat dan status verifikasi SAP</p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari toko / pemilik..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
              >
                <option value="All">Semua Area</option>
                <option value="Bandung Kota">Bandung Kota</option>
                <option value="Bandung Barat">Bandung Barat</option>
                <option value="Cimahi">Cimahi</option>
                <option value="Soreang">Soreang</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Nama Outlet</th>
                  <th className="p-3">Pemilik & Kontak</th>
                  <th className="p-3">Kategori & Area</th>
                  <th className="p-3">Koordinat GPS</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOutlets.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.id} • {item.address}</p>
                    </td>

                    <td className="p-3">
                      <p className="font-semibold text-slate-800">{item.owner}</p>
                      <p className="text-[11px] text-blue-600">{item.phone}</p>
                    </td>

                    <td className="p-3">
                      <span className="block font-medium text-slate-700">{item.category}</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                        {item.area}
                      </span>
                    </td>

                    <td className="p-3">
                      <a
                        href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-blue-600 hover:underline"
                        title="Lihat di Google Maps"
                      >
                        <span>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.status === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.status === 'Verified' ? 'Terverifikasi' : 'Menunggu Approval'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
