// Re-export storage primitives and events
export {
  STORAGE_SYNC_EVENT,
  KEYS,
  notifyStorageSync,
  getStoredItem,
  setStoredItem,
  removeStoredItem,
  resetAllDataToDefault,
} from '@/services/storage.service';

// Re-export Inventory types and services
export {
  type CatalogProduct,
  type WarehouseStockItem,
  getStoredCatalogProducts,
  setStoredCatalogProducts,
  getStoredWarehouseProducts,
  setStoredWarehouseProducts,
  getStoredWarehouseStocks,
  setStoredWarehouseStocks,
  deductProductStock,
} from '@/services/inventory.service';

// Re-export Outlet types and services
export {
  type OutletItem,
  type OutletProfile,
  getStoredOutlets,
  setStoredOutlets,
  getStoredOutletProfiles,
  setStoredOutletProfiles,
  getStoredOutletOptions,
} from '@/services/outlet.service';

// Re-export Retur types and services
export {
  type ReturItem,
  getStoredReturHistory,
  setStoredReturHistory,
} from '@/services/retur.service';

// Re-export Order types and services
export {
  type SalesOrderItem,
  type SalesOrder,
  type RemoteOrder,
  getStoredSalesOrders,
  setStoredSalesOrders,
  getStoredRemoteOrders,
  setStoredRemoteOrders,
  createRemoteOrder,
} from '@/services/order.service';

// Re-export Tracking types and services
export {
  type RouteStop,
  type ActivityLogItem,
  type OutletVisitLog,
  getStoredRouteStops,
  setStoredRouteStops,
  getStoredActivityLogs,
  setStoredActivityLogs,
  addActivityLogItem,
  getStoredVisitLogs,
  setStoredVisitLogs,
  logOutletVisit,
  getVisitDateKey,
  normalizeVisitDate,
  getDailyRouteStops,
  getOutletVisitSummary,
} from '@/services/tracking.service';

// Re-export Sales and Sales Reps types and services
export {
  type SalesPerson,
  type SalesData,
  type NewSalesmanPayload,
  getStoredSalesReps,
  setStoredSalesReps,
  getStoredSalesPerformance,
  setStoredSalesPerformance,
  registerSalesman,
} from '@/services/sales.service';

// Re-export Branch types and services
export {
  type BranchData,
  getStoredBranches,
  setStoredBranches,
} from '@/services/consolidator.service';

// Re-export Approval types and services
export {
  type ApprovalItem,
  getStoredApprovals,
  setStoredApprovals,
  registerNewOutlet,
  createReturClaim,
  recordOrderCheckout,
  updateApprovalStatus,
} from '@/services/approval.service';
