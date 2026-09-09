'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { UserSession } from '@/types/auth';
import {
  Menu,
  LogOut,
  Sparkles,
  BarChart3,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ShoppingCart,
  ShieldCheck,
  MapPin,
  Route,
  X,
} from 'lucide-react';
import { resetAllDataToDefault } from '@/lib/storage';

const SESSION_KEY = 'user_session';
const emptySubscribe = () => () => {};

interface DashboardNavbarProps {
  onToggleSidebar?: () => void;
}

const PAGE_TITLES: Record<string, { title: string; category: string }> = {
  '/dashboard': { title: 'Monitoring & Supervisi', category: 'Supervisi & Analisa' },
  '/dashboard/consolidator': { title: 'Smart Data Consolidator', category: 'Supervisi & Konsolidasi' },
  '/dashboard/taking-order': { title: 'Taking Order & Promo', category: 'Operasional Sales Lapangan' },
  '/dashboard/outlets': { title: 'Geotag & NOO Outlets', category: 'Operasional Sales Lapangan' },
  '/dashboard/tracking': { title: 'Rute & Live Tracking', category: 'Operasional Sales Lapangan' },
  '/dashboard/oos-orders': { title: 'Pesanan Tanpa Kunjungan (OOS)', category: 'Operasional Sales Lapangan' },
};

