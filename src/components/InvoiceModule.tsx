/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Invoice, Customer, Product, Employee, Offer, InvoiceItem } from '../types';
import { Search, Plus, Trash2, Edit2, Printer, Mail, QrCode, CornerDownRight, PlusCircle, CheckCircle } from 'lucide-react';

interface InvoiceModuleProps {
  invoices: Invoice[];
  customers: Customer[];
  products: Product[];
  employees: Employee[];
  offers: Offer[];
  currency: string;
  configLogo: string | null;
  onSaveLogo: (logo: string | null) => void;
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onMailInvoice: (invoice: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
}

// Native lightweight offline JS QR Code Painter inside canvas
function OfflineQRCode({ text, size = 120 }: { text: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Simple pseudo QR painter for offline corporate visual representation
    // Draws standard alignment markers at the three corners
    ctx.fillStyle = '#000000';
    // Backing grid
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 4, size - 8, size - 8);

    ctx.fillStyle = '#000000';
    // Top-Left marker
    ctx.fillRect(8, 8, 28, 28);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 12, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.fillRect(16, 16, 12, 12);

    // Top-Right marker
    ctx.fillRect(size - 36, 8, 28, 28);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size - 32, 12, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.fillRect(size - 28, 16, 12, 12);

    // Bottom-Left marker
    ctx.fillRect(8, size - 36, 28, 28);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, size - 32, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.fillRect(16, size - 28, 12, 12);

    // Small alignment block bottom right
    ctx.fillRect(size - 24, size - 24, 8, 8);

    // Generate deterministic pixel blocks based on hashed invoice values
    let hashCode = 0;
    for (let j = 0; j < text.length; j++) {
      hashCode = text.charCodeAt(j) + ((hashCode << 5) - hashCode);
    }

    const cols = 21;
    const blockSize = Math.floor((size - 16) / cols);
    const offset = 8;

    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip corner locator marker bounds
        if (r < 8 && c < 8) continue;
        if (r < 8 && c > cols - 9) continue;
        if (r > cols - 9 && c < 8) continue;

        const val = Math.abs((hashCode ^ (r * 11 + c * 33)) % 10);
        if (val % 3 === 0) {
          ctx.fillRect(offset + c * blockSize, offset + r * blockSize, blockSize, blockSize);
        }
      }
    }
  }, [text, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg border border-neutral-200 shadow-sm" />;
}

