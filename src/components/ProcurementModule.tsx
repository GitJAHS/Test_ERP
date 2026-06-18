/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Purchase, Delivery, Offer, Supplier, Product } from '../types';
import { Search, Plus, Trash2, Edit2, Play, Printer, CheckCircle, Clock, Truck, Tag, Calendar } from 'lucide-react';

interface ProcurementProps {
  purchases: Purchase[];
  deliveries: Delivery[];
  offers: Offer[];
  suppliers: Supplier[];
  products: Product[];
  currency: string;
  onSavePurchase: (p: Purchase) => void;
  onSaveDelivery: (d: Delivery) => void;
  onSaveOffer: (o: Offer) => void;
  onDeletePurchase: (id: string) => void;
  onDeleteDelivery: (id: string) => void;
  onDeleteOffer: (id: string) => void;
  onPrintPurchase: (p: Purchase) => void;
}

export function ProcurementModule({
  purchases,
  deliveries,
  offers,
  suppliers,
  products,
  currency,
  onSavePurchase,
  onSaveDelivery,
  onSaveOffer,
  onDeletePurchase,
  onDeleteDelivery,
  onDeleteOffer,
  onPrintPurchase,
}: ProcurementProps) {
  const [activeSegment, setActiveSegment] = useState<'purchases' | 'deliveries' | 'offers'>('purchases');
  const [query, setQuery] = useState('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Dynamic PO item lines
  const [purchItems, setPurchItems] = useState<Array<{ productId: string; quantity: number; costPrice: number; size: string; notes: string }>>([]);

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  };

  const handleOpenAddPurch = () => {
    setEditingPurchase(null);
    setPurchItems([{ productId: '', quantity: 1, costPrice: 0, size: '', notes: '' }]);
    setIsFormOpen(true);
  };

  const handleOpenEditPurch = (p: Purchase) => {
    setEditingPurchase(p);
    setPurchItems(p.items.map((it) => ({ ...it })));
    setIsFormOpen(true);
  };

  const addPurchRow = () => {
    setPurchItems((prev) => [...prev, { productId: '', quantity: 1, costPrice: 0, size: '', notes: '' }]);
  };

  const removePurchRow = (idx: number) => {
    setPurchItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePurchRowValueChange = (idx: number, key: string, val: any) => {
    setPurchItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[idx], [key]: val } as any;

      if (key === 'productId') {
        const prod = products.find((p) => p.id === val);
        if (prod) {
          target.costPrice = prod.pricing.costPrice;
          target.size = prod.basicInfo.size.split(',')[0]?.trim() || '';
        }
      }
      updated[idx] = target;
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (activeSegment === 'purchases') {
      const supplierId = formData.get('supplierId') as string;
      const status = formData.get('status') as string;
      const paymentMethod = formData.get('paymentMethod') as string;
      const transactionId = formData.get('transactionId') as string;

      const totalCost = purchItems.reduce((acc, curr) => acc + curr.quantity * curr.costPrice, 0);

      const pRecord: Purchase = {
        id: editingPurchase?.id || `PURCH-${Date.now().toString(36).toUpperCase()}`,
        supplierId,
        items: purchItems,
        totalCost,
        date: editingPurchase?.date || new Date().toISOString(),
        status,
        paymentMethod,
        transactionId,
      };

      onSavePurchase(pRecord);
    } else if (activeSegment === 'deliveries') {
      const invoiceId = formData.get('invoiceId') as string;
      const address = formData.get('address') as string;
      const status = formData.get('status') as string;
      const cost = parseFloat(formData.get('cost') as string) || 0;

      const dRecord: Delivery = {
        id: editingDelivery?.id || `DEL-${Date.now().toString(36).toUpperCase()}`,
        invoiceId,
        customerId: editingDelivery?.customerId || '',
        address,
        status,
        tracking: editingDelivery?.tracking || [],
        cost,
      };

      onSaveDelivery(dRecord);
    } else {
      const name = formData.get('name') as string;
      const promoCode = formData.get('promoCode') as string;
      const type = formData.get('type') as string;
      const value = parseFloat(formData.get('value') as string) || 0;
      const productId = formData.get('productId') as string;
      const startDateInput = formData.get('startDate') as string;
      const expiryDateInput = formData.get('expiryDate') as string;
      const status = formData.get('status') as string;

      const oRecord: Offer = {
        id: editingOffer?.id || `PROMO-${Date.now().toString(36).toUpperCase()}`,
        name,
        promoCode,
        type,
        value,
        productId: productId === '__any__' ? null : productId,
        startDate: startDateInput ? new Date(startDateInput).toISOString() : null,
        expiryDate: expiryDateInput ? new Date(expiryDateInput).toISOString() : null,
        status,
        createdAt: editingOffer?.createdAt || new Date().toISOString(),
      };

      onSaveOffer(oRecord);
    }
    setIsFormOpen(false);
  };

  const filteredPurchases = purchases.filter((p) => {
    const s = suppliers.find((vs) => vs.id === p.supplierId);
    return (
      p.id.toLowerCase().includes(query.toLowerCase()) ||
      (s && s.name.toLowerCase().includes(query.toLowerCase())) ||
      (s && s.company.toLowerCase().includes(query.toLowerCase()))
    );
  });

  const filteredDeliveries = deliveries.filter((d) => {
    return d.address.toLowerCase().includes(query.toLowerCase()) || d.invoiceId.toLowerCase().includes(query.toLowerCase());
  });

  const filteredOffers = offers.filter((o) => {
    return o.name.toLowerCase().includes(query.toLowerCase()) || o.promoCode.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveSegment('purchases');
              setQuery('');
              setIsFormOpen(false);
            }}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'purchases' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            Supply PO Restocks
          </button>
          <button
            onClick={() => {
              setActiveSegment('deliveries');
              setQuery('');
              setIsFormOpen(false);
            }}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'deliveries' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            Logistics & Couriers
          </button>
          <button
            onClick={() => {
              setActiveSegment('offers');
              setQuery('');
              setIsFormOpen(false);
            }}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'offers' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            Coupons & Promos desk
          </button>
        </div>

        {!isFormOpen && (
          <button
            onClick={
              activeSegment === 'purchases'
                ? handleOpenAddPurch
                : activeSegment === 'deliveries'
                ? () => {
                    setEditingDelivery(null);
                    setIsFormOpen(true);
                  }
                : () => {
                    setEditingOffer(null);
                    setIsFormOpen(true);
                  }
            }
            className="btn btn-filled flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <Plus className="w-4 h-4" /> onboarding entry
          </button>
        )}
      </div>

      {isFormOpen ? (
        /* Dynamic forms */
        <div className="card max-w-4xl mx-auto w-full">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-6 font-display">
            {activeSegment === 'purchases'
              ? editingPurchase
                ? `Edit purchase order: ${editingPurchase.id}`
                : 'Create purchase Order (Restock PO)'
              : activeSegment === 'deliveries'
              ? editingDelivery
                ? `Modify Dispatch delivery: ${editingDelivery.id}`
                : 'Register Courier Dispatch Order'
              : editingOffer
              ? `Edit Promo Coupon: ${editingOffer.name}`
              : 'Add Coupon promotion Code'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeSegment === 'purchases' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="field">
                    <label>Assigned Supplier *</label>
                    <select name="supplierId" required defaultValue={editingPurchase?.supplierId || ''}>
                      <option value="">— Select Registered Vendor —</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.company})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>PO Status</label>
                    <select name="status" defaultValue={editingPurchase?.status || 'pending'}>
                      <option value="pending">Pending Vendor Fulfillment</option>
                      <option value="completed">Completed (Increments stock & log expenses)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600">PO Restock line Items</h4>
                    <button type="button" onClick={addPurchRow} className="btn btn-tonal btn-sm text-[10px] py-1 px-2.5">
                      + Add Item line
                    </button>
                  </div>

                  {purchItems.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const sizesList = prod ? prod.basicInfo.size.split(',').map((s) => s.trim()) : [];

                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl relative border border-neutral-200/50"
                      >
                        <div className="field md:col-span-4">
                          <label className="text-[10px]">Select Catalog SKU</label>
                          <select
                            value={item.productId}
                            required
                            onChange={(e) => handlePurchRowValueChange(idx, 'productId', e.target.value)}
                          >
                            <option value="">— Choose SKU —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.basicInfo.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field md:col-span-2">
                          <label className="text-[10px]">size Specifications</label>
                          {sizesList.length > 0 ? (
                            <select
                              value={item.size}
                              onChange={(e) => handlePurchRowValueChange(idx, 'size', e.target.value)}
                            >
                              {sizesList.map((sz) => (
                                <option key={sz} value={sz}>
                                  {sz}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={item.size}
                              onChange={(e) => handlePurchRowValueChange(idx, 'size', e.target.value)}
                              placeholder="Standard"
                            />
                          )}
                        </div>
                        <div className="field md:col-span-2">
                          <label className="text-[10px]">Procure Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handlePurchRowValueChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="field md:col-span-2">
                          <label className="text-[10px]">Supplier Cost Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.costPrice}
                            onChange={(e) => handlePurchRowValueChange(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="field md:col-span-2">
                          <label className="text-[10px]">Line comments</label>
                          <input
                            value={item.notes}
                            onChange={(e) => handlePurchRowValueChange(idx, 'notes', e.target.value)}
                            placeholder="Comments..."
                          />
                        </div>

                        {purchItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePurchRow(idx)}
                            className="absolute right-2 top-2 p-1 text-red-500 rounded-full hover:bg-neutral-200/50"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-100 dark:border-neutral-850 pt-4">
                  <div className="field">
                    <label>Remittance Payment Method</label>
                    <select name="paymentMethod" defaultValue={editingPurchase?.paymentMethod || 'cash'}>
                      <option value="cash">Cash / Outfill</option>
                      <option value="bank">Bank Wire</option>
                      <option value="card">Corporate card</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Bank wire transaction Reference ID</label>
                    <input name="transactionId" defaultValue={editingPurchase?.transactionId || ''} placeholder="TXN-942183" />
                  </div>
                  <div className="p-3 bg-neutral-100/50 dark:bg-neutral-950/40 rounded-xl border border-neutral-150 inline-flex flex-col justify-center">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">Aggregated Cost Weight</span>
                    <span className="text-xl font-mono font-bold text-red-500">
                      {formatMoney(purchItems.reduce((acc, curr) => acc + curr.quantity * curr.costPrice, 0))}
                    </span>
                  </div>
                </div>
              </>
            )}

            {activeSegment === 'deliveries' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label>Consolidated invoice ID Link *</label>
                  <input name="invoiceId" required defaultValue={editingDelivery?.invoiceId || ''} placeholder="INV-20250618..." />
                </div>
                <div className="field">
                  <label>Delivery Costs Address *</label>
                  <input name="address" required defaultValue={editingDelivery?.address || ''} placeholder="Street Address, City..." />
                </div>
                <div className="field">
                  <label>Logistics cost Frame</label>
                  <input name="cost" type="number" step="0.01" defaultValue={editingDelivery?.cost || 0} />
                </div>
                <div className="field">
                  <label>Courier Status</label>
                  <select name="status" defaultValue={editingDelivery?.status || 'pending'}>
                    <option value="pending">Pending Dispatch</option>
                    <option value="shipped">Shipped (In transit)</option>
                    <option value="delivered">Delivered Successfully</option>
                  </select>
                </div>
              </div>
            )}

            {activeSegment === 'offers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label>Voucher Campaign Promo Name *</label>
                  <input name="name" required defaultValue={editingOffer?.name || ''} placeholder="Summer clearance 15%" />
                </div>
                <div className="field">
                  <label>Corporate Promo Code *</label>
                  <input name="promoCode" required defaultValue={editingOffer?.promoCode || ''} placeholder="SUMMER15" className="font-mono uppercase font-bold" />
                </div>
                <div className="field">
                  <label>Deduction Method Type</label>
                  <select name="type" defaultValue={editingOffer?.type || 'percentage'}>
                    <option value="percentage">Percentage based Deduction (%)</option>
                    <option value="fixed">Fixed Volume Deduction (Flat amount)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Voucher Value</label>
                  <input name="value" type="number" step="0.01" defaultValue={editingOffer?.value || 0} />
                </div>
                <div className="field">
                  <label>Link Specific Catalog Category Product</label>
                  <select name="productId" defaultValue={editingOffer?.productId || '__any__'}>
                    <option value="__any__">— Clears entire invoice checkout basket —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.basicInfo.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="field">
                    <label>Start Window</label>
                    <input type="date" name="startDate" defaultValue={editingOffer?.startDate?.slice(0, 10) || ''} />
                  </div>
                  <div className="field">
                    <label>End Window (Expiry Date)</label>
                    <input type="date" name="expiryDate" defaultValue={editingOffer?.expiryDate?.slice(0, 10) || ''} />
                  </div>
                </div>
                <div className="field pt-4">
                  <label>Promo Lifecycle state</label>
                  <select name="status" defaultValue={editingOffer?.status || 'active'}>
                    <option value="active">Active Coupon Voucher</option>
                    <option value="inactive">Inactive / Cleared</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingPurchase(null);
                  setEditingDelivery(null);
                  setEditingOffer(null);
                }}
                className="btn btn-outlined"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-filled font-bold">
                Confirm Commit Action
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Collections displays tables */
        <div className="card">
          <div className="relative max-w-sm mb-4">
            <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search registries..."
              className="pl-9 py-1.5 text-xs rounded-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {activeSegment === 'purchases' && (
            <div className="table-shell">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-500 tracking-wider">
                  <tr>
                    <th className="p-3">PO Number</th>
                    <th className="p-3">Vendor Supplier</th>
                    <th className="p-3 text-center">Items Ledger Count</th>
                    <th className="p-3 text-right">Sum Total Cost</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Date Dispatched</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-xs text-neutral-400">
                        No purchase PO catalog entries registered.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((p) => {
                      const sup = suppliers.find((s) => s.id === p.supplierId);
                      return (
                        <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                          <td className="p-3 font-mono font-bold text-xs">{p.id}</td>
                          <td className="p-3">
                            <div className="font-semibold text-neutral-900 dark:text-neutral-50">{sup?.name || p.supplierId}</div>
                            {sup && <span className="text-[10px] text-neutral-400 uppercase font-semibold">{sup.company}</span>}
                          </td>
                          <td className="p-3 text-center text-xs font-semibold">{p.items.length} Lines</td>
                          <td className="p-3 text-right font-mono font-bold text-red-500">{formatMoney(p.totalCost)}</td>
                          <td className="p-3 text-xs uppercase font-bold text-neutral-450">{p.paymentMethod}</td>
                          <td className="p-3 text-neutral-400 text-xs">{new Date(p.date).toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`badge ${p.status === 'completed' ? 'badge-green' : 'badge-amber'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex gap-1.5">
                              <button onClick={() => handleOpenEditPurch(p)} className="btn btn-tonal btn-sm py-1 px-2.5 flex items-center gap-1" title="Modifier PO">
                                <Edit2 className="w-3.5 h-3.5" /> Modify
                              </button>
                              <button onClick={() => onPrintPurchase(p)} className="p-1 px-1.5 border border-neutral-200/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300" title="Formatted PO paper format">
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Verify deleting PO order ledger?')) onDeletePurchase(p.id);
                                }}
                                className="p-1 px-1.5 border border-red-500/10 hover:border-red-500 text-red-500 rounded-lg"
                                title="Wipe Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSegment === 'deliveries' && (
            <div className="table-shell">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-500 tracking-wider">
                  <tr>
                    <th className="p-3">Courier ID</th>
                    <th className="p-3">linked Invoice</th>
                    <th className="p-3">Fulfillment Depot address</th>
                    <th className="p-3 text-right">Courier Costs</th>
                    <th className="p-3">Logistics status</th>
                    <th className="p-3 text-center">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-xs text-neutral-400">
                        No logistics couriers registered.
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="p-3 font-mono font-bold text-xs">{d.id}</td>
                        <td className="p-3 font-mono font-bold text-xs text-purple-600 truncate max-w-[120px]">{d.invoiceId}</td>
                        <td className="p-3 text-xs text-neutral-500 truncate max-w-[200px]">{d.address}</td>
                        <td className="p-3 text-right font-mono text-neutral-700 dark:text-neutral-300 font-bold">{formatMoney(d.cost)}</td>
                        <td className="p-3">
                          <span className={`badge ${
                            d.status === 'delivered' ? 'badge-green' : d.status === 'shipped' ? 'badge-blue' : 'badge-amber'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => {
                                setEditingDelivery(d);
                                setIsFormOpen(true);
                              }}
                              className="btn btn-tonal btn-sm py-1 px-2.5 flex items-center gap-1"
                              title="Modifier Dispatch state"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Modify
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Consent to clear tracking dispatcher?')) onDeleteDelivery(d.id);
                              }}
                              className="p-1 text-red-500 hover:bg-neutral-200/50 rounded-full"
                              title="Wipe logistics record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSegment === 'offers' && (
            <div className="table-shell">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-500 tracking-wider">
                  <tr>
                    <th className="p-3">Promo Name Campaign</th>
                    <th className="p-3 font-mono">Promo Code</th>
                    <th className="p-3">Deduction Method</th>
                    <th className="p-3 text-right">Value Off Weight</th>
                    <th className="p-3">Linked product bounds</th>
                    <th className="p-3">campaign Window (Start - Expiry)</th>
                    <th className="p-3">Status State</th>
                    <th className="p-3 text-center">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredOffers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-xs text-neutral-400">
                        No promotional vouchers configured.
                      </td>
                    </tr>
                  ) : (
                    filteredOffers.map((o) => {
                      const boundProd = o.productId ? products.find((p) => p.id === o.productId) : null;
                      return (
                        <tr key={o.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                          <td className="p-3 font-semibold text-neutral-900 dark:text-neutral-50">{o.name}</td>
                          <td className="p-3 font-mono font-bold text-xs uppercase tracking-wider text-[#6750A4] dark:text-[#D0BCFF] bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded inline-block mt-1 font-sans">{o.promoCode}</td>
                          <td className="p-3 text-xs text-neutral-450 font-semibold">{o.type === 'percentage' ? 'Percentage % Scale' : 'Flat standard off'}</td>
                          <td className="p-3 text-right font-mono font-bold text-green-600">
                            {o.type === 'percentage' ? `${o.value}%` : formatMoney(o.value)}
                          </td>
                          <td className="p-3 text-xs text-neutral-500 max-w-[150px] truncate">{boundProd ? boundProd.basicInfo.name : '— Basket checks'}</td>
                          <td className="p-3 text-xs text-neutral-400 gap-1 flex items-center mt-3">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                            {o.startDate ? new Date(o.startDate).toLocaleDateString() : '—'} to{' '}
                            {o.expiryDate ? new Date(o.expiryDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-3">
                            <span className={`badge ${o.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingOffer(o);
                                  setIsFormOpen(true);
                                }}
                                className="btn btn-tonal btn-sm py-1 px-2.5 flex items-center gap-1"
                                title="Modifier Coupon"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Modify
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Discard coupon promo permanently?')) onDeleteOffer(o.id);
                                }}
                                className="p-1 text-red-500 hover:bg-neutral-200/50 rounded-full"
                                title="Wipe coupon record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export type { ProcurementProps };
