'use client';

import { Package, Pencil, Download, Upload, Plus } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import StockEditModal from '@/components/dashboard/StockEditModal';
import AddStockModal from '@/components/dashboard/AddStockModal';
import { CatalogProduct, WarehouseStockItem } from '@/lib/storage';
import { StockFormState, NewStockFormState } from '@/hooks/useDashboardLogic';

interface Props {
  scopedStocks: WarehouseStockItem[];
  paginatedStocks: WarehouseStockItem[];
  catalogProducts: CatalogProduct[];
  userArea: string | undefined;
  isImporting: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (n: number) => void;
  editingStock: WarehouseStockItem | null;
  showAddModal: boolean;
  onOpenEdit: (item: WarehouseStockItem) => void;
  onCloseEdit: () => void;
  onSaveEdit: (stock: WarehouseStockItem, form: StockFormState) => void;
  onOpenAdd: () => void;
  onCloseAdd: () => void;
  onAdd: (form: NewStockFormState) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function StockStatusBadge({ status }: { status: WarehouseStockItem['status'] }) {
  const cls =
    status === 'Habis'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : status === 'Kritis'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${cls}`}>
      {status}
    </span>
  );
}

export default function StockTab({
  scopedStocks,
  paginatedStocks,
  catalogProducts,
  userArea,
  isImporting,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  editingStock,
  showAddModal,
  onOpenEdit,
  onCloseEdit,
  onSaveEdit,
  onOpenAdd,
  onCloseAdd,
  onAdd,
  onExport,
  onImport,
}: Props) {
  const oosCount = scopedStocks.filter((s) => s.status === 'Habis').length;
  const kritisCount = scopedStocks.filter((s) => s.status === 'Kritis').length;
  const firstKritis = scopedStocks.find((s) => s.status === 'Kritis');

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total SKU Terdaftar di Depo</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{scopedStocks.length} Produk FMCG</p>
          <p className="text-[11px] text-slate-400 mt-1">Gudang {userArea || 'Semua Wilayah'}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Produk Out of Stock (OOS)</span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{oosCount} SKU</p>
          <p className="text-[11px] text-rose-600 mt-1">
            {scopedStocks.filter((s) => s.status === 'Habis').map((s) => s.name.split(' ')[0]).join(', ') || 'Semua Produk Tersedia'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">SKU Mendekati Reorder Point</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{kritisCount} SKU</p>
          <p className="text-[11px] text-amber-700 mt-1">
            {firstKritis
              ? `${firstKritis.name} (Sisa ${firstKritis.depoStock} unit)`
              : 'Stok di atas batas kritis'}
          </p>
        </div>
      </div>

      {/* Stock table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table header bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Monitoring Stok Gudang &amp; Ambang Batas Keselamatan (Safety Stock)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisor memantau ketersediaan fisik, titik pemesanan ulang (ROP), dan estimasi ketahanan stok
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Import CSV */}
            <label
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                isImporting ? 'bg-slate-100 text-slate-400 pointer-events-none' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Import data stok dari file CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              {isImporting ? 'Mengimpor...' : 'Import CSV'}
              <input type="file" accept=".csv,text/csv" onChange={onImport} disabled={isImporting} className="hidden" />
            </label>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              title="Unduh data stok wilayah dalam format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            {/* Add product */}
            <button
              type="button"
              onClick={onOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Produk
            </button>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
              Realtime Sync Depo
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">SKU &amp; Nama Produk</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5 text-right">Harga Satuan</th>
                <th className="p-3.5 text-center">Stok Fisik Depo</th>
                <th className="p-3.5 text-center">Safety Stock</th>
                <th className="p-3.5 text-center">Reorder Point (ROP)</th>
                <th className="p-3.5 text-center">Ketahanan Stok</th>
                <th className="p-3.5 text-center">Status Gudang</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStocks.map((item) => {
                const price =
                  catalogProducts.find((p) => p.id === item.sku || p.name === item.name)?.price || 0;
                return (
                  <tr key={item.sku} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.sku}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-blue-700 whitespace-nowrap">
                      Rp {price.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="font-extrabold text-slate-900 text-sm">{item.depoStock} {item.unit}</span>
                    </td>
                    <td className="p-3.5 text-center text-slate-600 font-medium">{item.safetyStock} {item.unit}</td>
                    <td className="p-3.5 text-center text-slate-600 font-medium">{item.reorderPoint} {item.unit}</td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      {item.daysOfInventory > 0 ? `${item.daysOfInventory} Hari` : '0 Hari (OOS)'}
                    </td>
                    <td className="p-3.5 text-center">
                      <StockStatusBadge status={item.status} />
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenEdit(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100 transition cursor-pointer"
                        aria-label={`Edit stok ${item.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={scopedStocks.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={(n) => { onItemsPerPageChange(n); onPageChange(1); }}
        />
      </div>

      {/* Edit modal */}
      {editingStock && (
        <StockEditModal
          stock={editingStock}
          catalogProducts={catalogProducts}
          onSave={onSaveEdit}
          onClose={onCloseEdit}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddStockModal
          userArea={userArea}
          onAdd={onAdd}
          onClose={onCloseAdd}
        />
      )}
    </div>
  );
}
