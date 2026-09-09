'use client';

import { useState, useMemo } from 'react';
import { SalesData } from '@/types/sales';
import { UserSession } from '@/types/auth';
import {
  ApprovalItem,
  CatalogProduct,
  WarehouseStockItem,
  SalesOrder,
  RemoteOrder,
  OutletVisitLog,
  updateApprovalStatus,
  updateSalesOrderFulfillment,
  updateRemoteOrderProgress,
  getStoredApprovals,
  setStoredCatalogProducts,
  setStoredWarehouseProducts,
  setStoredWarehouseStocks,
  updateWarehouseStock,
  getStoredWarehouseProducts,
  normalizeVisitDate,
} from '@/lib/storage';
import { csvEscape, parseCsvLine } from '@/lib/csv';

// ─── Supervisor confirmation union type ───────────────────────────────────────
export type SupervisorConfirmation =
  | { kind: 'approval'; id: string; action: 'approved' | 'rejected' }
  | { kind: 'remoteApproval'; order: RemoteOrder; action: 'approved' | 'rejected' }
  | { kind: 'fulfillment'; orderId: string; status: RemoteOrder['fulfillmentStatus'] };

// ─── Promo form shape ─────────────────────────────────────────────────────────
export type PromoType = 'none' | 'discount' | 'quantity';

export interface StockFormState {
  sku: string;
  name: string;
  category: string;
  price: string;
  depoStock: string;
  safetyStock: string;
  reorderPoint: string;
  unit: string;
  daysOfInventory: string;
  status: WarehouseStockItem['status'];
  promoType: PromoType;
  promoValue: string;
  promoFreeQuantity: string;
}

export interface NewStockFormState {
  area: string;
  name: string;
  category: string;
  price: string;
  depoStock: string;
  safetyStock: string;
  reorderPoint: string;
  unit: string;
  promoType: PromoType;
  promoValue: string;
  promoFreeQuantity: string;
}

const DEFAULT_NEW_STOCK_FORM: NewStockFormState = {
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
};

// ─── Aggregate stats shape ────────────────────────────────────────────────────
export interface DashboardSummary {
  totalPlanned: number;
  totalVisit: number;
  totalOrderRp: number;
  totalOos: number;
  avgEffectiveness: number;
}

// ─── Hook args ────────────────────────────────────────────────────────────────
interface UseDashboardLogicArgs {
  user: UserSession | null;
  approvals: ApprovalItem[];
  warehouseStocks: WarehouseStockItem[];
  catalogProducts: CatalogProduct[];
  warehouseProducts: CatalogProduct[];
  salesOrders: SalesOrder[];
  remoteOrders: RemoteOrder[];
  salesList: SalesData[];
  visitLogs: OutletVisitLog[];
  periodMonth: string;
  periodYear: string;
}

