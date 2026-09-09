'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { CheckCircle2 } from 'lucide-react';
import { UserSession } from '@/types/auth';

// Hooks
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardLogic } from '@/hooks/useDashboardLogic';

// Layout & navigation
import PageShell from '@/components/dashboard/PageShell';
import SupervisorNavigation, { SupervisorTab } from '@/components/dashboard/SupervisorNavigation';

// Shared components
import DashboardBanner from '@/components/dashboard/DashboardBanner';
import ConfirmationModal from '@/components/dashboard/ConfirmationModal';

// Tab panels
import PerformanceTab from '@/components/dashboard/PerformanceTab';
import RemoteOrdersMonitor from '@/components/dashboard/RemoteOrdersMonitor';
import StockTab from '@/components/dashboard/StockTab';
import ApprovalsTab from '@/components/dashboard/ApprovalsTab';
import OrdersTab from '@/components/dashboard/OrdersTab';

const SESSION_KEY = 'user_session';
const emptySubscribe = () => () => {};

export default function DashboardPage() {
  const router = useRouter();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [activeTab, setActiveTab] = useState<SupervisorTab>('performance');
  const [periodMonth, setPeriodMonth] = useState('09');
  const [periodYear, setPeriodYear] = useState('2026');

  // ── Session ──────────────────────────────────────────────────────────────────
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

  // Auth guard
  useMemo(() => {
    if (isClient && !Cookies.get(SESSION_KEY)) router.push('/login');
  }, [isClient, router]);

  // ── Data & logic ─────────────────────────────────────────────────────────────
  const data = useDashboardData();
  const logic = useDashboardLogic({ user, ...data, periodMonth, periodYear });

  // ── Loading state ─────────────────────────────────────────────────────────────
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
    <PageShell>
      {/* Toast */}
      {logic.toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{logic.toastMsg}</p>
        </div>
      )}

      {/* Confirmation modal */}
      {logic.pendingConfirmation && (
        <ConfirmationModal
          confirmation={logic.pendingConfirmation}
          onConfirm={logic.confirmPendingAction}
          onCancel={() => logic.setPendingConfirmation(null)}
        />
      )}

      {/* Top banner + period picker + RBAC notice */}
      <DashboardBanner
        user={user}
        periodMonth={periodMonth}
        periodYear={periodYear}
        pendingCount={logic.pendingApprovalsCount}
        onMonthChange={setPeriodMonth}
        onYearChange={setPeriodYear}
      />

      {/* Tab navigation */}
      <SupervisorNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        outletCount={logic.scopedRemoteOrders.length}
        pendingApprovalCount={logic.pendingApprovalsCount}
        orderCount={logic.scopedSalesOrders.length}
      />

      {/* ── Tab 1: Analisa Performa Salesman ─────────────────────────────────── */}
      {activeTab === 'performance' && (
        <PerformanceTab
          summary={logic.summary}
          filteredSales={logic.filteredSales}
          periodSalesList={logic.periodSalesList}
          userArea={logic.userArea}
          search={logic.search}
          onSearchChange={logic.setSearch}
          onResetFilters={() => logic.setSearch('')}
        />
      )}

      {/* ── Tab 2: Profil & Audit Outlet 360° ────────────────────────────────── */}
      {activeTab === 'outlets' && (
        <RemoteOrdersMonitor
          orders={logic.scopedRemoteOrders}
          area={logic.userArea || 'Semua Wilayah'}
          onApproval={logic.handleRemoteApproval}
          onFulfillment={logic.handleRemoteFulfillment}
        />
      )}

      {/* ── Tab 3: Monitoring Stok Gudang ────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <StockTab
          scopedStocks={logic.scopedWarehouseStocks}
          paginatedStocks={logic.paginatedWarehouseStocks}
          catalogProducts={data.catalogProducts}
          userArea={logic.userArea}
          isImporting={logic.isImportingStocks}
          currentPage={logic.safeStockPage}
          totalPages={logic.stockTotalPages}
          itemsPerPage={logic.stockItemsPerPage}
          onPageChange={logic.setStockPage}
          onItemsPerPageChange={logic.setStockItemsPerPage}
          editingStock={logic.editingStock}
          showAddModal={logic.showAddStockModal}
          onOpenEdit={(item) => {
            logic.handleOpenEditStock(item);
          }}
          onCloseEdit={() => logic.setEditingStock(null)}
          onSaveEdit={logic.handleSaveStock}
          onOpenAdd={() => logic.setShowAddStockModal(true)}
          onCloseAdd={() => logic.setShowAddStockModal(false)}
          onAdd={logic.handleAddStock}
          onExport={logic.handleExportStocks}
          onImport={logic.handleImportStocks}
        />
      )}

      {/* ── Tab 4: Meja Persetujuan Supervisor ───────────────────────────────── */}
      {activeTab === 'approvals' && (
        <ApprovalsTab
          allApprovals={logic.scopedApprovals}
          paginatedApprovals={logic.paginatedApprovals}
          user={user}
          currentPage={logic.safeApprovalPage}
          totalPages={logic.approvalTotalPages}
          itemsPerPage={logic.approvalItemsPerPage}
          onPageChange={logic.setApprovalPage}
          onItemsPerPageChange={logic.setApprovalItemsPerPage}
          onApprovalAction={logic.handleApprovalAction}
        />
      )}

      {/* ── Tab 5: Monitoring Pesanan Masuk (Live PO SAP) ────────────────────── */}
      {activeTab === 'orders' && (
        <OrdersTab
          allOrders={logic.scopedSalesOrders}
          paginatedOrders={logic.paginatedSalesOrders}
          user={user}
          currentPage={logic.safeOrderPage}
          totalPages={logic.orderTotalPages}
          itemsPerPage={logic.orderItemsPerPage}
          onPageChange={logic.setOrderPage}
          onItemsPerPageChange={logic.setOrderItemsPerPage}
          onApprovalAction={logic.handleApprovalAction}
          onFulfillmentAction={logic.handleFulfillmentAction}
        />
      )}
    </PageShell>
  );
}