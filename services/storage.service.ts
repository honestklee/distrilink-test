export const STORAGE_SYNC_EVENT = 'distrilink_storage_sync';

export const KEYS = {
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
  SALES_PERFORMANCE: 'distrilink_sales_performance',
  VISIT_LOGS: 'distrilink_outlet_visit_logs',
};

// Helper: Broadcast sync event across browser tabs and components
export function notifyStorageSync(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
  }
}

// Helper: Generic read with safety
export function getStoredItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

// Helper: Generic write with safety & reactive notification
export function setStoredItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyStorageSync();
  } catch (err) {
    console.error(`Failed to store item for key: ${key}`, err);
  }
}

// Helper: Remove item
export function removeStoredItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
    notifyStorageSync();
  } catch (err) {
    console.error(`Failed to remove item for key: ${key}`, err);
  }
}

// Master reset all storage to default JSON values
export function resetAllDataToDefault(): void {
  if (typeof window === 'undefined') return;

  Object.values(KEYS).forEach((k) => {
    localStorage.removeItem(k);
  });

  notifyStorageSync();
}
