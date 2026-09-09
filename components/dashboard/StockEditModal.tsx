'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { WarehouseStockItem, CatalogProduct } from '@/lib/storage';
import { StockFormState, PromoType } from '@/hooks/useDashboardLogic';

interface Props {
  stock: WarehouseStockItem;
  catalogProducts: CatalogProduct[];
  onSave: (stock: WarehouseStockItem, form: StockFormState) => void;
  onClose: () => void;
}

const TEXT_FIELDS: [keyof StockFormState, string][] = [
  ['sku', 'SKU'],
  ['name', 'Nama Produk'],
  ['category', 'Kategori'],
  ['unit', 'Satuan'],
];

const NUMBER_FIELDS: [keyof StockFormState, string][] = [
  ['depoStock', 'Stok Fisik Depo'],
  ['safetyStock', 'Safety Stock'],
  ['reorderPoint', 'Reorder Point (ROP)'],
  ['daysOfInventory', 'Ketahanan Stok (Hari)'],
];

function buildInitialForm(stock: WarehouseStockItem, catalogProducts: CatalogProduct[]): StockFormState {
  const product = catalogProducts.find((p) => p.id === stock.sku || p.name === stock.name);
  return {
    sku: stock.sku,
    name: stock.name,
    category: stock.category,
    price: String(product?.price || 0),
    depoStock: String(stock.depoStock),
    safetyStock: String(stock.safetyStock),
    reorderPoint: String(stock.reorderPoint),
    unit: stock.unit,
    daysOfInventory: String(stock.daysOfInventory),
    status: stock.status,
    promoType: (product?.promo?.type === 'discount'
      ? 'discount'
      : product?.promo?.type === 'b5g1'
      ? 'quantity'
      : 'none') as PromoType,
    promoValue:
      product?.promo?.type === 'discount'
        ? String(product.promo.discountPercent || 10)
        : String(product?.promo?.quantityThreshold || 5),
    promoFreeQuantity: String(product?.promo?.freeQuantity || 1),
  };
}

export default function StockEditModal({ stock, catalogProducts, onSave, onClose }: Props) {
  const [form, setForm] = useState<StockFormState>(() => buildInitialForm(stock, catalogProducts));

  const set = (field: keyof StockFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(stock, form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Edit Data Stok Gudang &amp; Depo</h3>
            <p className="text-xs text-slate-500 mt-1">Perubahan tersimpan ke data stok bersama.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Tutup form edit stok"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Text fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEXT_FIELDS.map(([field, label]) => (
              <label key={field} className="font-semibold text-slate-700">
                {label}
                <input
                  type="text"
                  required
                  value={form[field] as string}
                  onChange={(e) => set(field, e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                />
              </label>
            ))}
          </div>

          {/* Price */}
          <label className="block font-semibold text-slate-700">
            Harga Satuan (Rp)
            <input
              type="number"
              min="0"
              required
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
            />
          </label>

          {/* Numeric stock fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {NUMBER_FIELDS.map(([field, label]) => (
              <label key={field} className="font-semibold text-slate-700">
                {label}
                <input
                  type="number"
                  min="0"
                  required
                  value={form[field] as string}
                  onChange={(e) => set(field, e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                />
              </label>
            ))}
          </div>

          {/* Status */}
          <label className="block font-semibold text-slate-700">
            Status Gudang
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as WarehouseStockItem['status'])}
              className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="Aman">Aman</option>
              <option value="Kritis">Kritis</option>
              <option value="Habis">Habis</option>
            </select>
          </label>

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
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
