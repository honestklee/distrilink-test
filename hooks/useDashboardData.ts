'use client';

import { useState, useEffect } from 'react';
import { SalesData } from '@/types/sales';
import {
  ApprovalItem,
  CatalogProduct,
  WarehouseStockItem,
  SalesOrder,
  RemoteOrder,
  OutletVisitLog,
  getStoredApprovals,
  getStoredWarehouseStocks,
  getStoredCatalogProducts,
  getStoredWarehouseProducts,
  getStoredSalesOrders,
  getStoredRemoteOrders,
  getStoredSalesPerformance,
  getStoredVisitLogs,
  STORAGE_SYNC_EVENT,
} from '@/lib/storage';

export interface DashboardData {
  approvals: ApprovalItem[];
  warehouseStocks: WarehouseStockItem[];
  catalogProducts: CatalogProduct[];
  warehouseProducts: CatalogProduct[];
  salesOrders: SalesOrder[];
  remoteOrders: RemoteOrder[];
  salesList: SalesData[];
  visitLogs: OutletVisitLog[];
}

export function useDashboardData(): DashboardData {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStockItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [warehouseProducts, setWarehouseProducts] = useState<CatalogProduct[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [remoteOrders, setRemoteOrders] = useState<RemoteOrder[]>([]);
  const [salesList, setSalesList] = useState<SalesData[]>([]);
  const [visitLogs, setVisitLogs] = useState<OutletVisitLog[]>([]);

  useEffect(() => {
    const sync = () => {
      setApprovals(getStoredApprovals());
      setWarehouseStocks(getStoredWarehouseStocks());
      setCatalogProducts(getStoredCatalogProducts());
      setWarehouseProducts(getStoredWarehouseProducts());
      setSalesOrders(getStoredSalesOrders());
      setRemoteOrders(getStoredRemoteOrders());
      setSalesList(getStoredSalesPerformance());
      setVisitLogs(getStoredVisitLogs());
    };

    sync();
    window.addEventListener(STORAGE_SYNC_EVENT, sync);
    return () => window.removeEventListener(STORAGE_SYNC_EVENT, sync);
  }, []);

  return {
    approvals,
    warehouseStocks,
    catalogProducts,
    warehouseProducts,
    salesOrders,
    remoteOrders,
    salesList,
    visitLogs,
  };
}
