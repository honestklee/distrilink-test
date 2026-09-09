'use client';

import { Check, CheckCircle2, Clock, Package, Truck, X } from 'lucide-react';
import { RemoteOrder } from '@/lib/storage';

interface RemoteOrdersMonitorProps {
  orders: RemoteOrder[];
  area: string;
  onApproval: (order: RemoteOrder, action: 'approved' | 'rejected') => void;
  onFulfillment: (order: RemoteOrder, status: RemoteOrder['fulfillmentStatus']) => void;
}

export default function RemoteOrdersMonitor({ orders, area, onApproval, onFulfillment }: RemoteOrdersMonitorProps) {
  const pending = orders.filter((order) => order.supervisorStatus === 'Menunggu Persetujuan').length;
  const paid = orders.filter((order) => order.paymentStatus === 'Sudah Dibayar').length;
  const shipped = orders.filter((order) => order.fulfillmentStatus === 'Dikirim ke Outlet').length;
  const backorders = orders.filter((order) => order.status === 'Backorder Menunggu Pasokan').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs"><span className="text-xs text-slate-500">Pesanan Non-Visit Menunggu Konfirmasi</span><p className="text-2xl font-extrabold text-amber-600 mt-1">{pending}</p><p className="text-[11px] text-slate-400 mt-1">Wilayah {area}</p></div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs"><span className="text-xs text-slate-500">Pembayaran Terkonfirmasi</span><p className="text-2xl font-extrabold text-emerald-600 mt-1">{paid}</p><p className="text-[11px] text-slate-400 mt-1">Siap diproses gudang</p></div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs"><span className="text-xs text-slate-500">Sudah Dikirim ke Outlet</span><p className="text-2xl font-extrabold text-blue-600 mt-1">{shipped}</p><p className="text-[11px] text-slate-400 mt-1">Konfirmasi pengiriman</p></div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs"><span className="text-xs text-slate-500">Back Order Priority</span><p className="text-2xl font-extrabold text-rose-600 mt-1">{backorders}</p><p className="text-[11px] text-rose-600 mt-1">Menunggu pasokan gudang</p></div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div><h2 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Package className="w-4 h-4 text-blue-600" /> Monitoring Pesanan Tanpa Kunjungan ({orders.length})</h2><p className="text-xs text-slate-500 mt-0.5">Supervisor mengonfirmasi pembayaran, penanganan gudang, dan pengiriman ke outlet.</p></div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">Wilayah: {area}</span>
        </div>
        <div className="divide-y divide-slate-100">
          {orders.length === 0 ? <div className="p-10 text-center text-xs text-slate-400">Belum ada pesanan tanpa kunjungan di wilayah {area}.</div> : orders.map((order) => {
            const waiting = order.supervisorStatus === 'Menunggu Persetujuan';
            return <div key={order.id} className="p-4 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2"><div><span className="font-bold text-blue-600 text-xs">{order.id}</span><span className="text-slate-300 mx-2">•</span><span className="font-bold text-slate-900 text-xs">{order.outletName}</span><p className="text-[11px] text-slate-500 mt-1">{order.items.map((item) => `${item.productName} (${item.qty} ${item.unit})`).join(', ')}</p></div><div className="flex flex-wrap items-center gap-2"><span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{order.supervisorStatus || 'Menunggu Persetujuan'}</span><span className="font-bold text-slate-900 text-xs">Rp {order.totalRp.toLocaleString('id-ID')}</span></div></div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]"><div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-1 text-slate-600"><Clock className="w-3 h-3" /> Pembayaran: {order.paymentStatus || 'Menunggu Konfirmasi'}</span><span className="inline-flex items-center gap-1 text-slate-600"><Truck className="w-3 h-3" /> Pengiriman: {order.fulfillmentStatus || 'Belum Diproses'}</span></div><div className="flex gap-2">{waiting ? <><button type="button" onClick={() => onApproval(order, 'rejected')} className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-semibold cursor-pointer"><X className="w-3 h-3 inline mr-1" />Tolak</button><button type="button" onClick={() => onApproval(order, 'approved')} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold cursor-pointer"><Check className="w-3 h-3 inline mr-1" />Konfirmasi</button></> : order.paymentStatus !== 'Sudah Dibayar' ? <button type="button" onClick={() => onFulfillment(order, 'Menunggu Penanganan Gudang')} className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-semibold cursor-pointer">Konfirmasi Pembayaran</button> : order.fulfillmentStatus === 'Menunggu Penanganan Gudang' ? <button type="button" onClick={() => onFulfillment(order, 'Sudah Ditangani Gudang')} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold cursor-pointer">Tandai Ditangani Gudang</button> : order.fulfillmentStatus === 'Sudah Ditangani Gudang' ? <button type="button" onClick={() => onFulfillment(order, 'Dikirim ke Outlet')} className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold cursor-pointer">Konfirmasi Dikirim</button> : order.fulfillmentStatus === 'Dikirim ke Outlet' ? <button type="button" onClick={() => onFulfillment(order, 'Selesai')} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold cursor-pointer"><CheckCircle2 className="w-3 h-3 inline mr-1" />Selesai</button> : null}</div></div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}
