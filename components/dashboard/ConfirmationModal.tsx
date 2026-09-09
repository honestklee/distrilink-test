'use client';

import { ShieldCheck, Check } from 'lucide-react';
import { SupervisorConfirmation } from '@/hooks/useDashboardLogic';

interface Props {
  confirmation: SupervisorConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({ confirmation, onConfirm, onCancel }: Props) {
  const message =
    confirmation.kind === 'approval'
      ? `Konfirmasi ${confirmation.action === 'approved' ? 'persetujuan' : 'penolakan'} tiket ${confirmation.id}?`
      : confirmation.kind === 'remoteApproval'
      ? `Konfirmasi pesanan ${confirmation.order.id} ${confirmation.action === 'approved' ? 'disetujui' : 'ditolak'}?`
      : `Konfirmasi status ${confirmation.status} untuk ${confirmation.orderId}?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Konfirmasi Kedua</h2>
            <p className="text-xs text-slate-500 mt-1">
              Pastikan tindakan supervisor berikut sudah benar sebelum data diperbarui.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm font-bold text-amber-900">
          {message}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
          >
            <Check className="w-4 h-4 inline mr-1" />
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
}