export default function DashboardNavbar({ onToggleSidebar }: DashboardNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Retrieve user session
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

  const handleLogout = () => {
    Cookies.remove(SESSION_KEY);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
    router.push('/login');
  };

  const userInitial = user?.firstName ? user.firstName[0].toUpperCase() : 'U';
  const pageMeta = PAGE_TITLES[pathname] || { title: 'Dashboard', category: 'Distrilink SAP' };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Toggle & Page Context */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar Toggle Button */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer shrink-0"
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Logo (hidden on lg since sidebar is visible) */}
            <Link
              href={user?.role === 'salesman' ? '/dashboard/taking-order' : '/dashboard'}
              className="lg:hidden flex items-center gap-2 shrink-0"
            >
              <div className="p-1.5 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-xl text-white">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">Distrilink</span>
            </Link>

            {/* Desktop Breadcrumb & Current Page Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs min-w-0">
              <span className="text-slate-400 font-medium whitespace-nowrap">{pageMeta.category}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="font-bold text-slate-800 truncate">{pageMeta.title}</span>
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0 whitespace-nowrap">
                <Sparkles className="w-2.5 h-2.5 text-blue-500" /> Live Monitoring
              </span>
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Panduan Alur & Role SOP Button */}
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition cursor-pointer"
              title="Pelajari pembagian tugas Salesman vs Supervisor dan SOP alur kerja"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Panduan Alur & Role</span>
              <span className="sm:hidden">SOP</span>
            </button>

            {/* Reset Data Button */}
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Reset data uji coba ke kondisi default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Reset Data</span>
            </button>

            {/* SAP Online Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-700">SAP Sync Online</span>
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              {user?.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt={user.firstName}
                  className="w-8 h-8 rounded-full object-cover shadow-xs border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInitial}
                </div>
              )}
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {user ? `${user.firstName} ${user.lastName}` : 'Memuat...'}
                  </p>
                  {user && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        user.role === 'supervisor'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {user.role === 'supervisor' ? `SPV: ${user.area}` : `Sales: ${user.area}`}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">@{user?.username || 'user'}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200/80 text-xs font-semibold transition shadow-2xs cursor-pointer"
              title="Keluar dari akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Panduan Alur & Role SOP Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg sm:text-xl">
                    Panduan Alur & Pembagian Peran (SOP Distrilink)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Memahami peran Salesman Lapangan vs Supervisor serta alur transaksi end-to-end
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Comparison of 2 Roles */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Pembagian Peran (Role Distinction)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Salesman Lapangan */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                    <span className="p-1.5 rounded-lg bg-blue-600 text-white">📱</span>
                    <span>Role: Salesman Lapangan (SFA)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bertanggung jawab atas operasional kunjungan fisik toko, pencarian outlet baru, dan pencatatan pesanan (Taking Order).
                  </p>
                  <ul className="text-xs text-slate-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <Route className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Rute & Tracking:</strong> Menjalankan rute kunjungan harian & check-in GPS di toko.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Geotag & NOO:</strong> Mendaftarkan toko baru beserta foto & koordinat GPS anti-fraud.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShoppingCart className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Taking Order & Promo:</strong> Memasukkan pesanan produk, memanfaatkan promo SAP otomatis, & kirim PO.</span>
                    </li>
                  </ul>
                </div>

                {/* Supervisor & Backoffice */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                    <span className="p-1.5 rounded-lg bg-indigo-600 text-white">🛡️</span>
                    <span>Role: Supervisor & Backoffice (HQ)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bertanggung jawab memonitor kinerja sales, menjaga keabsahan data, kontrol batas kredit/piutang, dan persetujuan PO.
                  </p>
                  <ul className="text-xs text-slate-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>Meja Persetujuan (Tab 4):</strong> Verifikasi pendaftaran NOO toko baru & klaim retur barang rusak.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>Monitoring PO (Tab 5):</strong> Review PO masuk, pantau piutang toko, & klik Setujui untuk memotong stok depo.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>Smart Consolidator:</strong> Konsolidasi multi-cabang & ekspor CSV ke SAP ERP pusat.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 2. Step-by-Step SOP Workflow */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Siklus Alur Operasional Harian (End-to-End SOP)
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Salesman Berangkat & Check-in di Toko</p>
                    <p className="text-slate-500 mt-0.5">Salesman membuka <strong>Rute & Live Tracking</strong> untuk melihat daftar urutan toko hari ini dan melakukan check-in radius GPS.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Pendaftaran Toko Baru (NOO) Bila Perlu</p>
                    <p className="text-slate-500 mt-0.5">Jika mengunjungi toko baru yang belum terdaftar di SAP, Salesman mendaftarkannya di <strong>Geotag & NOO</strong>. Status awal akan berupa <em>Pending Verifikasi</em>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Taking Order (Input Pesanan & Promo)</p>
                    <p className="text-slate-500 mt-0.5">Salesman membuka <strong>Taking Order & Promo</strong>, memilih produk, mendapatkan bonus promo otomatis, lalu klik <em>Kirim Pesanan ke SAP</em>. Tiket approval otomatis diteruskan ke meja Supervisor.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Supervisor Mereview di Meja Persetujuan & Monitoring PO</p>
                    <p className="text-slate-500 mt-0.5">Supervisor membuka <strong>Dashboard Monitoring & Supervisi</strong>. Pada Tab 4 (Meja Persetujuan) atau Tab 5 (Monitoring PO), Supervisor mengecek keabsahan NOO dan batas kredit piutang toko, lalu menekan tombol <em>Setujui</em>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</div>
                  <div className="text-xs">
                    <p className="font-bold text-emerald-900">Sistem Otomatis Mengupdate Stok & Piutang</p>
                    <p className="text-emerald-700 mt-0.5">Begitu disetujui, stok fisik di depo cabang langsung berkurang, toko NOO menjadi <em>Verified</em>, dan piutang toko bertambah pada modul SAP Backoffice. Siap dikirim oleh tim armada gudang!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Saya Mengerti, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Data Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reset Semua Data Uji Coba?</h3>
                <p className="text-xs text-slate-500">Kembalikan ke data bawaan awal default</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan menghapus semua perubahan lokal (pendaftaran outlet NOO baru, persetujuan supervisi, order taking order, klaim retur, stok depo terpotong, dan rute kunjungan), lalu mengembalikannya ke data bawaan awal sample JSON.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllDataToDefault();
                  setShowResetModal(false);
                  window.location.reload();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition shadow-md shadow-rose-500/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Reset Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