export function useDashboardLogic({
  user,
  approvals,
  warehouseStocks,
  catalogProducts,
  warehouseProducts,
  salesOrders,
  remoteOrders,
  salesList,
  visitLogs,
  periodMonth,
  periodYear,
}: UseDashboardLogicArgs) {
  const userArea = user?.area;
  const selectedPeriod = `${periodYear}-${periodMonth}`;

  // ── Search state ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState<SupervisorConfirmation | null>(null);

  // ── Stock modal state ─────────────────────────────────────────────────────────
  const [editingStock, setEditingStock] = useState<WarehouseStockItem | null>(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [isImportingStocks, setIsImportingStocks] = useState(false);

  // ── Pagination state ──────────────────────────────────────────────────────────
  const [stockPage, setStockPage] = useState(1);
  const [stockItemsPerPage, setStockItemsPerPage] = useState(5);
  const [approvalPage, setApprovalPage] = useState(1);
  const [approvalItemsPerPage, setApprovalItemsPerPage] = useState(5);
  const [orderPage, setOrderPage] = useState(1);
  const [orderItemsPerPage, setOrderItemsPerPage] = useState(5);

  // ── Toast helper ──────────────────────────────────────────────────────────────
  const showToast = (msg: string, duration = 4000) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), duration);
  };

  // ── Territory-scoped data ─────────────────────────────────────────────────────
  const scopedWarehouseStocks = useMemo(() => {
    if (!userArea || userArea === 'All') return warehouseStocks;
    return warehouseStocks.filter((s) => s.area === userArea);
  }, [warehouseStocks, userArea]);

  const scopedApprovals = useMemo(() => {
    if (!userArea || userArea === 'All') return approvals;
    return approvals.filter((a) => !a.area || a.area.toLowerCase() === userArea.toLowerCase());
  }, [approvals, userArea]);

  const scopedSalesOrders = useMemo(() => {
    if (!userArea || userArea === 'All') return salesOrders;
    return salesOrders.filter((o) => !o.area || o.area.toLowerCase() === userArea.toLowerCase());
  }, [salesOrders, userArea]);

  const scopedRemoteOrders = useMemo(() => {
    if (!userArea || userArea === 'All') return remoteOrders;
    return remoteOrders.filter((o) => !o.area || o.area.toLowerCase() === userArea.toLowerCase());
  }, [remoteOrders, userArea]);

  // ── Period-filtered visit logs ────────────────────────────────────────────────
  const periodVisitLogs = useMemo(
    () => visitLogs.filter((l) => normalizeVisitDate(l.date).startsWith(selectedPeriod)),
    [selectedPeriod, visitLogs]
  );

  // ── Period-aware sales list ───────────────────────────────────────────────────
  const periodSalesList = useMemo(() => {
    return salesList.map((salesman) => {
      const logs = periodVisitLogs.filter(
        (l) =>
          (salesman.id && l.salesId === salesman.id) ||
          l.salesName.trim().toLowerCase() === salesman.nama_sales.trim().toLowerCase()
      );
      const realized = logs.length;
      const orderTotal = logs.reduce((sum, l) => sum + (Number(l.orderValueRp) || 0), 0);
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

  const scopedSalesList = useMemo(() => {
    if (!userArea || userArea === 'All') return periodSalesList;
    return periodSalesList.filter((i) => !i.area || i.area.toLowerCase() === userArea.toLowerCase());
  }, [periodSalesList, userArea]);

  const filteredSales = useMemo(
    () => scopedSalesList.filter((i) => i.nama_sales.toLowerCase().includes(search.toLowerCase())),
    [search, scopedSalesList]
  );

  const summary: DashboardSummary = useMemo(() => {
    const totalPlanned = filteredSales.reduce((a, b) => a + b.kunjungan_planned, 0);
    const totalVisit = filteredSales.reduce((a, b) => a + b.kunjungan_realisasi, 0);
    const totalOrderRp = filteredSales.reduce((a, b) => a + b.total_order_rp, 0);
    const totalOos = scopedWarehouseStocks.filter((s) => s.status === 'Habis').length;
    const avgEffectiveness = filteredSales.length
      ? Math.round(filteredSales.reduce((a, b) => a + b.efektivitas_visit_persen, 0) / filteredSales.length)
      : 0;
    return { totalPlanned, totalVisit, totalOrderRp, totalOos, avgEffectiveness };
  }, [filteredSales, scopedWarehouseStocks]);

  const pendingApprovalsCount = useMemo(
    () => scopedApprovals.filter((a) => a.status === 'pending').length,
    [scopedApprovals]
  );

  // ── Pagination helpers ────────────────────────────────────────────────────────
  const stockTotalPages = Math.ceil(scopedWarehouseStocks.length / stockItemsPerPage) || 1;
  const safeStockPage = Math.min(stockPage, stockTotalPages) || 1;
  const paginatedWarehouseStocks = scopedWarehouseStocks.slice(
    (safeStockPage - 1) * stockItemsPerPage,
    safeStockPage * stockItemsPerPage
  );

  const approvalTotalPages = Math.ceil(scopedApprovals.length / approvalItemsPerPage) || 1;
  const safeApprovalPage = Math.min(approvalPage, approvalTotalPages) || 1;
  const paginatedApprovals = scopedApprovals.slice(
    (safeApprovalPage - 1) * approvalItemsPerPage,
    safeApprovalPage * approvalItemsPerPage
  );

  const orderTotalPages = Math.ceil(scopedSalesOrders.length / orderItemsPerPage) || 1;
  const safeOrderPage = Math.min(orderPage, orderTotalPages) || 1;
  const paginatedSalesOrders = scopedSalesOrders.slice(
    (safeOrderPage - 1) * orderItemsPerPage,
    safeOrderPage * orderItemsPerPage
  );

  // ── Promo builder ─────────────────────────────────────────────────────────────
  const buildPromo = (type: PromoType, value: string, freeQuantity: string) => {
    if (type === 'discount') {
      const percent = Math.max(1, Number(value) || 0);
      return { type: 'discount' as const, label: `Diskon ${percent}%`, discountPercent: percent };
    }
    if (type === 'quantity') {
      const threshold = Math.max(1, Number(value) || 1);
      const free = Math.max(1, Number(freeQuantity) || 1);
      return { type: 'b5g1' as const, label: `Beli ${threshold} Gratis ${free}`, quantityThreshold: threshold, freeQuantity: free };
    }
    return undefined;
  };

  // ── Stock handlers ────────────────────────────────────────────────────────────
  const handleOpenEditStock = (item: WarehouseStockItem) => {
    const product = catalogProducts.find((p) => p.id === item.sku || p.name === item.name);
    setEditingStock(item);
    return {
      sku: item.sku,
      name: item.name,
      category: item.category,
      price: String(product?.price || 0),
      depoStock: String(item.depoStock),
      safetyStock: String(item.safetyStock),
      reorderPoint: String(item.reorderPoint),
      unit: item.unit,
      daysOfInventory: String(item.daysOfInventory),
      status: item.status,
      promoType: (product?.promo?.type === 'discount' ? 'discount' : product?.promo?.type === 'b5g1' ? 'quantity' : 'none') as PromoType,
      promoValue: product?.promo?.type === 'discount'
        ? String(product.promo.discountPercent || 10)
        : String(product?.promo?.quantityThreshold || 5),
      promoFreeQuantity: String(product?.promo?.freeQuantity || 1),
    } as StockFormState;
  };

  const handleSaveStock = (editingStockItem: WarehouseStockItem, form: StockFormState) => {
    const depoStock = Math.max(0, Number(form.depoStock) || 0);
    const safetyStock = Math.max(0, Number(form.safetyStock) || 0);
    const reorderPoint = Math.max(0, Number(form.reorderPoint) || 0);
    const daysOfInventory = Math.max(0, Number(form.daysOfInventory) || 0);
    const price = Math.max(0, Number(form.price) || 0);
    const status = depoStock === 0 ? 'Habis' : form.status;

    try {
      updateWarehouseStock(editingStockItem.sku, editingStockItem.area, {
        area: editingStockItem.area,
        sku: form.sku.trim() || editingStockItem.sku,
        name: form.name.trim(),
        category: form.category.trim(),
        depoStock, safetyStock, reorderPoint,
        unit: form.unit.trim() || editingStockItem.unit,
        daysOfInventory, status,
      });

      const updatedProduct = catalogProducts.find(
        (p) => p.id === editingStockItem.sku || p.name === editingStockItem.name
      );
      const nextProduct: CatalogProduct = {
        ...(updatedProduct || {
          id: form.sku.trim() || editingStockItem.sku,
          price, stock: depoStock, unit: form.unit.trim() || editingStockItem.unit,
        }),
        id: form.sku.trim() || editingStockItem.sku,
        name: form.name.trim(),
        category: form.category.trim(),
        price, stock: depoStock,
        unit: form.unit.trim() || editingStockItem.unit,
        promo: buildPromo(form.promoType, form.promoValue, form.promoFreeQuantity),
      };
      const remaining = catalogProducts.filter(
        (p) => p.id !== editingStockItem.sku && p.name !== editingStockItem.name
      );
      setStoredCatalogProducts([nextProduct, ...remaining]);
      setStoredWarehouseProducts(
        getStoredWarehouseProducts().map((p) =>
          p.id === editingStockItem.sku || p.name === editingStockItem.name ? nextProduct : p
        )
      );
      setEditingStock(null);
      showToast(`Data stok ${form.name} berhasil diperbarui.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Data stok gagal diperbarui.');
    }
  };

  const handleAddStock = (form: NewStockFormState) => {
    const name = form.name.trim();
    const area = form.area || userArea || 'Bandung Kota';
    const price = Math.max(0, Number(form.price) || 0);
    const depoStock = Math.max(0, Number(form.depoStock) || 0);
    const safetyStock = Math.max(0, Number(form.safetyStock) || 0);
    const reorderPoint = Math.max(0, Number(form.reorderPoint) || 0);
    if (!name || price <= 0) return;

    const productIds = [...catalogProducts, ...warehouseProducts, ...warehouseStocks]
      .map((p) => ('id' in p ? p.id : p.sku))
      .filter((id): id is string => Boolean(id));
    const nextNum = productIds.reduce((highest, id) => {
      const m = id.match(/(?:PRD|SKU)-(\d+)/);
      return Math.max(highest, m ? Number(m[1]) : 0);
    }, 0) + 1;
    const productId = `PRD-${String(nextNum).padStart(3, '0')}`;
    const status: WarehouseStockItem['status'] =
      depoStock === 0 ? 'Habis' : depoStock <= reorderPoint ? 'Kritis' : 'Aman';

    const product: CatalogProduct = {
      id: productId, name, category: form.category, price, stock: depoStock,
      unit: form.unit.trim() || 'pcs',
      promo: buildPromo(form.promoType, form.promoValue, form.promoFreeQuantity),
    };
    const stock: WarehouseStockItem = {
      sku: productId, area, name, category: form.category,
      depoStock, safetyStock, reorderPoint,
      unit: product.unit, status,
      daysOfInventory: Math.floor(depoStock / 10),
      fastMovingRank: warehouseStocks.length + 1,
    };

    setStoredCatalogProducts([product, ...catalogProducts]);
    setStoredWarehouseProducts([product, ...warehouseProducts]);
    setStoredWarehouseStocks([stock, ...warehouseStocks]);
    setShowAddStockModal(false);
    showToast(`${name} berhasil ditambahkan dan tersedia di Taking Order.`);
  };

  const handleExportStocks = () => {
    const headers = ['SKU','Area','Nama Produk','Kategori','Harga Satuan','Stok Fisik Depo','Safety Stock','Reorder Point (ROP)','Satuan','Ketahanan Stok (Hari)','Status Gudang'];
    const rows = scopedWarehouseStocks.map((s) => {
      const product = catalogProducts.find((p) => p.id === s.sku || p.name === s.name);
      return [s.sku, s.area, s.name, s.category, product?.price || 0, s.depoStock, s.safetyStock, s.reorderPoint, s.unit, s.daysOfInventory, s.status].map(csvEscape).join(',');
    });
    const csv = `\uFEFF${headers.map(csvEscape).join(',')}\n${rows.join('\n')}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `stok-gudang-${(userArea || 'semua-wilayah').toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast(`${scopedWarehouseStocks.length} data stok berhasil diekspor.`);
  };

  const handleImportStocks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsImportingStocks(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const lines = String(reader.result || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) throw new Error('File CSV tidak memiliki data.');
        const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
        const required = ['sku','nama produk','kategori','stok fisik depo','safety stock','reorder point (rop)','satuan'];
        const missing = required.find((h) => !headers.includes(h));
        if (missing) throw new Error(`Kolom wajib tidak ditemukan: ${missing}.`);

        const importedStocks: WarehouseStockItem[] = [];
        const importedProducts: CatalogProduct[] = [];
        let skipped = 0;
        lines.slice(1).forEach((line) => {
          const vals = parseCsvLine(line);
          const row = Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
          const area = row.area || userArea || 'Bandung Kota';
          if (userArea && userArea !== 'All' && area.toLowerCase() !== userArea.toLowerCase()) { skipped++; return; }
          const sku = row.sku.trim();
          const name = row['nama produk'].trim();
          if (!sku || !name) { skipped++; return; }
          const depoStock = Math.max(0, Number(row['stok fisik depo']) || 0);
          const safetyStock = Math.max(0, Number(row['safety stock']) || 0);
          const reorderPoint = Math.max(0, Number(row['reorder point (rop)']) || 0);
          const statusVal = row['status gudang'];
          const status: WarehouseStockItem['status'] = depoStock === 0 ? 'Habis' : (statusVal === 'Kritis' || statusVal === 'Habis') ? statusVal : 'Aman';
          const s: WarehouseStockItem = { sku, area, name, category: row.kategori.trim() || 'Sembako', depoStock, safetyStock, reorderPoint, unit: row.satuan.trim() || 'pcs', status, daysOfInventory: Math.max(0, Number(row['ketahanan stok (hari)']) || Math.floor(depoStock / 10)), fastMovingRank: warehouseStocks.length + importedStocks.length + 1 };
          importedStocks.push(s);
          const ep = catalogProducts.find((p) => p.id === sku || p.name === name);
          importedProducts.push({ id: sku, name, category: s.category, price: Number(row['harga satuan']) || ep?.price || 0, stock: depoStock, unit: s.unit, promo: ep?.promo, substituteId: ep?.substituteId, substituteName: ep?.substituteName });
        });
        if (importedStocks.length === 0) throw new Error('Tidak ada baris CSV yang sesuai dengan wilayah aktif.');
        const importedKeys = new Set(importedStocks.map((s) => `${s.area}:${s.sku}`));
        const remainingStocks = warehouseStocks.filter((s) => !importedKeys.has(`${s.area}:${s.sku}`));
        const importedProductIds = new Set(importedProducts.map((p) => p.id));
        setStoredWarehouseStocks([...importedStocks, ...remainingStocks]);
        setStoredCatalogProducts([...importedProducts, ...catalogProducts.filter((p) => !importedProductIds.has(p.id))]);
        setStoredWarehouseProducts([...importedProducts, ...warehouseProducts.filter((p) => !importedProductIds.has(p.id))]);
        showToast(`${importedStocks.length} data stok berhasil diimpor${skipped ? `, ${skipped} baris dilewati` : ''}.`, 5000);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'File CSV gagal diimpor.');
      } finally {
        setIsImportingStocks(false);
      }
    };
    reader.onerror = () => { setIsImportingStocks(false); showToast('File CSV gagal dibaca.'); };
    reader.readAsText(file);
  };

  // ── Approval / fulfillment handlers ──────────────────────────────────────────
  const handleApprovalAction = (id: string, action: 'approved' | 'rejected') =>
    setPendingConfirmation({ kind: 'approval', id, action });

  const handleFulfillmentAction = (orderId: string, status: SalesOrder['fulfillmentStatus']) =>
    setPendingConfirmation({ kind: 'fulfillment', orderId, status });

  const handleRemoteApproval = (order: RemoteOrder, action: 'approved' | 'rejected') =>
    setPendingConfirmation({ kind: 'remoteApproval', order, action });

  const handleRemoteFulfillment = (order: RemoteOrder, status: RemoteOrder['fulfillmentStatus']) =>
    setPendingConfirmation({ kind: 'fulfillment', orderId: order.id, status });

  const confirmPendingAction = () => {
    if (!pendingConfirmation) return;
    if (pendingConfirmation.kind === 'approval') {
      updateApprovalStatus(pendingConfirmation.id, pendingConfirmation.action);
      showToast(`Pengajuan ${pendingConfirmation.id} berhasil dikonfirmasi.`, 4500);
    } else if (pendingConfirmation.kind === 'remoteApproval') {
      const approval = getStoredApprovals().find((a) => a.orderId === pendingConfirmation.order.id);
      if (approval) updateApprovalStatus(approval.id, pendingConfirmation.action);
      else updateRemoteOrderProgress(pendingConfirmation.order.id, { supervisorStatus: pendingConfirmation.action === 'approved' ? 'Disetujui' : 'Ditolak' });
      showToast(`${pendingConfirmation.order.id} berhasil dikonfirmasi.`, 4500);
    } else {
      updateRemoteOrderProgress(pendingConfirmation.orderId, { paymentStatus: 'Sudah Dibayar', fulfillmentStatus: pendingConfirmation.status });
      updateSalesOrderFulfillment(pendingConfirmation.orderId, pendingConfirmation.status);
      showToast(`${pendingConfirmation.orderId} berhasil diperbarui.`, 4500);
    }
    setPendingConfirmation(null);
  };

  return {
    // search
    search, setSearch,
    // toast
    toastMsg,
    // confirmation modal
    pendingConfirmation, setPendingConfirmation, confirmPendingAction,
    // stock modal
    editingStock, setEditingStock,
    showAddStockModal, setShowAddStockModal,
    isImportingStocks,
    // pagination
    stockPage, setStockPage, stockItemsPerPage, setStockItemsPerPage,
    stockTotalPages, safeStockPage, paginatedWarehouseStocks,
    approvalPage, setApprovalPage, approvalItemsPerPage, setApprovalItemsPerPage,
    approvalTotalPages, safeApprovalPage, paginatedApprovals,
    orderPage, setOrderPage, orderItemsPerPage, setOrderItemsPerPage,
    orderTotalPages, safeOrderPage, paginatedSalesOrders,
    // derived data
    userArea,
    scopedWarehouseStocks, scopedApprovals, scopedSalesOrders, scopedRemoteOrders,
    periodSalesList, filteredSales, summary, pendingApprovalsCount,
    // handlers
    handleOpenEditStock,
    handleSaveStock,
    handleAddStock,
    handleExportStocks,
    handleImportStocks,
    handleApprovalAction,
    handleFulfillmentAction,
    handleRemoteApproval,
    handleRemoteFulfillment,
  };
}
