'use client';

import { useState, useMemo } from 'react';
import {
  ShoppingCart,
  RotateCcw,
  Wifi,
  WifiOff,
  Sparkles,
  Tag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Package,
  FileCheck,
  Search,
} from 'lucide-react';

interface OrderReceipt {
  orderId: string;
  outlet: string;
  paymentTerm: string;
  total: number;
  mode: string;
  itemCount: number;
  bonusItems: string[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  promo?: {
    type: 'b5g1' | 'discount';
    label: string;
  };
}

const CATALOG_PRODUCTS: Product[] = [
  {
    id: 'PRD-001',
    name: 'Minyak Goreng Rose Brand 2L',
    category: 'Sembako',
    price: 34000,
    stock: 140,
    unit: 'pouch',
    promo: {
      type: 'b5g1',
      label: 'Beli 5 Gratis 1',
    },
  },
  {
    id: 'PRD-002',
    name: 'Beras Premium Pandan Wangi 5kg',
    category: 'Sembako',
    price: 75000,
    stock: 85,
    unit: 'sak',
  },
  {
    id: 'PRD-003',
    name: 'Kopi Kapal Api Special Mix (1 Renteng)',
    category: 'Minuman',
    price: 18500,
    stock: 220,
    unit: 'renteng',
    promo: {
      type: 'discount',
      label: 'Hemat 5%',
    },
  },
  {
    id: 'PRD-004',
    name: 'Susu Ultra Milk UHT 1L (Plain/Cokelat)',
    category: 'Minuman',
    price: 21000,
    stock: 95,
    unit: 'kotak',
  },
  {
    id: 'PRD-005',
    name: 'Gula Pasir Gulaku Tebu 1kg',
    category: 'Sembako',
    price: 17500,
    stock: 160,
    unit: 'bungkus',
  },
  {
    id: 'PRD-006',
    name: 'Teh Botol Sosro Kotak 250ml (Karton isi 24)',
    category: 'Minuman',
    price: 72000,
    stock: 60,
    unit: 'karton',
    promo: {
      type: 'b5g1',
      label: 'Beli 5 Gratis 1',
    },
  },
];

const OUTLETS = [
  'Toko Sumber Berkah - Bandung Kota',
  'Warung Bu Siti - Bandung Barat',
  'Minimarket Barokah - Cimahi',
  'Toko Kelontong Sejahtera - Bandung Timur',
  'Toko Harapan Jaya - Soreang',
];

export default function TakingOrderPage() {
  const [activeTab, setActiveTab] = useState<'order' | 'retur'>('order');
  const [isOnline, setIsOnline] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState(OUTLETS[0]);
  const [paymentTerm, setPaymentTerm] = useState('COD');
  
  // Cart state: Record<productId, quantity>
  const [cart, setCart] = useState<Record<string, number>>({
    'PRD-001': 5, // Default preloaded with 5 to immediately showcase the B5G1 promo!
    'PRD-003': 2,
  });

  const [orderSuccessModal, setOrderSuccessModal] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useState<OrderReceipt | null>(null);

  // Retur State
  const [returProduct, setReturProduct] = useState(CATALOG_PRODUCTS[0].id);
  const [returQty, setReturQty] = useState(1);
  const [returReason, setReturReason] = useState('Kemasan Rusak / Bocor');
  const [returNotes, setReturNotes] = useState('');
  const [returSuccessMsg, setReturSuccessMsg] = useState('');

  const [returHistory, setReturHistory] = useState([
    {
      id: 'RET-2026-001',
      outlet: 'Toko Sumber Berkah',
      product: 'Minyak Goreng Rose Brand 2L',
      qty: 2,
      reason: 'Kemasan Bocor',
      date: '07 Sep 2026',
      status: 'Disetujui Supervisor',
    },
    {
      id: 'RET-2026-002',
      outlet: 'Warung Bu Siti',
      product: 'Susu Ultra Milk UHT 1L',
      qty: 4,
      reason: 'Mendekati Kedaluwarsa',
      date: '06 Sep 2026',
      status: 'Selesai Diganti',
    },
  ]);

  // Cart operations
  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const removeProduct = (id: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Automated Promo and Discount calculations
  const orderSummary = useMemo(() => {
    let subtotal = 0;
    const bonusItems: string[] = [];

    Object.entries(cart).forEach(([id, qty]) => {
      const product = CATALOG_PRODUCTS.find((p) => p.id === id);
      if (product) {
        subtotal += product.price * qty;

        // Auto B5G1 promo: for every 5 bought, 1 bonus is awarded!
        if (product.promo?.type === 'b5g1' && qty >= 5) {
          const bonusQty = Math.floor(qty / 5);
          bonusItems.push(`${product.name} (Bonus: ${bonusQty} ${product.unit})`);
        }
      }
    });

    // Tiered transaction discount
    let discountPercent = 0;
    let discountAmount = 0;
    let promoReason = '';

    if (subtotal >= 1500000) {
      discountPercent = 10;
      promoReason = 'Diskon Grosir 10% (Belanja > Rp 1.500.000)';
    } else if (subtotal >= 500000) {
      discountPercent = 5;
      promoReason = 'Diskon Volume 5% (Belanja > Rp 500.000)';
    }

    if (discountPercent > 0) {
      discountAmount = Math.round((subtotal * discountPercent) / 100);
    }

    const grandTotal = subtotal - discountAmount;

    return {
      subtotal,
      discountPercent,
      discountAmount,
      promoReason,
      bonusItems,
      grandTotal,
    };
  }, [cart]);

  const handleCheckout = () => {
    const orderId = `PO-SAP-${Math.floor(100000 + Math.random() * 900000)}`;
    setLastOrderInfo({
      orderId,
      outlet: selectedOutlet,
      paymentTerm,
      total: orderSummary.grandTotal,
      mode: isOnline ? 'Online (Realtime SAP Sync)' : 'Offline (Tersimpan di Buffer Lokal)',
      itemCount: Object.values(cart).reduce((a, b) => a + b, 0),
      bonusItems: orderSummary.bonusItems,
    });
    setOrderSuccessModal(true);
    setCart({});
  };

  const handleCreateRetur = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProd = CATALOG_PRODUCTS.find((p) => p.id === returProduct);
    const newRetur = {
      id: `RET-2026-00${returHistory.length + 1}`,
      outlet: selectedOutlet.split(' - ')[0],
      product: targetProd?.name || 'Produk',
      qty: returQty,
      reason: returReason,
      date: '07 Sep 2026',
      status: 'Menunggu Verifikasi',
    };
    setReturHistory([newRetur, ...returHistory]);
    setReturSuccessMsg(`Pengajuan retur ${newRetur.id} berhasil dicatat!`);
    setTimeout(() => setReturSuccessMsg(''), 4000);
  };

  const filteredProducts = CATALOG_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 font-sans">
      {/* Top Banner with Online/Offline Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Mobile SFA: Taking Order & Retur
              </h1>
              <p className="text-xs text-slate-500">
                Pemesanan produk lapangan, kalkulasi skema promo/diskon otomatis, dan pengelolaan retur barang
              </p>
            </div>
          </div>
        </div>

        {/* Online / Offline Mode Pill */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold shadow-2xs transition ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Mode: ONLINE (SAP Cloud Live)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span>Mode: OFFLINE (Buffer Penyimpanan Lokal)</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold transition shadow-2xs cursor-pointer"
          >
            Ganti Mode
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('order')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'order'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Form Taking Order (Pemesanan)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('retur')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'retur'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Form Retur Barang & Klaim</span>
        </button>
      </div>

      {/* TAB 1: TAKING ORDER */}
      {activeTab === 'order' && (
        <div className="space-y-6">
          {/* Active Promo Notice Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <p className="font-bold text-sm">Skema Promo & Diskon Aktif Otomatis</p>
                <p className="text-xs text-blue-100 mt-0.5">
                  • <strong>Beli 5 Gratis 1</strong> untuk Minyak Goreng & Teh Botol • Diskon 5% (min. Rp 500rb) • Diskon 10% (min. Rp 1.5jt)
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-md">
              Otomatis Diterapkan
            </span>
          </div>

          {/* Outlet & Terms Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Outlet Kunjungan:
              </label>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              >
                {OUTLETS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Termin Pembayaran:
              </label>
              <select
                value={paymentTerm}
                onChange={(e) => setPaymentTerm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="COD">Cash On Delivery (Tunai)</option>
                <option value="TOP 7 Hari">TOP 7 Hari (Tempo)</option>
                <option value="TOP 14 Hari">TOP 14 Hari (Tempo)</option>
                <option value="TOP 30 Hari">TOP 30 Hari (Grosir Khusus)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cari Produk Katalog:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik nama produk / kategori..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Catalog & Cart 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Product Catalog */}
            <div className="lg:col-span-7 space-y-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span>Katalog Produk FMCG</span>
                <span className="text-xs text-slate-500 font-normal">
                  {filteredProducts.length} produk tersedia
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const qty = cart[product.id] || 0;
                  return (
                    <div
                      key={product.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {product.category}
                          </span>
                          {product.promo && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full border border-rose-200 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              {product.promo.label}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm mt-2">{product.name}</h3>
                        <p className="text-xs text-slate-400">SKU: {product.id}</p>
                        <p className="font-extrabold text-blue-600 text-base mt-2">
                          Rp {product.price.toLocaleString('id-ID')}{' '}
                          <span className="text-xs text-slate-400 font-normal">/ {product.unit}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">Stok Gudang: {product.stock} {product.unit}</p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">Pesanan:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, -1)}
                            disabled={qty <= 0}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-bold text-xs text-slate-800">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, 1)}
                            className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Cart & Order Breakdown */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <span>Keranjang Pesanan</span>
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {Object.keys(cart).length} item
                  </span>
                </div>

                {/* Items in Cart */}
                {Object.keys(cart).length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Belum ada barang di keranjang. Silakan pilih produk dari katalog.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {Object.entries(cart).map(([id, qty]) => {
                      const prod = CATALOG_PRODUCTS.find((p) => p.id === id);
                      if (!prod) return null;
                      const itemTotal = prod.price * qty;

                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                        >
                          <div className="flex-1 pr-2">
                            <p className="font-semibold text-slate-800">{prod.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {qty} x Rp {prod.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900">
                              Rp {itemTotal.toLocaleString('id-ID')}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeProduct(id)}
                              className="text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Promo Bonus Tag if any */}
                {orderSummary.bonusItems.length > 0 && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Bonus Promo Diterapkan!
                    </p>
                    {orderSummary.bonusItems.map((bonus, i) => (
                      <p key={i} className="text-[11px] text-emerald-700">
                        🎁 {bonus}
                      </p>
                    ))}
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Produk</span>
                    <span className="font-semibold text-slate-800">
                      Rp {orderSummary.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {orderSummary.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>{orderSummary.promoReason}</span>
                      <span>- Rp {orderSummary.discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                    <span>Total Pembayaran:</span>
                    <span className="text-blue-600 text-lg">
                      Rp {orderSummary.grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Checkout Submit Button */}
                <button
                  type="button"
                  disabled={Object.keys(cart).length === 0}
                  onClick={handleCheckout}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {isOnline ? 'Kirim Pesanan ke SAP Backoffice' : 'Simpan Pesanan ke Buffer Offline'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RETUR BARANG */}
      {activeTab === 'retur' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Retur Form */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Formulir Pengajuan Retur Barang</span>
            </h2>
            <p className="text-xs text-slate-500">
              Catat barang rusak, kedaluwarsa, atau salah kirim dari outlet untuk diverifikasi gudang & supervisor.
            </p>

            {returSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{returSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateRetur} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Outlet Pelapor:</label>
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {OUTLETS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Produk Diretur:</label>
                <select
                  value={returProduct}
                  onChange={(e) => setReturProduct(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {CATALOG_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Retur:</label>
                  <input
                    type="number"
                    min={1}
                    value={returQty}
                    onChange={(e) => setReturQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alasan Retur:</label>
                  <select
                    value={returReason}
                    onChange={(e) => setReturReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Kemasan Rusak / Bocor">Kemasan Rusak / Bocor</option>
                    <option value="Mendekati Kedaluwarsa">Mendekati Kedaluwarsa</option>
                    <option value="Produk Kedaluwarsa">Produk Kedaluwarsa</option>
                    <option value="Salah Kirim Barang">Salah Kirim Barang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan:</label>
                <textarea
                  rows={2}
                  placeholder="Kondisi kemasan saat diterima, nomor lot produksi..."
                  value={returNotes}
                  onChange={(e) => setReturNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Ajukan Klaim Retur
              </button>
            </form>
          </div>

          {/* Retur History Table */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">Riwayat & Status Retur Outlet</h2>
              <span className="text-xs text-slate-400">Total {returHistory.length} pengajuan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">ID Retur</th>
                    <th className="p-3">Outlet</th>
                    <th className="p-3">Produk</th>
                    <th className="p-3 text-center">Jumlah</th>
                    <th className="p-3">Alasan</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-blue-600">{item.id}</td>
                      <td className="p-3 font-medium text-slate-800">{item.outlet}</td>
                      <td className="p-3 text-slate-600">{item.product}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{item.qty}</td>
                      <td className="p-3 text-slate-500">{item.reason}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Receipt Modal */}
      {orderSuccessModal && lastOrderInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-lg">Pesanan Berhasil Dicatat!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Taking order telah terverifikasi ke sistem Distrilink SAP.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor PO:</span>
                <span className="font-bold text-blue-600">{lastOrderInfo.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outlet:</span>
                <span className="font-semibold text-slate-800">{lastOrderInfo.outlet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode Sinkronisasi:</span>
                <span className="font-semibold text-emerald-700">{lastOrderInfo.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Termin Bayar:</span>
                <span className="font-semibold text-slate-800">{lastOrderInfo.paymentTerm}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-slate-900">
                <span>Total Nilai Pesanan:</span>
                <span className="text-blue-600">
                  Rp {lastOrderInfo.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOrderSuccessModal(false)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition cursor-pointer"
            >
              Tutup & Buat Pesanan Baru
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
