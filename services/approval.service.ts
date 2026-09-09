import initialApprovalsRaw from '@/data/approvals.json';
import { getStoredItem, setStoredItem, KEYS } from './storage.service';
import { OutletItem, OutletProfile, getStoredOutlets, setStoredOutlets, getStoredOutletProfiles, setStoredOutletProfiles } from './outlet.service';
import { ReturItem, getStoredReturHistory, setStoredReturHistory } from './retur.service';
import { SalesOrder, SalesOrderItem, getStoredSalesOrders, setStoredSalesOrders, getStoredRemoteOrders, updateRemoteOrderProgress } from './order.service';
import { deductProductStock } from './inventory.service';
import { addActivityLogItem } from './tracking.service';
import { DEMO_CURRENT_DATE, DEMO_DEFAULT_AREA, DEMO_SUBMITTER } from '@/data/demo-config';

export interface ApprovalItem {
  id: string;
  type: 'NOO' | 'Discount' | 'Retur' | 'Order';
  title: string;
  submitter: string;
  detail: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  area: string; // Wilayah (Bandung Kota, Bandung Barat, Cimahi, dll)
  outletId?: string;
  returId?: string;
  orderId?: string;
}

export function getStoredApprovals(): ApprovalItem[] {
  return getStoredItem<ApprovalItem[]>(KEYS.APPROVALS, initialApprovalsRaw as ApprovalItem[]);
}

export function setStoredApprovals(approvals: ApprovalItem[]): void {
  setStoredItem(KEYS.APPROVALS, approvals);
}

// Register new NOO outlet and create supervisor approval ticket
export function registerNewOutlet(newOutlet: OutletItem): ApprovalItem {
  const currentOutlets = getStoredOutlets();
  setStoredOutlets([newOutlet, ...currentOutlets]);

  const currentApprovals = getStoredApprovals();
  const newApproval: ApprovalItem = {
    id: `APV-00${currentApprovals.length + 1}`,
    type: 'NOO',
    title: `Pendaftaran Outlet Baru: ${newOutlet.name} (${newOutlet.area})`,
    submitter: DEMO_SUBMITTER,
    detail: `Koordinat GPS (${newOutlet.latitude}, ${newOutlet.longitude}) telah lolos validasi otomatis 14 meter dari fisik toko. Pemilik: ${newOutlet.owner} (${newOutlet.phone}).`,
    date: `${newOutlet.registeredDate} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
    status: 'pending',
    area: newOutlet.area,
    outletId: newOutlet.id,
  };

  setStoredApprovals([newApproval, ...currentApprovals]);
  return newApproval;
}

// Create Retur claim and supervisor approval ticket
export function createReturClaim(newRetur: ReturItem): ApprovalItem {
  const currentReturs = getStoredReturHistory();
  setStoredReturHistory([newRetur, ...currentReturs]);

  const currentOutlets = getStoredOutlets();
  const matchedOutlet = currentOutlets.find(
    (o) => o.name.toLowerCase().includes(newRetur.outlet.toLowerCase()) || o.id === newRetur.outlet
  );
  const outletArea = matchedOutlet?.area || 'Bandung Kota';

  const currentApprovals = getStoredApprovals();
  const newApproval: ApprovalItem = {
    id: `APV-00${currentApprovals.length + 1}`,
    type: 'Retur',
    title: `Klaim Retur Barang: ${newRetur.product} (${newRetur.qty} unit)`,
    submitter: DEMO_SUBMITTER,
    detail: `Outlet ${newRetur.outlet} mengajukan retur produk karena alasan: ${newRetur.reason}. Menunggu verifikasi fisik gudang & otorisasi supervisi.`,
    date: `${newRetur.date} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
    status: 'pending',
    area: outletArea,
    returId: newRetur.id,
  };

  setStoredApprovals([newApproval, ...currentApprovals]);
  return newApproval;
}

// Record order checkout and create supervisor approval ticket
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
  const currentDate = DEMO_CURRENT_DATE;

  const currentOutlets = getStoredOutlets();
  const matchedOutlet = currentOutlets.find(
    (o) => o.name.toLowerCase().includes(cleanName.toLowerCase()) || o.id === cleanName
  );
  const orderArea =
    matchedOutlet?.area ||
    (params.outletName.includes(' - ') ? params.outletName.split(' - ')[1] : DEMO_DEFAULT_AREA);

  const requiresApproval = !params.skipApproval;
  let newApproval: ApprovalItem | undefined;

  if (requiresApproval) {
    const currentApprovals = getStoredApprovals();
    newApproval = {
      id: `APV-00${currentApprovals.length + 1}`,
      type: 'Order',
      title: `Otorisasi Pesanan ${params.orderId}: ${cleanName}`,
      submitter: DEMO_SUBMITTER,
      detail: `Pesanan senilai Rp ${params.grandTotal.toLocaleString('id-ID')} (${params.items.length} item, termin ${params.paymentTerm || 'COD'}). Menunggu otorisasi supervisi sebelum rilis pengiriman gudang.`,
      date: `${currentDate} ${currentTime}`,
      status: 'pending',
      area: orderArea,
      orderId: params.orderId,
    };
    setStoredApprovals([newApproval, ...currentApprovals]);
  } else {
    // If skip approval, deduct stock immediately
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
    area: orderArea,
  };

  const currentOrders = getStoredSalesOrders();
  setStoredSalesOrders([newOrder, ...currentOrders]);

  addActivityLogItem({
    id: `LOG-${Date.now()}`,
    title: `Order Diterbitkan: ${params.orderId}`,
    detail: `${cleanName} • Rp ${params.grandTotal.toLocaleString('id-ID')} (${newOrder.status})`,
    type: 'order',
    time: currentTime,
  });

  return { newOrder, newApproval };
}

// Supervisor updates approval status and triggers cascades
export function updateApprovalStatus(id: string, action: 'approved' | 'rejected'): void {
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

  // 1. NOO approval: update outlet status & create profile if approved
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

  // 2. Retur approval: update retur-history
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

  // 3. Order approval: update sales order status & stock/receivables
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
          fulfillmentStatus:
            action === 'approved' ? ('Menunggu Penanganan Gudang' as const) : o.fulfillmentStatus,
        };
      }
      return o;
    });
    setStoredSalesOrders(updatedOrders);

    if (action === 'approved') {
      const targetOrder = updatedOrders.find(
        (o) =>
          (targetApproval?.orderId && o.id === targetApproval.orderId) ||
          targetApproval?.title.includes(o.id)
      );
      if (targetOrder) {
        if (!targetOrder.notes?.includes('Backorder Menunggu Pasokan')) {
          targetOrder.items.forEach((item) => {
            deductProductStock(item.productId, item.qty, targetOrder.area);
          });
        }

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

    const remoteOrder = getStoredRemoteOrders().find((order) => order.id === targetApproval?.orderId);
    if (remoteOrder) {
      updateRemoteOrderProgress(remoteOrder.id, {
        supervisorStatus: action === 'approved' ? 'Disetujui' : 'Ditolak',
        fulfillmentStatus: action === 'approved' ? 'Menunggu Penanganan Gudang' : undefined,
      });
    }
  }
}
