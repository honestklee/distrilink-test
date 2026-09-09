import initialSalesOrdersRaw from '@/data/sales-orders.json';
import initialRemoteOrdersRaw from '@/data/remote-orders.json';
import { getStoredItem, setStoredItem, KEYS } from './storage.service';
import { deductProductStock } from './inventory.service';
import { getStoredOutletProfiles, setStoredOutletProfiles } from './outlet.service';
import { DEMO_CURRENT_DATE } from '@/data/demo-config';

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
  fulfillmentStatus?: 'Menunggu Penanganan Gudang' | 'Sudah Ditangani Gudang' | 'Dikirim ke Outlet' | 'Selesai';
  approvalId?: string;
  notes?: string;
  area?: string;
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
  area?: string;
  date: string;
  status: 'Siap Kirim' | 'Substitusi Diterapkan' | 'Backorder Menunggu Pasokan';
  restockEta?: string;
  awaitingSupervisorApproval?: boolean;
  supervisorStatus?: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  paymentStatus?: 'Menunggu Konfirmasi' | 'Sudah Dibayar';
  fulfillmentStatus?: 'Menunggu Penanganan Gudang' | 'Sudah Ditangani Gudang' | 'Dikirim ke Outlet' | 'Selesai';
}

export function getStoredSalesOrders(): SalesOrder[] {
  return getStoredItem<SalesOrder[]>(KEYS.SALES_ORDERS, initialSalesOrdersRaw as SalesOrder[]);
}

export function setStoredSalesOrders(orders: SalesOrder[]): void {
  setStoredItem(KEYS.SALES_ORDERS, orders);
}

export function getStoredRemoteOrders(): RemoteOrder[] {
  return getStoredItem<RemoteOrder[]>(KEYS.REMOTE_ORDERS, initialRemoteOrdersRaw as RemoteOrder[]);
}

export function setStoredRemoteOrders(orders: RemoteOrder[]): void {
  setStoredItem(KEYS.REMOTE_ORDERS, orders);
}

export function createRemoteOrder(newOrder: RemoteOrder): void {
  const currentOrders = getStoredRemoteOrders();
  setStoredRemoteOrders([newOrder, ...currentOrders]);

  // Deduct stock if not backorder
  if (!newOrder.awaitingSupervisorApproval && newOrder.status !== 'Backorder Menunggu Pasokan') {
    newOrder.items.forEach((item) => {
      deductProductStock(item.productId, item.qty, newOrder.area);
    });
  }

  // Update outlet receivable
  if (!newOrder.awaitingSupervisorApproval) {
    const profiles = getStoredOutletProfiles();
    const updatedProfiles = profiles.map((p) => {
      if (p.name.toLowerCase().includes(newOrder.outletName.toLowerCase())) {
        return {
          ...p,
          currentReceivableRp: p.currentReceivableRp + newOrder.totalRp,
          lastOrderDate: DEMO_CURRENT_DATE,
        };
      }
      return p;
    });
    setStoredOutletProfiles(updatedProfiles);
  }
}

export function updateSalesOrderFulfillment(
  orderId: string,
  fulfillmentStatus: SalesOrder['fulfillmentStatus']
): void {
  if (!fulfillmentStatus) return;
  setStoredSalesOrders(
    getStoredSalesOrders().map((order) =>
      order.id === orderId ? { ...order, fulfillmentStatus } : order
    )
  );
}

export function updateRemoteOrderProgress(
  orderId: string,
  updates: Pick<RemoteOrder, 'supervisorStatus' | 'paymentStatus' | 'fulfillmentStatus'>
): void {
  setStoredRemoteOrders(
    getStoredRemoteOrders().map((order) =>
      order.id === orderId ? { ...order, ...updates } : order
    )
  );
}
