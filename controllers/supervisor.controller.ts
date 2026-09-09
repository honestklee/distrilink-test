import {
  ApprovalItem,
  getStoredApprovals,
  getStoredOutletProfiles,
  getStoredWarehouseStocks,
  getStoredSalesOrders,
  updateApprovalStatus,
} from '@/lib/storage';

export class SupervisorController {
  /**
   * Process approval decision (approve or reject)
   */
  static processApproval(
    id: string,
    action: 'approved' | 'rejected'
  ): { success: boolean; message: string } {
    try {
      updateApprovalStatus(id, action);
      const actionText = action === 'approved' ? 'disetujui' : 'ditolak';
      return {
        success: true,
        message: `Tiket persetujuan ${id} berhasil ${actionText} dan status data telah diperbarui secara otomatis.`,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Gagal memperbarui status persetujuan.',
      };
    }
  }

  /**
   * Get filtered approval items
   */
  static getFilteredApprovals(
    approvals: ApprovalItem[],
    filterType: string = 'all'
  ): ApprovalItem[] {
    if (filterType === 'all') return approvals;
    return approvals.filter((a) => a.type.toLowerCase() === filterType.toLowerCase());
  }

  /**
   * Aggregate high-level supervisor metrics
   */
  static getDashboardSummary() {
    const approvals = getStoredApprovals();
    const outletProfiles = getStoredOutletProfiles();
    const warehouseStocks = getStoredWarehouseStocks();
    const salesOrders = getStoredSalesOrders();

    const pendingApprovals = approvals.filter((a) => a.status === 'pending');
    const overLimitOutlets = outletProfiles.filter((p) => p.auditStatus === 'Over Limit');
    const criticalStocks = warehouseStocks.filter((s) => s.status !== 'Aman');

    return {
      pendingApprovalsCount: pendingApprovals.length,
      overLimitOutletsCount: overLimitOutlets.length,
      criticalStocksCount: criticalStocks.length,
      totalOrdersCount: salesOrders.length,
      totalOrdersValue: salesOrders.reduce((acc, o) => acc + o.totalRp, 0),
    };
  }
}
