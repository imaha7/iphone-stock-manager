'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2, Printer, Search } from 'lucide-react';
import { Sale } from '@/lib/types';
import { sales } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoicesPage() {
  const [saleList, setSaleList] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSaleList(await sales.getAll());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load invoices',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filteredSales = saleList.filter((sale) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      String(sale.id),
      sale.buyerName || '',
      sale.buyerPhone || '',
      sale.iphoneUnit?.model || '',
      sale.iphoneUnit?.imei || '',
    ].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Sales Invoices
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View, print, or save invoices from recorded transactions.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, model, or IMEI..."
            className="input pl-9"
          />
        </div>
      </section>

      {loading ? (
        <div className="card flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500">
          <Loader2 className="spinner h-5 w-5 text-emerald-600" />
          Loading invoices...
        </div>
      ) : error ? (
        <div className="card space-y-3 text-center">
          <p className="text-sm text-rose-600">{error}</p>
          <button onClick={fetchSales} className="btn-primary">
            Try Again
          </button>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="card flex min-h-56 flex-col items-center justify-center text-center">
          <FileText className="mb-3 h-8 w-8 text-slate-300" />
          <p className="font-semibold text-slate-700">
            {saleList.length ? 'No invoices found' : 'No invoices yet'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {saleList.length
              ? 'Try another search term.'
              : 'Invoices will appear automatically after a sale is recorded.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#ebe7e2] bg-white">
          <div className="hidden grid-cols-[1.1fr_1.2fr_1.4fr_0.8fr_1fr_auto] gap-4 bg-[#faf9f7] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid">
            <span>No. Invoice</span>
            <span>Date</span>
            <span>Customer</span>
            <span>Quantity</span>
            <span className="text-right">Total</span>
            <span className="text-right">Actions</span>
          </div>
          {filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="grid gap-3 border-t border-[#f0eeeb] px-4 py-4 first:border-0 sm:px-5 md:grid-cols-[1.1fr_1.2fr_1.4fr_0.8fr_1fr_auto] md:items-center md:gap-4"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">
                  INV-{new Date(sale.saleDate).getFullYear()}-{String(sale.id).padStart(5, '0')}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">Transaction #{sale.id}</p>
              </div>
              <span className="text-xs text-slate-600">{formatDate(sale.saleDate)}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {sale.buyerName || 'Customer'}
                </p>
                <p className="mt-1 truncate text-[11px] text-slate-400">
                  {[sale.iphoneUnit?.model, sale.iphoneUnit?.capacity]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <span className="text-xs text-slate-600">{sale.quantity} units</span>
              <span className="text-xs font-bold text-slate-900 md:text-right">
                {formatCurrency(sale.sellingPrice)}
              </span>
              <Link
                href={`/sales/${sale.id}/invoice`}
                className="btn-secondary w-full py-2 text-xs md:w-auto"
              >
                <Printer className="h-3.5 w-3.5" />
                View Invoice
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
