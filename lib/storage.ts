import initialApprovalsRaw from '@/data/approvals.json';
import branchesRaw from '@/data/branches.json';
import catalogProductsRaw from '@/data/catalog-products.json';
import outletProfilesRaw from '@/data/outlet-profiles.json';
import initialOutletsRaw from '@/data/outlets.json';
import initialRemoteOrdersRaw from '@/data/remote-orders.json';
import initialReturHistoryRaw from '@/data/retur-history.json';
import initialStopsRaw from '@/data/route-stops.json';
import salesRepsRaw from '@/data/sales-reps.json';
import warehouseProductsRaw from '@/data/warehouse-products.json';
import warehouseStocksRaw from '@/data/warehouse-stocks.json';
import initialSalesOrdersRaw from '@/data/sales-orders.json';

export interface OutletItem {
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

export interface OutletProfile {
  id: string;
  name: string;
  owner: string;
  area: string;
  category: string;
  creditLimitRp: number;
  currentReceivableRp: number;
  paymentCompliancePercent: number;
  riskGrade: 'A' | 'B' | 'C';
  avgMonthlyOrderRp: number;
  lastOrderDate: string;
  auditStatus: 'Clean' | 'Perlu Follow-up' | 'Over Limit';
}

export interface WarehouseStockItem {
  sku: string;
  name: string;
  category: string;
  depoStock: number;
  safetyStock: number;
  reorderPoint: number;
  unit: string;
  status: 'Aman' | 'Kritis' | 'Habis';
  daysOfInventory: number;
  fastMovingRank: number;
}

export interface ApprovalItem {
  id: string;
  type: 'NOO' | 'Discount' | 'Retur' | 'Order';
  title: string;
  submitter: string;
  detail: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  outletId?: string;
  returId?: string;
  orderId?: string;
}

export interface SalesOrderItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  subtotal: number;
  unit: string;
}

export interface SalesOrder {
  id: string;
  outletName: string;
  salesName: string;
  date: string;
  time: string;
  paymentTerm: string;
  items: SalesOrderItem[];
  totalRp: number;
  bonusItems: string[];
  status: 'Menunggu Persetujuan Supervisor' | 'Disetujui & Siap Kirim' | 'Ditolak Supervisor';
  approvalId?: string;
  notes?: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  substituteId?: string;
  substituteName?: string;
  promo?: {
    type: 'b5g1' | 'discount';
    label: string;
  };
}

export interface RemoteOrder {
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

export interface ReturItem {
  id: string;
  outlet: string;
  product: string;
  qty: number;
  reason: string;
  date: string;
  status: string;
  approvalId?: string;
}

export interface RouteStop {
  id: string;
  orderIndex: number;
  outletName: string;
  owner: string;
  address: string;
  scheduledTime: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  durationMinutes?: number;
  orderValueRp?: number;
  status: 'completed' | 'in_progress' | 'waiting' | 'skipped';
  coordinates: { lat: number; lng: number };
  notes?: string;
}

export interface SalesPerson {
  id: string;
  name: string;
  area: string;
  vehicle: string;
  plateNumber: string;
  phone: string;
  batteryLevel: number;
  currentLat: number;
  currentLng: number;
  currentStatus: string;
  lastPing: string;
}

export interface BranchData {
  id: string;
  name: string;
  region: string;
  supervisor: string;
  salesTeamCount: number;
  outletsCount: number;
  targetOmsetRp: number;
  realizationOmsetRp: number;
  achievementPercent: number;
  oosRatePercent: number;
  returRatePercent: number;
  syncLatencyMs: number;
  lastSync: string;
  status: 'online' | 'syncing' | 'delayed';
}

export interface ActivityLogItem {
  id: string;
  title: string;
  detail: string;
  type: 'checkin' | 'checkout' | 'order' | 'retur';
  time: string;
}

// STORAGE KEYS
const KEYS = {
  OUTLETS: 'distrilink_outlets',
  OUTLET_PROFILES: 'distrilink_outlet_profiles',
  APPROVALS: 'distrilink_approvals',
  WAREHOUSE_STOCKS: 'distrilink_warehouse_stocks',
  WAREHOUSE_PRODUCTS: 'distrilink_warehouse_products',
  CATALOG_PRODUCTS: 'distrilink_catalog_products',
  REMOTE_ORDERS: 'distrilink_remote_orders',
  RETUR_HISTORY: 'distrilink_retur_history',
  ROUTE_STOPS: 'distrilink_route_stops',
  SALES_REPS: 'distrilink_sales_reps',
  BRANCHES: 'distrilink_branches',
  ACTIVITY_LOGS: 'distrilink_activity_logs',
  SALES_ORDERS: 'distrilink_sales_orders',
};

export const STORAGE_SYNC_EVENT = 'distrilink_storage_sync';

// Initial Activity Logs
const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'LOG-01',
    title: 'Check-in Toko Sumber Berkah',
    detail: '08:32 WIB • Geotag radius 14m (Valid)',
    type: 'checkin',
    time: '08:32 WIB',
  },
  {
    id: 'LOG-02',
    title: 'Taking Order Berhasil Diterbitkan',
    detail: '09:12 WIB • PO-SAP-881290 (Rp 1.850.000)',
    type: 'order',
    time: '09:12 WIB',
  },
  {
    id: 'LOG-03',
    title: 'Check-in Warung Bu Siti',
    detail: '09:50 WIB • Mengajukan klaim retur 2 unit',
    type: 'checkin',
    time: '09:50 WIB',
  },
  {
    id: 'LOG-04',
    title: 'Check-in Minimarket Barokah Mandiri',
    detail: '10:52 WIB • Sedang proses taking order di kasir',
    type: 'checkin',
    time: '10:52 WIB',
  },
];

