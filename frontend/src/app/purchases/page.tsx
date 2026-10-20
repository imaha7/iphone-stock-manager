'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  PackagePlus,
  CheckCircle2,
  Calendar,
  Building2,
  Tag,
  Copy,
  Check,
  Layers,
  Minus,
} from 'lucide-react';
import { Purchase } from '@/lib/types';
import { purchases } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import ConfirmDialog from '@/components/ConfirmDialog';

interface PurchaseFormData {
  model: string;
  capacity: string;
  color: string;
  imei: string;
  purchasePrice: string;
  quantity: string;
  supplier: string;
  purchaseDate: string;
  notes: string;
}

const initialFormData: PurchaseFormData = {
  model: '',
  capacity: '128GB',
  color: '',
  imei: '',
  purchasePrice: '',
  quantity: '1',
  supplier: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  notes: '',
};

const capacityOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const popularModels = [
  'iPhone 16 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16',
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15',
  'iPhone 14',
  'iPhone 13',
  'iPhone 12',
  'iPhone 11',
];

export default function PurchasesPage() {
  const [purchaseList, setPurchaseList] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<boolean>;
  } | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [formData, setFormData] = useState<PurchaseFormData>(initialFormData);
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
      const data = await purchases.getAll();
      setPurchaseList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase data');
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const adjustQty = (delta: number) => {
    setFormData((prev) => {
      const current = Math.max(1, (parseInt(prev.quantity, 10) || 1) + delta);
      return { ...prev, quantity: current.toString() };
    });
  };

  const openAddModal = () => {
    setEditingPurchase(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    const unit = purchase.iphoneUnit;
    const formattedDate = purchase.purchaseDate
      ? new Date(purchase.purchaseDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    setFormData({
      model: unit?.model || '',
      capacity: unit?.capacity || '128GB',
      color: unit?.color || '',
      imei: unit?.imei || '',
      purchasePrice: (unit?.purchasePrice || '').toString(),
      quantity: (purchase.quantity ?? unit?.quantity ?? 1).toString(),
      supplier: purchase.supplier || '',
      purchaseDate: formattedDate,
      notes: purchase.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.model.trim()) {
      showToast('iPhone model is required', 'error');
      return;
    }
    if (!formData.imei.trim()) {
      showToast('IMEI number is required', 'error');
      return;
    }
    const priceNum = Number(formData.purchasePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Purchase price must be a valid number greater than 0', 'error');
      return;
    }

    const qtyNum = parseInt(formData.quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 1) {
      showToast('Quantity must be at least 1', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        model: formData.model.trim(),
        capacity: formData.capacity,
        color: formData.color.trim() || 'Standar',
        imei: formData.imei.trim(),
        purchasePrice: priceNum,
        quantity: qtyNum,
        supplier: formData.supplier.trim() || null,
        purchaseDate: formData.purchaseDate,
        notes: formData.notes.trim() || null,
      };

      if (editingPurchase) {
        await purchases.update(editingPurchase.id, payload);
        showToast('Stock-in record updated successfully!', 'success');
      } else {
        await purchases.create(payload);
        showToast('Stock-in record saved successfully!', 'success');
      }

      setShowModal(false);
      setEditingPurchase(null);
      setFormData(initialFormData);
      fetchData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save stock-in record',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, model: string, imei: string) => {
    setConfirmation({
      title: 'Delete this stock-in record?',
      description: `The ${model} record with IMEI ${imei} will be deleted. The unit will only be removed from stock if it has not been sold.`,
      confirmLabel: 'Delete record',
      onConfirm: async () => {
        try {
          await purchases.delete(id);
          showToast('Purchase record deleted successfully', 'success');
          fetchData();
          return true;
        } catch (err) {
          showToast(
            err instanceof Error ? err.message : 'Failed to delete purchase record',
            'error'
          );
          return false;
        }
      },
    });
  };

  const totalSpent = purchaseList.reduce(
    (acc, p) =>
      acc + (p.iphoneUnit?.purchasePrice || 0) * (p.quantity ?? p.iphoneUnit?.quantity ?? 1),
    0
  );

  const totalUnitsReceived = purchaseList.reduce(
    (acc, p) => acc + (p.quantity ?? p.iphoneUnit?.quantity ?? 1),
    0
  );

  const unitPriceNum = Number(formData.purchasePrice) || 0;
  const currentQty = parseInt(formData.quantity, 10) || 1;
  const totalModalCalculated = unitPriceNum * currentQty;

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
            Stock In
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record new units and track stock purchases
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex w-fit items-center gap-1 rounded-xl border border-[#e7e3de] bg-white p-1">
            <Link
              href="/purchases"
              className="rounded-lg bg-[#1b1b20] px-4 py-2 text-xs font-bold text-white"
            >
              Stock In
            </Link>
            <Link
              href="/sales"
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-[#f5f3f0] hover:text-slate-900"
            >
              Stock Out
            </Link>
          </nav>
          <div className="flex gap-5 text-xs text-slate-500">
            <span><b className="text-slate-900">{totalUnitsReceived}</b> units received</span>
            <span>Cost <b className="text-slate-900">{formatCurrency(totalSpent)}</b></span>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary w-full sm:w-auto py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2"
        >
          <PackagePlus className="h-4 w-4" />
          <span>+ Add Stock In</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="spinner h-8 w-8 text-orange-600" />
          <p className="text-xs text-slate-500">Loading stock-in records...</p>
        </div>
      ) : error ? (
        <div className="card flex h-64 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500" />
          <p className="text-xs sm:text-sm text-slate-600">{error}</p>
          <button onClick={fetchData} className="btn-primary py-2 text-xs">
            Try Again
          </button>
        </div>
      ) : purchaseList.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-3">
            <PackagePlus className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            No stock-in records yet
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Click below to record your first stock purchase.
          </p>
          <button
            onClick={openAddModal}
            className="btn-primary mt-4 py-2 text-xs"
          >
            + Add Stock In
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card List View (< md) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {purchaseList.map((item) => {
              const qty = item.quantity ?? item.iphoneUnit?.quantity ?? 1;
              const unitPrice = item.iphoneUnit?.purchasePrice || 0;
              const totalPrice = unitPrice * qty;
              const isSold = item.iphoneUnit?.status === 'sold';

              return (
                <div key={item.id} className="card !p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {item.iphoneUnit?.model}
                        </h3>
                        <span className="badge-neutral text-[10px] px-1.5 py-0.5">
                          {item.iphoneUnit?.capacity}
                        </span>
                        <span className="badge-primary text-[10px] px-1.5 py-0.5 font-bold">
                          Qty: {qty} units
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(item.purchaseDate)} &bull; {item.iphoneUnit?.color}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                        {formatCurrency(totalPrice)}
                      </span>
                      {qty > 1 && (
                        <span className="text-[10px] text-slate-400 block">
                          @{formatCurrency(unitPrice)}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">Total Cost</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-400">IMEI:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {item.iphoneUnit?.imei}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate max-w-[140px]">{item.supplier || 'No Supplier'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
                        title="Edit purchase record"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(
                            item.id,
                            item.iphoneUnit?.model || 'Unit',
                            item.iphoneUnit?.imei || ''
                          )
                        }
                        className="btn-danger py-1 px-2 text-xs flex items-center gap-1"
                        title={isSold ? 'Unit already sold' : 'Delete purchase'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                      Notes: {item.notes}
                    </p>
                  )}
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
                  <th>Unit Model</th>
                  <th>Capacity</th>
                  <th>Color</th>
                  <th>IMEI</th>
                  <th className="text-center">Qty</th>
                  <th>Unit Price</th>
                  <th>Total Cost</th>
                  <th>Supplier</th>
                  <th>Notes</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseList.map((item, index) => {
                  const qty = item.quantity ?? item.iphoneUnit?.quantity ?? 1;
                  const unitPrice = item.iphoneUnit?.purchasePrice || 0;
                  const totalPrice = unitPrice * qty;

                  return (
                    <tr key={item.id}>
                      <td className="text-center text-xs text-slate-400">{index + 1}</td>
                      <td className="text-xs font-medium text-slate-600">
                        {formatDate(item.purchaseDate)}
                      </td>
                      <td className="font-bold text-slate-900">{item.iphoneUnit?.model}</td>
                      <td>
                        <span className="badge-neutral text-xs">{item.iphoneUnit?.capacity}</span>
                      </td>
                      <td className="text-slate-600 text-xs">{item.iphoneUnit?.color}</td>
                      <td className="font-mono text-xs text-slate-600">{item.iphoneUnit?.imei}</td>
                      <td className="text-center">
                        <span className="badge-primary font-bold text-xs">
                          {qty} units
                        </span>
                      </td>
                      <td className="text-xs font-medium text-slate-700">
                        {formatCurrency(unitPrice)}
                      </td>
                      <td className="font-bold text-slate-900">
                        {formatCurrency(totalPrice)}
                      </td>
                      <td className="text-slate-600 text-xs">
                        {item.supplier || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="text-xs text-slate-500 max-w-[140px] truncate">
                        {item.notes || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                            title="Edit Purchase"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(
                                item.id,
                                item.iphoneUnit?.model || 'Unit',
                                item.iphoneUnit?.imei || ''
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Purchase"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Add / Edit Stock-In Form */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[1000] h-[100dvh] w-screen overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="grid min-h-full w-full grid-cols-1 items-stretch lg:h-full lg:grid-cols-[1.35fr_1fr]"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="modal-card h-full min-h-[100dvh] !max-h-none !max-w-none !rounded-none !border-0 !shadow-none lg:min-h-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  {editingPurchase ? (
                    <Pencil className="h-5 w-5" />
                  ) : (
                    <PackagePlus className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingPurchase ? 'Edit Stock-In Record' : 'Record Stock In'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingPurchase
                      ? `Update specifications or purchase details for unit #${editingPurchase.id}`
                      : 'Add a new unit to inventory'}
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
              {/* Model */}
              <div>
                <label className="label">
                  iPhone Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  placeholder="Example: iPhone 15 Pro Max"
                  className="input"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                />
                {/* Quick Model Chips */}
                {!editingPurchase && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {popularModels.slice(0, 5).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, model: m }))}
                        className={cn(
                          'rounded-lg px-2 py-1 text-[11px] font-medium border transition-colors',
                          formData.model === m
                            ? 'bg-orange-50 border-orange-300 text-orange-700 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Capacity (Quick Pill Selector) */}
              <div>
                <label className="label">
                  Storage Capacity <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {capacityOptions.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, capacity: cap }))
                      }
                      className={cn(
                        'py-2 text-xs font-bold rounded-xl border text-center transition-all',
                        formData.capacity === cap
                          ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color & IMEI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Color <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="color"
                    placeholder="Example: Natural Titanium"
                    className="input"
                    value={formData.color}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    IMEI Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="imei"
                    placeholder="15-digit IMEI"
                    className="input font-mono"
                    value={formData.imei}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Quantity with Counter Controls */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="label !mb-0 text-slate-800">
                      Quantity <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Number of units received with these specifications
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustQty(-1)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      className="w-16 text-center font-bold text-sm py-1 border border-slate-300 rounded-xl bg-white"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => adjustQty(1)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Unit Purchase Price with Live Calculation */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">
                    Unit Purchase Price (IDR) <span className="text-rose-500">*</span>
                  </label>
                  {unitPriceNum > 0 && (
                    <span className="text-xs font-bold text-orange-600">
                      {formatCurrency(unitPriceNum)} / unit
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  name="purchasePrice"
                  placeholder="Example: 18500000"
                  className="input font-semibold"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  min="0"
                  step="10000"
                  required
                />

                {/* Total Purchase Cost Preview */}
                {unitPriceNum > 0 && (
                  <div className="mt-2 p-2.5 bg-orange-50/70 rounded-xl border border-orange-100 flex items-center justify-between text-xs animate-slide-down">
                    <span className="text-slate-600 font-medium">
                      Total Purchase Cost ({currentQty} units):
                    </span>
                    <span className="font-extrabold text-orange-700 text-sm">
                      {formatCurrency(totalModalCalculated)}
                    </span>
                  </div>
                )}
              </div>

              {/* Supplier & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Supplier / Source</label>
                  <input
                    type="text"
                    name="supplier"
                    placeholder="Example: Distributor"
                    className="input"
                    value={formData.supplier}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="label">Stock-In Date</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    className="input"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Additional Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Physical condition, battery health, included accessories..."
                  className="input resize-none"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>

              {/* Submit / Cancel Buttons */}
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
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="spinner h-4 w-4" />
                      <span>{editingPurchase ? 'Saving Changes...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{editingPurchase ? 'Update Record' : 'Save Unit'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <aside className="hidden h-full overflow-y-auto border-l border-slate-100 bg-white p-6 lg:block">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Recent Stock In</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {purchaseList.length} purchase records
                </p>
              </div>
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-5 space-y-2.5">
              {purchaseList.slice(0, 6).map((purchase) => (
                <div
                  key={purchase.id}
                  className="rounded-xl border border-[#eeeae5] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">
                        {purchase.iphoneUnit?.model || 'iPhone'}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {purchase.iphoneUnit?.capacity} · {formatDate(purchase.purchaseDate)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                      +{purchase.quantity ?? purchase.iphoneUnit?.quantity ?? 1} units
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                    <span className="font-mono text-slate-400">
                      IMEI {purchase.iphoneUnit?.imei || '-'}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(
                        (purchase.iphoneUnit?.purchasePrice || 0) *
                          (purchase.quantity ?? purchase.iphoneUnit?.quantity ?? 1)
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {purchaseList.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                  No stock-in records yet.
                </p>
              )}
            </div>
          </aside>
          </div>
        </div>
        , document.body)}
    </div>
  );
}
