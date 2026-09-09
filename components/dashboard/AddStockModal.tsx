'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { NewStockFormState, PromoType } from '@/hooks/useDashboardLogic';

const DEFAULT_FORM: NewStockFormState = {
  area: '',
  name: '',
  category: 'Sembako',
  price: '',
  depoStock: '100',
  safetyStock: '20',
  reorderPoint: '30',
  unit: 'pcs',
  promoType: 'none',
  promoValue: '10',
  promoFreeQuantity: '1',
};

const CATEGORIES = ['Sembako', 'Minuman', 'Makanan Ringan', 'Personal Care', 'Kebersihan'];
const STOCK_FIELDS: [keyof NewStockFormState, string][] = [
  ['depoStock', 'Stok Fisik Depo'],
  ['safetyStock', 'Safety Stock'],
  ['reorderPoint', 'Reorder Point (ROP)'],
];

interface Props {
  userArea: string | undefined;
  onAdd: (form: NewStockFormState) => void;
  onClose: () => void;
}

export default function AddStockModal({ userArea, onAdd, onClose }: Props) {
  const [form, setForm] = useState<NewStockFormState>(DEFAULT_FORM);

  const set = (field: keyof NewStockFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Tambah Produk Gudang &amp; Taking Order</h3>
            <p className="text-xs text-slate-500 mt-1">
              Produk baru otomatis tersedia di katalog Taking Order.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Tutup form tambah produk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Area (read-only) */}
          <label className="block font-semibold text-slate-700">
            Wilayah Stok
            <input
              type="text"
              value={userArea || 'Semua Wilayah'}
              readOnly
              className="mt-1 w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none"
            />
          </label>

          {/* Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="font-semibold text-slate-700">
              Nama Produk
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Contoh: Biskuit Roma 300g"
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
              />
            </label>
            <label className="font-semibold text-slate-700">
              Kategori
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          {/* Price + Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="font-semibold text-slate-700">
              Harga Satuan (Rp)
              <input
                type="number"
                required
                min="1"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
              />
            </label>
            <label className="font-semibold text-slate-700">
              Satuan
              <input
                type="text"
                required
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                placeholder="pcs / karton / sak"
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
              />
            </label>
          </div>

          {/* Stock fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STOCK_FIELDS.map(([field, label]) => (
              <label key={field} className="font-semibold text-slate-700">
                {label}
                <input
                  type="number"
                  required
                  min="0"
                  value={form[field] as string}
                  onChange={(e) => set(field, e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                />
              </label>
            ))}
          </div>

          {/* Promo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="font-semibold text-slate-700">
              Jenis Promo
              <select
                value={form.promoType}
                onChange={(e) => set('promoType', e.target.value as PromoType)}
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="none">Tanpa Promo</option>
                <option value="discount">Diskon Harga (%)</option>
                <option value="quantity">Diskon Kuantitas</option>
              </select>
            </label>
            <label className="font-semibold text-slate-700">
              {form.promoType === 'quantity' ? 'Minimal Beli' : 'Diskon (%)'}
              <input
                type="number"
                min="1"
                value={form.promoValue}
                onChange={(e) => set('promoValue', e.target.value)}
                disabled={form.promoType === 'none'}
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50"
              />
            </label>
            <label className="font-semibold text-slate-700">
              Bonus Gratis
              <input
                type="number"
                min="1"
                value={form.promoFreeQuantity}
                onChange={(e) => set('promoFreeQuantity', e.target.value)}
                disabled={form.promoType !== 'quantity'}
                className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Simpan Produk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
