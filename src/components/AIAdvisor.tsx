/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Customer, Product, Invoice, Supplier, Purchase, ERPData } from '../types';
import { Bot, Phone, Mail, ShoppingCart, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AIAdvisorProps {
  data: ERPData;
  currency: string;
  onNavigate: (panel: string) => void;
  triggerQuickPurchase: (product: Product) => void;
}

export function AIAdvisor({ data, currency, onNavigate, triggerQuickPurchase }: AIAdvisorProps) {
  // Proactive Scan Checks
  const scanLowStock = (): Array<{ product: Product; reorderQty: number; supplier: Supplier | null }> => {
    return data.products
      .filter((p) => p.status === 'active' && (p.stock?.available ?? 0) < (p.stock?.reorderLevel ?? 10))
      .map((product) => {
        const supplier = product.supplierId
          ? data.suppliers.find((s) => s.id === product.supplierId) || null
          : null;
        const reorderQty = (product.stock?.reorderLevel ?? 10) * 2 - (product.stock?.available ?? 0);
        return { product, reorderQty: Math.max(1, reorderQty), supplier };
      });
  };

  const scanOverdueInvoices = (): Array<{ invoice: Invoice; customerRecord: Customer | null; daysOverdue: number }> => {
    const now = new Date();
    return data.invoices
      .filter((inv) => {
        const isUnpaid = inv.payment?.status === 'unpaid' || inv.payment?.status === 'partial';
        if (!isUnpaid || inv.status === 'draft') return false;
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(new Date(inv.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
        return dueDate < now;
      })
      .map((invoice) => {
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date(new Date(invoice.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
        const diffTime = Math.abs(now.getTime() - dueDate.getTime());
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const customerRecord = data.customers.find((c) => c.id === invoice.customer?.customerId) || null;
        return { invoice, customerRecord, daysOverdue };
      });
  };

  const lowStockList = scanLowStock();
  const overdueList = scanOverdueInvoices();
  const totalFindings = lowStockList.length + overdueList.length;

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Advisor Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 dark:from-purple-950/40 dark:to-indigo-950/40 border border-neutral-200/50 dark:border-neutral-800/50 shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-purple-600 text-white shadow-md">
            <Bot className="w-8 h-8 animate-bounce-slow" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-neutral-900 dark:text-neutral-50">smart AI Corporate Advisor</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
              Your system assistant periodically monitors cashflow, inventory bottlenecks, and corporate accounts receivables.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <span className={`text-xs px-3 py-1 font-bold rounded-full ${
                totalFindings > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
              }`}>
                {totalFindings === 0 ? '✓ Database fully optimized' : `⚠ ${totalFindings} operational actions recommended`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Advisory Box */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-neutral-900 dark:text-neutral-50 font-display">Inventory Deficits ({lowStockList.length})</h3>
            </div>
            {lowStockList.length > 0 && (
              <span className="text-xs font-semibold text-neutral-400">Reorder Required</span>
            )}
          </div>

          {lowStockList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-2 opacity-80" />
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Stock Integrity Normal</p>
              <p className="text-xs text-neutral-400 mt-1">All active SKUs satisfy baseline buffer margins.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[360px] pr-1.5">
              {lowStockList.map(({ product, reorderQty, supplier }) => (
                <div
                  key={product.id}
                  className="p-4 rounded-xl bg-neutral-100/40 dark:bg-neutral-800/20 border border-neutral-200/40 dark:border-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 transition flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{product.basicInfo.name}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5 font-mono">SKU ID: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-red-600 font-bold text-sm block">{product.stock.available} Available</span>
                      <span className="text-xs text-neutral-400">Level Limit: {product.stock.reorderLevel}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs p-2 bg-white dark:bg-neutral-950 border border-neutral-200/30 dark:border-neutral-800/30 rounded-lg">
                    <span className="text-neutral-500 font-medium">Recommending Purchase Qty:</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-50 font-mono">{reorderQty} units</span>
                  </div>

                  {supplier ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <button
                        onClick={() => triggerQuickPurchase(product)}
                        className="btn btn-filled btn-sm py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Order PO
                      </button>
                      <a
                        href={`tel:${supplier.phone}`}
                        className="btn btn-tonal btn-sm py-1.5 px-3 flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Supplier
                      </a>
                      {supplier.email && (
                        <a
                          href={`mailto:${supplier.email}?subject=Restock%20Order%3A%20${encodeURIComponent(product.basicInfo.name)}&body=Dear%20${encodeURIComponent(supplier.name)}%2C%0A%0AWe%20would%20like%20to%20place%20an%20urgent%20restock%20order%20for%3A%20${encodeURIComponent(product.basicInfo.name)}%20(${reorderQty}%20units).%20Please%20provide%20estimated%20fulfillment.%0A%0AThanks.`}
                          className="btn btn-outlined btn-sm py-1.5 px-3 flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-neutral-400">No linked supplier found for automatic PO routing.</p>
                      <button
                        onClick={() => onNavigate('products')}
                        className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
                      >
                        Link Supplier <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Receivables & Overdue Advisory Box */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-neutral-900 dark:text-neutral-50 font-display">Overdue Receivables ({overdueList.length})</h3>
            </div>
            {overdueList.length > 0 && (
              <span className="text-xs font-semibold text-neutral-400">Collection Task</span>
            )}
          </div>

          {overdueList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-2 opacity-80" />
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Receivables Healthy</p>
              <p className="text-xs text-neutral-400 mt-1">No outstanding balances have exceeded agreed net-due bounds.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[360px] pr-1.5">
              {overdueList.map(({ invoice, customerRecord, daysOverdue }) => (
                <div
                  key={invoice.id}
                  className="p-4 rounded-xl bg-neutral-100/40 dark:bg-neutral-800/20 border border-neutral-200/40 dark:border-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 transition flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{invoice.customer.name}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5 font-mono">Invoice Number: {invoice.id}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-600 font-bold text-sm block">{formatMoney(invoice.payment?.dueAmount || 0)} Due</span>
                      <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {daysOverdue} Days Passed
                      </span>
                    </div>
                  </div>

                  {customerRecord ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <a
                        href={`tel:${customerRecord.personalInfo.phone}`}
                        className="btn btn-filled btn-sm py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Customer
                      </a>
                      {customerRecord.personalInfo.email && (
                        <a
                          href={`mailto:${customerRecord.personalInfo.email}?subject=Outstanding%20Balance%20Reminder%20%23${invoice.id}&body=Dear%20${encodeURIComponent(invoice.customer.name)}%2C%0A%0AThis%20is%20a%20reminder%20that%20invoice%20${invoice.id}%20totaling%20${formatMoney(invoice.calculations.grandTotal)}%20remains%20unpaid%20with%20an%20outstanding%20due%20of%20${formatMoney(invoice.payment.dueAmount)}.%20This%20payment%20is%20now%20overdue%20by%20${daysOverdue}%20days.%0A%0APlease%20remit%20at%20your%20earliest%20convenience.%0A%0AWith%20regards%20from%20Finance.%0A${encodeURIComponent(data.config.company.name)}`}
                          className="btn btn-tonal btn-sm py-1.5 px-3 flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200"
                        >
                          <Mail className="w-3.5 h-3.5" /> Mail Reminder
                        </a>
                      )}
                      <button
                        onClick={() => onNavigate('invoices')}
                        className="btn btn-outlined btn-sm py-1.5 px-3 flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200"
                      >
                        Inspect Ledger
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-neutral-400">Temporary customer. No permanent record link.</p>
                      <button
                        onClick={() => onNavigate('invoices')}
                        className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
                      >
                        Invoices Ledger <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