// Helper: Broadcast sync event
export function notifyStorageSync() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
  }
}

// Helper: Generic read
function getStoredItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

// Helper: Generic write
function setStoredItem<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyStorageSync();
  } catch (err) {
    console.error(`Failed to store item for key: ${key}`, err);
  }
}

// ==========================================
// 1. OUTLETS (NOO)
// ==========================================
export function getStoredOutlets(): OutletItem[] {
  return getStoredItem<OutletItem[]>(KEYS.OUTLETS, initialOutletsRaw as OutletItem[]);
}

export function setStoredOutlets(outlets: OutletItem[]) {
  setStoredItem(KEYS.OUTLETS, outlets);
}

export function registerNewOutlet(newOutlet: OutletItem): ApprovalItem {
  const currentOutlets = getStoredOutlets();
  const updatedOutlets = [newOutlet, ...currentOutlets];
  setStoredOutlets(updatedOutlets);

  // Automatically create a pending approval item for Supervisor
  const currentApprovals = getStoredApprovals();
  const newApproval: ApprovalItem = {
    id: `APV-00${currentApprovals.length + 1}`,
    type: 'NOO',
    title: `Pendaftaran Outlet Baru: ${newOutlet.name} (${newOutlet.area})`,
    submitter: 'Budi Santoso (Sales)',
    detail: `Koordinat GPS (${newOutlet.latitude}, ${newOutlet.longitude}) telah lolos validasi otomatis 14 meter dari fisik toko. Pemilik: ${newOutlet.owner} (${newOutlet.phone}).`,
    date: `${newOutlet.registeredDate} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
    status: 'pending',
    outletId: newOutlet.id,
  };

  const updatedApprovals = [newApproval, ...currentApprovals];
  setStoredApprovals(updatedApprovals);

  return newApproval;
}

// Get dynamic outlet options for form selects (contains default + approved NOO outlets)
export function getStoredOutletOptions(): string[] {
  const outlets = getStoredOutlets();
  // Include verified outlets
  const verifiedList = outlets
    .filter((o) => o.status === 'Verified')
    .map((o) => `${o.name} - ${o.area}`);

  // Base list
  const baseList = [
    'Toko Sumber Berkah - Bandung Kota',
    'Warung Bu Siti - Bandung Barat',
    'Minimarket Barokah Mandiri - Cimahi',
    'Toko Harapan Jaya - Soreang',
    'Kios Rezeki Baru - Bandung Timur',
  ];

  return Array.from(new Set([...baseList, ...verifiedList]));
}

// ==========================================
// 2. SUPERVISOR APPROVALS
// ==========================================
export function getStoredApprovals(): ApprovalItem[] {
  return getStoredItem<ApprovalItem[]>(KEYS.APPROVALS, initialApprovalsRaw as ApprovalItem[]);
}

export function setStoredApprovals(approvals: ApprovalItem[]) {
  setStoredItem(KEYS.APPROVALS, approvals);
}

export function updateApprovalStatus(id: string, action: 'approved' | 'rejected') {
  const approvals = getStoredApprovals();
  let targetApproval: ApprovalItem | undefined;

  const updatedApprovals = approvals.map((item) => {
    if (item.id === id) {
      targetApproval = { ...item, status: action };
      return targetApproval;
    }
    return item;
  });

  setStoredApprovals(updatedApprovals);

  if (!targetApproval) return;

  // Interconnection 1: If NOO approval, update the outlet status!
  if (targetApproval.type === 'NOO') {
    const outlets = getStoredOutlets();
    const updatedOutlets = outlets.map((o) => {
      const matchById =
        (targetApproval?.outletId && o.id === targetApproval.outletId) ||
        (targetApproval?.id === 'APV-001' && (o.id === 'OUT-BDG-003' || o.name.toLowerCase().includes('barokah')));
      const cleanTitle = (targetApproval?.title || '').toLowerCase();
      const cleanName = o.name.toLowerCase();
      const matchByName =
        cleanTitle.includes(cleanName) ||
        (cleanName.includes('barokah') && cleanTitle.includes('barokah'));

      if (matchById || matchByName) {
        return {
          ...o,
          status: action === 'approved' ? ('Verified' as const) : ('Rejected' as const),
        };
      }
      return o;
    });
    setStoredOutlets(updatedOutlets);

    // If approved, also create an OutletProfile in Tab 2!
    if (action === 'approved') {
      const targetOutlet = updatedOutlets.find(
        (o) =>
          (targetApproval?.outletId && o.id === targetApproval.outletId) ||
          (targetApproval?.id === 'APV-001' && (o.id === 'OUT-BDG-003' || o.name.toLowerCase().includes('barokah'))) ||
          targetApproval?.title.toLowerCase().includes(o.name.toLowerCase())
      );
      if (targetOutlet) {
        const profiles = getStoredOutletProfiles();
        const existing = profiles.find((p) => p.name === targetOutlet.name);
        if (!existing) {
          const newProfile: OutletProfile = {
            id: targetOutlet.id,
            name: targetOutlet.name,
            owner: targetOutlet.owner,
            area: targetOutlet.area,
            category: targetOutlet.category,
            creditLimitRp: 15000000,
            currentReceivableRp: 0,
            paymentCompliancePercent: 100,
            riskGrade: 'A',
            avgMonthlyOrderRp: 0,
            lastOrderDate: targetOutlet.registeredDate,
            auditStatus: 'Clean',
          };
          setStoredOutletProfiles([newProfile, ...profiles]);
        }
      }
    }
  }

  // Interconnection 2: If Retur approval, update retur-history!
  if (targetApproval.type === 'Retur') {
    const returs = getStoredReturHistory();
    const updatedReturs = returs.map((r) => {
      const matchById =
        (targetApproval?.returId && r.id === targetApproval.returId) ||
        (targetApproval?.id === 'APV-003' && r.id === 'RET-2026-001');
      const cleanTitle = (targetApproval?.title || '').toLowerCase();
      const matchByContent =
        cleanTitle.includes(r.product.toLowerCase().split(' ')[0]) ||
        (targetApproval?.id === 'APV-003' && r.id === 'RET-2026-001');

      if (matchById || matchByContent) {
        return {
          ...r,
          status: action === 'approved' ? 'Disetujui Supervisor' : 'Ditolak Supervisor',
        };
      }
      return r;
    });
    setStoredReturHistory(updatedReturs);
  }

  // Interconnection 3: If Order approval, update sales order status & stock/receivables!
  if (targetApproval.type === 'Order') {
    const orders = getStoredSalesOrders();
    const updatedOrders = orders.map((o) => {
      const match =
        (targetApproval?.orderId && o.id === targetApproval.orderId) ||
        targetApproval?.title.includes(o.id);
      if (match) {
        return {
          ...o,
          status:
            action === 'approved'
              ? ('Disetujui & Siap Kirim' as const)
              : ('Ditolak Supervisor' as const),
        };
      }
      return o;
    });
    setStoredSalesOrders(updatedOrders);

    // If approved: deduct stock and update receivables
    if (action === 'approved') {
      const targetOrder = updatedOrders.find(
        (o) =>
          (targetApproval?.orderId && o.id === targetApproval.orderId) ||
          targetApproval?.title.includes(o.id)
      );
      if (targetOrder) {
        targetOrder.items.forEach((item) => {
          deductProductStock(item.productId, item.qty);
        });

        // Update outlet receivable
        const profiles = getStoredOutletProfiles();
        const cleanName = targetOrder.outletName.split(' - ')[0];
        const updatedProfiles = profiles.map((p) => {
          if (p.name.toLowerCase().includes(cleanName.toLowerCase())) {
            const nextReceivable = p.currentReceivableRp + targetOrder.totalRp;
            const isOver = nextReceivable > p.creditLimitRp;
            return {
              ...p,
              currentReceivableRp: nextReceivable,
              lastOrderDate: '08 Sep 2026',
              auditStatus: isOver ? ('Over Limit' as const) : p.auditStatus,
            };
          }
          return p;
        });
        setStoredOutletProfiles(updatedProfiles);
      }
    }
  }
}

// ==========================================
// 3. OUTLET PROFILES (FINANCIAL AUDIT)
// ==========================================
export function getStoredOutletProfiles(): OutletProfile[] {
  return getStoredItem<OutletProfile[]>(
    KEYS.OUTLET_PROFILES,
    outletProfilesRaw as OutletProfile[]
  );
}

export function setStoredOutletProfiles(profiles: OutletProfile[]) {
  setStoredItem(KEYS.OUTLET_PROFILES, profiles);
}

// ==========================================
// 4. WAREHOUSE & DEPO STOCKS
// ==========================================
export function getStoredWarehouseStocks(): WarehouseStockItem[] {
  return getStoredItem<WarehouseStockItem[]>(
    KEYS.WAREHOUSE_STOCKS,
    warehouseStocksRaw as WarehouseStockItem[]
  );
}

export function setStoredWarehouseStocks(stocks: WarehouseStockItem[]) {
  setStoredItem(KEYS.WAREHOUSE_STOCKS, stocks);
}

// ==========================================
// 5. CATALOG & WAREHOUSE PRODUCTS
// ==========================================
export function getStoredCatalogProducts(): CatalogProduct[] {
  return getStoredItem<CatalogProduct[]>(
    KEYS.CATALOG_PRODUCTS,
    catalogProductsRaw as CatalogProduct[]
  );
}

export function setStoredCatalogProducts(products: CatalogProduct[]) {
  setStoredItem(KEYS.CATALOG_PRODUCTS, products);
}

export function getStoredWarehouseProducts(): CatalogProduct[] {
  return getStoredItem<CatalogProduct[]>(
    KEYS.WAREHOUSE_PRODUCTS,
    warehouseProductsRaw as CatalogProduct[]
  );
}

export function setStoredWarehouseProducts(products: CatalogProduct[]) {
  setStoredItem(KEYS.WAREHOUSE_PRODUCTS, products);
}

// Decrement product stock when order is placed
export function deductProductStock(productId: string, qty: number) {
  // Update in warehouse stocks (depo stock table)
  const stocks = getStoredWarehouseStocks();
  const updatedStocks = stocks.map((s) => {
    // Match by SKU or partial name
    const isMatch = s.sku === productId || s.name.toLowerCase().includes(productId.toLowerCase());
    if (isMatch) {
      const nextStock = Math.max(0, s.depoStock - qty);
      let status: 'Aman' | 'Kritis' | 'Habis' = 'Aman';
      if (nextStock === 0) status = 'Habis';
      else if (nextStock <= s.reorderPoint) status = 'Kritis';

      return {
        ...s,
        depoStock: nextStock,
        status,
        daysOfInventory: Math.floor(nextStock / 10),
      };
    }
    return s;
  });
  setStoredWarehouseStocks(updatedStocks);

  // Update in catalog products
  const catalog = getStoredCatalogProducts();
  const updatedCatalog = catalog.map((p) => {
    if (p.id === productId || p.name.toLowerCase().includes(productId.toLowerCase())) {
      return {
        ...p,
        stock: Math.max(0, p.stock - qty),
      };
    }
    return p;
  });
  setStoredCatalogProducts(updatedCatalog);

  // Update in warehouse products (OOS page)
  const warehouseProds = getStoredWarehouseProducts();
  const updatedWhProds = warehouseProds.map((p) => {
    if (p.id === productId || p.name.toLowerCase().includes(productId.toLowerCase())) {
      return {
        ...p,
        stock: Math.max(0, p.stock - qty),
      };
    }
    return p;
  });
  setStoredWarehouseProducts(updatedWhProds);
}

// ==========================================
// 6. TAKING ORDER & RETUR
// ==========================================
export function getStoredReturHistory(): ReturItem[] {
  return getStoredItem<ReturItem[]>(KEYS.RETUR_HISTORY, initialReturHistoryRaw as ReturItem[]);
}

export function setStoredReturHistory(returs: ReturItem[]) {
  setStoredItem(KEYS.RETUR_HISTORY, returs);
}

export function createReturClaim(newRetur: ReturItem): ApprovalItem {
  const currentReturs = getStoredReturHistory();
  const updatedReturs = [newRetur, ...currentReturs];
  setStoredReturHistory(updatedReturs);

  // Automatically create approval item in Supervisor approvals!
  const currentApprovals = getStoredApprovals();
  const newApproval: ApprovalItem = {
    id: `APV-00${currentApprovals.length + 1}`,
    type: 'Retur',
    title: `Klaim Retur Barang: ${newRetur.product} (${newRetur.qty} unit)`,
    submitter: 'Budi Santoso (Sales)',
    detail: `Outlet ${newRetur.outlet} mengajukan retur produk karena alasan: ${newRetur.reason}. Menunggu verifikasi fisik gudang & otorisasi supervisi.`,
    date: `${newRetur.date} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
    status: 'pending',
    returId: newRetur.id,
  };

  setStoredApprovals([newApproval, ...currentApprovals]);
  return newApproval;
}

