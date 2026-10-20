'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Filter,
  Loader2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  DollarSign,
  Wallet,
  Receipt,
  Calendar,
  Smartphone,
  ArrowUpRight,
} from 'lucide-react';
import { ProfitPerUnit } from '@/lib/types';
import { dashboard } from '@/lib/api';
import { formatCostCategory, formatCurrency, formatDate, cn } from '@/lib/utils';

export default function ReportsPage() {
  const [profitData, setProfitData] = useState<ProfitPerUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [showCustomDate, setShowCustomDate] = useState(false);

  const setPresetFilter = (preset: 'all' | 'today' | '7days' | 'month') => {
    setActiveFilter(preset);
    setShowCustomDate(false);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await dashboard.getProfitPerUnit(
        Object.keys(params).length > 0 ? params : undefined
      );
      setProfitData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Summary
  const summary = {
    totalSales: profitData.length,
    totalRevenue: profitData.reduce((sum, p) => sum + p.sellingPrice, 0),
    totalCostPrice: profitData.reduce((sum, p) => sum + p.purchasePrice, 0),
    totalAdditionalCosts: profitData.reduce(
      (sum, p) => sum + p.totalAdditionalCosts,
      0
    ),
    grossProfit: profitData.reduce((sum, p) => sum + p.grossProfit, 0),
    netProfit: profitData.reduce((sum, p) => sum + p.netProfit, 0),
  };

  const summaryCards = [
    {
      title: 'Units Sold',
      value: `${summary.totalSales} units`,
      icon: TrendingUp,
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50/80',
      borderColor: 'border-blue-200/60',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue),
      icon: DollarSign,
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50/80',
      borderColor: 'border-purple-200/60',
    },
    {
      title: 'Additional Costs',
      value: formatCurrency(summary.totalAdditionalCosts),
      icon: Receipt,
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50/80',
      borderColor: 'border-amber-200/60',
    },
    {
      title: 'Gross Profit',
      value: formatCurrency(summary.grossProfit),
      icon: BarChart3,
      textColor: 'text-teal-700',
      bgColor: 'bg-teal-50/80',
      borderColor: 'border-teal-200/60',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(summary.netProfit),
      icon: Wallet,
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50/90',
      borderColor: 'border-orange-200/80',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Financial & Unit Profit Reports
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Gross profit, additional cost deductions, and actual net profit
        </p>
      </div>

      {/* Filter Bar with Presets */}
      <div className="card !p-3 sm:!p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Period:
            </span>
            <button
              onClick={() => setPresetFilter('all')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
                activeFilter === 'all'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              All Time
            </button>
            <button
              onClick={() => setPresetFilter('today')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
                activeFilter === 'today'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Today
            </button>
            <button
              onClick={() => setPresetFilter('7days')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
                activeFilter === '7days'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              7 Days
            </button>
            <button
              onClick={() => setPresetFilter('month')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
                activeFilter === 'month'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              This Month
            </button>
            <button
              onClick={() => {
                setActiveFilter('custom');
                setShowCustomDate(!showCustomDate);
              }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all',
                activeFilter === 'custom' || showCustomDate
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Calendar className="h-3 w-3" />
              Custom
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-orange-600">
              <Loader2 className="spinner h-3.5 w-3.5" />
              <span>Calculating...</span>
            </div>
          )}
        </div>

        {/* Custom Date Inputs */}
        {showCustomDate && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end animate-slide-down">
            <div>
              <label className="label text-xs">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveFilter('custom');
                }}
                className="input py-1.5 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="label text-xs">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveFilter('custom');
                }}
                className="input py-1.5 text-xs sm:text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchData()}
                className="btn-primary py-2 text-xs flex-1"
              >
                Apply Filter
              </button>
              <button
                onClick={() => setPresetFilter('all')}
                className="btn-secondary py-2 text-xs"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary Metric Cards (2-cols on mobile, 5-cols on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={cn(
                'card !p-3.5 sm:!p-4 border transition-all duration-150',
                card.bgColor,
                card.borderColor
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <Icon className={cn('h-4 w-4', card.textColor)} />
              </div>
              <p
                className={cn(
                  'text-base sm:text-lg md:text-xl font-extrabold tracking-tight mt-2 break-words',
                  card.textColor
                )}
              >
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Profit per Unit Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Profit Details per iPhone Unit
            </h2>
            <p className="text-xs text-slate-400">
              Price differences and net profit for each unit sold
            </p>
          </div>
          <span className="badge-neutral text-xs font-semibold text-center">
            {profitData.length} Units Sold
          </span>
        </div>

        {loading ? (
          <div className="card flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 className="spinner h-8 w-8 text-orange-600" />
            <p className="text-xs text-slate-500">Loading profit analysis...</p>
          </div>
        ) : error ? (
          <div className="card flex h-64 flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className="text-xs sm:text-sm text-slate-600">{error}</p>
            <button onClick={fetchData} className="btn-primary py-2 text-xs">
              Try Again
            </button>
          </div>
        ) : profitData.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-3">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              No sales data for this period
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Select another date range or record a new sale on the Sales page.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List View (< md) */}
            <div className="grid grid-cols-1 gap-3.5 md:hidden">
              {profitData.map((item) => (
                <div key={item.id} className="card !p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {item.model}
                        </h3>
                        <span className="badge-neutral text-[10px] px-1.5 py-0.5">
                          {item.capacity}
                        </span>
                        <span className="badge-primary text-[10px] px-1.5 py-0.5 font-bold">
                          Qty: {item.quantity || 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(item.saleDate)} &bull; {item.color}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={cn(
                          'text-xs font-black px-2.5 py-1 rounded-full inline-block',
                          item.netProfit >= 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        )}
                      >
                        {item.netProfit >= 0 ? '+' : ''}
                        {formatCurrency(item.netProfit)}
                      </span>
                      <span className="text-[10px] block text-slate-400 mt-0.5">
                        Net Profit
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Purchase Price</span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {formatCurrency(item.purchasePrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Selling Price</span>
                      <span className="font-bold text-emerald-600 text-[11px]">
                        {formatCurrency(item.sellingPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Additional Costs</span>
                      <span className="font-semibold text-amber-700 text-[11px]">
                        {formatCurrency(item.totalAdditionalCosts)}
                      </span>
                    </div>
                  </div>

                  {/* Additional Costs Details */}
                  {item.additionalCosts && item.additionalCosts.length > 0 && (
                    <div className="text-[11px] text-slate-500 bg-amber-50/50 p-2 rounded-lg border border-amber-100/50 space-y-1">
                      <span className="font-semibold text-amber-900 block text-[10px]">
                        Additional Cost Details:
                      </span>
                      {item.additionalCosts.map((c, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            &bull; {formatCostCategory(c.category)}: {c.description}
                          </span>
                          <span className="font-medium text-slate-700">
                            {formatCurrency(c.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-400">IMEI: {item.imei}</span>
                    <span className="font-medium text-slate-600">
                      Gross Profit: {formatCurrency(item.grossProfit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (md+) */}
            <div className="table-container hidden md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12 text-center">No</th>
                    <th>Date</th>
                    <th>Unit Model</th>
                    <th className="text-center">Qty</th>
                    <th>IMEI</th>
                    <th>Purchase Price</th>
                    <th>Selling Price</th>
                    <th>Additional Costs</th>
                    <th>Gross Profit</th>
                    <th className="text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {profitData.map((item, index) => (
                    <tr key={item.id}>
                      <td className="text-center text-xs text-slate-400">{index + 1}</td>
                      <td className="text-xs text-slate-600">{formatDate(item.saleDate)}</td>
                      <td>
                        <span className="font-bold text-slate-900 block">{item.model}</span>
                        <span className="text-xs text-slate-400">
                          {item.capacity} &bull; {item.color}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge-primary font-bold text-xs">
                          {item.quantity || 1} units
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-600">{item.imei}</td>
                      <td className="text-xs text-slate-600">
                        {formatCurrency(item.purchasePrice)}
                      </td>
                      <td className="font-semibold text-slate-900">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td>
                        {item.totalAdditionalCosts > 0 ? (
                          <div>
                            <span className="text-xs font-semibold text-amber-700">
                              {formatCurrency(item.totalAdditionalCosts)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {item.additionalCosts?.length} cost items
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                      <td className="text-xs font-semibold text-slate-800">
                        {formatCurrency(item.grossProfit)}
                      </td>
                      <td className="text-right">
                        <span
                          className={cn(
                            'text-xs font-extrabold px-2.5 py-1 rounded-full inline-block',
                            item.netProfit >= 0
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30'
                              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/30'
                          )}
                        >
                          {item.netProfit >= 0 ? '+' : ''}
                          {formatCurrency(item.netProfit)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={5} className="text-right py-3.5 px-4 text-xs uppercase tracking-wider">
                      Grand Total:
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold">
                      {formatCurrency(summary.totalCostPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-900">
                      {formatCurrency(summary.totalRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-amber-700">
                      {formatCurrency(summary.totalAdditionalCosts)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-teal-800">
                      {formatCurrency(summary.grossProfit)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-sm font-black text-orange-700 bg-orange-100/70 px-3 py-1 rounded-xl">
                        {formatCurrency(summary.netProfit)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
