'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Loader2,
  Package,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { AdditionalCost, DashboardSummary, IPhoneUnit, Purchase, Sale } from '@/lib/types';
import { costs, dashboard, iphones, purchases, sales } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface MonthSummary {
  date: Date;
  label: string;
  revenue: number;
  profit: number;
  transactions: number;
  unitsSold: number;
}

interface Activity {
  id: string;
  kind: 'purchase' | 'sale';
  title: string;
  detail: string;
  date: string;
  amount: number;
}

const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' });
const expenseLabels: Record<string, string> = {
  shipping: 'Shipping',
  ongkir: 'Shipping',
  service: 'Service',
  servis: 'Service',
  operational: 'Operations',
  operasional: 'Operations',
};

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function compactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K`;
  }
  return String(Math.round(value));
}

function inDateRange(value: string, startDate: string, endDate: string) {
  const date = new Date(value);
  if (startDate && date < new Date(`${startDate}T00:00:00`)) return false;
  if (endDate && date > new Date(`${endDate}T23:59:59.999`)) return false;
  return true;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [stock, setStock] = useState<IPhoneUnit[]>([]);
  const [periodSales, setPeriodSales] = useState<Sale[]>([]);
  const [periodPurchases, setPeriodPurchases] = useState<Purchase[]>([]);
  const [allCosts, setAllCosts] = useState<AdditionalCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return toDateInput(new Date(today.getFullYear(), today.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => toDateInput(new Date()));
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('month');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeChartMonth, setActiveChartMonth] = useState<number | null>(null);
  const [pinnedChartMonth, setPinnedChartMonth] = useState<number | null>(null);

  const setPresetFilter = (preset: 'all' | 'today' | '7days' | 'month') => {
    setActiveFilter(preset);
    setShowCustomDate(false);
    const today = new Date();
    const todayString = toDateInput(today);

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayString);
      setEndDate(todayString);
    } else if (preset === '7days') {
      const past = new Date(today);
      past.setDate(today.getDate() - 6);
      setStartDate(toDateInput(past));
      setEndDate(todayString);
    } else {
      setStartDate(toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
      setEndDate(todayString);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryParams: Record<string, string> = {};
      if (startDate) summaryParams.startDate = startDate;
      if (endDate) summaryParams.endDate = endDate;

      const chartStart = new Date();
      chartStart.setDate(1);
      chartStart.setMonth(chartStart.getMonth() - 5);
      const chartParams = { startDate: toDateInput(chartStart) };

      const [summaryData, stockData, salesData, purchaseData, costData] =
        await Promise.all([
          dashboard.getSummary(
            Object.keys(summaryParams).length ? summaryParams : undefined,
          ),
          iphones.getAll({ status: 'available' }),
          sales.getAll(chartParams),
          purchases.getAll(chartParams),
          costs.getAll(
            Object.keys(summaryParams).length ? summaryParams : undefined,
          ),
        ]);
      setSummary(summaryData);
      setStock(stockData);
      setPeriodSales(salesData);
      setPeriodPurchases(purchaseData);
      setAllCosts(costData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load dashboard data',
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartMonths = useMemo<MonthSummary[]>(() => {
    const today = new Date();
    const months: MonthSummary[] = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      return {
        date,
        label: monthLabel.format(date),
        revenue: 0,
        profit: 0,
        transactions: 0,
        unitsSold: 0,
      };
    });
    const monthIndexes = new Map(
      months.map((month, index) => [`${month.date.getFullYear()}-${month.date.getMonth()}`, index]),
    );

    for (const sale of periodSales) {
      const index = monthIndexes.get(dateKey(sale.saleDate));
      if (index === undefined) continue;
      const costsTotal = (sale.additionalCosts ?? []).reduce(
        (total, cost) => total + cost.amount,
        0,
      );
      months[index].revenue += sale.sellingPrice;
      months[index].profit +=
        sale.sellingPrice -
        (sale.iphoneUnit?.purchasePrice ?? 0) * sale.quantity -
        costsTotal;
      months[index].transactions += 1;
      months[index].unitsSold += sale.quantity;
    }
    return months;
  }, [periodSales]);

  const popularModels = useMemo(() => {
    const models = new Map<string, { model: string; capacity: string; quantity: number }>();
    for (const sale of periodSales) {
      const model = sale.iphoneUnit?.model || 'iPhone';
      const capacity = sale.iphoneUnit?.capacity || '';
      const key = `${model}-${capacity}`;
      const entry = models.get(key) ?? { model, capacity, quantity: 0 };
      entry.quantity += sale.quantity;
      models.set(key, entry);
    }
    return Array.from(models.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 4);
  }, [periodSales]);

  const recentActivities = useMemo<Activity[]>(() => {
    const purchaseActivities = periodPurchases.map((purchase) => ({
      id: `purchase-${purchase.id}`,
      kind: 'purchase' as const,
      title: purchase.iphoneUnit?.model || 'iPhone',
      detail: `${purchase.iphoneUnit?.capacity || ''} · ${purchase.quantity} units`,
      date: purchase.purchaseDate,
      amount: (purchase.iphoneUnit?.purchasePrice || 0) * purchase.quantity,
    }));
    const saleActivities = periodSales.map((sale) => ({
      id: `sale-${sale.id}`,
      kind: 'sale' as const,
      title: sale.iphoneUnit?.model || 'iPhone',
      detail: `${sale.iphoneUnit?.capacity || ''} · ${sale.quantity} units`,
      date: sale.saleDate,
      amount: sale.sellingPrice,
    }));
    return [...purchaseActivities, ...saleActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [periodPurchases, periodSales]);

  const expenseTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const cost of allCosts) {
      if (!inDateRange(cost.date, startDate, endDate)) continue;
      const label = expenseLabels[cost.category.toLowerCase()] || cost.category;
      totals.set(label, (totals.get(label) || 0) + cost.amount);
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [allCosts, startDate, endDate]);

  const totalStockValue = stock.reduce(
    (total, unit) => total + unit.purchasePrice * unit.quantity,
    0,
  );
  const totalAvailable = stock.reduce((total, unit) => total + unit.quantity, 0);
  const chartMaxRevenue = Math.max(...chartMonths.map((month) => month.revenue), 1);
  const chartMaxProfit = Math.max(
    ...chartMonths.map((month) => Math.max(month.profit, 0)),
    1,
  );
  const monthProfitPoints = chartMonths.map((month, index) => ({
    x: 60 + index * 96,
    y: 180 - (Math.max(month.profit, 0) / chartMaxProfit) * 135,
  }));
  const selectedPeriod = activeFilter === 'month'
    ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())
    : activeFilter === 'today'
      ? 'Today'
      : activeFilter === '7days'
        ? 'Last 7 days'
        : activeFilter === 'custom'
          ? 'Custom period'
          : 'All time';

  if (loading && !summary) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="spinner h-8 w-8 text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading business overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card flex h-80 flex-col items-center justify-center gap-3 text-center p-6">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <h3 className="text-base font-bold text-slate-800">Overview is unavailable</h3>
        <p className="max-w-sm text-sm text-slate-500">{error}</p>
        <button onClick={() => setRefreshKey((key) => key + 1)} className="btn-primary mt-2">
          Try Again
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const summaryCards = [
    {
      title: 'Ready Stock',
      value: `${totalAvailable} units`,
      subtitle: `Stock value ${formatCurrency(totalStockValue)}`,
      icon: Package,
      tone: 'text-emerald-700',
      marker: 'bg-emerald-600',
    },
    {
      title: 'Purchases',
      value: formatCurrency(summary.totalPurchaseAmount),
      subtitle: `${summary.totalPurchases} stock-in transactions`,
      icon: ShoppingCart,
      tone: 'text-slate-700',
      marker: 'bg-slate-400',
    },
    {
      title: 'Sales Revenue',
      value: formatCurrency(summary.totalSalesAmount),
      subtitle: `${summary.totalSales} sales transactions`,
      icon: TrendingUp,
      tone: 'text-orange-600',
      marker: 'bg-orange-600',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(summary.netProfit),
      subtitle: `After costs ${formatCurrency(summary.totalAdditionalCosts)}`,
      icon: Wallet,
      tone: 'text-emerald-400',
      marker: 'bg-emerald-400',
      dark: true,
    },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className={`rounded-2xl border p-4 sm:p-5 ${
                card.dark
                  ? 'border-[#1b1b20] bg-[#1b1b20] text-white'
                  : 'border-[#ebe7e2] bg-white'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <span className={`h-2 w-2 rounded-sm ${card.marker}`} />
                {card.title}
                <Icon className={`ml-auto h-4 w-4 ${card.tone}`} />
              </div>
              <p className={`mt-3 break-words text-xl font-extrabold tracking-tight sm:text-2xl ${card.tone}`}>
                {card.value}
              </p>
              <p className={`mt-1 truncate text-xs ${card.dark ? 'text-slate-400' : 'text-slate-400'}`}>
                {card.subtitle}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,0.9fr)]">
        <article className="rounded-2xl border border-[#ebe7e2] bg-white p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue &amp; Net Profit</h2>
              <p className="mt-1 text-xs text-slate-400">Performance over the last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-[#d9d4ce]" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-600" /> Net profit
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-hidden">
            <div
              className="relative h-[230px]"
              onPointerLeave={() => setActiveChartMonth(pinnedChartMonth)}
            >
              <div className="absolute inset-y-0 left-0 flex flex-col justify-between pb-7 pr-2 text-[10px] text-slate-400">
                {[1, 0.66, 0.33, 0].map((ratio) => (
                  <span key={ratio}>{compactCurrency(chartMaxRevenue * ratio)}</span>
                ))}
              </div>
              <svg
                className="absolute inset-0 h-full w-full overflow-visible"
                viewBox="0 0 640 220"
                preserveAspectRatio="none"
                role="group"
                aria-label="Revenue and net profit chart for the last six months"
              >
                {[26, 76, 126, 176].map((y) => (
                  <line
                    key={y}
                    x1="38"
                    x2="632"
                    y1={y}
                    y2={y}
                    stroke="#f0eeeb"
                    strokeWidth="1"
                  />
                ))}
                {chartMonths.map((month, index) => {
                  const x = 60 + index * 96;
                  const height = (month.revenue / chartMaxRevenue) * 150;
                  return (
                    <g key={`${month.label}-${month.date.getFullYear()}`}>
                      <title>{`${month.label}: revenue ${formatCurrency(month.revenue)}, profit ${formatCurrency(month.profit)}`}</title>
                      <rect
                        className="chart-bar"
                        x={x - 25}
                        y={176 - height}
                        width="50"
                        height={height}
                        rx="7"
                        fill={index === chartMonths.length - 1 ? '#ed552d' : '#ded9d3'}
                        pointerEvents="none"
                        style={{
                          transition:
                            'y 550ms cubic-bezier(0.22, 1, 0.36, 1), height 550ms cubic-bezier(0.22, 1, 0.36, 1)',
                          animationDelay: `${index * 55}ms`,
                        }}
                      />
                      <text
                        x={x}
                        y="205"
                        textAnchor="middle"
                        fill="#96939a"
                        fontSize="11"
                        pointerEvents="none"
                      >
                        {month.label}
                      </text>
                    </g>
                  );
                })}
                {monthProfitPoints.slice(0, -1).map((point, index) => {
                  const nextPoint = monthProfitPoints[index + 1];
                  return (
                    <line
                      key={`profit-segment-${index}`}
                      x1={point.x}
                      y1={point.y}
                      x2={nextPoint.x}
                      y2={nextPoint.y}
                      stroke="#168f68"
                      strokeWidth="3"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      style={{
                        transition:
                          'y1 550ms cubic-bezier(0.22, 1, 0.36, 1), y2 550ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    />
                  );
                })}
                {chartMonths.map((month, index) => {
                  const x = 60 + index * 96;
                  const y = monthProfitPoints[index].y;
                  return (
                    <circle
                      key={`${month.label}-profit`}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="white"
                      stroke="#168f68"
                      strokeWidth="2.5"
                      pointerEvents="none"
                      style={{
                        transition: 'cy 550ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    >
                      <title>{`${month.label}: net profit ${formatCurrency(month.profit)}`}</title>
                    </circle>
                  );
                })}
                {chartMonths.map((month, index) => {
                  const x = 60 + index * 96;
                  const isPressed = pinnedChartMonth === index;
                  return (
                    <rect
                      key={`${month.label}-chart-hit-area`}
                      x={x - 44}
                      y="20"
                      width="88"
                      height="190"
                      fill="transparent"
                      role="button"
                      tabIndex={0}
                      aria-describedby={
                        activeChartMonth === index ? 'chart-month-tooltip' : undefined
                      }
                      aria-label={`${month.label}: revenue ${formatCurrency(month.revenue)}, net profit ${formatCurrency(month.profit)}, ${month.transactions} transactions, ${month.unitsSold} units sold`}
                      aria-pressed={isPressed}
                      onPointerEnter={() =>
                        setActiveChartMonth(pinnedChartMonth ?? index)
                      }
                      onFocus={() => setActiveChartMonth(index)}
                      onBlur={() => {
                        setActiveChartMonth(pinnedChartMonth);
                      }}
                      onClick={() => {
                        const nextIndex = pinnedChartMonth === index ? null : index;
                        setPinnedChartMonth(nextIndex);
                        setActiveChartMonth(nextIndex);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          const nextIndex = pinnedChartMonth === index ? null : index;
                          setPinnedChartMonth(nextIndex);
                          setActiveChartMonth(nextIndex);
                        }
                      }}
                      className="cursor-pointer outline-none focus-visible:stroke-[#ed552d] focus-visible:stroke-2"
                    />
                  );
                })}
              </svg>
              {activeChartMonth !== null && chartMonths[activeChartMonth] && (
                <div
                  id="chart-month-tooltip"
                  role="tooltip"
                  className={`pointer-events-none absolute top-1 z-10 w-52 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl ${
                    activeChartMonth < 2
                      ? '-translate-x-1'
                      : activeChartMonth > 3
                        ? '-translate-x-[96%]'
                        : '-translate-x-1/2'
                  }`}
                  style={{ left: `${((60 + activeChartMonth * 96) / 640) * 100}%` }}
                >
                  <p className="font-bold capitalize text-slate-900">
                    {chartMonths[activeChartMonth].date.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="h-2 w-2 rounded-sm bg-[#d9d4ce]" /> Revenue
                      </span>
                      <strong className="text-slate-800">
                        {formatCurrency(chartMonths[activeChartMonth].revenue)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-600" /> Net profit
                      </span>
                      <strong className="text-emerald-700">
                        {formatCurrency(chartMonths[activeChartMonth].profit)}
                      </strong>
                    </div>
                    <p className="border-t border-slate-100 pt-1.5 text-[10px] text-slate-500">
                      {chartMonths[activeChartMonth].transactions} transactions · {chartMonths[activeChartMonth].unitsSold} units sold
                    </p>
                  </div>
                  {pinnedChartMonth === activeChartMonth && (
                    <p className="mt-1.5 text-[9px] text-slate-400">Tap again to close</p>
                  )}
                </div>
              )}
            </div>
            {loading && (
              <p className="mt-1 text-right text-[11px] text-emerald-700">
                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                Updating data...
              </p>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#ebe7e2] bg-white">
          <div className="flex items-center justify-between px-4 pb-3 pt-4 sm:px-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Sellers</h2>
              <p className="mt-1 text-xs text-slate-400">Units sold in the last 6 months</p>
            </div>
            <Smartphone className="h-4 w-4 text-slate-400" />
          </div>
          {popularModels.length ? (
            <div>
              {popularModels.map((item, index) => {
                const maxQuantity = popularModels[0].quantity || 1;
                return (
                  <div
                    key={`${item.model}-${item.capacity}`}
                    className="flex items-center gap-3 border-t border-[#f0eeeb] px-4 py-3 sm:px-5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f6f4f1] text-xs font-bold text-slate-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-800">{item.model}</p>
                      <p className="text-[10px] text-slate-400">{item.capacity}</p>
                    </div>
                    <div className="hidden w-16 overflow-hidden rounded-full bg-[#f3f1ee] sm:block">
                      <div
                        className="h-1.5 rounded-full bg-[#1b1b20]"
                        style={{ width: `${(item.quantity / maxQuantity) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-bold text-slate-700">
                      {item.quantity} units
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="border-t border-[#f0eeeb] px-5 py-10 text-center text-xs text-slate-400">
              No sales transactions yet.
            </p>
          )}
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,0.9fr)]">
        <article className="rounded-2xl border border-[#ebe7e2] bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Stock In &amp; Out</h2>
              <p className="mt-1 text-xs text-slate-400">Latest inventory activity</p>
            </div>
            <Link href="/sales" className="text-xs font-semibold text-slate-500 hover:text-emerald-700">
              All transactions <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
            </Link>
          </div>
          {recentActivities.length ? (
            <div>
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 border-t border-[#f0eeeb] py-3 first:border-0"
                >
                  <span className={`rounded-md px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                    activity.kind === 'purchase'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-orange-50 text-orange-600'
                  }`}>
                    {activity.kind === 'purchase' ? 'Stock In' : 'Stock Out'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800">{activity.title}</p>
                    <p className="text-[10px] text-slate-400">{activity.detail}</p>
                  </div>
                  <span className="hidden text-[10px] text-slate-400 sm:block">
                    {formatDate(activity.date)}
                  </span>
                  <span className="min-w-24 text-right text-xs font-semibold text-slate-700">
                    {activity.kind === 'purchase' ? '+' : ''}{formatCurrency(activity.amount)}
                  </span>
                  {activity.kind === 'purchase' ? (
                    <ArrowDownLeft className="hidden h-4 w-4 text-emerald-600 sm:block" />
                  ) : (
                    <ArrowUpRight className="hidden h-4 w-4 text-orange-500 sm:block" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="border-t border-[#f0eeeb] py-10 text-center text-xs text-slate-400">
              No activity during this period.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-[#ebe7e2] bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Additional Costs</h2>
              <p className="mt-1 text-xs text-slate-400">{selectedPeriod}</p>
            </div>
            <Wallet className="h-4 w-4 text-slate-400" />
          </div>
          {expenseTotals.length ? (
            <div className="space-y-4">
              {expenseTotals.map(([label, amount]) => {
                const maxAmount = expenseTotals[0][1] || 1;
                return (
                  <div key={label}>
                    <div className="mb-1.5 flex justify-between gap-3 text-xs">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#f1efec]">
                      <div
                        className="h-full rounded-full bg-[#ed552d]"
                        style={{ width: `${(amount / maxAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-[#f0eeeb] pt-3 text-xs text-slate-500">
                Total costs <span className="float-right font-bold text-slate-800">{formatCurrency(summary.totalAdditionalCosts)}</span>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-xs text-slate-400">
              No additional costs during this period.
            </p>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-[#ebe7e2] bg-white p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Report period
            <span className="hidden text-slate-300 sm:inline">·</span>
            <span className="hidden text-slate-400 sm:inline">{selectedPeriod}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              ['today', 'Today'],
              ['7days', '7 days'],
              ['month', 'This month'],
              ['all', 'All time'],
            ] as const).map(([preset, label]) => (
              <button
                key={preset}
                onClick={() => setPresetFilter(preset)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  activeFilter === preset
                    ? 'bg-[#1b1b20] text-white'
                    : 'bg-[#f6f4f1] text-slate-600 hover:bg-[#eeece9]'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => {
                setActiveFilter('custom');
                setShowCustomDate((visible) => !visible);
              }}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                activeFilter === 'custom'
                  ? 'bg-[#1b1b20] text-white'
                  : 'bg-[#f6f4f1] text-slate-600 hover:bg-[#eeece9]'
              }`}
            >
              Custom <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {loading && <Loader2 className="ml-1 h-4 w-4 animate-spin text-emerald-700" />}
          </div>
        </div>
        {showCustomDate && (
          <div className="mt-3 grid gap-3 border-t border-[#f0eeeb] pt-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-xs font-semibold text-slate-600">
              From date
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setActiveFilter('custom');
                }}
                className="input mt-1 py-2 text-xs"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              To date
              <input
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setActiveFilter('custom');
                }}
                className="input mt-1 py-2 text-xs"
              />
            </label>
            <button
              onClick={() => setRefreshKey((key) => key + 1)}
              className="btn-primary py-2 text-xs"
            >
              Apply
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
