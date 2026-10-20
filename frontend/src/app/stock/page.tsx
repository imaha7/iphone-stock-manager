'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  Smartphone,
  PlusCircle,
  Copy,
  Check,
  CheckCircle2,
  Tag,
  ShieldCheck,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { IPhoneUnit } from '@/lib/types';
import { iphones } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function StockPage() {
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<boolean>;
  } | null>(null);
  const [units, setUnits] = useState<IPhoneUnit[]>([]);
  const [allUnits, setAllUnits] = useState<IPhoneUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold'>('all');
  const [copiedImei, setCopiedImei] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const copyImei = (imei: string) => {
    navigator.clipboard.writeText(imei);
    setCopiedImei(imei);
    showToast(`IMEI ${imei} copied`, 'success');
    setTimeout(() => setCopiedImei(null), 2000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const [data, allData] = await Promise.all([
        iphones.getAll(Object.keys(params).length > 0 ? params : undefined),
        iphones.getAll(),
      ]);
      setUnits(data);
      setAllUnits(allData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number, model: string, imei: string) => {
    setConfirmation({
      title: 'Remove this unit from stock?',
      description: `The ${model} unit with IMEI ${imei} will be removed from inventory. This action cannot be undone.`,
      confirmLabel: 'Remove unit',
      onConfirm: async () => {
        try {
          await iphones.delete(id);
          showToast('Unit removed from stock', 'success');
          fetchData();
          return true;
        } catch (err) {
          showToast(
            err instanceof Error ? err.message : 'Failed to remove unit',
            'error'
          );
          return false;
        }
      },
    });
  };

  const availableUnits = allUnits.filter((u) => u.status === 'available');
  const availableTotalQty = availableUnits.reduce((acc, u) => acc + u.quantity, 0);

  const soldUnits = allUnits.filter((u) => u.status === 'sold');
  const soldCount = soldUnits.length;

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
      {confirmation && (
        <ConfirmDialog
          {...confirmation}
          onCancel={() => setConfirmation(null)}
        />
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            iPhone Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            All units, IMEIs, and statuses
          </p>
        </div>

        <Link
          href="/purchases"
          className="btn-primary w-full sm:w-auto py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>+ Add Stock (Stock In)</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'All', count: allUnits.length },
            { value: 'available', label: 'Ready', count: availableTotalQty },
            { value: 'sold', label: 'Sold', count: soldCount },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value as 'all' | 'available' | 'sold')}
              className={cn(
                'shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition',
                statusFilter === filter.value
                  ? 'border-[#1b1b20] bg-[#1b1b20] text-white'
                  : 'border-[#e7e3de] bg-white text-slate-600 hover:bg-[#f5f3f0]'
              )}
            >
              {filter.label} <span className="ml-1 opacity-70">{filter.count}</span>
            </button>
          ))}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {/* Search Input */}
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search model or IMEI..."
              className="input pl-10 py-2 text-xs sm:text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="spinner h-8 w-8 text-orange-600" />
          <p className="text-xs text-slate-500">Loading stock units...</p>
        </div>
      ) : error ? (
        <div className="card flex h-64 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500" />
          <p className="text-xs sm:text-sm text-slate-600">{error}</p>
          <button onClick={fetchData} className="btn-primary py-2 text-xs">
            Try Again
          </button>
        </div>
      ) : units.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-3">
            <Smartphone className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            No matching units
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            {search
              ? `No results for "${search}". Try another search term.`
              : 'No stock units yet. Use the button below to add one.'}
          </p>
          {!search && (
            <Link href="/purchases" className="btn-primary mt-4 py-2 text-xs">
              + Add First Unit
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card List View (visible on < md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {units.map((unit) => {
              const isAvailable = unit.status === 'available';
              const qty = unit.quantity;

              return (
                <div
                  key={unit.id}
                  className="card !p-4 space-y-3 border-l-4 transition-all duration-150"
                  style={{
                    borderLeftColor: isAvailable ? '#10b981' : '#f59e0b',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {unit.model}
                        </h3>
                        <span className="badge-neutral text-[11px] px-1.5 py-0.5">
                          {unit.capacity}
                        </span>
                        <span className="badge-primary text-[10px] px-1.5 py-0.5 font-bold">
                          Qty: {qty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Color: <span className="font-medium text-slate-700">{unit.color}</span>
                      </p>
                    </div>

                    <span
                      className={cn(
                        'text-xs font-bold px-2.5 py-1 rounded-full',
                        isAvailable ? 'badge-available' : 'badge-sold'
                      )}
                    >
                      {isAvailable ? 'Available' : 'Sold'}
                    </span>
                  </div>

                  {/* IMEI Chip with Copy */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2 border border-slate-100 text-xs">
                    <span className="text-slate-400 font-medium">IMEI:</span>
                    <button
                      onClick={() => copyImei(unit.imei)}
                      className="flex items-center gap-1.5 font-mono text-slate-700 font-semibold hover:text-orange-600 transition-colors"
                      title="Click to copy IMEI"
                    >
                      <span>{unit.imei}</span>
                      {copiedImei === unit.imei ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Prices & Action */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Unit Cost</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {formatCurrency(unit.purchasePrice)}
                      </span>
                    </div>

                    {unit.sellingPrice ? (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Selling Price</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-600">
                          {formatCurrency(unit.sellingPrice)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <Link
                          href="/sales"
                          className="btn-primary py-1.5 px-3 text-xs"
                        >
                          Sell Unit
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Delete button (Only for available units) */}
                  {isAvailable && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDelete(unit.id, unit.model, unit.imei)}
                        className="btn-danger py-1 px-2.5 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (visible on md+) */}
          <div className="table-container hidden md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>iPhone Model</th>
                  <th>Capacity</th>
                  <th>IMEI</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Profit / unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const isAvailable = unit.status === 'available';
                  const qty = unit.quantity;
                  const profitPerUnit = (unit.sellingPrice ?? 0) - unit.purchasePrice;

                  return (
                    <tr key={unit.id} className={cn(!isAvailable && 'opacity-55')}>
                      <td>
                        <span className="block font-bold text-slate-900">{unit.model}</span>
                        <span className="mt-1 block text-[11px] text-slate-400">{unit.color}</span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-700">{unit.capacity}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => copyImei(unit.imei)}
                          className="group flex items-center gap-1.5 font-mono text-xs tracking-wide text-slate-600 hover:text-emerald-700"
                          title="Copy IMEI"
                        >
                          <span>{unit.imei.replace(/(.{4})/g, '$1 ').trim()}</span>
                          {copiedImei === unit.imei ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>
                      <td className="font-semibold text-slate-800">
                        {formatCurrency(unit.purchasePrice)}
                      </td>
                      <td>
                        {unit.sellingPrice ? (
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(unit.sellingPrice)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">- Not sold yet -</span>
                        )}
                      </td>
                      <td className="font-semibold text-emerald-700">
                        {unit.sellingPrice
                          ? `${profitPerUnit >= 0 ? '+' : ''}${formatCurrency(profitPerUnit)}`
                          : <span className="text-slate-300">-</span>}
                      </td>
                      <td>
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-md font-bold',
                          isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        )}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', isAvailable ? 'bg-emerald-600' : 'bg-slate-400')} />
                          {isAvailable ? 'Ready' : 'Sold'}
                        </span>
                        <span className="ml-2 text-md text-slate-400">Qty {qty}</span>
                        {isAvailable && (
                          <button
                            onClick={() => handleDelete(unit.id, unit.model, unit.imei)}
                            className="ml-2 text-slate-300 hover:text-rose-600"
                            title="Delete unit"
                          >
                            <Trash2 className="inline h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
