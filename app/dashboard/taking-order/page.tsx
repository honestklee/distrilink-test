'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Clock,
  Eye,
  AlertCircle,
  FileText,
  X,
} from 'lucide-react';

import {
  CatalogProduct,
  WarehouseStockItem,
  ReturItem,
  SalesOrder,
  getStoredCatalogProducts,
  setStoredCatalogProducts,
  getStoredWarehouseStocks,
  setStoredWarehouseStocks,
  getStoredOutletOptions,
  getStoredReturHistory,
  getStoredSalesOrders,
  createReturClaim,
  recordOrderCheckout,
  STORAGE_SYNC_EVENT,
} from '@/lib/storage';
import Pagination from '@/components/dashboard/Pagination';

interface OrderReceipt {
  orderId: string;
  outlet: string;
  paymentTerm: string;
  total: number;
  mode: string;
  itemCount: number;
  bonusItems: string[];
  approvalId?: string;
  status: string;
}

export default function TakingOrderPage() {
  const [activeTab, setActiveTab] = useState<'order' | 'retur' | 'history'>('order');
  const [isOnline, setIsOnline] = useState(true);
  const [search, setSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [outletOptions, setOutletOptions] = useState<string[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('COD');
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  
  // Cart state: Record<productId, quantity> (starts empty for fresh user testing)
  const [cart, setCart] = useState<Record<string, number>>({});

  // Add custom product state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Sembako');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('100');
  const [newProdUnit, setNewProdUnit] = useState('pcs');
  const [newProdPromo, setNewProdPromo] = useState<'none' | 'b5g1' | 'discount'>('none');

  const [orderSuccessModal, setOrderSuccessModal] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useState<OrderReceipt | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SalesOrder | null>(null);

  // Retur State
  const [returProduct, setReturProduct] = useState('PRD-001');
  const [returQty, setReturQty] = useState(1);
  const [returReason, setReturReason] = useState('Kemasan Rusak / Bocor');
  const [returNotes, setReturNotes] = useState('');
  const [returSuccessMsg, setReturSuccessMsg] = useState('');
  const [returHistory, setReturHistory] = useState<ReturItem[]>([]);

  // Pagination states
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogItemsPerPage, setCatalogItemsPerPage] = useState(6);
  const [returPage, setReturPage] = useState(1);
  const [returItemsPerPage, setReturItemsPerPage] = useState(5);
  const [orderHistoryPage, setOrderHistoryPage] = useState(1);
  const [orderHistoryItemsPerPage, setOrderHistoryItemsPerPage] = useState(5);

  useEffect(() => {
    const syncData = () => {
      const opts = getStoredOutletOptions();
      setOutletOptions(opts);
      if (!selectedOutlet && opts.length > 0) {
        setSelectedOutlet(opts[0]);
      }
      setCatalogProducts(getStoredCatalogProducts());
      setReturHistory(getStoredReturHistory());
      setSalesOrders(getStoredSalesOrders());
    };

    syncData();
    window.addEventListener(STORAGE_SYNC_EVENT, syncData);
    return () => window.removeEventListener(STORAGE_SYNC_EVENT, syncData);
  }, [selectedOutlet]);

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
      const product = catalogProducts.find((p) => p.id === id);
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
  }, [cart, catalogProducts]);

  const handleCheckout = () => {
    const orderId = `PO-SAP-${Math.floor(100000 + Math.random() * 900000)}`;
    const detailedItems = Object.entries(cart).map(([productId, qty]) => {
      const p = catalogProducts.find((item) => item.id === productId);
      return {
        productId,
        productName: p?.name || productId,
        qty,
        price: p?.price || 0,
        subtotal: (p?.price || 0) * qty,
        unit: p?.unit || 'Pcs',
      };
    });

    const { newOrder, newApproval } = recordOrderCheckout({
      orderId,
      outletName: selectedOutlet,
      paymentTerm,
      grandTotal: orderSummary.grandTotal,
      items: detailedItems,
      bonusItems: orderSummary.bonusItems,
      notes: orderSummary.promoReason || 'Pesanan diterbitkan via SFA Taking Order',
    });

    setLastOrderInfo({
      orderId,
      outlet: selectedOutlet,
      paymentTerm,
      total: orderSummary.grandTotal,
      mode: isOnline ? 'Online (Terkirim ke Meja Supervisi)' : 'Offline (Tersimpan di Buffer Lokal)',
      itemCount: Object.values(cart).reduce((a, b) => a + b, 0),
      bonusItems: orderSummary.bonusItems,
      approvalId: newApproval?.id,
      status: newOrder.status,
    });
    setOrderSuccessModal(true);
    setCart({});
  };

  const handleCreateRetur = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProd = catalogProducts.find((p) => p.id === returProduct);
    const newRetur: ReturItem = {
      id: `RET-2026-00${returHistory.length + 1}`,
      outlet: selectedOutlet.split(' - ')[0],
      product: targetProd?.name || 'Produk',
      qty: returQty,
      reason: returReason,
      date: '08 Sep 2026',
      status: 'Menunggu Verifikasi',
    };

    const approval = createReturClaim(newRetur);
    setReturSuccessMsg(
      `Pengajuan retur ${newRetur.id} berhasil dicatat dan permintaan otorisasi ${approval.id} dikirim ke Meja Supervisi!`
    );
    setReturNotes('');
    setTimeout(() => setReturSuccessMsg(''), 5000);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    const newId = `PRD-00${catalogProducts.length + 1}`;
    const priceNum = Number(newProdPrice) || 0;
    const stockNum = Number(newProdStock) || 50;

    const newProd: CatalogProduct = {
      id: newId,
      name: newProdName.trim(),
      category: newProdCategory,
      price: priceNum,
      stock: stockNum,
      unit: newProdUnit.trim() || 'pcs',
      promo:
        newProdPromo === 'b5g1'
          ? { type: 'b5g1', label: 'Beli 5 Gratis 1' }
          : newProdPromo === 'discount'
          ? { type: 'discount', label: 'Hemat 5%' }
          : undefined,
    };

    setStoredCatalogProducts([newProd, ...catalogProducts]);

    // Also synchronize into warehouse stocks for supervisor inventory monitoring
    const currentWarehouse = getStoredWarehouseStocks();
    const newWarehouseItem: WarehouseStockItem = {
      sku: newId,
      name: newProd.name,
      category: newProd.category,
      depoStock: stockNum,
      safetyStock: 20,
      reorderPoint: 30,
      unit: newProd.unit,
      status: stockNum > 30 ? 'Aman' : stockNum > 0 ? 'Kritis' : 'Habis',
      daysOfInventory: Math.floor(stockNum / 10),
      fastMovingRank: currentWarehouse.length + 1,
    };
    setStoredWarehouseStocks([newWarehouseItem, ...currentWarehouse]);

    setShowAddProductModal(false);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdStock('100');
    setNewProdUnit('pcs');
    setNewProdPromo('none');
  };

  const filteredProducts = catalogProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalCatalogPages = Math.ceil(filteredProducts.length / catalogItemsPerPage) || 1;
  const paginatedCatalogProducts = filteredProducts.slice(
    (catalogPage - 1) * catalogItemsPerPage,
    catalogPage * catalogItemsPerPage
  );

  const totalReturPages = Math.ceil(returHistory.length / returItemsPerPage) || 1;
  const paginatedReturHistory = returHistory.slice(
    (returPage - 1) * returItemsPerPage,
    returPage * returItemsPerPage
  );

  const filteredOrders = salesOrders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(historySearch.toLowerCase()) ||
      order.outletName.toLowerCase().includes(historySearch.toLowerCase());
    return matchSearch;
  });
  const totalOrderPages = Math.ceil(filteredOrders.length / orderHistoryItemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (orderHistoryPage - 1) * orderHistoryItemsPerPage,
    orderHistoryPage * orderHistoryItemsPerPage
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
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('order')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'order'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>1. Form Taking Order (Pemesanan)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('retur')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'retur'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>2. Form Retur Barang & Klaim</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>3. Riwayat Pesanan (PO SAP)</span>
          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
            {salesOrders.length}
          </span>
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
                {outletOptions.map((o) => (
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
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCatalogPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Catalog & Cart 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Product Catalog */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Katalog Produk FMCG</span>
                  <span className="text-xs text-slate-500 font-normal">
                    ({filteredProducts.length} produk tersedia)
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paginatedCatalogProducts.map((product) => {
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

              {/* FMCG Catalog Pagination */}
              <Pagination
                currentPage={catalogPage}
                totalPages={totalCatalogPages}
                totalItems={filteredProducts.length}
                itemsPerPage={catalogItemsPerPage}
                onPageChange={setCatalogPage}
                onItemsPerPageChange={setCatalogItemsPerPage}
              />
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
                      const prod = catalogProducts.find((p) => p.id === id);
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
                  {outletOptions.map((o) => (
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
                  {catalogProducts.map((p) => (
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
                  {paginatedReturHistory.map((item) => (
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

            {/* Retur History Pagination */}
            <Pagination
              currentPage={returPage}
              totalPages={totalReturPages}
              totalItems={returHistory.length}
              itemsPerPage={returItemsPerPage}
              onPageChange={setReturPage}
              onItemsPerPageChange={setReturItemsPerPage}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RIWAYAT PESANAN (PO SAP) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Pesanan Diterbitkan</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{salesOrders.length} PO</p>
              <p className="text-[11px] text-slate-400 mt-1">Tercatat di SAP Buffer Lokal</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Nilai Order</span>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">
                Rp {salesOrders.reduce((a, b) => a + b.totalRp, 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Omset sales taking order</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Menunggu Otorisasi Supervisor</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {salesOrders.filter((o) => o.status === 'Menunggu Persetujuan Supervisor').length} PO
              </p>
              <p className="text-[11px] text-amber-700 mt-1">Di Meja Persetujuan Supervisi</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Disetujui & Siap Kirim</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                {salesOrders.filter((o) => o.status === 'Disetujui & Siap Kirim').length} PO
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">Stok terpotong & surat jalan siap</p>
            </div>
          </div>

          {/* Search bar & Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-blue-900">
              <FileCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="font-bold">Status Otorisasi Pesanan SAP Terhubung Real-Time</p>
                <p className="text-blue-700 text-[11px]">
                  Saat pesanan baru dibuat, tiket otorisasi otomatis muncul di <strong>Meja Persetujuan Supervisi</strong>. Ketika Supervisor menyetujui, status di bawah akan otomatis berubah menjadi <strong>&quot;Disetujui & Siap Kirim&quot;</strong> dan stok gudang terpotong.
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor PO atau nama toko..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setOrderHistoryPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Daftar Transaksi Pesanan Taking Order ({filteredOrders.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lacak status otorisasi supervisi, rincian barang pesanan, dan termin pembayaran
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
                Live LocalStorage
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Belum ada pesanan yang sesuai dengan kriteria pencarian.
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {paginatedOrders.map((order) => {
                    const isPending = order.status === 'Menunggu Persetujuan Supervisor';
                    const isApproved = order.status === 'Disetujui & Siap Kirim';
                    const isRejected = order.status === 'Ditolak Supervisor';

                    return (
                      <div key={order.id} className="p-4 hover:bg-slate-50/70 transition space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-blue-600 text-sm">{order.id}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-bold text-slate-900 text-xs">{order.outletName}</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-medium">
                              Termin: {order.paymentTerm}
                            </span>
                            {order.approvalId && (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-semibold">
                                Tiket: {order.approvalId}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                isPending
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isPending && <Clock className="w-3 h-3 text-amber-600 animate-pulse" />}
                              {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {isRejected && <AlertCircle className="w-3 h-3 text-rose-600" />}
                              <span>{order.status}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => setSelectedOrderForDetail(order)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-blue-600" />
                              <span>Detail PO</span>
                            </button>
                          </div>
                        </div>

                        {/* Order Items Snapshot */}
                        <div className="bg-slate-50/80 p-3 rounded-2xl text-xs space-y-1.5 border border-slate-100">
                          <div className="flex justify-between font-semibold text-slate-600 text-[11px] pb-1 border-b border-slate-200">
                            <span>Item Produk ({order.items.length})</span>
                            <span>Subtotal</span>
                          </div>
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-slate-700 text-xs">
                              <span>
                                {it.productName} ({it.qty} {it.unit})
                              </span>
                              <span className="font-semibold text-slate-900">
                                Rp {it.subtotal.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}

                          {order.bonusItems && order.bonusItems.length > 0 && (
                            <div className="pt-1 text-[11px] text-emerald-700 font-medium">
                              🎁 Bonus Promo: {order.bonusItems.join(', ')}
                            </div>
                          )}

                          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                            <span>Total Tagihan:</span>
                            <span className="text-blue-700 text-sm">
                              Rp {order.totalRp.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Salesman: {order.salesName}</span>
                          <span>{order.date} • {order.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sales Orders Pagination */}
                <Pagination
                  currentPage={orderHistoryPage}
                  totalPages={totalOrderPages}
                  totalItems={filteredOrders.length}
                  itemsPerPage={orderHistoryItemsPerPage}
                  onPageChange={setOrderHistoryPage}
                  onItemsPerPageChange={setOrderHistoryItemsPerPage}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Order Success Receipt Modal */}
      {orderSuccessModal && lastOrderInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mx-auto">
              <FileCheck className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-lg">Pesanan Berhasil Diterbitkan!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Terkirim ke antrean Meja Persetujuan Supervisi untuk otorisasi rilis gudang.
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
                <span className="text-slate-500">Status Otorisasi:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lastOrderInfo.status}</span>
                </span>
              </div>
              {lastOrderInfo.approvalId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiket Persetujuan:</span>
                  <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    {lastOrderInfo.approvalId}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Termin Bayar:</span>
                <span className="font-semibold text-slate-800">{lastOrderInfo.paymentTerm}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-slate-900">
                <span>Total Nilai Pesanan:</span>
                <span className="text-blue-600 text-sm">
                  Rp {lastOrderInfo.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
              <p className="font-bold">Info Alur Pesanan:</p>
              <p>
                Pesanan ini telah tercatat di <strong>Tab 3 (Riwayat Pesanan)</strong> dan otomatis muncul di <strong>Meja Persetujuan Supervisi</strong>. Begitu Supervisor mengklik &quot;Setujui&quot;, status pesanan berubah menjadi &quot;Disetujui & Siap Kirim&quot; dan stok gudang akan terpotong.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOrderSuccessModal(false);
                  setActiveTab('history');
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lihat Riwayat Pesanan</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderSuccessModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail PO Modal */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedOrderForDetail.id}</h3>
                  <p className="text-xs text-slate-500">{selectedOrderForDetail.outletName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl">
              <div>
                <span className="text-slate-400 block text-[10px]">Status Otorisasi:</span>
                <span className="font-bold text-slate-800">{selectedOrderForDetail.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Termin Pembayaran:</span>
                <span className="font-bold text-slate-800">{selectedOrderForDetail.paymentTerm}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Waktu Transaksi:</span>
                <span className="font-medium text-slate-700">{selectedOrderForDetail.date} • {selectedOrderForDetail.time}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Salesman PIC:</span>
                <span className="font-medium text-slate-700">{selectedOrderForDetail.salesName}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">Rincian Barang Pesanan:</p>
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {selectedOrderForDetail.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{it.productName}</p>
                      <p className="text-[10px] text-slate-400">
                        {it.qty} {it.unit} @ Rp {it.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className="font-bold text-slate-800">
                      Rp {it.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="font-extrabold text-slate-900 text-xs">Total Tagihan Pesanan:</span>
              <span className="text-base font-extrabold text-blue-600">
                Rp {selectedOrderForDetail.totalRp.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrderForDetail(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      {/* Modal: Tambah Produk Baru ke Katalog & Gudang */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tambah Produk FMCG Baru</h3>
                  <p className="text-xs text-slate-500">
                    Produk akan tersimpan ke katalog taking order & stok depo gudang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Produk:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Biskuit Roma Kelapa 300g"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori:</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Sembako">Sembako</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Makanan Ringan">Makanan Ringan</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Kebersihan">Kebersihan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan Unit:</label>
                  <input
                    type="text"
                    required
                    placeholder="pcs / karton / bungkus"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Satuan (Rp):</label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="Contoh: 12500"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Fisik Awal:</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Contoh: 150"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skema Promo Otomatis:</label>
                <select
                  value={newProdPromo}
                  onChange={(e) => setNewProdPromo(e.target.value as 'none' | 'b5g1' | 'discount')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                >
                  <option value="none">Tanpa Promo (Harga Normal)</option>
                  <option value="b5g1">Beli 5 Gratis 1 (B5G1)</option>
                  <option value="discount">Diskon Khusus 5%</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Produk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
