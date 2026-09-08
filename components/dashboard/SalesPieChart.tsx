'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { SalesData } from '@/types/sales';
import { PieChart as PieChartIcon } from 'lucide-react';

interface SalesPieChartProps {
  data: SalesData[];
}

interface AreaDataItem {
  name: string;
  revenue: number;
  visits: number;
  value: number;
  percentage: string;
}

interface PieTooltipProps {
  active?: boolean;
  payload?: readonly {
    payload?: AreaDataItem;
  }[];
}

const COLORS = [
  '#2563eb', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#64748b', // slate
];

const emptySubscribe = () => () => {};

export default function SalesPieChart({ data }: SalesPieChartProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [metric, setMetric] = useState<'revenue' | 'visits'>('revenue');

  // Aggregate data by Area
  const areaData = useMemo(() => {
    const areaMap: Record<string, { name: string; revenue: number; visits: number }> = {};

    data.forEach((item) => {
      if (!areaMap[item.area]) {
        areaMap[item.area] = { name: item.area, revenue: 0, visits: 0 };
      }
      areaMap[item.area].revenue += item.total_order_rp;
      areaMap[item.area].visits += item.kunjungan_realisasi;
    });

    const list = Object.values(areaMap);
    const totalRev = list.reduce((a, b) => a + b.revenue, 0);
    const totalVis = list.reduce((a, b) => a + b.visits, 0);

    return list.map((item): AreaDataItem => ({
      ...item,
      value: metric === 'revenue' ? item.revenue : item.visits,
      percentage:
        metric === 'revenue'
          ? totalRev ? ((item.revenue / totalRev) * 100).toFixed(1) : '0'
          : totalVis ? ((item.visits / totalVis) * 100).toFixed(1) : '0',
    }));
  }, [data, metric]);

  if (!isClient) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-[380px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2 text-slate-400">
          <PieChartIcon className="w-8 h-8 animate-bounce" />
          <span className="text-sm font-medium">Memuat pie chart...</span>
        </div>
      </div>
    );
  }

  const customTooltip = ({ active, payload }: PieTooltipProps) => {
    if (active && payload && payload.length && payload[0].payload) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs min-w-[170px] space-y-1">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex justify-between items-center">
            <span>{item.name}</span>
            <span className="text-emerald-400 font-bold">{item.percentage}%</span>
          </div>
          <div className="text-slate-300 flex justify-between items-center pt-1">
            <span>{metric === 'revenue' ? 'Nilai Order:' : 'Realisasi Visit:'}</span>
            <span className="font-semibold text-white">
              {metric === 'revenue'
                ? `Rp ${item.revenue.toLocaleString('id-ID')}`
                : `${item.visits} visit`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Header with Switcher */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Distribusi Wilayah</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Pangsa pasar order & aktivitas per area</p>
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium border border-slate-200/60">
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              metric === 'revenue'
                ? 'bg-white text-emerald-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Order (Rp)
          </button>
          <button
            type="button"
            onClick={() => setMetric('visits')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              metric === 'visits'
                ? 'bg-white text-emerald-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kunjungan
          </button>
        </div>
      </div>

      {/* Pie Canvas */}
      <div className="w-full h-[350px] lg:h-[370px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={customTooltip} />
            <Pie
              data={areaData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="48%"
              innerRadius={65}
              outerRadius={110}
              paddingAngle={3}
            >
              {areaData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
