'use client';

import { Building2 } from 'lucide-react';
import { OutletProfile } from '@/lib/storage';

interface OutletProfilesAuditProps {
  profiles: OutletProfile[];
  area: string;
}

export default function OutletProfilesAudit({ profiles, area }: OutletProfilesAuditProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Limit Kredit Diberikan</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            Rp {profiles.reduce((total, profile) => total + profile.creditLimitRp, 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1">{profiles.length} outlet di {area}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Piutang Berjalan</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
            Rp {profiles.reduce((total, profile) => total + profile.currentReceivableRp, 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Outstanding outlet wilayah aktif</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Kepatuhan Pembayaran Rata-rata</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {profiles.length
              ? (profiles.reduce((total, profile) => total + profile.paymentCompliancePercent, 0) / profiles.length).toFixed(1)
              : 0}%
          </p>
          <p className="text-[11px] text-amber-600 mt-1">
            {profiles.filter((profile) => profile.auditStatus === 'Over Limit').length} outlet melebihi plafon
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" /> Profil Finansial & Audit Outlet
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Profil kredit, piutang, kepatuhan pembayaran, dan risiko outlet.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">Wilayah: {area}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Nama Toko / Outlet</th>
                <th className="p-3.5">Wilayah & Kategori</th>
                <th className="p-3.5 text-right">Plafon Kredit</th>
                <th className="p-3.5 text-right">Piutang Aktif</th>
                <th className="p-3.5 text-center">Kepatuhan TOP</th>
                <th className="p-3.5 text-center">Skor Risiko</th>
                <th className="p-3.5 text-center">Status Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Belum ada profil outlet di wilayah {area}.</td></tr>
              ) : profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5"><p className="font-bold text-slate-900">{profile.name}</p><p className="text-[10px] text-slate-400">{profile.id} • Pemilik: {profile.owner}</p></td>
                  <td className="p-3.5"><span className="font-medium text-slate-800">{profile.category}</span><span className="block text-[10px] text-slate-400">{profile.area}</span></td>
                  <td className="p-3.5 text-right font-medium">Rp {profile.creditLimitRp.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 text-right font-bold">Rp {profile.currentReceivableRp.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 text-center font-bold">{profile.paymentCompliancePercent}%</td>
                  <td className="p-3.5 text-center"><span className={`inline-block w-6 h-6 rounded-full text-[11px] font-extrabold leading-6 ${profile.riskGrade === 'A' ? 'bg-emerald-100 text-emerald-800' : profile.riskGrade === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{profile.riskGrade}</span></td>
                  <td className="p-3.5 text-center"><span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${profile.auditStatus === 'Over Limit' ? 'bg-rose-50 text-rose-700 border-rose-200' : profile.auditStatus === 'Perlu Follow-up' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{profile.auditStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