export function getStoredSalesOrders(): SalesOrder[] {
  return getStoredItem<SalesOrder[]>(
    KEYS.SALES_ORDERS,
    initialSalesOrdersRaw as SalesOrder[]
  );
}

export function setStoredSalesOrders(orders: SalesOrder[]) {
  setStoredItem(KEYS.SALES_ORDERS, orders);
}

// Record order and route through Sales Orders & Supervisor Approval
export function recordOrderCheckout(params: {
  orderId: string;
  outletName: string;
  paymentTerm?: string;
  grandTotal: number;
  items: SalesOrderItem[];
  bonusItems?: string[];
  notes?: string;
  skipApproval?: boolean;
}): { newOrder: SalesOrder; newApproval?: ApprovalItem } {
  const cleanName = params.outletName.split(' - ')[0];
  const currentTime =
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const currentDate = '08 Sep 2026';

  const requiresApproval = !params.skipApproval;
  let newApproval: ApprovalItem | undefined;

  if (requiresApproval) {
    const currentApprovals = getStoredApprovals();
    newApproval = {
      id: `APV-00${currentApprovals.length + 1}`,
      type: 'Order',
      title: `Otorisasi Pesanan ${params.orderId}: ${cleanName}`,
      submitter: 'Budi Santoso (Sales)',
      detail: `Pesanan senilai Rp ${params.grandTotal.toLocaleString('id-ID')} (${params.items.length} item, termin ${params.paymentTerm || 'COD'}). Menunggu otorisasi supervisi sebelum rilis pengiriman gudang.`,
      date: `${currentDate} ${currentTime}`,
      status: 'pending',
      orderId: params.orderId,
    };
    setStoredApprovals([newApproval, ...currentApprovals]);
  } else {
    // If not requiring approval, deduct stock immediately
    params.items.forEach((item) => {
      deductProductStock(item.productId, item.qty);
    });

    const profiles = getStoredOutletProfiles();
    const updatedProfiles = profiles.map((p) => {
      if (p.name.toLowerCase().includes(cleanName.toLowerCase())) {
        const nextReceivable = p.currentReceivableRp + params.grandTotal;
        const isOver = nextReceivable > p.creditLimitRp;
        return {
          ...p,
          currentReceivableRp: nextReceivable,
          lastOrderDate: currentDate,
          auditStatus: isOver ? ('Over Limit' as const) : p.auditStatus,
        };
      }
      return p;
    });
    setStoredOutletProfiles(updatedProfiles);
  }

  const newOrder: SalesOrder = {
    id: params.orderId,
    outletName: cleanName,
    salesName: 'Budi Santoso (Sales)',
    date: currentDate,
    time: currentTime,
    paymentTerm: params.paymentTerm || 'COD',
    items: params.items,
    totalRp: params.grandTotal,
    bonusItems: params.bonusItems || [],
    status: requiresApproval
      ? 'Menunggu Persetujuan Supervisor'
      : 'Disetujui & Siap Kirim',
    approvalId: newApproval?.id,
    notes: params.notes || 'Pesanan diterbitkan via SFA Taking Order',
  };

  const currentOrders = getStoredSalesOrders();
  setStoredSalesOrders([newOrder, ...currentOrders]);

  // Add activity log
  addActivityLogItem({
    id: `LOG-${Date.now()}`,
    title: `Order Diterbitkan: ${params.orderId}`,
    detail: `${cleanName} • Rp ${params.grandTotal.toLocaleString('id-ID')} (${newOrder.status})`,
    type: 'order',
    time: currentTime,
  });

  return { newOrder, newApproval };
}

