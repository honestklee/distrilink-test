'use client';

import { useState, useSyncExternalStore } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { SalesData } from '@/types/sales';
import { BarChart3 } from 'lucide-react';

interface PerformanceGraphProps {
  data: SalesData[];
}

interface ChartItem {
  name: string;
  fullName: string;
  area: string;
  planned: number;
  realized: number;
  effectiveness: number;
  orderValue: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly {
    payload?: ChartItem;
  }[];
}

const emptySubscribe = () => () => {};

export default function PerformanceGraph({ data }: PerformanceGraphProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [chartType, setChartType] = useState<'visits' | 'effectiveness' | 'revenue'>('visits');

  // Format data for chart display
  const chartData: ChartItem[] = data.map((item) => ({
    name: item.nama_sales.split(' ')[0], // First name for clean X-axis
    fullName: item.nama_sales,
    area: item.area,
    planned: item.kunjungan_planned,
    realized: item.kunjungan_realisasi,
    effectiveness: item.efektivitas_visit_persen,
    orderValue: item.total_order_rp,
  }));

  const customTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length && payload[0].payload) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs min-w-[180px] space-y-1.5 z-50">
          <div className="border-b border-slate-800 pb-1 font-semibold flex justify-between items-center">
            <span>{item.fullName}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-blue-400 rounded">
              {item.area}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Target Rencana:</span>
            <span className="font-semibold text-slate-200">{item.planned} visit</span>
          </div>
          <div className="flex justify-between items-center text-blue-400">
            <span>Realisasi:</span>
            <span className="font-semibold">{item.realized} visit</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400">
            <span>Efektivitas:</span>
            <span className="font-semibold">{item.effectiveness}%</span>
          </div>
          <div className="flex justify-between items-center text-amber-400 pt-1 border-t border-slate-800/80">
            <span>Nilai Order:</span>
            <span className="font-semibold">Rp {item.orderValue.toLocaleString('id-ID')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isClient) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-[380px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2 text-slate-400">
          <BarChart3 className="w-8 h-8 animate-bounce" />
          <span className="text-sm font-medium">Memuat visualisasi grafik...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Grafik Analisa Performa Salesman</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi target rencana, realisasi kunjungan, dan pencapaian per salesman
          </p>
        </div>

        {/* View Toggle Pill */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium self-start sm:self-auto border border-slate-200/60">
          <button
            type="button"
            onClick={() => setChartType('visits')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              chartType === 'visits'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rencana vs Realisasi
          </button>
          <button
            type="button"
            onClick={() => setChartType('effectiveness')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              chartType === 'effectiveness'
                ? 'bg-white text-emerald-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Efektivitas (%)
          </button>
          <button
            type="button"
            onClick={() => setChartType('revenue')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              chartType === 'revenue'
                ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nilai Order
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[350px] lg:h-[370px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'visits' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={customTooltip} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
              />
              <Bar
                dataKey="planned"
                name="Rencana Visit"
                fill="#cbd5e1"
                radius={[6, 6, 0, 0]}
                barSize={18}
              />
              <Bar
                dataKey="realized"
                name="Realisasi Visit"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
                barSize={18}
              />
            </BarChart>
          ) : chartType === 'effectiveness' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEffectiveness" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 12 }}
                unit="%"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={customTooltip} />
              <Area
                type="monotone"
                dataKey="effectiveness"
                name="Efektivitas (%)"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorEffectiveness)"
                dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}jt`}
              />
              <Tooltip content={customTooltip} />
              <Bar
                dataKey="orderValue"
                name="Total Order (Rp)"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                barSize={24}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
