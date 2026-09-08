'use client';

import { useState } from 'react';
import {
  PackageX,
  PhoneCall,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Sparkles,
  ShoppingCart,
  Send,
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  substituteId?: string;
  substituteName?: string;
}

const WAREHOUSE_PRODUCTS: ProductItem[] = [
  {
    id: 'PRD-001',
    name: 'Minyak Goreng Rose Brand 2L',
    category: 'Sembako',
    price: 34000,
    stock: 140,
    unit: 'pouch',
  },
  {
    id: 'PRD-002',
    name: 'Beras Premium Pandan Wangi 5kg',
    category: 'Sembako',
    price: 75000,
    stock: 0, // OUT OF STOCK!
    unit: 'sak',
    substituteId: 'PRD-007',
    substituteName: 'Beras Premium Ramos Setra 5kg (Tersedia 60 sak)',
  },
  {
    id: 'PRD-003',
    name: 'Kopi Kapal Api Special Mix (Renteng)',
    category: 'Minuman',
    price: 18500,
    stock: 220,
    unit: 'renteng',
  },
  {
    id: 'PRD-004',
    name: 'Susu Ultra Milk UHT 1L Full Cream',
    category: 'Minuman',
    price: 21000,
    stock: 0, // OUT OF STOCK!
    unit: 'kotak',
    substituteId: 'PRD-008',
    substituteName: 'Susu Indomilk UHT 1L Plain (Tersedia 45 kotak)',
  },
  {
    id: 'PRD-005',
    name: 'Gula Pasir Gulaku Tebu 1kg',
    category: 'Sembako',
    price: 17500,
    stock: 8, // LOW STOCK
    unit: 'bungkus',
  },
  {
    id: 'PRD-006',
    name: 'Teh Botol Sosro 250ml (Karton)',
    category: 'Minuman',
    price: 72000,
    stock: 60,
    unit: 'karton',
  },
  {
    id: 'PRD-007',
    name: 'Beras Premium Ramos Setra 5kg',
    category: 'Sembako',
    price: 74000,
    stock: 60,
    unit: 'sak',
  },
  {
    id: 'PRD-008',
    name: 'Susu Indomilk UHT 1L Plain',
    category: 'Minuman',
    price: 20500,
    stock: 45,
    unit: 'kotak',
  },
];

interface RemoteOrder {
  id: string;
  outletName: string;
  channel: 'WhatsApp' | 'Telepon' | 'Portal B2B' | 'Darurat';
  reason: string;
  items: {
    productId: string;
    productName: string;
    qty: number;
    unit: string;
    isOos: boolean;
    substituteUsed?: string;
  }[];
  totalRp: number;
  date: string;
  status: 'Siap Kirim' | 'Substitusi Diterapkan' | 'Backorder Menunggu Pasokan';
  restockEta?: string;
}

const INITIAL_REMOTE_ORDERS: RemoteOrder[] = [
  {
    id: 'RMT-2026-001',
    outletName: 'Toko Sumber Berkah',
    channel: 'WhatsApp',
    reason: 'Permintaan Restock Cepat (Stok Toko Menipis Drastis)',
    items: [
      {
        productId: 'PRD-001',
        productName: 'Minyak Goreng Rose Brand 2L',
        qty: 10,
        unit: 'pouch',
        isOos: false,
      },
    ],
    totalRp: 340000,
    date: '07 Sep 2026 11:20',
    status: 'Siap Kirim',
  },
  {
    id: 'RMT-2026-002',
    outletName: 'Warung Bu Siti',
    channel: 'Telepon',
    reason: 'Di luar jadwal rute kunjungan fisik hari ini',
    items: [
      {
        productId: 'PRD-002',
        productName: 'Beras Premium Pandan Wangi 5kg',
        qty: 5,
        unit: 'sak',
        isOos: true,
        substituteUsed: 'Substitusi ke Beras Ramos Setra 5kg',
      },
    ],
    totalRp: 370000,
    date: '07 Sep 2026 10:45',
    status: 'Substitusi Diterapkan',
  },
  {
    id: 'RMT-2026-003',
    outletName: 'Minimarket Barokah Mandiri',
    channel: 'Portal B2B',
    reason: 'Pesanan mandiri dari aplikasi portal toko',
    items: [
      {
        productId: 'PRD-004',
        productName: 'Susu Ultra Milk UHT 1L Full Cream',
        qty: 20,
        unit: 'kotak',
        isOos: true,
      },
    ],
    totalRp: 420000,
    date: '07 Sep 2026 09:15',
    status: 'Backorder Menunggu Pasokan',
    restockEta: '08 Sep 2026 (Pagi)',
  },
];

const OUTLETS = [
  'Toko Sumber Berkah - Bandung Kota',
  'Warung Bu Siti - Bandung Barat',
  'Minimarket Barokah Mandiri - Cimahi',
  'Toko Harapan Jaya - Soreang',
  'Kios Rezeki Baru - Bandung Timur',
];

