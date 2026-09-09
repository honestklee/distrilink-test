'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { SalesData } from '@/types/sales';
import { UserSession } from '@/types/auth';

import StatCard from '@/components/dashboard/StatCard';
import PerformanceGraph from '@/components/dashboard/PerformanceGraph';
import SalesPieChart from '@/components/dashboard/SalesPieChart';
import SalesTable from '@/components/dashboard/SalesTable';
import Pagination from '@/components/dashboard/Pagination';
import { csvEscape, parseCsvLine } from '@/lib/csv';

import {
  Search,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  MapPin,
  Calendar,
  BarChart3,
  Building2,
  Package,
  ShieldCheck,
  Check,
  X,
  ShoppingCart,
  Clock,
  Pencil,
  Plus,
  Download,
  Upload,
} from 'lucide-react';

const SESSION_KEY = 'user_session';
const emptySubscribe = () => () => {};

import {
  OutletProfile,
  CatalogProduct,
  WarehouseStockItem,
  ApprovalItem,
  SalesOrder,
  getStoredApprovals,
  getStoredOutletProfiles,
  getStoredWarehouseStocks,
  getStoredCatalogProducts,
  getStoredWarehouseProducts,
  setStoredCatalogProducts,
  setStoredWarehouseProducts,
  setStoredWarehouseStocks,
  updateWarehouseStock,
  getStoredSalesOrders,
  getStoredSalesPerformance,
  getStoredVisitLogs,
  normalizeVisitDate,
  updateApprovalStatus,
  STORAGE_SYNC_EVENT,
} from '@/lib/storage';