// ==========================================
// 7. REMOTE ORDERS (OOS ORDERS)
// ==========================================
export function getStoredRemoteOrders(): RemoteOrder[] {
  return getStoredItem<RemoteOrder[]>(
    KEYS.REMOTE_ORDERS,
    initialRemoteOrdersRaw as RemoteOrder[]
  );
}

export function setStoredRemoteOrders(orders: RemoteOrder[]) {
  setStoredItem(KEYS.REMOTE_ORDERS, orders);
}

export function createRemoteOrder(newOrder: RemoteOrder) {
  const currentOrders = getStoredRemoteOrders();
  setStoredRemoteOrders([newOrder, ...currentOrders]);

  // Deduct stock if not backorder
  if (newOrder.status !== 'Backorder Menunggu Pasokan') {
    newOrder.items.forEach((item) => {
      deductProductStock(item.productId, item.qty);
    });
  }

  // Update outlet receivable
  const profiles = getStoredOutletProfiles();
  const updatedProfiles = profiles.map((p) => {
    if (p.name.toLowerCase().includes(newOrder.outletName.toLowerCase())) {
      return {
        ...p,
        currentReceivableRp: p.currentReceivableRp + newOrder.totalRp,
        lastOrderDate: '08 Sep 2026',
      };
    }
    return p;
  });
  setStoredOutletProfiles(updatedProfiles);
}