export default function OosOrdersPage() {
  const [orders, setOrders] = useState<RemoteOrder[]>(INITIAL_REMOTE_ORDERS);
  const [selectedOutlet, setSelectedOutlet] = useState(OUTLETS[0]);
  const [channel, setChannel] = useState<'WhatsApp' | 'Telepon' | 'Portal B2B' | 'Darurat'>('WhatsApp');
  const [nonVisitReason, setNonVisitReason] = useState('Toko memesan darurat di luar jadwal rute regular');
  const [selectedProductId, setSelectedProductId] = useState(WAREHOUSE_PRODUCTS[1].id); // Pandan wangi (OOS to show feature!)
  const [orderQty, setOrderQty] = useState(5);
  const [oosActionChoice, setOosActionChoice] = useState<'substitute' | 'backorder'>('substitute');
  const [toastMessage, setToastMessage] = useState('');

  const currentProduct = WAREHOUSE_PRODUCTS.find((p) => p.id === selectedProductId) || WAREHOUSE_PRODUCTS[0];
  const isOos = currentProduct.stock === 0;
  const isLowStock = currentProduct.stock > 0 && currentProduct.stock < 15;

  // KPI calculations
  const totalRemoteCount = orders.length;
  const totalRemoteValue = orders.reduce((acc, o) => acc + o.totalRp, 0);
  const oosCount = orders.filter((o) => o.status !== 'Siap Kirim').length;
  const backorderCount = orders.filter((o) => o.status === 'Backorder Menunggu Pasokan').length;

  const handleSubmitRemoteOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const orderId = `RMT-2026-00${orders.length + 1}`;
    let itemStatus: 'Siap Kirim' | 'Substitusi Diterapkan' | 'Backorder Menunggu Pasokan' = 'Siap Kirim';
    let substituteUsed: string | undefined = undefined;
    let eta: string | undefined = undefined;

    if (isOos) {
      if (oosActionChoice === 'substitute' && currentProduct.substituteName) {
        itemStatus = 'Substitusi Diterapkan';
        substituteUsed = `Substitusi disetujui: ${currentProduct.substituteName}`;
      } else {
        itemStatus = 'Backorder Menunggu Pasokan';
        eta = 'Besok (08 Sep 2026 10:00 WIB)';
      }
    }

    const newOrder: RemoteOrder = {
      id: orderId,
      outletName: selectedOutlet.split(' - ')[0],
      channel,
      reason: nonVisitReason,
      items: [
        {
          productId: currentProduct.id,
          productName: currentProduct.name,
          qty: orderQty,
          unit: currentProduct.unit,
          isOos,
          substituteUsed,
        },
      ],
      totalRp: currentProduct.price * orderQty,
      date: '07 Sep 2026 (Hari Ini)',
      status: itemStatus,
      restockEta: eta,
    };

    setOrders([newOrder, ...orders]);
    setToastMessage(`Pesanan tanpa kunjungan ${orderId} berhasil diterbitkan dengan status: ${itemStatus}`);
    setTimeout(() => setToastMessage(''), 5000);
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
              <PackageX className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Pesanan Tanpa Kunjungan & Penanganan Out of Stock (OOS)
              </h1>
              <p className="text-xs text-slate-500">
                Layanan pemesanan jarak jauh (WhatsApp / Telepon), deteksi stok kosong, mesin substitusi, dan antrean backorder
              </p>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
          <RefreshCw className="w-4 h-4 text-amber-600" />
          <span>Smart OOS Engine & Priority Allocation Aktif</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Pesanan Non-Visit</span>
            <PhoneCall className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalRemoteCount} pesanan</p>
          <p className="text-[11px] text-slate-400 mt-1">Tanpa perlu check-in GPS fisik</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Nilai Transaksi Remote</span>
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            Rp {(totalRemoteValue / 1000).toLocaleString('id-ID')} rb
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Total omset terselamatkan</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Kasus OOS Tertangani</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{oosCount} kasus</p>
          <p className="text-[11px] text-slate-400 mt-1">Melalui substitusi & backorder</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Antrean Backorder Prioritas</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{backorderCount} order</p>
          <p className="text-[11px] text-slate-400 mt-1">Alokasi otomatis saat pasokan tiba</p>
        </div>
      </div>

      {/* Main 2-Column: Form Order Non-Visit with OOS Handler & Order Management Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Non-Visit Order Taking Form (Col 5) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Entri Pesanan Jarak Jauh (Non-Visit)</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              Direct Order
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Digunakan saat toko menghubungi via WhatsApp/Telepon untuk restock mendadak tanpa perlu kunjungan rute fisik salesman.
          </p>

          <form onSubmit={handleSubmitRemoteOrder} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Outlet Pemesan:</label>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800"
              >
                {OUTLETS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kanal Komunikasi:</label>
                <select
                  value={channel}
                  onChange={(e) =>
                    setChannel(
                      e.target.value as 'WhatsApp' | 'Telepon' | 'Portal B2B' | 'Darurat'
                    )
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800"
                >
                  <option value="WhatsApp">WhatsApp Bisnis</option>
                  <option value="Telepon">Telepon Langsung</option>
                  <option value="Portal B2B">Portal B2B Mitra</option>
                  <option value="Darurat">Hotline Darurat</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Tanpa Kunjungan:</label>
                <select
                  value={nonVisitReason}
                  onChange={(e) => setNonVisitReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-[11px] text-slate-800"
                >
                  <option value="Toko memesan darurat di luar jadwal rute regular">Permintaan Darurat</option>
                  <option value="Di luar jadwal rute kunjungan fisik hari ini">Di Luar Siklus Rute</option>
                  <option value="Keterbatasan akses fisik / kendala cuaca jalan">Kendala Akses Cuaca</option>
                  <option value="Pesanan tambahan susulan setelah kunjungan selesai">Order Susulan Toko</option>
                </select>
              </div>
            </div>

            {/* Product selection with Live Stock Warning */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pilih Produk Pesanan:</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800"
              >
                {WAREHOUSE_PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.stock === 0 ? '(STOK HABIS / OOS)' : `(Stok: ${p.stock} ${p.unit})`} - Rp{' '}
                    {p.price.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
            </div>

            {/* OOS Handling Banner if current product is Out of Stock */}
            {isOos && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2 text-rose-800 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs">Barang Out of Stock (Stok Gudang: 0)!</p>
                    <p className="text-[11px] font-normal text-rose-700 mt-0.5">
                      Pilih solusi penanganan OOS untuk menjaga kepuasan outlet:
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-rose-200">
                  {/* Option 1: Product substitution */}
                  {currentProduct.substituteName && (
                    <label
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                        oosActionChoice === 'substitute'
                          ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 text-slate-900'
                          : 'bg-rose-100/50 border-rose-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="oosAction"
                        checked={oosActionChoice === 'substitute'}
                        onChange={() => setOosActionChoice('substitute')}
                        className="mt-0.5"
                      />
                      <div className="text-[11px]">
                        <span className="font-bold block text-blue-700">
                          ✨ Substitusi Produk Rekomendasi:
                        </span>
                        <span className="text-slate-800 font-semibold">{currentProduct.substituteName}</span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Kualitas setara & harga bersaing, tidak membuat toko menunggu pasokan.
                        </span>
                      </div>
                    </label>
                  )}

                  {/* Option 2: Backorder Queue */}
                  <label
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                      oosActionChoice === 'backorder'
                        ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 text-slate-900'
                        : 'bg-rose-100/50 border-rose-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="oosAction"
                      checked={oosActionChoice === 'backorder'}
                      onChange={() => setOosActionChoice('backorder')}
                      className="mt-0.5"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold block text-rose-700">
                        📦 Alokasikan ke Antrean Backorder Prioritas:
                      </span>
                      <span className="text-slate-600 block">
                        Pesanan tetap diproses. Begitu kiriman pabrik tiba besok pagi, pesanan otomatis dikirim prioritas ke toko.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {isLowStock && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Peringatan: Stok menipis ({currentProduct.stock} {currentProduct.unit} tersisa di depo).</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Pesanan:</label>
                <input
                  type="number"
                  min={1}
                  value={orderQty}
                  onChange={(e) => setOrderQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Estimasi:</label>
                <div className="w-full p-2.5 bg-slate-100 rounded-xl font-extrabold text-blue-700">
                  Rp {(currentProduct.price * orderQty).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Terbitkan Pesanan Remote</span>
            </button>
          </form>
        </div>

        {/* Right: Remote & OOS Order Tracking Table (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PackageX className="w-4 h-4 text-blue-600" />
                <span>Daftar Pesanan Non-Visit & Penanganan Stok ({orders.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring status pemenuhan barang dan riwayat mitigasi stok kosong
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
              Live Buffer SAP
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.map((order) => {
              const isBackorder = order.status === 'Backorder Menunggu Pasokan';
              const isSubstituted = order.status === 'Substitusi Diterapkan';
              const isReady = order.status === 'Siap Kirim';

              return (
                <div key={order.id} className="p-4 hover:bg-slate-50/70 transition space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 text-xs">{order.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-slate-800 text-xs">{order.outletName}</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-medium">
                        via {order.channel}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isReady
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isSubstituted
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isReady && <CheckCircle2 className="w-3 h-3" />}
                      {isSubstituted && <Sparkles className="w-3 h-3 text-blue-600" />}
                      {isBackorder && <Clock className="w-3 h-3 text-rose-600" />}
                      <span>{order.status}</span>
                    </span>
                  </div>

                  {/* Items detail */}
                  <div className="text-xs space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-700">
                        <span>
                          {item.productName} ({item.qty} {item.unit})
                        </span>
                        <span className="font-semibold text-slate-900">
                          Rp {order.totalRp.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}

                    {/* Mitigation detail note */}
                    {order.items[0]?.substituteUsed && (
                      <p className="text-[11px] text-blue-700 bg-blue-50 p-2 rounded-lg font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>{order.items[0].substituteUsed}</span>
                      </p>
                    )}

                    {order.restockEta && (
                      <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Estimasi Pasokan Tiba: {order.restockEta}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Alasan Non-Visit: {order.reason}</span>
                    <span>{order.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
