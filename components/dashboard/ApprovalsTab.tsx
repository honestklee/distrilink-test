'use client';

import { ShieldCheck, Check, X } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import { ApprovalItem } from '@/lib/storage';
import { UserSession } from '@/types/auth';

interface Props {
  allApprovals: ApprovalItem[];
  paginatedApprovals: ApprovalItem[];
  user: UserSession | null;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (n: number) => void;
  onApprovalAction: (id: string, action: 'approved' | 'rejected') => void;
}

const TYPE_STYLES: Record<string, string> = {
  NOO: 'bg-emerald-100 text-emerald-800',
  Order: 'bg-purple-100 text-purple-800',
  Retur: 'bg-amber-100 text-amber-800',
};

const TYPE_LABELS: Record<string, string> = {
  NOO: 'Pendaftaran NOO',
  Order: 'Otorisasi Order SAP',
  Retur: 'Klaim Retur',
};

export default function ApprovalsTab({
  allApprovals,
  paginatedApprovals,
  user,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onApprovalAction,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Panel Pengesahan &amp; Otorisasi Supervisor
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Persetujuan terpusat untuk pendaftaran outlet baru (NOO), diskon pesanan di atas wewenang sales, dan klaim retur barang
          </p>
        </div>

        {/* Approval list */}
        <div className="space-y-3">
          {allApprovals.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">
                Tidak ada tiket pengajuan untuk wilayah {user?.area}
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Saat salesman mengajukan outlet baru (NOO), klaim retur barang rusak, atau order taking order di wilayah{' '}
                {user?.area}, tiket otorisasi akan otomatis masuk ke meja Anda di sini.
              </p>
            </div>
          ) : (
            paginatedApprovals.map((item) => {
              const isPending = item.status === 'pending';
              const isApproved = item.status === 'approved';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-slate-50 border-slate-200'
                      : isApproved
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-blue-600 text-xs">{item.id}</span>
                        <span className="text-slate-300">•</span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                            TYPE_STYLES[item.type] || 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {TYPE_LABELS[item.type] || item.type}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-600">{item.detail}</p>
                      <p className="text-[11px] text-slate-400">
                        Diajukan oleh: <strong>{item.submitter}</strong> • {item.date} • Wilayah:{' '}
                        <strong className="text-indigo-600">{item.area}</strong>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprovalAction(item.id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            Tolak
                          </button>
                          <button
                            type="button"
                            onClick={() => onApprovalAction(item.id, 'approved')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Setujui Otorisasi
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {isApproved ? 'Telah Disetujui' : 'Telah Ditolak'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={allApprovals.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={(n) => { onItemsPerPageChange(n); onPageChange(1); }}
        />
      </div>
    </div>
  );
}
