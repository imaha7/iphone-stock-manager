'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Loader2,
  MessageCircle,
  Printer,
} from 'lucide-react';
import { Sale } from '@/lib/types';
import { sales } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

function formatInvoiceDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function SalesInvoicePage() {
  const params = useParams<{ id: string }>();
  const saleId = Number(params.id);
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSale = useCallback(async () => {
    if (!Number.isSafeInteger(saleId) || saleId <= 0) {
      setError('Invalid transaction ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setSale(await sales.getById(saleId));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load transaction data.',
      );
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  if (loading) {
    return (
      <div className="card flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
        <Loader2 className="spinner h-5 w-5 text-orange-600" />
        Loading invoice...
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="card w-full space-y-4 text-center">
        <p className="text-sm text-rose-600">{error || 'Transaction not found.'}</p>
        <div className="flex justify-center gap-2">
          <button onClick={fetchSale} className="btn-primary">
            Try Again
          </button>
          <Link href="/sales" className="btn-secondary">
            Back to Sales
          </Link>
        </div>
      </div>
    );
  }

  const invoiceDate = new Date(sale.saleDate);
  const invoiceNumber = `INV-${String(invoiceDate.getFullYear()).slice(-2)}${String(
    invoiceDate.getMonth() + 1,
  ).padStart(2, '0')}-${String(sale.id).padStart(4, '0')}`;
  const unit = sale.iphoneUnit;
  const rawPhone = sale.buyerPhone?.replace(/\D/g, '');
  const whatsappNumber = rawPhone
    ? rawPhone.startsWith('0')
      ? `62${rawPhone.slice(1)}`
      : rawPhone.startsWith('62')
        ? rawPhone
        : `62${rawPhone}`
    : null;
  const whatsappText = encodeURIComponent(
    `Hello ${sale.buyerName || ''}, here is invoice ${invoiceNumber} for your transaction of ${formatCurrency(sale.sellingPrice)}.`,
  );

  return (
    <div className="w-full space-y-4">
      <div className="print-hide flex items-center">
        <Link href="/sales" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_270px]">
      <article className="invoice-print relative min-h-[570px] rounded-md border border-[#ebe7e2] bg-white p-6 shadow-sm sm:p-10 lg:p-12">
        <header className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-7 sm:flex-row sm:items-start">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17171b] text-xs font-extrabold text-white">
              IP
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                iPhone Stock Manager
              </h1>
              <p className="text-xs text-slate-500">Sales transaction invoice</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-3xl font-black tracking-tight text-[#17171b]">
              INVOICE
            </p>
            <p className="mt-1 font-mono text-xs tracking-wider text-slate-500">
              {invoiceNumber}
            </p>
          </div>
        </header>

        <section className="grid gap-5 border-b border-slate-200 py-5 sm:grid-cols-3">
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Bill To
            </h2>
            <p className="font-semibold text-slate-900">
              {sale.buyerName || 'Customer'}
            </p>
            {sale.buyerPhone && (
              <p className="mt-1 text-sm text-slate-600">{sale.buyerPhone}</p>
            )}
          </div>
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Date
            </h2>
            <p className="text-sm font-semibold text-slate-900">
              {formatInvoiceDate(sale.saleDate)}
            </p>
          </div>
          <div className="sm:text-right">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Payment
            </h2>
            <p className="text-sm font-semibold text-slate-900">Not recorded</p>
          </div>
        </section>

        <section className="py-7">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4 font-semibold">Description</th>
                  <th className="px-4 pb-3 text-left font-semibold">IMEI</th>
                  <th className="px-4 pb-3 text-center font-semibold">Qty</th>
                  <th className="pb-3 pl-4 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 align-top">
                  <td className="py-5 pr-4">
                    <p className="font-bold text-slate-900">
                      {unit?.model || 'iPhone'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {[unit?.capacity, unit?.color].filter(Boolean).join(' • ') ||
                        'Unit details unavailable'}
                    </p>
                  </td>
                  <td className="px-4 py-5 font-mono text-xs tracking-wide text-slate-700">
                    {unit?.imei?.replace(/(.{4})/g, '$1 ').trim() || '-'}
                  </td>
                  <td className="px-4 py-5 text-center text-sm text-slate-700">
                    {sale.quantity}
                  </td>
                  <td className="py-5 pl-4 text-right text-sm font-semibold text-slate-900">
                    {formatCurrency(sale.sellingPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-6 max-w-sm space-y-3">
            <div className="flex justify-between gap-6 text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(sale.sellingPrice)}</span>
            </div>
            <div className="flex justify-between gap-6 border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(sale.sellingPrice)}</span>
            </div>
          </div>
        </section>

        <div className="pointer-events-none absolute bottom-28 left-10 -rotate-12 rounded-lg border-[3px] border-emerald-700/70 px-3 py-1 text-3xl font-black tracking-[0.16em] text-emerald-700/70 sm:left-14 sm:text-4xl">
          RECORDED
        </div>

        {sale.notes && (
          <section className="border-t border-slate-200 pt-5">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              Notes
            </h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{sale.notes}</p>
          </section>
        )}

        <footer className="absolute bottom-7 left-6 right-6 flex justify-between border-t border-slate-100 pt-4 text-[10px] text-slate-400 sm:left-10 sm:right-10 lg:left-12 lg:right-12">
          <span>Thank you for your purchase.</span>
          <span>Invoice generated automatically from this transaction.</span>
        </footer>
      </article>
        <aside className="print-hide grid gap-2">
          <button
            onClick={() => window.print()}
            className="btn-primary w-full !bg-[#ed552d] hover:!bg-[#d94a25]"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          {whatsappNumber ? (
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full"
            >
              <MessageCircle className="h-4 w-4" />
              Send via WhatsApp
            </a>
          ) : (
            <button
              disabled
              title="No WhatsApp number was recorded for this transaction"
              className="btn-secondary w-full opacity-50"
            >
              <MessageCircle className="h-4 w-4" />
              Send via WhatsApp
            </button>
          )}
          <button onClick={() => window.print()} className="btn-secondary w-full">
            <Printer className="h-4 w-4" />
            Print
          </button>
          <div className="rounded-xl border border-[#ebe7e2] bg-white p-4 text-xs text-slate-600">
            <p className="font-bold text-slate-900">Recorded automatically</p>
            <p className="mt-1.5 leading-relaxed">
              This invoice is generated from the sale. Stock and financial summaries
              are updated automatically.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
