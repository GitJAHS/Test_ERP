/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceData, Income, Expense } from '../types';
import { Search, Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinanceModuleProps {
  finance: FinanceData;
  currency: string;
  onSaveIncome: (inc: Income) => void;
  onSaveExpense: (exp: Expense) => void;
  onDeleteIncome: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

export function FinanceModule({
  finance,
  currency,
  onSaveIncome,
  onSaveExpense,
  onDeleteIncome,
  onDeleteExpense,
}: FinanceModuleProps) {
  const [activeSegment, setActiveTab] = useState<'income' | 'expenses'>('income');
  const [query, setQuery] = useState('');

  // Creation State
  const [isFormOpen, setIsFormOpen] = useState(false);

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  };

  const currentYear = new Date().getFullYear();

  const totalIncome = finance.income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = finance.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netCushion = totalIncome - totalExpense;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string) || 0;
    const dateInput = formData.get('date') as string;
    const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

    if (activeSegment === 'income') {
      const source = formData.get('source') as string;
      const referenceId = formData.get('referenceId') as string;

      const newIncome: Income = {
        id: `INC-${Date.now().toString(36).toUpperCase()}`,
        source,
        amount,
        date,
        referenceId: referenceId || undefined,
      };
      onSaveIncome(newIncome);
    } else {
      const category = formData.get('category') as string;
      const note = formData.get('note') as string;

      const newExpense: Expense = {
        id: `EXP-${Date.now().toString(36).toUpperCase()}`,
        category,
        amount,
        date,
        note: note || undefined,
      };
      onSaveExpense(newExpense);
    }
    setIsFormOpen(false);
  };

  const filteredIncome = finance.income.filter((i) => {
    return i.source.toLowerCase().includes(query.toLowerCase()) || (i.referenceId && i.referenceId.toLowerCase().includes(query.toLowerCase()));
  });

  const filteredExpenses = finance.expenses.filter((e) => {
    return e.category.toLowerCase().includes(query.toLowerCase()) || (e.note && e.note.toLowerCase().includes(query.toLowerCase()));
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* High-Contrast Dynamic Financial KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-green-50 dark:bg-green-950/20 text-green-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Gross Revenues</span>
            <div className="text-xl font-bold font-mono text-green-600 mt-1">{formatMoney(totalIncome)}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Operating Expenses</span>
            <div className="text-xl font-bold font-mono text-red-500 mt-1">{formatMoney(totalExpense)}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl ${netCushion >= 0 ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600' : 'bg-red-100 text-red-500'}`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Net accounts cushion</span>
            <div className={`text-xl font-bold font-mono mt-1 ${netCushion >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-500'}`}>
              {formatMoney(netCushion)}
            </div>
          </div>
        </div>
      </div>

      {isFormOpen ? (
        /* Addition Form panels */
        <div className="card max-w-md mx-auto w-full">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-6 font-display">
            Bookkeeping entry: {activeSegment === 'income' ? 'Income inflow' : 'Expense Outflow'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeSegment === 'income' ? (
              <>
                <div className="field">
                  <label>Origin Channel Source *</label>
                  <select name="source" required>
                    <option value="invoice">Customer Invoice Settlement</option>
                    <option value="manual">Manual Entry Cash</option>
                    <option value="other">Other Asset Yield</option>
                  </select>
                </div>
                <div className="field">
                  <label>Ledger Reference ID</label>
                  <input name="referenceId" placeholder="TXN-XYZ-99" />
                </div>
              </>
            ) : (
              <>
                <div className="field">
                  <label>Cost Category *</label>
                  <input name="category" required placeholder="Rent / Utilities" />
                </div>
                <div className="field">
                  <label>Addendum Note</label>
                  <input name="note" placeholder="Office internet fee" />
                </div>
              </>
            )}

            <div className="field">
              <label>Remitted Volume Amount *</label>
              <input type="number" step="0.01" name="amount" required placeholder="0.00" />
            </div>

            <div className="field">
              <label>Accounting Date</label>
              <input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-outlined">
                Cancel
              </button>
              <button type="submit" className="btn btn-filled">
                Confirm ledger Post
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ledger Boards */
        <div className="card">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('income');
                  setQuery('');
                }}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
                  activeSegment === 'income' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Inflow Ledger (Income)
              </button>
              <button
                onClick={() => {
                  setActiveTab('expenses');
                  setQuery('');
                }}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
                  activeSegment === 'expenses' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Outflow Ledger (Expenses)
              </button>
            </div>

            <button onClick={() => setIsFormOpen(true)} className="btn btn-filled flex items-center gap-1.5 py-1.5 px-3 text-xs">
              <Plus className="w-4 h-4" /> add Bookkeeping Ledger
            </button>
          </div>

          <div className="relative max-w-sm mb-4">
            <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search statements..."
              className="pl-9 py-1.5 text-xs rounded-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {activeSegment === 'income' ? (
            <div className="table-shell">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-500 tracking-wider">
                  <tr>
                    <th className="p-3">Reference ID</th>
                    <th className="p-3">Origin / Channel</th>
                    <th className="p-3 text-right">Inflow Volume</th>
                    <th className="p-3">Logged stamp</th>
                    <th className="p-3 text-center">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredIncome.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-xs text-neutral-400">
                        Inflow records empty.
                      </td>
                    </tr>
                  ) : (
                    filteredIncome.map((i) => (
                      <tr key={i.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="p-3 font-mono font-bold text-xs">{i.referenceId || i.id}</td>
                        <td className="p-3"><span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 dark:bg-green-950/20 font-semibold rounded-full uppercase">{i.source}</span></td>
                        <td className="p-3 text-right font-mono font-bold text-green-600">{formatMoney(i.amount)}</td>
                        <td className="p-3 text-xs text-neutral-400">{new Date(i.date).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Discard post item?')) onDeleteIncome(i.id);
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
                            title="Discard entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-shell">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-500 tracking-wider">
                  <tr>
                    <th className="p-3">Expense ID</th>
                    <th className="p-3">Accounting Category</th>
                    <th className="p-3">Note Detail</th>
                    <th className="p-3 text-right">Outfill Volume</th>
                    <th className="p-3">Logged stamp</th>
                    <th className="p-3 text-center">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-xs text-neutral-400">
                        Expense outlays empty.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="p-3 font-mono font-semibold text-xs text-neutral-400">{e.id}</td>
                        <td className="p-3 font-bold text-neutral-900 dark:text-neutral-50">{e.category}</td>
                        <td className="p-3 text-xs text-neutral-500 italic max-w-[160px] truncate">{e.note || '—'}</td>
                        <td className="p-3 text-right font-mono font-bold text-red-500">{formatMoney(e.amount)}</td>
                        <td className="p-3 text-xs text-neutral-400">{new Date(e.date).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Discard post item?')) onDeleteExpense(e.id);
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
                            title="Discard entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
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