export default function DashboardPage() {
  const router = useRouter();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Supervisor Active Tab: 'performance' | 'outlets' | 'stock' | 'approvals' | 'orders'
  const [activeSupervisorTab, setActiveSupervisorTab] = useState<
    'performance' | 'outlets' | 'stock' | 'approvals' | 'orders'
  >('performance');

  const [search, setSearch] = useState('');
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [outletProfiles, setOutletProfiles] = useState<OutletProfile[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStockItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [warehouseProducts, setWarehouseProducts] = useState<CatalogProduct[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [salesList, setSalesList] = useState<SalesData[]>([]);
  const [visitLogs, setVisitLogs] = useState<ReturnType<typeof getStoredVisitLogs>>([]);
  const [periodMonth, setPeriodMonth] = useState('09');
  const [periodYear, setPeriodYear] = useState('2026');
  const [toastMsg, setToastMsg] = useState('');
  const [isImportingStocks, setIsImportingStocks] = useState(false);
  const [stockPage, setStockPage] = useState(1);
  const [stockItemsPerPage, setStockItemsPerPage] = useState(5);
  const [outletPage, setOutletPage] = useState(1);
  const [outletItemsPerPage, setOutletItemsPerPage] = useState(5);
  const [approvalPage, setApprovalPage] = useState(1);
  const [approvalItemsPerPage, setApprovalItemsPerPage] = useState(5);
  const [orderPage, setOrderPage] = useState(1);
  const [orderItemsPerPage, setOrderItemsPerPage] = useState(5);
  const [editingStock, setEditingStock] = useState<WarehouseStockItem | null>(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStockForm, setNewStockForm] = useState({
    area: '',
    name: '',
    category: 'Sembako',
    price: '',
    depoStock: '100',
    safetyStock: '20',
    reorderPoint: '30',
    unit: 'pcs',
    promoType: 'none' as 'none' | 'discount' | 'quantity',
    promoValue: '10',
    promoFreeQuantity: '1',
  });
  const [stockForm, setStockForm] = useState({
    sku: '',
    name: '',
    category: 'Sembako',
    depoStock: '0',
    safetyStock: '0',
    reorderPoint: '0',
    unit: 'pcs',
    daysOfInventory: '0',
    status: 'Aman' as WarehouseStockItem['status'],
    promoType: 'none' as 'none' | 'discount' | 'quantity',
    promoValue: '10',
    promoFreeQuantity: '1',
  });

  useEffect(() => {
    const syncData = () => {
      setApprovals(getStoredApprovals());
      setOutletProfiles(getStoredOutletProfiles());
      setWarehouseStocks(getStoredWarehouseStocks());
      setCatalogProducts(getStoredCatalogProducts());
      setWarehouseProducts(getStoredWarehouseProducts());
      setSalesOrders(getStoredSalesOrders());
      setSalesList(getStoredSalesPerformance());
      setVisitLogs(getStoredVisitLogs());
    };
    syncData();
    window.addEventListener(STORAGE_SYNC_EVENT, syncData);
    return () => window.removeEventListener(STORAGE_SYNC_EVENT, syncData);
  }, []);

  // Retrieve user session without cascading renders
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

  // Auth guard redirect if no session
  useEffect(() => {
    if (isClient && !Cookies.get(SESSION_KEY)) {
      router.push('/login');
    }
  }, [isClient, router]);

  const userArea = user?.area;
  const scopedWarehouseStocks = useMemo(() => {
    if (!userArea || userArea === 'All') return warehouseStocks;
    return warehouseStocks.filter((stock) => stock.area === userArea);
  }, [userArea, warehouseStocks]);
  const stockTotalPages = Math.ceil(scopedWarehouseStocks.length / stockItemsPerPage) || 1;
  const safeStockPage = Math.min(stockPage, stockTotalPages) || 1;
  const paginatedWarehouseStocks = scopedWarehouseStocks.slice(
    (safeStockPage - 1) * stockItemsPerPage,
    safeStockPage * stockItemsPerPage
  );
  const selectedPeriod = `${periodYear}-${periodMonth}`;

  const periodVisitLogs = useMemo(() => {
    return visitLogs.filter((log) => normalizeVisitDate(log.date).startsWith(selectedPeriod));
  }, [selectedPeriod, visitLogs]);

  const periodSalesList = useMemo(() => {
    return salesList.map((salesman) => {
      const logs = periodVisitLogs.filter(
        (log) =>
          (salesman.id && log.salesId === salesman.id) ||
          log.salesName.trim().toLowerCase() === salesman.nama_sales.trim().toLowerCase()
      );
      const realized = logs.length;
      const orderTotal = logs.reduce((total, log) => total + (Number(log.orderValueRp) || 0), 0);

      return {
        ...salesman,
        kunjungan_realisasi: realized,
        efektivitas_visit_persen: salesman.kunjungan_planned
          ? Math.round((realized / salesman.kunjungan_planned) * 100)
          : 0,
        total_order_rp: orderTotal,
      };
    });
  }, [periodVisitLogs, salesList]);

  // Territory-scoped Approvals (matching supervisor's assigned area)
  const scopedApprovals = useMemo(() => {
    if (!userArea || userArea === 'All') return approvals;
    return approvals.filter(
      (a) => !a.area || a.area.toLowerCase() === userArea.toLowerCase()
    );
  }, [approvals, userArea]);

  const approvalTotalPages = Math.ceil(scopedApprovals.length / approvalItemsPerPage) || 1;
  const safeApprovalPage = Math.min(approvalPage, approvalTotalPages) || 1;
  const paginatedApprovals = scopedApprovals.slice(
    (safeApprovalPage - 1) * approvalItemsPerPage,
    safeApprovalPage * approvalItemsPerPage
  );

  const pendingApprovalsCount = useMemo(() => {
    return scopedApprovals.filter((a) => a.status === 'pending').length;
  }, [scopedApprovals]);

  // Territory-scoped Sales Orders
  const scopedSalesOrders = useMemo(() => {
    if (!userArea || userArea === 'All') return salesOrders;
    return salesOrders.filter(
      (o) => !o.area || o.area.toLowerCase() === userArea.toLowerCase()
    );
  }, [salesOrders, userArea]);

  const orderTotalPages = Math.ceil(scopedSalesOrders.length / orderItemsPerPage) || 1;
  const safeOrderPage = Math.min(orderPage, orderTotalPages) || 1;
  const paginatedSalesOrders = scopedSalesOrders.slice(
    (safeOrderPage - 1) * orderItemsPerPage,
    safeOrderPage * orderItemsPerPage
  );

  // Territory-scoped Outlet Profiles
  const scopedOutletProfiles = useMemo(() => {
    if (!userArea || userArea === 'All') return outletProfiles;
    return outletProfiles.filter(
      (p) => !p.area || p.area.toLowerCase() === userArea.toLowerCase()
    );
  }, [outletProfiles, userArea]);

  const outletTotalPages = Math.ceil(scopedOutletProfiles.length / outletItemsPerPage) || 1;
  const safeOutletPage = Math.min(outletPage, outletTotalPages) || 1;
  const paginatedOutletProfiles = scopedOutletProfiles.slice(
    (safeOutletPage - 1) * outletItemsPerPage,
    safeOutletPage * outletItemsPerPage
  );

  // Territory-scoped Sales Performance (matching supervisor's assigned area)
  const scopedSalesList = useMemo(() => {
    if (!userArea || userArea === 'All') return periodSalesList;
    return periodSalesList.filter(
      (item) => !item.area || item.area.toLowerCase() === userArea.toLowerCase()
    );
  }, [periodSalesList, userArea]);

  // Filtered sales list based on search within supervisor's scoped territory
  const filteredSales = useMemo(() => {
    return scopedSalesList.filter((item) => {
      return item.nama_sales.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, scopedSalesList]);

  // Aggregate statistics
  const summary = useMemo(() => {
    const totalPlanned = filteredSales.reduce((acc, curr) => acc + curr.kunjungan_planned, 0);
    const totalVisit = filteredSales.reduce((acc, curr) => acc + curr.kunjungan_realisasi, 0);
    const totalOrderRp = filteredSales.reduce((acc, curr) => acc + curr.total_order_rp, 0);
    const totalOos = scopedWarehouseStocks.filter((stock) => stock.status === 'Habis').length;
    const avgEffectiveness = filteredSales.length
      ? Math.round(
          filteredSales.reduce((acc, curr) => acc + curr.efektivitas_visit_persen, 0) /
            filteredSales.length
        )
      : 0;

    return { totalPlanned, totalVisit, totalOrderRp, totalOos, avgEffectiveness };
  }, [filteredSales, scopedWarehouseStocks]);

  const handleResetFilters = () => {
    setSearch('');
  };

  const handleEditStock = (item: WarehouseStockItem) => {
    const product = catalogProducts.find((entry) => entry.id === item.sku || entry.name === item.name);
    setEditingStock(item);
    setStockForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      depoStock: String(item.depoStock),
      safetyStock: String(item.safetyStock),
      reorderPoint: String(item.reorderPoint),
      unit: item.unit,
      daysOfInventory: String(item.daysOfInventory),
      status: item.status,
      promoType: product?.promo?.type === 'discount'
        ? 'discount'
        : product?.promo?.type === 'b5g1'
        ? 'quantity'
        : 'none',
      promoValue: product?.promo?.type === 'discount'
        ? String(product.promo.discountPercent || 10)
        : String(product?.promo?.quantityThreshold || 5),
      promoFreeQuantity: String(product?.promo?.freeQuantity || 1),
    });
  };

  const buildPromo = (type: 'none' | 'discount' | 'quantity', value: string, freeQuantity: string) => {
    if (type === 'discount') {
      const percent = Math.max(1, Number(value) || 0);
      return { type: 'discount' as const, label: `Diskon ${percent}%`, discountPercent: percent };
    }
    if (type === 'quantity') {
      const threshold = Math.max(1, Number(value) || 1);
      const free = Math.max(1, Number(freeQuantity) || 1);
      return {
        type: 'b5g1' as const,
        label: `Beli ${threshold} Gratis ${free}`,
        quantityThreshold: threshold,
        freeQuantity: free,
      };
    }
    return undefined;
  };

  const handleSaveStock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingStock) return;

    const depoStock = Math.max(0, Number(stockForm.depoStock) || 0);
    const safetyStock = Math.max(0, Number(stockForm.safetyStock) || 0);
    const reorderPoint = Math.max(0, Number(stockForm.reorderPoint) || 0);
    const daysOfInventory = Math.max(0, Number(stockForm.daysOfInventory) || 0);
    const status = depoStock === 0 ? 'Habis' : stockForm.status;

    try {
      updateWarehouseStock(editingStock.sku, editingStock.area, {
        area: editingStock.area,
        sku: stockForm.sku.trim() || editingStock.sku,
        name: stockForm.name.trim(),
        category: stockForm.category.trim(),
        depoStock,
        safetyStock,
        reorderPoint,
        unit: stockForm.unit.trim() || editingStock.unit,
        daysOfInventory,
        status,
      });
      const updatedProduct = catalogProducts.find(
        (product) => product.id === editingStock.sku || product.name === editingStock.name
      );
      const nextProduct: CatalogProduct = {
        ...(updatedProduct || {
          id: stockForm.sku.trim() || editingStock.sku,
          price: 0,
          stock: depoStock,
          unit: stockForm.unit.trim() || editingStock.unit,
        }),
        id: stockForm.sku.trim() || editingStock.sku,
        name: stockForm.name.trim(),
        category: stockForm.category.trim(),
        stock: depoStock,
        unit: stockForm.unit.trim() || editingStock.unit,
        promo: buildPromo(stockForm.promoType, stockForm.promoValue, stockForm.promoFreeQuantity),
      };
      const remainingProducts = catalogProducts.filter(
        (product) => product.id !== editingStock.sku && product.name !== editingStock.name
      );
      setStoredCatalogProducts([nextProduct, ...remainingProducts]);
      setStoredWarehouseProducts(
        getStoredWarehouseProducts().map((product) =>
          product.id === editingStock.sku || product.name === editingStock.name ? nextProduct : product
        )
      );
      setEditingStock(null);
      setToastMsg(`Data stok ${stockForm.name} berhasil diperbarui.`);
    } catch (error) {
      setToastMsg(error instanceof Error ? error.message : 'Data stok gagal diperbarui.');
    }
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleAddStock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newStockForm.name.trim();
    const area = newStockForm.area || userArea || 'Bandung Kota';
    const price = Math.max(0, Number(newStockForm.price) || 0);
    const depoStock = Math.max(0, Number(newStockForm.depoStock) || 0);
    const safetyStock = Math.max(0, Number(newStockForm.safetyStock) || 0);
    const reorderPoint = Math.max(0, Number(newStockForm.reorderPoint) || 0);
    if (!name || price <= 0) return;

    const productIds = [...catalogProducts, ...warehouseProducts, ...warehouseStocks]
      .map((product) => ('id' in product ? product.id : product.sku))
      .filter((id): id is string => Boolean(id));
    const nextProductNumber = productIds.reduce((highest, id) => {
      const match = id.match(/(?:PRD|SKU)-(\d+)/);
      return Math.max(highest, match ? Number(match[1]) : 0);
    }, 0) + 1;
    const productId = `PRD-${String(nextProductNumber).padStart(3, '0')}`;
    const status: WarehouseStockItem['status'] =
      depoStock === 0 ? 'Habis' : depoStock <= reorderPoint ? 'Kritis' : 'Aman';
    const product: CatalogProduct = {
      id: productId,
      name,
      category: newStockForm.category,
      price,
      stock: depoStock,
      unit: newStockForm.unit.trim() || 'pcs',
      promo: buildPromo(newStockForm.promoType, newStockForm.promoValue, newStockForm.promoFreeQuantity),
    };
    const stock: WarehouseStockItem = {
      sku: productId,
      area,
      name,
      category: newStockForm.category,
      depoStock,
      safetyStock,
      reorderPoint,
      unit: product.unit,
      status,
      daysOfInventory: Math.floor(depoStock / 10),
      fastMovingRank: warehouseStocks.length + 1,
    };

    setStoredCatalogProducts([product, ...catalogProducts]);
    setStoredWarehouseProducts([product, ...warehouseProducts]);
    setStoredWarehouseStocks([stock, ...warehouseStocks]);
    setShowAddStockModal(false);
    setNewStockForm({
      area: '',
      name: '',
      category: 'Sembako',
      price: '',
      depoStock: '100',
      safetyStock: '20',
      reorderPoint: '30',
      unit: 'pcs',
      promoType: 'none',
      promoValue: '10',
      promoFreeQuantity: '1',
    });
    setToastMsg(`${name} berhasil ditambahkan dan tersedia di Taking Order.`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleExportStocks = () => {
    const headers = [
      'SKU',
      'Area',
      'Nama Produk',
      'Kategori',
      'Harga Satuan',
      'Stok Fisik Depo',
      'Safety Stock',
      'Reorder Point (ROP)',
      'Satuan',
      'Ketahanan Stok (Hari)',
      'Status Gudang',
    ];
    const rows = scopedWarehouseStocks.map((stock) => {
      const product = catalogProducts.find(
        (item) => item.id === stock.sku || item.name === stock.name
      );
      return [
        stock.sku,
        stock.area,
        stock.name,
        stock.category,
        product?.price || 0,
        stock.depoStock,
        stock.safetyStock,
        stock.reorderPoint,
        stock.unit,
        stock.daysOfInventory,
        stock.status,
      ].map(csvEscape).join(',');
    });
    const csv = `\uFEFF${headers.map(csvEscape).join(',')}\n${rows.join('\n')}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `stok-gudang-${(userArea || 'semua-wilayah').toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    setToastMsg(`${scopedWarehouseStocks.length} data stok berhasil diekspor.`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleImportStocks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImportingStocks(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const lines = String(reader.result || '')
          .replace(/^\uFEFF/, '')
          .split(/\r?\n/)
          .filter((line) => line.trim());
        if (lines.length < 2) throw new Error('File CSV tidak memiliki data.');

        const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
        const requiredHeaders = ['sku', 'nama produk', 'kategori', 'stok fisik depo', 'safety stock', 'reorder point (rop)', 'satuan'];
        const missingHeader = requiredHeaders.find((header) => !headers.includes(header));
        if (missingHeader) throw new Error(`Kolom wajib tidak ditemukan: ${missingHeader}.`);

        const importedStocks: WarehouseStockItem[] = [];
        const importedProducts: CatalogProduct[] = [];
        let skippedRows = 0;
        lines.slice(1).forEach((line) => {
          const values = parseCsvLine(line);
          const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
          const area = row.area || userArea || 'Bandung Kota';
          if (userArea && userArea !== 'All' && area.toLowerCase() !== userArea.toLowerCase()) {
            skippedRows += 1;
            return;
          }

          const sku = row.sku.trim();
          const name = row['nama produk'].trim();
          if (!sku || !name) {
            skippedRows += 1;
            return;
          }
          const depoStock = Math.max(0, Number(row['stok fisik depo']) || 0);
          const safetyStock = Math.max(0, Number(row['safety stock']) || 0);
          const reorderPoint = Math.max(0, Number(row['reorder point (rop)']) || 0);
          const statusValue = row['status gudang'];
          const status: WarehouseStockItem['status'] = depoStock === 0
            ? 'Habis'
            : statusValue === 'Kritis' || statusValue === 'Habis'
            ? statusValue
            : 'Aman';
          const stock: WarehouseStockItem = {
            sku,
            area,
            name,
            category: row.kategori.trim() || 'Sembako',
            depoStock,
            safetyStock,
            reorderPoint,
            unit: row.satuan.trim() || 'pcs',
            status,
            daysOfInventory: Math.max(0, Number(row['ketahanan stok (hari)']) || Math.floor(depoStock / 10)),
            fastMovingRank: warehouseStocks.length + importedStocks.length + 1,
          };
          importedStocks.push(stock);
          const existingProduct = catalogProducts.find((product) => product.id === sku || product.name === name);
          importedProducts.push({
            id: sku,
            name,
            category: stock.category,
            price: Number(row['harga satuan']) || existingProduct?.price || 0,
            stock: depoStock,
            unit: stock.unit,
            promo: existingProduct?.promo,
            substituteId: existingProduct?.substituteId,
            substituteName: existingProduct?.substituteName,
          });
        });

        if (importedStocks.length === 0) throw new Error('Tidak ada baris CSV yang sesuai dengan wilayah aktif.');
        const importedKeys = new Set(importedStocks.map((stock) => `${stock.area}:${stock.sku}`));
        const remainingStocks = warehouseStocks.filter((stock) => !importedKeys.has(`${stock.area}:${stock.sku}`));
        const existingProductIds = new Set(importedProducts.map((product) => product.id));
        const remainingCatalog = catalogProducts.filter((product) => !existingProductIds.has(product.id));
        const remainingWarehouseProducts = warehouseProducts.filter((product) => !existingProductIds.has(product.id));
        setStoredWarehouseStocks([...importedStocks, ...remainingStocks]);
        setStoredCatalogProducts([...importedProducts, ...remainingCatalog]);
        setStoredWarehouseProducts([...importedProducts, ...remainingWarehouseProducts]);
        setToastMsg(`${importedStocks.length} data stok berhasil diimpor${skippedRows ? `, ${skippedRows} baris dilewati` : ''}.`);
      } catch (error) {
        setToastMsg(error instanceof Error ? error.message : 'File CSV gagal diimpor.');
      } finally {
        setIsImportingStocks(false);
        setTimeout(() => setToastMsg(''), 5000);
      }
    };
    reader.onerror = () => {
      setIsImportingStocks(false);
      setToastMsg('File CSV gagal dibaca.');
      setTimeout(() => setToastMsg(''), 4000);
    };
    reader.readAsText(file);
  };

  const handleApprovalAction = (id: string, action: 'approved' | 'rejected') => {
    updateApprovalStatus(id, action);
    const text = action === 'approved' ? 'disetujui' : 'ditolak';
    setToastMsg(`Pengajuan ${id} berhasil ${text} oleh Supervisor dan data terkait telah disinkronkan!`);
    setTimeout(() => setToastMsg(''), 4500);
  };

  if (!isClient || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Memuat Dashboard Analisa...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMsg}</p>
        </div>
      )}

      {/* Top Banner: Greeting & Period */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Monitoring, Supervisi & Dashboard Analisa
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
            onChange={(event) => setPeriodMonth(event.target.value)}
            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            aria-label="Pilih bulan dashboard"
          >
            {[
              ['01', 'Januari'],
              ['02', 'Februari'],
              ['03', 'Maret'],
              ['04', 'April'],
              ['05', 'Mei'],
              ['06', 'Juni'],
              ['07', 'Juli'],
              ['08', 'Agustus'],
              ['09', 'September'],
              ['10', 'Oktober'],
              ['11', 'November'],
              ['12', 'Desember'],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={periodYear}
            onChange={(event) => setPeriodYear(event.target.value)}
            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            aria-label="Pilih tahun dashboard"
          >
            {['2025', '2026', '2027'].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Territory Scoping Notice Banner */}
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
              Anda mengotorisasi pengajuan toko baru (NOO), plafon kredit, dan pesanan taking order di area <strong>{user?.area || 'Wilayah Aktif'}</strong>. Pengajuan dari wilayah lain otomatis diarahkan ke supervisor cabang bersangkutan.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 sm:self-center">
          <span className="px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-[11px] font-bold text-indigo-700 shadow-2xs">
            {pendingApprovalsCount} Tiket Perlu Tindakan
          </span>
        </div>
      </div>

      {/* Supervisor Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSupervisorTab('performance')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSupervisorTab === 'performance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>1. Analisa Performa Salesman</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSupervisorTab('outlets')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSupervisorTab === 'outlets'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>2. Profil & Audit Outlet 360°</span>
          {scopedOutletProfiles.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              {scopedOutletProfiles.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSupervisorTab('stock')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSupervisorTab === 'stock'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>3. Monitoring Stok Gudang & Depo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSupervisorTab('approvals')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSupervisorTab === 'approvals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. Meja Persetujuan Supervisi</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSupervisorTab('orders')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSupervisorTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>5. Monitoring Pesanan Masuk (Live PO SAP)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
            {scopedSalesOrders.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ANALISA PERFORMA SALESMAN (Original Core Features) */}
      {/* ========================================================================= */}
      {activeSupervisorTab === 'performance' && (
        <div className="space-y-6">
          {/* KPI StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Realisasi Visit"
              value={`${summary.totalVisit} visit`}
              icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
              variant="blue"
              trend={{
                value: `${Math.round((summary.totalVisit / (summary.totalPlanned || 1)) * 100)}%`,
                isPositive: true,
                label: 'dari rencana',
              }}
              subtitle={`Target: ${summary.totalPlanned}`}
            />

            <StatCard
              title="Rata-rata Efektivitas"
              value={`${summary.avgEffectiveness}%`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              variant="emerald"
              trend={{
                value: summary.avgEffectiveness >= 80 ? 'Optimal' : 'Perlu Evaluasi',
                isPositive: summary.avgEffectiveness >= 75,
              }}
              subtitle={`${filteredSales.length} salesman`}
            />

            <StatCard
              title="Total Nilai Order"
              value={`Rp ${(summary.totalOrderRp / 1000000).toFixed(1)} jt`}
              icon={<CreditCard className="w-5 h-5 text-violet-600" />}
              variant="violet"
              trend={{
                value: 'Aktif',
                isPositive: true,
                label: 'omset tercatat',
              }}
              subtitle={`Rp ${summary.totalOrderRp.toLocaleString('id-ID')}`}
            />

            <StatCard
              title="Kendala Order (OOS)"
              value={`${summary.totalOos} insiden`}
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              variant="rose"
              trend={{
                value: summary.totalOos > 0 ? 'Perhatian' : 'Aman',
                isPositive: summary.totalOos === 0,
                label: 'out of stock',
              }}
              subtitle="Perlu restock gudang"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 flex">
              <div className="w-full">
                <PerformanceGraph data={filteredSales} />
              </div>
            </div>

            <div className="lg:col-span-5 flex">
              <div className="w-full">
                <SalesPieChart data={periodSalesList} />
              </div>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama sales..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2.5">
              <div className="flex flex-row items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Wilayah Otorisasi: {userArea || 'Semua Wilayah'}</span>
                </span>
              </div>

              {search && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Sales Table */}
          <SalesTable data={filteredSales} onResetFilters={handleResetFilters} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROFIL & AUDIT OUTLET 360° */}
      {/* ========================================================================= */}
      {activeSupervisorTab === 'outlets' && (
        <div className="space-y-6">
          {/* Quick Metrics for Outlets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Limit Kredit Diberikan</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                Rp {scopedOutletProfiles.reduce((acc, c) => acc + c.creditLimitRp, 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-emerald-600 mt-1">Terbagi ke {scopedOutletProfiles.length} Outlet Binaan ({user?.area || 'Cabang'})</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Piutang Berjalan (Outstanding)</span>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">
                Rp {scopedOutletProfiles.reduce((acc, c) => acc + c.currentReceivableRp, 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Utilisasi: {scopedOutletProfiles.length > 0 ? (
                  (
                    (scopedOutletProfiles.reduce((acc, c) => acc + c.currentReceivableRp, 0) /
                      (scopedOutletProfiles.reduce((acc, c) => acc + c.creditLimitRp, 0) || 1)) *
                    100
                  ).toFixed(1)
                ) : 0}% (Aman)
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Kepatuhan Pembayaran Rata-rata</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                {scopedOutletProfiles.length > 0
                  ? (
                      scopedOutletProfiles.reduce((acc, c) => acc + c.paymentCompliancePercent, 0) /
                      scopedOutletProfiles.length
                    ).toFixed(1)
                  : 0}%
              </p>
              <p className="text-[11px] text-amber-600 mt-1">
                {scopedOutletProfiles.filter((p) => p.auditStatus === 'Over Limit').length} Toko Melebihi Plafon
              </p>
            </div>
          </div>

          {/* Outlets Profiling Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Daftar Profil Finansial & Audit Outlet ({scopedOutletProfiles.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supervisor memantau batas limit kredit, riwayat piutang berjalan, dan tingkat kepatuhan tempo toko di wilayah {user?.area}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
                Wilayah: {user?.area || 'Semua'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Nama Toko / Outlet</th>
                    <th className="p-3.5">Wilayah & Kategori</th>
                    <th className="p-3.5 text-right">Plafon Kredit</th>
                    <th className="p-3.5 text-right">Piutang Aktif</th>
                    <th className="p-3.5 text-center">Kepatuhan TOP</th>
                    <th className="p-3.5 text-center">Skor Risiko</th>
                    <th className="p-3.5 text-center">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scopedOutletProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Belum ada profil outlet di wilayah {user?.area}. Saat outlet baru diverifikasi, profil audit finansialnya akan tercatat di sini.
                      </td>
                    </tr>
                  ) : (
                    paginatedOutletProfiles.map((item) => {
                      const isOverLimit = item.auditStatus === 'Over Limit';
                      const isWarning = item.auditStatus === 'Perlu Follow-up';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5">
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {item.id} • Pemilik: {item.owner}
                            </p>
                          </td>

                        <td className="p-3.5">
                          <span className="font-medium text-slate-800">{item.category}</span>
                          <span className="block text-[10px] text-slate-400">{item.area}</span>
                        </td>

                        <td className="p-3.5 text-right font-medium text-slate-700">
                          Rp {item.creditLimitRp.toLocaleString('id-ID')}
                        </td>

                        <td className="p-3.5 text-right font-bold text-slate-900">
                          Rp {item.currentReceivableRp.toLocaleString('id-ID')}
                        </td>

                        <td className="p-3.5 text-center font-bold text-slate-800">
                          {item.paymentCompliancePercent}%
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block w-6 h-6 rounded-full text-[11px] font-extrabold leading-6 ${
                              item.riskGrade === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.riskGrade === 'B'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.riskGrade}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isOverLimit
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isWarning
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.auditStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
            <Pagination
              currentPage={safeOutletPage}
              totalPages={outletTotalPages}
              totalItems={scopedOutletProfiles.length}
              itemsPerPage={outletItemsPerPage}
              onPageChange={setOutletPage}
              onItemsPerPageChange={(items) => {
                setOutletItemsPerPage(items);
                setOutletPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MONITORING STOK GUDANG & DEPO TERPUSAT */}
      {/* ========================================================================= */}
      {activeSupervisorTab === 'stock' && (
        <div className="space-y-6">
          {/* Stock Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total SKU Terdaftar di Depo</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{scopedWarehouseStocks.length} Produk FMCG</p>
              <p className="text-[11px] text-slate-400 mt-1">Gudang {userArea || 'Semua Wilayah'}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Produk Out of Stock (OOS)</span>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">
                {scopedWarehouseStocks.filter((s) => s.status === 'Habis').length} SKU
              </p>
              <p className="text-[11px] text-rose-600 mt-1">
                {scopedWarehouseStocks.filter((s) => s.status === 'Habis').map((s) => s.name.split(' ')[0]).join(', ') || 'Semua Produk Tersedia'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">SKU Mendekati Reorder Point</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {scopedWarehouseStocks.filter((s) => s.status === 'Kritis').length} SKU
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                {scopedWarehouseStocks.find((s) => s.status === 'Kritis')
                  ? `${scopedWarehouseStocks.find((s) => s.status === 'Kritis')?.name} (Sisa ${scopedWarehouseStocks.find((s) => s.status === 'Kritis')?.depoStock} unit)`
                  : 'Stok di atas batas kritis'}
              </p>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Monitoring Stok Gudang & Ambang Batas Keselamatan (Safety Stock)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supervisor memantau ketersediaan fisik, titik pemesanan ulang (ROP), dan estimasi ketahanan stok
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isImportingStocks
                      ? 'bg-slate-100 text-slate-400 pointer-events-none'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Import data stok dari file CSV"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isImportingStocks ? 'Mengimpor...' : 'Import CSV'}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleImportStocks}
                    disabled={isImportingStocks}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleExportStocks}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  title="Unduh data stok wilayah dalam format CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Produk
                </button>
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                  Realtime Sync Depo
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">SKU & Nama Produk</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5 text-center">Stok Fisik Depo</th>
                    <th className="p-3.5 text-center">Safety Stock</th>
                    <th className="p-3.5 text-center">Reorder Point (ROP)</th>
                    <th className="p-3.5 text-center">Ketahanan Stok</th>
                    <th className="p-3.5 text-center">Status Gudang</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedWarehouseStocks.map((item) => {
                    const isHabis = item.status === 'Habis';
                    const isKritis = item.status === 'Kritis';
                    return (
                      <tr key={item.sku} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.sku}</p>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-medium">
                            {item.category}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {item.depoStock} {item.unit}
                          </span>
                        </td>

                        <td className="p-3.5 text-center text-slate-600 font-medium">
                          {item.safetyStock} {item.unit}
                        </td>

                        <td className="p-3.5 text-center text-slate-600 font-medium">
                          {item.reorderPoint} {item.unit}
                        </td>

                        <td className="p-3.5 text-center font-semibold text-slate-700">
                          {item.daysOfInventory > 0 ? `${item.daysOfInventory} Hari` : '0 Hari (OOS)'}
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isHabis
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isKritis
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleEditStock(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100 transition cursor-pointer"
                            aria-label={`Edit stok ${item.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={safeStockPage}
              totalPages={stockTotalPages}
              totalItems={scopedWarehouseStocks.length}
              itemsPerPage={stockItemsPerPage}
              onPageChange={setStockPage}
              onItemsPerPageChange={(items) => {
                setStockItemsPerPage(items);
                setStockPage(1);
              }}
            />
          </div>

          {editingStock && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900">Edit Data Stok Gudang & Depo</h3>
                    <p className="text-xs text-slate-500 mt-1">Perubahan tersimpan ke data stok bersama.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingStock(null)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    aria-label="Tutup form edit stok"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveStock} className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ['sku', 'SKU'],
                      ['name', 'Nama Produk'],
                      ['category', 'Kategori'],
                      ['unit', 'Satuan'],
                    ].map(([field, label]) => (
                      <label key={field} className="font-semibold text-slate-700">
                        {label}
                        <input
                          type="text"
                          required
                          value={stockForm[field as keyof typeof stockForm]}
                          onChange={(event) =>
                            setStockForm((current) => ({ ...current, [field]: event.target.value }))
                          }
                          className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ['depoStock', 'Stok Fisik Depo'],
                      ['safetyStock', 'Safety Stock'],
                      ['reorderPoint', 'Reorder Point (ROP)'],
                      ['daysOfInventory', 'Ketahanan Stok (Hari)'],
                    ].map(([field, label]) => (
                      <label key={field} className="font-semibold text-slate-700">
                        {label}
                        <input
                          type="number"
                          min="0"
                          required
                          value={stockForm[field as keyof typeof stockForm]}
                          onChange={(event) =>
                            setStockForm((current) => ({ ...current, [field]: event.target.value }))
                          }
                          className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                        />
                      </label>
                    ))}
                  </div>

                  <label className="block font-semibold text-slate-700">
                    Status Gudang
                    <select
                      value={stockForm.status}
                      onChange={(event) =>
                        setStockForm((current) => ({
                          ...current,
                          status: event.target.value as WarehouseStockItem['status'],
                        }))
                      }
                      className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Aman">Aman</option>
                      <option value="Kritis">Kritis</option>
                      <option value="Habis">Habis</option>
                    </select>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="font-semibold text-slate-700">
                      Jenis Promo
                      <select value={stockForm.promoType} onChange={(event) => setStockForm((current) => ({ ...current, promoType: event.target.value as 'none' | 'discount' | 'quantity' }))} className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                        <option value="none">Tanpa Promo</option>
                        <option value="discount">Diskon Harga (%)</option>
                        <option value="quantity">Diskon Kuantitas</option>
                      </select>
                    </label>
                    <label className="font-semibold text-slate-700">
                      {stockForm.promoType === 'quantity' ? 'Minimal Beli' : 'Diskon (%)'}
                      <input type="number" min="1" value={stockForm.promoValue} onChange={(event) => setStockForm((current) => ({ ...current, promoValue: event.target.value }))} disabled={stockForm.promoType === 'none'} className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50" />
                    </label>
                    <label className="font-semibold text-slate-700">
                      Bonus Gratis
                      <input type="number" min="1" value={stockForm.promoFreeQuantity} onChange={(event) => setStockForm((current) => ({ ...current, promoFreeQuantity: event.target.value }))} disabled={stockForm.promoType !== 'quantity'} className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50" />
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingStock(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showAddStockModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900">Tambah Produk Gudang & Taking Order</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Produk baru otomatis tersedia di katalog Taking Order.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddStockModal(false)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    aria-label="Tutup form tambah produk"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddStock} className="p-5 space-y-4 text-xs">
                  <label className="block font-semibold text-slate-700">
                    Wilayah Stok
                    <input
                      type="text"
                      value={userArea || 'Semua Wilayah'}
                      readOnly
                      className="mt-1 w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none"
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="font-semibold text-slate-700">
                      Nama Produk
                      <input
                        type="text"
                        required
                        value={newStockForm.name}
                        onChange={(event) => setNewStockForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Contoh: Biskuit Roma 300g"
                        className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                      />
                    </label>
                    <label className="font-semibold text-slate-700">
                      Kategori
                      <select
                        value={newStockForm.category}
                        onChange={(event) => setNewStockForm((current) => ({ ...current, category: event.target.value }))}
                        className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                      >
                        <option>Sembako</option>
                        <option>Minuman</option>
                        <option>Makanan Ringan</option>
                        <option>Personal Care</option>
                        <option>Kebersihan</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="font-semibold text-slate-700">
                      Harga Satuan (Rp)
                      <input
                        type="number"
                        required
                        min="1"
                        value={newStockForm.price}
                        onChange={(event) => setNewStockForm((current) => ({ ...current, price: event.target.value }))}
                        className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                      />
                    </label>
                    <label className="font-semibold text-slate-700">
                      Satuan
                      <input
                        type="text"
                        required
                        value={newStockForm.unit}
                        onChange={(event) => setNewStockForm((current) => ({ ...current, unit: event.target.value }))}
                        placeholder="pcs / karton / sak"
                        className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      ['depoStock', 'Stok Fisik Depo'],
                      ['safetyStock', 'Safety Stock'],
                      ['reorderPoint', 'Reorder Point (ROP)'],
                    ].map(([field, label]) => (
                      <label key={field} className="font-semibold text-slate-700">
                        {label}
                        <input
                          type="number"
                          required
                          min="0"
                          value={newStockForm[field as keyof typeof newStockForm]}
                          onChange={(event) => setNewStockForm((current) => ({ ...current, [field]: event.target.value }))}
                          className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="font-semibold text-slate-700">
                      Jenis Promo
                      <select value={newStockForm.promoType} onChange={(event) => setNewStockForm((current) => ({ ...current, promoType: event.target.value as 'none' | 'discount' | 'quantity' }))} className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                        <option value="none">Tanpa Promo</option>
                        <option value="discount">Diskon Harga (%)</option>
                        <option value="quantity">Diskon Kuantitas</option>
                      </select>
                    </label>
                    <label className="font-semibold text-slate-700">
                      {newStockForm.promoType === 'quantity' ? 'Minimal Beli' : 'Diskon (%)'}
                      <input type="number" min="1" value={newStockForm.promoValue} onChange={(event) => setNewStockForm((current) => ({ ...current, promoValue: event.target.value }))} disabled={newStockForm.promoType === 'none'} className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50" />
                    </label>
                    <label className="font-semibold text-slate-700">
                      Bonus Gratis
                      <input type="number" min="1" value={newStockForm.promoFreeQuantity} onChange={(event) => setNewStockForm((current) => ({ ...current, promoFreeQuantity: event.target.value }))} disabled={newStockForm.promoType !== 'quantity'} className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50" />
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStockModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Simpan Produk
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MEJA PERSETUJUAN SUPERVISI (SUPERVISOR APPROVALS) */}
      {/* ========================================================================= */}
      {activeSupervisorTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Panel Pengesahan & Otorisasi Supervisor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Persetujuan terpusat untuk pendaftaran outlet baru (NOO), diskon pesanan di atas wewenang sales, dan klaim retur barang
              </p>
            </div>

            <div className="space-y-3">
              {scopedApprovals.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">
                    Tidak ada tiket pengajuan untuk wilayah {user?.area}
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Saat salesman mengajukan outlet baru (NOO), klaim retur barang rusak, atau order taking order di wilayah {user?.area}, tiket otorisasi akan otomatis masuk ke meja Anda di sini.
                  </p>
                </div>
              ) : (
                paginatedApprovals.map((item) => {
                  const isPending = item.status === 'pending';
                  const isApproved = item.status === 'approved';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPending
                          ? 'bg-slate-50 border-slate-200'
                          : isApproved
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600 text-xs">{item.id}</span>
                            <span className="text-slate-300">•</span>
                            <span
                              className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                item.type === 'NOO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.type === 'Order'
                                  ? 'bg-purple-100 text-purple-800'
                                  : item.type === 'Retur'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {item.type === 'NOO'
                                ? 'Pendaftaran NOO'
                                : item.type === 'Order'
                                ? 'Otorisasi Order SAP'
                                : item.type === 'Retur'
                                ? 'Klaim Retur'
                                : item.type}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{item.title}</span>
                          </div>

                          <p className="text-xs text-slate-600">{item.detail}</p>

                          <p className="text-[11px] text-slate-400">
                            Diajukan oleh: <strong>{item.submitter}</strong> • {item.date} • Wilayah: <strong className="text-indigo-600">{item.area}</strong>
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprovalAction(item.id, 'rejected')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprovalAction(item.id, 'approved')}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui Otorisasi</span>
                              </button>
                            </>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {isApproved ? 'Telah Disetujui' : 'Telah Ditolak'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Pagination
              currentPage={safeApprovalPage}
              totalPages={approvalTotalPages}
              totalItems={scopedApprovals.length}
              itemsPerPage={approvalItemsPerPage}
              onPageChange={setApprovalPage}
              onItemsPerPageChange={(items) => {
                setApprovalItemsPerPage(items);
                setApprovalPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MONITORING PESANAN MASUK (LIVE PO SAP) */}
      {/* ========================================================================= */}
      {activeSupervisorTab === 'orders' && (
        <div className="space-y-6">
          {/* Order Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Pesanan Masuk Hari Ini</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{scopedSalesOrders.length} Pesanan</p>
              <p className="text-[11px] text-slate-400 mt-1">Diterbitkan tim salesman di {user?.area}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Nilai Omset PO</span>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">
                Rp {scopedSalesOrders.reduce((a, b) => a + b.totalRp, 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Akumulasi taking order wilayah</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Perlu Otorisasi Supervisor</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {scopedSalesOrders.filter((o) => o.status === 'Menunggu Persetujuan Supervisor').length} PO
              </p>
              <p className="text-[11px] text-amber-700 mt-1">Menunggu pengesahan rilis gudang</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Telah Disetujui & Siap Kirim</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                {scopedSalesOrders.filter((o) => o.status === 'Disetujui & Siap Kirim').length} PO
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">Stok terpotong, siap dipacking</p>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span>Daftar Transaksi Pesanan Masuk Salesman ({scopedSalesOrders.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supervisor memantau seluruh PO yang dikirim oleh salesman di wilayah {user?.area}, mengecek rincian barang, dan dapat menyetujui langsung
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                Wilayah: {user?.area || 'Semua'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Nomor PO</th>
                    <th className="p-3.5">Outlet Pemesan</th>
                    <th className="p-3.5">Salesman</th>
                    <th className="p-3.5">Item Produk</th>
                    <th className="p-3.5 text-right">Total Nilai</th>
                    <th className="p-3.5 text-center">Termin</th>
                    <th className="p-3.5 text-center">Status Otorisasi</th>
                    <th className="p-3.5 text-center">Aksi Supervisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scopedSalesOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Belum ada pesanan yang masuk untuk wilayah {user?.area}.
                      </td>
                    </tr>
                  ) : (
                    paginatedSalesOrders.map((order) => {
                      const isPending = order.status === 'Menunggu Persetujuan Supervisor';
                      const isApproved = order.status === 'Disetujui & Siap Kirim';
                      const isRejected = order.status === 'Ditolak Supervisor';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-bold text-blue-600 whitespace-nowrap">
                            {order.id}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {order.date} • {order.time}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <p className="font-bold text-slate-900">{order.outletName}</p>
                            {order.approvalId && (
                              <span className="text-[10px] text-purple-700 font-medium">
                                Tiket: {order.approvalId}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-700 font-medium">
                            {order.salesName}
                          </td>

                          <td className="p-3.5">
                            <p className="font-semibold text-slate-800">
                              {order.items.length} jenis produk
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">
                              {order.items.map((it) => `${it.productName} (${it.qty} ${it.unit})`).join(', ')}
                            </p>
                          </td>

                          <td className="p-3.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                            Rp {order.totalRp.toLocaleString('id-ID')}
                          </td>

                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                              {order.paymentTerm}
                            </span>
                          </td>

                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isPending
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isPending && <Clock className="w-3 h-3 text-amber-600 animate-pulse" />}
                              {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {isRejected && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                              <span>{order.status}</span>
                            </span>
                          </td>

                          <td className="p-3.5 text-center whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApprovalAction(order.approvalId || order.id, 'rejected')}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Tolak
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApprovalAction(order.approvalId || order.id, 'approved')}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Setujui</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Selesai Diotorisasi
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
            <Pagination
              currentPage={safeOrderPage}
              totalPages={orderTotalPages}
              totalItems={scopedSalesOrders.length}
              itemsPerPage={orderItemsPerPage}
              onPageChange={setOrderPage}
              onItemsPerPageChange={(items) => {
                setOrderItemsPerPage(items);
                setOrderPage(1);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}