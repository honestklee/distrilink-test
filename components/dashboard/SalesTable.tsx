'use client';

import { useState, useMemo } from 'react';
import { SalesData } from '@/types/sales';
import Pagination from './Pagination';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
  Inbox,
  Sparkles,
} from 'lucide-react';

interface SalesTableProps {
  data: SalesData[];
  onResetFilters?: () => void;
}

type SortField =
  | 'nama_sales'
  | 'area'
  | 'kunjungan_planned'
  | 'kunjungan_realisasi'
  | 'efektivitas_visit_persen'
  | 'total_order_rp'
  | 'jumlah_order_oos';

export default function SalesTable({ data, onResetFilters }: SalesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortField, setSortField] = useState<SortField>('efektivitas_visit_persen');
  const [sortAsc, setSortAsc] = useState(false);

  // Sorting
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [data, sortField, sortAsc]);

  // Pagination calculation
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Safe page correction if data shrunk
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, safeCurrentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending for numbers
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 ml-1 inline" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1 inline" />
    );
  };

  // Helper for avatar initials & color
  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-emerald-100 text-emerald-700',
      'bg-violet-100 text-violet-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
      'bg-cyan-100 text-cyan-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Title Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>Daftar Kinerja Salesman</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
              {totalItems} salesman
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik judul kolom untuk mengurutkan data (sorting)
          </p>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th
                onClick={() => handleSort('nama_sales')}
                className="p-4 cursor-pointer hover:bg-slate-100/70 transition select-none"
              >
                Nama Sales {renderSortIcon('nama_sales')}
              </th>
              <th
                onClick={() => handleSort('area')}
                className="p-4 cursor-pointer hover:bg-slate-100/70 transition select-none"
              >
                Area {renderSortIcon('area')}
              </th>
              <th
                onClick={() => handleSort('kunjungan_planned')}
                className="p-4 text-center cursor-pointer hover:bg-slate-100/70 transition select-none"
              >
                Rencana {renderSortIcon('kunjungan_planned')}
              </th>
              <th
                onClick={() => handleSort('kunjungan_realisasi')}
                className="p-4 text-center cursor-pointer hover:bg-slate-100/70 transition select-none"
              >
                Realisasi {renderSortIcon('kunjungan_realisasi')}
              </th>
              <th
                onClick={() => handleSort('efektivitas_visit_persen')}
                className="p-4 text-center cursor-pointer hover:bg-slate-100/70 transition select-none"
              >
                Efektivitas {renderSortIcon('efektivitas_visit_persen')}
              </th>
              <th
                onClick={() => handleSort('total_order_rp')}
                className="p-4 text-right cursor-pointer hover:bg-slate-100/70 transition select-none"
              >
                Total Order {renderSortIcon('total_order_rp')}
              </th>
              <th
                onClick={() => handleSort('jumlah_order_oos')}
                className="p-4 text-center cursor-pointer hover:bg-slate-100/70 transition select-none"
              >
                Kendala OOS {renderSortIcon('jumlah_order_oos')}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                      <Inbox className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">Tidak ada data ditemukan</p>
                    <p className="text-xs text-slate-500 max-w-xs">
                      Coba ganti kata kunci pencarian atau reset filter area untuk melihat data salesman.
                    </p>
                    {onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition border border-blue-200"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const initials = item.nama_sales
                  ? item.nama_sales
                      .trim()
                      .split(/\s+/)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'S';

                const isHigh = item.efektivitas_visit_persen >= 85;
                const isMedium =
                  item.efektivitas_visit_persen >= 70 && item.efektivitas_visit_persen < 85;

                return (
                  <tr
                    key={item.id ? `${item.id}-${item.nama_sales}` : item.nama_sales}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Sales Name with Initials Avatar */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${getAvatarBg(
                            item.nama_sales
                          )}`}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                            {item.nama_sales}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            ID: {item.id || `SLM-001`}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Area */}
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                        {item.area}
                      </span>
                    </td>

                    {/* Planned */}
                    <td className="p-4 text-center font-medium text-slate-600">
                      {item.kunjungan_planned} visit
                    </td>

                    {/* Realized */}
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <span>{item.kunjungan_realisasi}</span>
                        <span className="text-xs text-slate-400">/ {item.kunjungan_planned}</span>
                      </div>
                    </td>

                    {/* Effectiveness Pill */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isHigh
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isMedium
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isHigh && <Sparkles className="w-3 h-3 text-emerald-500" />}
                        {item.efektivitas_visit_persen}%
                      </span>
                    </td>

                    {/* Total Order */}
                    <td className="p-4 text-right">
                      <span className="font-bold text-slate-900">
                        Rp {item.total_order_rp.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* OOS Warning */}
                    <td className="p-4 text-center">
                      {item.jumlah_order_oos > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          {item.jumlah_order_oos} kendala
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lancar
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(limit) => {
            setItemsPerPage(limit);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
