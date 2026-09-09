'use client';

import {
  ShoppingCart, Clock, CheckCircle2, AlertTriangle, Check,
} from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import { SalesOrder } from '@/lib/storage';
import { UserSession } from '@/types/auth';

interface Props {
  allOrders: SalesOrder[];
  paginatedOrders: SalesOrder[];
  user: UserSession | null;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (n: number) => void;
  onApprovalAction: (id: string, action: 'approved' | 'rejected') => void;
  onFulfillmentAction: (orderId: string, status: SalesOrder['fulfillmentStatus']) => void;
}

function FulfillmentActions({
  order,
  onFulfillmentAction,
}: {
  order: SalesOrder;
  onFulfillmentAction: (orderId: string, status: SalesOrder['fulfillmentStatus']) => void;
}) {
  if (order.fulfillmentStatus === 'Menunggu Penanganan Gudang') {
    return (
      <button
        type="button"
        onClick={() => onFulfillmentAction(order.id, 'Sudah Ditangani Gudang')}
        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
      >
        Tandai Ditangani Gudang
      </button>
    );
  }
  if (order.fulfillmentStatus === 'Sudah Ditangani Gudang') {
    return (
      <button
        type="button"
        onClick={() => onFulfillmentAction(order.id, 'Dikirim ke Outlet')}
        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
      >
        Tandai Dikirim
      </button>
    );
  }
  if (order.fulfillmentStatus === 'Dikirim ke Outlet') {
    return (
      <button
        type="button"
        onClick={() => onFulfillmentAction(order.id, 'Selesai')}
        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
      >
        Tandai Selesai
      </button>
    );
  }
  return (
    <span className="text-[11px] text-slate-400 font-medium">Menunggu proses gudang</span>
  );
}

export default function OrdersTab({
  allOrders,
  paginatedOrders,
  user,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onApprovalAction,
  onFulfillmentAction,
}: Props) {
  const totalValue = allOrders.reduce((a, b) => a + b.totalRp, 0);
  const pendingCount = allOrders.filter((o) => o.status === 'Menunggu Persetujuan Supervisor').length;
  const approvedCount = allOrders.filter((o) => o.status === 'Disetujui & Siap Kirim').length;

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Pesanan Masuk Hari Ini</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{allOrders.length} Pesanan</p>
          <p className="text-[11px] text-slate-400 mt-1">Diterbitkan tim salesman di {user?.area}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Nilai Omset PO</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">Rp {totalValue.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-slate-400 mt-1">Akumulasi taking order wilayah</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Perlu Otorisasi Supervisor</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount} PO</p>
          <p className="text-[11px] text-amber-700 mt-1">Menunggu pengesahan rilis gudang</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Telah Disetujui &amp; Siap Kirim</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{approvedCount} PO</p>
          <p className="text-[11px] text-emerald-700 mt-1">Stok terpotong, siap dipacking</p>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              Daftar Transaksi Pesanan Masuk Salesman ({allOrders.length})
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
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Belum ada pesanan yang masuk untuk wilayah {user?.area}.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
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

                      <td className="p-3.5 text-slate-700 font-medium">{order.salesName}</td>

                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">{order.items.length} jenis produk</p>
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
                          {order.status}
                        </span>
                        {order.fulfillmentStatus && (
                          <span className="block text-[10px] text-blue-700 font-semibold mt-1">
                            Gudang: {order.fulfillmentStatus}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onApprovalAction(order.approvalId || order.id, 'rejected')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                            >
                              Tolak
                            </button>
                            <button
                              type="button"
                              onClick={() => onApprovalAction(order.approvalId || order.id, 'approved')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Setujui
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <FulfillmentActions order={order} onFulfillmentAction={onFulfillmentAction} />
                          </div>
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
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={allOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={(n) => { onItemsPerPageChange(n); onPageChange(1); }}
        />
      </div>
    </div>
  );
}