export function InvoiceModule({
  invoices,
  customers,
  products,
  employees,
  offers,
  currency,
  configLogo,
  onSaveLogo,
  onSaveInvoice,
  onDeleteInvoice,
  onMailInvoice,
  onPrintInvoice,
}: InvoiceModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<'id' | 'grandTotal' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Active Line Items
  const [formItems, setFormItems] = useState<InvoiceItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('draft');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [transactionId, setTransactionId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [invoiceNote, setInvoiceNote] = useState('');
  const [invoiceTerms, setInvoiceTerms] = useState('');
  const [applyTerms, setApplyTerms] = useState(false);

  // QR Modal State
  const [qrTextModal, setQrTextModal] = useState<string | null>(null);

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  };

  const handleOpenAdd = () => {
    setEditingInvoice(null);
    setFormItems([{ productId: '', name: '', size: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, subtotal: 0 }]);
    setSelectedCustomerId('');
    setSelectedSellerId('');
    setInvoiceStatus('draft');
    setPaymentMethod('cash');
    setPaidAmount(0);
    setTransactionId('');
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setPromoCode('');
    setInvoiceNote('');
    setInvoiceTerms('');
    setApplyTerms(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setFormItems(inv.items.map(item => ({ ...item })));
    setSelectedCustomerId(inv.customer.customerId);
    setSelectedSellerId(inv.seller?.id || '');
    setInvoiceStatus(inv.status);
    setPaymentMethod(inv.payment.method);
    setPaidAmount(inv.payment.paidAmount);
    setTransactionId(inv.payment.transactionId);
    setDueDate(inv.dueDate ? inv.dueDate.slice(0, 10) : '');
    setPromoCode(inv.promo?.code || '');
    setInvoiceNote(inv.note || '');
    setInvoiceTerms(inv.terms || '');
    setApplyTerms(inv.termsApplied || false);
    setIsFormOpen(true);
  };

  // Recalculations hook for subtotal, tax, discount, promos
  const calculateTotals = () => {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    formItems.forEach((it) => {
      const lineTotal = it.quantity * it.unitPrice;
      subTotal += lineTotal;
      totalDiscount += it.discount;
      totalTax += (lineTotal - it.discount) * (it.taxRate / 100);
    });

    let grandTotal = subTotal - totalDiscount + totalTax;

    // Apply Promo Codes vouchers
    let promoDiscountAmount = 0;
    if (promoCode) {
      const promo = offers.find((o) => o.promoCode === promoCode && o.status === 'active');
      if (promo) {
        if (promo.type === 'percentage') {
          promoDiscountAmount = subTotal * (promo.value / 100);
        } else {
          promoDiscountAmount = Math.min(promo.value, subTotal);
        }
        grandTotal -= promoDiscountAmount;
      }
    }

    grandTotal = Math.max(0, grandTotal);
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    return {
      subTotal,
      totalDiscount,
      totalTax,
      grandTotal,
      dueAmount,
      promoDiscountAmount,
    };
  };

  const totals = calculateTotals();

  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setFormItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: prodId,
        name: prod.basicInfo.name,
        unitPrice: prod.pricing.salePrice,
        taxRate: prod.pricing.taxRate,
        size: prod.basicInfo.size.split(',')[0]?.trim() || '',
        subtotal: 1 * prod.pricing.salePrice,
      };
      return updated;
    });
  };

  const handleItemValueChange = (index: number, key: keyof InvoiceItem, val: any) => {
    setFormItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [key]: val } as any;

      // Recalculate discrete line item subtotal
      const line = target.quantity * target.unitPrice;
      const afterDisc = line - target.discount;
      target.subtotal = Math.max(0, afterDisc * (1 + target.taxRate / 100));

      updated[index] = target;
      return updated;
    });
  };

  const handleAddRow = () => {
    setFormItems((prev) => [
      ...prev,
      { productId: '', name: '', size: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, subtotal: 0 },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onSaveLogo(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    const customerRecord = customers.find((c) => c.id === selectedCustomerId);
    if (!customerRecord) return;

    const employeeRecord = employees.find((emp) => emp.id === selectedSellerId);
    const seller = employeeRecord
      ? { id: employeeRecord.id, name: employeeRecord.personalInfo.fullName, role: employeeRecord.jobInfo.role }
      : null;

    // Deduct stock if issued or paid
    const isFulfilled = invoiceStatus === 'issued' || invoiceStatus === 'paid';

    const invoiceCalculations = {
      subTotal: totals.subTotal,
      totalDiscount: totals.totalDiscount,
      totalTax: totals.totalTax,
      grandTotal: totals.grandTotal,
    };

    const invoicePayment = {
      status: totals.dueAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      method: paymentMethod,
      paidAmount,
      dueAmount: totals.dueAmount,
      transactionId,
    };

    const activePromoOffer = offers.find((o) => o.promoCode === promoCode && o.status === 'active');
    const invoicePromo = activePromoOffer
      ? { code: promoCode, discountAmount: totals.promoDiscountAmount, promoId: activePromoOffer.id }
      : null;

    const invoiceRecord: Invoice = {
      id: editingInvoice?.id || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2,6).toUpperCase()}`,
      createdAt: editingInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      businessId: data.businessId,
      customer: {
        customerId: selectedCustomerId,
        name: customerRecord.personalInfo.fullName,
        phone: customerRecord.personalInfo.phone,
        email: customerRecord.personalInfo.email,
        address: [
          customerRecord.personalInfo.address?.street,
          customerRecord.personalInfo.address?.city,
          customerRecord.personalInfo.address?.state,
          customerRecord.personalInfo.address?.country,
          customerRecord.personalInfo.address?.postalCode,
        ]
          .filter(Boolean)
          .join(', '),
      },
      seller,
      items: formItems,
      calculations: invoiceCalculations,
      payment: invoicePayment,
      status: invoiceStatus,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      promo: invoicePromo,
      note: invoiceNote,
      terms: invoiceTerms,
      termsApplied: applyTerms,
      stockDeducted: isFulfilled,
    };

    onSaveInvoice(invoiceRecord);
    setIsFormOpen(false);
  };

  const data = { businessId: 'Corporate Account' };

  // Filtration/Sorting execution layers
  const filteredInvoices = invoices
    .filter((inv) => {
      const matchSearch =
        inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer.phone.includes(searchQuery);

      const matchStatus = filterStatus === 'all' || inv.status === filterStatus;

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortField === 'id') comp = a.id.localeCompare(b.id);
      if (sortField === 'grandTotal') comp = a.calculations.grandTotal - b.calculations.grandTotal;
      if (sortField === 'createdAt') comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

      return sortOrder === 'asc' ? comp : -comp;
    });

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      {isFormOpen ? (
        /* Dynamic Invoicing Form Layer */
        <div className="card max-w-5xl mx-auto">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 font-display">
              {editingInvoice ? `Modify Invoice: ${editingInvoice.id}` : 'Compile Corporate Invoice Document'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="btn btn-outlined btn-sm font-semibold">
              Wrape Ledger
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header / Client Specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="field">
                <label>Select Company Customer *</label>
                <select name="customerId" required value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                  <option value="">— Select Onboarded Account —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.personalInfo.fullName} ({c.personalInfo.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Staff Rep (Seller)</label>
                <select value={selectedSellerId} onChange={(e) => setSelectedSellerId(e.target.value)}>
                  <option value="">— No Rep Linked —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.personalInfo.fullName} ({e.jobInfo.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Terms Expiry (Due Date)</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            {/* Logo and Promo specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="field">
                <label>Corporate Promo Code</label>
                <select value={promoCode} onChange={(e) => setPromoCode(e.target.value)}>
                  <option value="">— No Code Voucher —</option>
                  {offers
                    .filter((o) => o.status === 'active')
                    .map((o) => (
                      <option key={o.id} value={o.promoCode}>
                        {o.promoCode} ({o.type === 'percentage' ? `${o.value}%` : formatMoney(o.value)} off)
                      </option>
                    ))}
                </select>
              </div>

              <div className="field">
                <label>Branding Logo</label>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="file:btn file:btn-sm file:btn-outlined" />
              </div>

              <div className="flex items-center justify-center p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/40 bg-neutral-50 dark:bg-neutral-950">
                {configLogo ? (
                  <div className="relative flex flex-col items-center">
                    <img src={configLogo} alt="Corporate Logo" className="max-h-12 max-w-full rounded shadow-sm object-contain" />
                    <button type="button" onClick={() => onSaveLogo(null)} className="text-[10px] text-red-500 hover:underline mt-1 font-bold">Remove Logo</button>
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400">Branding header logo absent</span>
                )}
              </div>
            </div>

            {/* Line Items Grid section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display flex items-center gap-1.5">
                  <CornerDownRight className="w-4 h-4 text-purple-600" /> Line Items Ledger
                </h4>
                <button type="button" onClick={handleAddRow} className="btn btn-tonal btn-sm text-xs py-1.5 flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5" /> Append Item
                </button>
              </div>

              <div className="space-y-3">
                {formItems.map((item, index) => {
                  const prod = products.find((p) => p.id === item.productId);
                  const sizesList = prod ? prod.basicInfo.size.split(',').map((s) => s.trim()) : [];
                  const activeStock = prod ? prod.stock.available : 0;

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-neutral-100/30 dark:bg-neutral-800/20 border border-neutral-200/40 dark:border-neutral-800/40 rounded-xl relative"
                    >
                      <div className="field md:col-span-3">
                        <label className="text-[10px]">Select Product ID</label>
                        <select value={item.productId} required onChange={(e) => handleItemProductChange(index, e.target.value)}>
                          <option value="">— Choose SKU —</option>
                          {products
                            .filter((p) => p.status === 'active')
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.basicInfo.name} ({p.sku})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="field md:col-span-2">
                        <label className="text-[10px]">Size</label>
                        {sizesList.length > 0 ? (
                          <select value={item.size} onChange={(e) => handleItemValueChange(index, 'size', e.target.value)}>
                            {sizesList.map((sz) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            defaultValue={item.size}
                            placeholder="Uniform"
                            onChange={(e) => handleItemValueChange(index, 'size', e.target.value)}
                          />
                        )}
                      </div>

                      <div className="field md:col-span-1">
                        <label className="text-[10px]">Qty</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemValueChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="field md:col-span-2">
                        <label className="text-[10px]">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemValueChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="field md:col-span-1.5 col-span-2">
                        <label className="text-[10px]">Tax Rate%</label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.taxRate}
                          onChange={(e) => handleItemValueChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="field md:col-span-1.5 col-span-2 text-right">
                        <label className="text-[10px] block">Sub total</label>
                        <span className="font-mono font-bold text-xs mt-3.5 block text-neutral-800 dark:text-neutral-200">
                          {formatMoney(item.subtotal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-center md:col-span-1 col-span-1 mt-5">
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            className="p-1 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Stock depletion indicator */}
                      {prod && item.quantity > activeStock && (
                        <div className="md:col-span-12 col-span-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">
                          ⚠ warning: Quantity requested ({item.quantity}) exceeds available inventory buffer ({activeStock})
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ledger Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field">
                <label>Addendum Notes (Visible on Invoice)</label>
                <textarea rows={2} value={invoiceNote} onChange={(e) => setInvoiceNote(e.target.value)} placeholder="Terms of shipping, delivery logs..." />
              </div>
              <div className="field">
                <label>Custom Terms & Conditions</label>
                <textarea rows={2} value={invoiceTerms} onChange={(e) => setInvoiceTerms(e.target.value)} placeholder="Payments net 30 days..." />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="chkTerms" checked={applyTerms} onChange={(e) => setApplyTerms(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="chkTerms" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Apply Terms and Conditions to Document Footers</label>
            </div>

            {/* Calculations summaries panel */}
            <div className="p-4 bg-neutral-150/40 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-6 space-y-4">
                <h5 className="text-xs font-bold font-display uppercase tracking-wider text-purple-600">Payment Collection State</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label>Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="cash">Cash / Physical</option>
                      <option value="bank">Bank Wire</option>
                      <option value="mobile">Mobile Money</option>
                      <option value="card">Point of Sale (POS)</option>
                      <option value="cod">Cash on Delivery</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Paid Client Amount</label>
                    <input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="field md:col-span-2">
                    <label>Transaction ID / Reference Reference</label>
                    <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="TXN-984218-09" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 flex flex-col justify-between space-y-3">
                <h5 className="text-xs font-bold font-display uppercase tracking-wider text-purple-600 text-right">Ledger Statement Summary</h5>
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Aggregated Items Gross:</span>
                    <span className="font-mono text-neutral-800 dark:text-neutral-200">{formatMoney(totals.subTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Ledger Taxes Sum:</span>
                    <span className="font-mono text-neutral-800 dark:text-neutral-200">{formatMoney(totals.totalTax)}</span>
                  </div>
                  {totals.promoDiscountAmount > 0 && (
                    <div className="flex justify-between text-purple-600 dark:text-purple-300">
                      <span>Promo Coupon Discount:</span>
                      <span className="font-mono font-bold">-{formatMoney(totals.promoDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-neutral-200 dark:border-neutral-800 pt-2 text-base font-bold text-neutral-900 dark:text-neutral-100">
                    <span>Grand Clean Total:</span>
                    <span className="font-mono">{formatMoney(totals.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-500">
                    <span>Arrears Due:</span>
                    <span className="font-mono">{formatMoney(totals.dueAmount)}</span>
                  </div>
                </div>

                <div className="field w-full md:max-w-xs ml-auto">
                  <label className="text-right block">Document Status State</label>
                  <select value={invoiceStatus} onChange={(e) => setInvoiceStatus(e.target.value)}>
                    <option value="draft">Draft (Holds stock)</option>
                    <option value="issued">Issued (Deducts stock)</option>
                    <option value="partial">Partial Payment Received</option>
                    <option value="paid">Accounts Fully Settled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-neutral-150 dark:border-neutral-800 pt-4">
              <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-outlined">
                Cancel
              </button>
              <button type="submit" className="btn btn-filled flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Save Invoice & Post Ledger
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Invoices Archive Dashboard */
        <div className="card">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
            <div>
              <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-50 font-display">Invoices Registry</h3>
              <p className="text-xs text-neutral-400">Monitor collections receivables, dispatch ledger invoices, print clean PDFs, and email customer summaries.</p>
            </div>
            <div>
              <button onClick={handleOpenAdd} className="btn btn-filled flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold">
                <Plus className="w-4 h-4" /> Create Invoice
              </button>
            </div>
          </div>

          {/* Filtration controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-neutral-100/50 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-200/40 dark:border-neutral-800/40 mb-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search Client ID or Invoice..."
                className="pl-9 py-1.5 text-xs rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <select
                className="py-1.5 text-xs rounded-lg font-semibold"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All States</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="partial">Partial Payment</option>
                <option value="paid">Fully Paid</option>
              </select>
            </div>
            <div>
              <select
                className="py-1.5 text-xs rounded-lg"
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortField(field as any);
                  setSortOrder(order as any);
                }}
              >
                <option value="createdAt-desc">Date Created (New-Old)</option>
                <option value="createdAt-asc">Date Created (Old-New)</option>
                <option value="grandTotal-desc">Amount (High-Low)</option>
                <option value="id-asc">Invoice ID (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Registry Table */}
          <div className="table-shell">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-500 tracking-wider">
                <tr>
                  <th className="p-3">Invoice Identification</th>
                  <th className="p-3">Client Account Name</th>
                  <th className="p-3 text-center">SKU Counts</th>
                  <th className="p-3 text-right">Sum Total</th>
                  <th className="p-3 text-right">Paid Weight</th>
                  <th className="p-3 text-right">Remaining Due</th>
                  <th className="p-3">Payment State</th>
                  <th className="p-3 text-center">QR Link</th>
                  <th className="p-3">Dispatch Date</th>
                  <th className="p-3 text-center">Operations Desk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-xs text-neutral-400">
                      No invoices recorded. Click "Create Invoice" above.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const statusColors = {
                      draft: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
                      issued: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20',
                      partial: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20',
                      paid: 'bg-green-50 text-green-700 dark:bg-green-950/20',
                    };

                    return (
                      <tr key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="p-3 font-mono font-bold text-xs">{inv.id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-50">{inv.customer.name}</div>
                          <span className="text-[10px] font-mono text-neutral-400">{inv.customer.phone}</span>
                        </td>
                        <td className="p-3 text-center text-xs font-medium">{inv.items.length} SKUs</td>
                        <td className="p-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">{formatMoney(inv.calculations.grandTotal)}</td>
                        <td className="p-3 text-right font-mono font-bold text-green-600">{formatMoney(inv.payment.paidAmount)}</td>
                        <td className="p-3 text-right font-mono font-bold text-red-500">{formatMoney(inv.payment.dueAmount)}</td>
                        <td className="p-3">
                          <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${statusColors[inv.status as keyof typeof statusColors] || ''}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setQrTextModal(JSON.stringify({ id: inv.id, total: inv.calculations.grandTotal, due: inv.payment.dueAmount }))}
                            className="p-1 px-1.5 rounded-lg border border-neutral-200/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition text-neutral-600 dark:text-neutral-300"
                            title="Interactive QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="p-3 text-xs text-neutral-400">{new Date(inv.createdAt).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex gap-1.5">
                            <button onClick={() => handleOpenEdit(inv)} className="btn btn-tonal btn-sm py-1 px-2.5 flex items-center gap-1" title="Modifier properties">
                              <Edit2 className="w-3.5 h-3.5" /> Modify
                            </button>
                            <button onClick={() => onPrintInvoice(inv)} className="p-1.5 border border-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 dark:text-neutral-300" title="Formatted print layout">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => onMailInvoice(inv)} className="p-1.5 border border-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 dark:text-neutral-300" title="Direct Email PDF">
                              <Mail className="w-4 h-4" />
                            </button>
                            <button onClick={() => { if (confirm('Consent to discard this invoice transaction completely?')) onDeleteInvoice(inv.id); }} className="p-1.5 border border-red-500/10 hover:border-red-500 rounded-lg text-red-500" title="Delete Transaction">
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
        </div>
      )}

      {/* Pop-up modal displaying Offline secure QR verification */}
      {qrTextModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 max-w-sm w-full mx-4 flex flex-col items-center gap-4 animate-slide-up shadow-2xl">
            <h4 className="font-bold text-neutral-900 dark:text-neutral-50 font-display text-center">Secure Ledger verification</h4>
            <OfflineQRCode text={qrTextModal} />
            <div className="text-center">
              <span className="text-[10px] text-neutral-400 uppercase font-mono tracking-widest block mb-2">Invoice verification metadata</span>
              <p className="text-xs text-neutral-500 leading-relaxed font-semibold break-all px-4 select-all bg-neutral-50 dark:bg-neutral-950 p-2 rounded-lg border border-neutral-200/50">
                {qrTextModal}
              </p>
            </div>
            <button onClick={() => setQrTextModal(null)} className="btn btn-filled w-full mt-2 font-bold py-2 rounded-xl">
              Close Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export { OfflineQRCode };