// ==========================================
// 8. ROUTE TRACKING & STOPS
// ==========================================
export function getStoredRouteStops(): RouteStop[] {
  return getStoredItem<RouteStop[]>(KEYS.ROUTE_STOPS, initialStopsRaw as RouteStop[]);
}

export function setStoredRouteStops(stops: RouteStop[]) {
  setStoredItem(KEYS.ROUTE_STOPS, stops);
}

export function getStoredActivityLogs(): ActivityLogItem[] {
  return getStoredItem<ActivityLogItem[]>(KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
}

export function setStoredActivityLogs(logs: ActivityLogItem[]) {
  setStoredItem(KEYS.ACTIVITY_LOGS, logs);
}

export function addActivityLogItem(item: ActivityLogItem) {
  const logs = getStoredActivityLogs();
  setStoredActivityLogs([item, ...logs]);
}

export function getStoredSalesReps(): SalesPerson[] {
  return getStoredItem<SalesPerson[]>(KEYS.SALES_REPS, salesRepsRaw as SalesPerson[]);
}

export function setStoredSalesReps(reps: SalesPerson[]) {
  setStoredItem(KEYS.SALES_REPS, reps);
}

// ==========================================
// 9. BRANCHES CONSOLIDATOR
// ==========================================
export function getStoredBranches(): BranchData[] {
  return getStoredItem<BranchData[]>(KEYS.BRANCHES, branchesRaw as BranchData[]);
}

export function setStoredBranches(branches: BranchData[]) {
  setStoredItem(KEYS.BRANCHES, branches);
}

// ==========================================
// 10. MASTER RESET ALL TO DEFAULT
// ==========================================
export function resetAllDataToDefault() {
  if (typeof window === 'undefined') return;

  Object.values(KEYS).forEach((k) => {
    localStorage.removeItem(k);
  });

  notifyStorageSync();
}
