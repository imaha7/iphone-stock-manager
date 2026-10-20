'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  ShoppingCart,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  User,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Smartphone,
  Check,
  FileText,
  Search,
} from 'lucide-react';
import { Sale, IPhoneUnit } from '@/lib/types';
import { sales, iphones } from '@/lib/api';
import { formatCostCategory, formatCurrency, formatDate, cn } from '@/lib/utils';
import ConfirmDialog from '@/components/ConfirmDialog';

interface AdditionalCostForm {
  description: string;
  amount: string;
  category: 'Shipping' | 'Service' | 'Operations';
}

interface SaleFormData {
  iphoneUnitId: string;
  quantity: string;
  sellingPrice: string;
  buyerName: string;
  buyerPhone: string;
  saleDate: string;
  notes: string;
  additionalCosts: AdditionalCostForm[];
}

const initialFormData: SaleFormData = {
  iphoneUnitId: '',
  quantity: '1',
  sellingPrice: '',
  buyerName: '',
  buyerPhone: '',
  saleDate: new Date().toISOString().split('T')[0],
  notes: '',
  additionalCosts: [],
};

const costCategories: ('Shipping' | 'Service' | 'Operations')[] = [
  'Shipping',
  'Service',
  'Operations',
];

export default function SalesPage() {
  const [saleList, setSaleList] = useState<Sale[]>([]);
  const [availableUnits, setAvailableUnits] = useState<IPhoneUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<boolean>;
  } | null>(null);
  const [unitSearch, setUnitSearch] = useState('');
  const [formData, setFormData] = useState<SaleFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    },
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesData, unitsData] = await Promise.all([
        sales.getAll(),
        iphones.getAll({ status: 'available' }),
      ]);
      setSaleList(salesData);
      setAvailableUnits(unitsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'iphoneUnitId' ? { quantity: '1' } : {}),
    }));
  };

  const addCost = () => {
    setFormData((prev) => ({
      ...prev,
      additionalCosts: [
        ...prev.additionalCosts,
        { description: '', amount: '', category: 'Shipping' },
      ],
    }));
  };

  const removeCost = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter((_, i) => i !== index),
    }));
  };

  const handleCostChange = (
    index: number,
    field: keyof AdditionalCostForm,
    value: string
  ) => {
    setFormData((prev) => {
      const newCosts = [...prev.additionalCosts];
      newCosts[index] = { ...newCosts[index], [field]: value };
      return { ...prev, additionalCosts: newCosts };
    });
  };

  const selectedUnit = availableUnits.find(
    (u) => u.id === Number(formData.iphoneUnitId)
  );
  const matchingUnits = availableUnits.filter((unit) =>
    `${unit.model} ${unit.capacity} ${unit.color} ${unit.imei}`
      .toLowerCase()
      .includes(unitSearch.toLowerCase().trim())
  );

  // Live calculations for modal
  const purchasePrice = selectedUnit?.purchasePrice || 0;
  const saleQuantity = Number(formData.quantity) || 0;
  const sellingPriceNum = Number(formData.sellingPrice) || 0;
  const totalAdditionalCostsNum = formData.additionalCosts.reduce(
    (sum, c) => sum + (Number(c.amount) || 0),
    0
  );
  const grossProfit =
    sellingPriceNum > 0
      ? sellingPriceNum - purchasePrice * saleQuantity
      : 0;
  const netProfit = grossProfit - totalAdditionalCostsNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.iphoneUnitId) {
      showToast('Select the iPhone unit to sell', 'error');
      return;
    }

    if (
      !Number.isInteger(saleQuantity) ||
      saleQuantity < 1 ||
      saleQuantity > (selectedUnit?.quantity ?? 0)
    ) {
      showToast('Sale quantity must not exceed the available stock', 'error');
      return;
    }

    if (!formData.sellingPrice || sellingPriceNum <= 0) {
      showToast('Enter a valid selling price greater than 0', 'error');
      return;
    }

    // Validate additional costs
    for (let i = 0; i < formData.additionalCosts.length; i++) {
      const cost = formData.additionalCosts[i];
      if (!cost.description.trim()) {
        showToast(`Description for additional cost #${i + 1} is required`, 'error');
        return;
      }
      if (isNaN(Number(cost.amount)) || Number(cost.amount) <= 0) {
        showToast(`Enter a valid amount for additional cost #${i + 1}`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      await sales.create({
        iphoneUnitId: Number(formData.iphoneUnitId),
        quantity: saleQuantity,
        sellingPrice: sellingPriceNum,
        buyerName: formData.buyerName.trim() || null,
        buyerPhone: formData.buyerPhone.trim() || null,
        saleDate: formData.saleDate,
        notes: formData.notes.trim() || null,
        additionalCosts:
          formData.additionalCosts.length > 0
            ? formData.additionalCosts.map((c) => ({
                description: c.description.trim(),
                amount: Number(c.amount),
                category: c.category,
              }))
            : undefined,
      });

      showToast('Sale transaction recorded successfully!', 'success');
      setShowModal(false);
      setFormData(initialFormData);
      fetchData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to record sale',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSale = async (id: number, model: string) => {
    setConfirmation({
      title: 'Cancel this sale?',
      description: `The ${model} transaction will be canceled and the unit will be returned to available stock.`,
      confirmLabel: 'Cancel sale',
      onConfirm: async () => {
        try {
          await sales.delete(id);
          showToast('Sale canceled. The unit is back in available stock.', 'success');
          fetchData();
          return true;
        } catch (err) {
          showToast(
            err instanceof Error ? err.message : 'Failed to cancel sale',
            'error'
          );
          return false;
        }
      },
    });
  };

  const totalOmzet = saleList.reduce((sum, s) => sum + s.sellingPrice, 0);

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
            Stock Out
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record sales and track transaction performance
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex w-fit items-center gap-1 rounded-xl border border-[#e7e3de] bg-white p-1">
            <Link
              href="/purchases"
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-[#f5f3f0] hover:text-slate-900"
            >
              Stock In
            </Link>
            <Link
              href="/sales"
              className="rounded-lg bg-[#1b1b20] px-4 py-2 text-xs font-bold text-white"
            >
              Stock Out
            </Link>
          </nav>
          <div className="text-xs text-slate-500">
            {saleList.length} transactions <span className="mx-1.5 text-slate-300">•</span>
            Revenue <b className="text-slate-900">{formatCurrency(totalOmzet)}</b>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData(initialFormData);
            setShowModal(true);
          }}
          className="btn-primary w-full sm:w-auto py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>+ Create Sale</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="spinner h-8 w-8 text-orange-600" />
          <p className="text-xs text-slate-500">Loading sales data...</p>
        </div>
      ) : error ? (
        <div className="card flex h-64 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500" />
          <p className="text-xs sm:text-sm text-slate-600">{error}</p>
          <button onClick={fetchData} className="btn-primary py-2 text-xs">
            Try Again
          </button>
        </div>
      ) : saleList.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-3">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            No sales transactions yet
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Select an available unit and record your first sale.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary mt-4 py-2 text-xs"
          >
            + Create Sale
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card List View (< md) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {saleList.map((sale) => {
              const pPrice = sale.iphoneUnit?.purchasePrice || 0;
              const costSum = (sale.additionalCosts || []).reduce(
                (sum, c) => sum + c.amount,
                0
              );
              const gProfit = sale.sellingPrice - pPrice * sale.quantity;
              const nProfit = gProfit - costSum;

              return (
                <div key={sale.id} className="card !p-4 space-y-3">
                  {/* Card Header: Unit & Price */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {sale.iphoneUnit?.model}
                        </h3>
                        <span className="badge-neutral text-[10px] px-1.5 py-0.5">
                          {sale.iphoneUnit?.capacity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(sale.saleDate)} &bull; {sale.iphoneUnit?.color} &bull; Qty: {sale.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                        {formatCurrency(sale.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400">Sale Price</span>
                    </div>
                  </div>

                  {/* Profit breakdown banner */}
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Purchase Cost: {formatCurrency(pPrice * sale.quantity)}</span>
                      <span>
                        Additional Costs: {formatCurrency(costSum)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 font-bold">
                      <span className="text-slate-700">Net Profit:</span>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-extrabold',
                          nProfit >= 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        )}
                      >
                        {nProfit >= 0 ? '+' : ''}
                        {formatCurrency(nProfit)}
                      </span>
                    </div>
                  </div>

                  {/* Additional Costs pills if any */}
                  {sale.additionalCosts && sale.additionalCosts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {sale.additionalCosts.map((c, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          {formatCostCategory(c.category)}: {c.description} ({formatCurrency(c.amount)})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Buyer & Action */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium">
                        {sale.buyerName || 'Customer'}
                      </span>
                      {sale.buyerPhone && (
                        <span className="text-slate-400">({sale.buyerPhone})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/sales/${sale.id}/invoice`}
                        className="btn-secondary py-1 px-2.5 text-xs"
                        title="View and print invoice"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Invoice
                      </Link>
                      <button
                        onClick={() =>
                          handleCancelSale(
                            sale.id,
                            sale.iphoneUnit?.model || 'Unit'
                          )
                        }
                        className="btn-danger py-1 px-2.5 text-xs"
                        title="Cancel this transaction and return the unit to stock"
                      >
                        Cancel Sale
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (md+) */}
          <div className="table-container hidden md:block">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12 text-center">No</th>
                  <th>Date</th>
                  <th>iPhone Unit</th>
                  <th>Qty</th>
                  <th>IMEI</th>
                  <th>Purchase Cost</th>
                  <th>Selling Price</th>
                  <th>Additional Costs</th>
                  <th>Net Profit</th>
                  <th>Customer</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {saleList.map((sale, index) => {
                  const pPrice = sale.iphoneUnit?.purchasePrice || 0;
                  const costSum = (sale.additionalCosts || []).reduce(
                    (sum, c) => sum + c.amount,
                    0
                  );
                  const nProfit =
                    sale.sellingPrice - pPrice * sale.quantity - costSum;

                  return (
                    <tr key={sale.id}>
                      <td className="text-center text-xs text-slate-400">{index + 1}</td>
                      <td className="text-xs font-medium text-slate-600">
                        {formatDate(sale.saleDate)}
                      </td>
                      <td>
                        <span className="font-bold text-slate-900 block">
                          {sale.iphoneUnit?.model}
                        </span>
                        <span className="text-xs text-slate-400">
                          {sale.iphoneUnit?.capacity} &bull; {sale.iphoneUnit?.color}
                        </span>
                      </td>
                      <td className="text-xs text-slate-600">
                        {sale.quantity} units
                      </td>
                      <td className="font-mono text-xs text-slate-600">
                        {sale.iphoneUnit?.imei}
                      </td>
                      <td className="text-xs text-slate-600">
                        {formatCurrency(pPrice * sale.quantity)}
                      </td>
                      <td className="font-bold text-slate-900">
                        {formatCurrency(sale.sellingPrice)}
                      </td>
                      <td>
                        {costSum > 0 ? (
                          <div>
                            <span className="text-xs font-semibold text-amber-700">
                              {formatCurrency(costSum)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {sale.additionalCosts?.length} costs
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={cn(
                            'text-xs font-extrabold px-2 py-0.5 rounded-full inline-block',
                            nProfit >= 0
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
                          )}
                        >
                          {nProfit >= 0 ? '+' : ''}
                          {formatCurrency(nProfit)}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium text-slate-800 text-xs block">
                          {sale.buyerName || <span className="text-slate-300">-</span>}
                        </span>
                        {sale.buyerPhone && (
                          <span className="text-[11px] text-slate-400">
                            {sale.buyerPhone}
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/sales/${sale.id}/invoice`}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-50 hover:text-orange-800"
                            title="View and print invoice"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Invoice
                          </Link>
                          <button
                            onClick={() =>
                              handleCancelSale(
                                sale.id,
                                sale.iphoneUnit?.model || 'Unit'
                              )
                            }
                            className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                            title="Cancel sale and return unit to stock"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create Sale Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="grid w-full max-w-5xl grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="modal-card w-full lg:!max-w-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Unit Sale
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select an iPhone unit from stock and enter sale details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Unit Selector */}
              <div>
                <label className="label">
                  iPhone Unit <span className="text-rose-500">*</span>
                </label>
                {availableUnits.length === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                    No units are currently available. Add stock from the{' '}
                    <Link href="/purchases" className="underline font-bold">
                      Stock In
                    </Link>
                    .
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={unitSearch}
                        onChange={(event) => setUnitSearch(event.target.value)}
                        className="input pl-9"
                        placeholder="Search model or IMEI..."
                        aria-label="Search units by model or IMEI"
                      />
                    </div>
                    <select
                      name="iphoneUnitId"
                      className="select"
                      value={formData.iphoneUnitId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select an available unit</option>
                      {matchingUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.model} ({unit.capacity}) - {unit.color} | Qty: {unit.quantity} | IMEI: {unit.imei}
                        </option>
                      ))}
                    </select>
                    {unitSearch && matchingUnits.length === 0 && (
                      <p className="text-xs text-amber-700">
                        No available units match your search.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Unit Snapshot Card */}
              {selectedUnit && (
                <div className="rounded-2xl border border-[#e7e3de] bg-[#f7f5f2] p-3.5 text-xs flex items-center justify-between animate-slide-down">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      {selectedUnit.model} {selectedUnit.capacity} ({selectedUnit.quantity} units)
                    </span>
                    <span className="mt-1 block font-mono text-[11px] text-slate-500">
                      {selectedUnit.color} &bull; IMEI {selectedUnit.imei}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Cost / unit:</span>
                    <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                      {formatCurrency(selectedUnit.purchasePrice)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="label">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  className="input"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  max={selectedUnit?.quantity ?? 1}
                  step="1"
                  required
                  disabled={!selectedUnit}
                />
                {selectedUnit && (
                  <p className="mt-1 text-xs text-slate-500">
                    Available stock: {selectedUnit.quantity} units
                  </p>
                )}
              </div>

              {/* Selling Price */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">
                    Selling Price (IDR) <span className="text-rose-500">*</span>
                  </label>
                  {formData.sellingPrice && !isNaN(Number(formData.sellingPrice)) && (
                    <span className="text-xs font-bold text-emerald-600">
                      {formatCurrency(Number(formData.sellingPrice))}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  name="sellingPrice"
                  placeholder="Example: 20500000"
                  className="input font-semibold"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="10000"
                  required
                />
              </div>

              {/* Customer & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Customer Name</label>
                  <input
                    type="text"
                    name="buyerName"
                    placeholder="Example: Alex Smith"
                    className="input"
                    value={formData.buyerName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="label">Phone / WhatsApp</label>
                  <input
                    type="text"
                    name="buyerPhone"
                    placeholder="Example: 081234567890"
                    className="input font-mono"
                    value={formData.buyerPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="label">Transaction Date</label>
                <input
                  type="date"
                  name="saleDate"
                  className="input"
                  value={formData.saleDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Additional Costs Section */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="label !mb-0">Additional Sale Costs (Optional)</label>
                    <p className="text-[11px] text-slate-400">
                      Shipping, repairs/service, or other operating costs
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addCost}
                    className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Cost</span>
                  </button>
                </div>

                {formData.additionalCosts.length > 0 && (
                  <div className="space-y-2.5">
                    {formData.additionalCosts.map((cost, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-600 text-[11px]">
                            Cost #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCost(index)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <label className="label text-[10px]">Kategori</label>
                            <select
                              value={cost.category}
                              onChange={(e) =>
                                handleCostChange(
                                  index,
                                  'category',
                                  e.target.value as any
                                )
                              }
                              className="select py-1.5 text-xs"
                            >
                              {costCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="label text-[10px]">Description</label>
                            <input
                              type="text"
                              placeholder="Misal: Kurir Instan, Ganti Baterai"
                              value={cost.description}
                              onChange={(e) =>
                                handleCostChange(index, 'description', e.target.value)
                              }
                              className="input py-1.5 text-xs"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="label text-[10px]">Nominal (Rp)</label>
                          <input
                            type="number"
                            placeholder="Contoh: 50000"
                            value={cost.amount}
                            onChange={(e) =>
                              handleCostChange(index, 'amount', e.target.value)
                            }
                            className="input py-1.5 text-xs font-semibold"
                            min="0"
                            step="1000"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LIVE PROFIT SUMMARY */}
              <div className="rounded-2xl bg-[#1b1b20] p-5 text-white shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Estimated transaction profit</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Net profit after additional costs
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="space-y-2.5 border-b border-white/10 pb-4 text-xs">
                  <div className="flex justify-between gap-3 text-slate-300">
                    <span>Selling price</span>
                    <span className="font-semibold text-white">{formatCurrency(sellingPriceNum)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-300">
                    <span>Unit cost</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(purchasePrice * saleQuantity)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-300">
                    <span>Additional costs</span>
                    <span className="font-semibold text-amber-300">
                      -{formatCurrency(totalAdditionalCostsNum)}
                    </span>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3 pt-4">
                  <div>
                    <p className="text-xs text-slate-300">Profit bersih</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {selectedUnit ? `${selectedUnit.model} · Qty ${saleQuantity}` : 'Select a unit to calculate'}
                    </p>
                  </div>
                  <p className={cn(
                    'text-xl font-black',
                    netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Transaction Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Payment method (transfer/cash), store warranty, extras..."
                  className="input resize-none"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary py-2.5 px-4 text-xs sm:text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2.5 px-6 text-xs sm:text-sm flex items-center gap-2"
                  disabled={submitting || availableUnits.length === 0}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="spinner h-4 w-4" />
                      <span>Saving Sale...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save Sale</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <aside className="hidden min-h-[520px] flex-col overflow-hidden rounded-3xl bg-[#1b1b20] p-6 text-white shadow-2xl lg:flex">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-300">Transaction Summary</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Values update as you enter details
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                Selected unit
              </p>
              <p className="mt-2 font-semibold">
                {selectedUnit
                  ? `${selectedUnit.model} ${selectedUnit.capacity}`
                  : 'Select a unit from stock'}
              </p>
              <p className="mt-1 font-mono text-[10px] text-slate-500">
                {selectedUnit ? `IMEI ${selectedUnit.imei}` : `${availableUnits.length} units available`}
              </p>
            </div>
            <div className="mt-4 space-y-3 border-b border-white/10 pb-5 text-xs">
              <div className="flex justify-between gap-3 text-slate-300">
                <span>Selling price</span>
                <span className="font-semibold text-white">{formatCurrency(sellingPriceNum)}</span>
              </div>
              <div className="flex justify-between gap-3 text-slate-300">
                <span>Unit cost</span>
                <span className="font-semibold text-white">
                  {formatCurrency(purchasePrice * saleQuantity)}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-slate-300">
                <span>Additional costs</span>
                <span className="font-semibold text-amber-300">
                  -{formatCurrency(totalAdditionalCostsNum)}
                </span>
              </div>
            </div>
            <div className="mt-auto pt-5">
              <p className="text-xs text-slate-300">Estimasi profit bersih</p>
              <p className={cn(
                'mt-2 text-3xl font-black',
                netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              )}>
                {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
              </p>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                Calculation includes unit cost, sale quantity, and additional costs.
              </p>
            </div>
          </aside>
          </div>
        </div>
      )}
    </div>
  );
}
