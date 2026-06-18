/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer } from '../types';
import { Search, UserPlus, Edit2, Trash2, Filter, Download, ArrowLeft, ArrowRight } from 'lucide-react';

interface CustomerModuleProps {
  customers: Customer[];
  currency: string;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export function CustomerModule({
  customers,
  currency,
  onSaveCustomer,
  onDeleteCustomer,
}: CustomerModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<'id' | 'fullName' | 'totalSpent'>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const gender = formData.get('gender') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;

    const street = formData.get('street') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const country = formData.get('country') as string;
    const postalCode = formData.get('postalCode') as string;

    const customerType = formData.get('customerType') as string;
    const companyName = formData.get('companyName') as string;
    const industry = formData.get('industry') as string;
    const source = formData.get('source') as string;

    const creditLimit = parseFloat(formData.get('creditLimit') as string) || 0;
    const riskLevel = formData.get('riskLevel') as string;
    const status = formData.get('status') as string;

    const customerRecord: Customer = {
      id: editingCustomer?.id || `CUST-${Date.now().toString(36).toUpperCase()}`,
      createdAt: editingCustomer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInfo: {
        fullName,
        phone,
        email,
        gender,
        dateOfBirth,
        address: { street, city, state, country, postalCode },
      },
      businessInfo: {
        customerType,
        companyName,
        industry,
        source,
      },
      financialInfo: {
        creditLimit,
        totalSpent: editingCustomer?.financialInfo?.totalSpent || 0,
        totalPaid: editingCustomer?.financialInfo?.totalPaid || 0,
        totalDue: editingCustomer?.financialInfo?.totalDue || 0,
        loyaltyPoints: editingCustomer?.financialInfo?.loyaltyPoints || 0,
        riskLevel,
      },
      status,
    };

    onSaveCustomer(customerRecord);
    setIsFormOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Customer Type', 'Credit Limit', 'Total Spent', 'Status', 'Risk Level'];
    const rows = filteredCustomers.map((c) => [
      c.id,
      c.personalInfo.fullName,
      c.personalInfo.phone,
      c.personalInfo.email || '—',
      c.businessInfo.customerType,
      c.financialInfo.creditLimit,
      c.financialInfo.totalSpent,
      c.status,
      c.financialInfo.riskLevel,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRM_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering & Sorting processes
  const filteredCustomers = customers
    .filter((c) => {
      const matchSearch =
        c.personalInfo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.personalInfo.phone.includes(searchQuery) ||
        (c.personalInfo.email && c.personalInfo.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = filterType === 'all' || c.businessInfo.customerType === filterType;
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;

      return matchSearch && matchType && matchStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') comparison = a.id.localeCompare(b.id);
      if (sortField === 'fullName') comparison = a.personalInfo.fullName.localeCompare(b.personalInfo.fullName);
      if (sortField === 'totalSpent') comparison = a.financialInfo.totalSpent - b.financialInfo.totalSpent;

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Calculate Paginated items
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {isFormOpen ? (
        /* Dynamic Customer Editing Card Form */
        <div className="card max-w-4xl mx-auto">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 font-display">
              {editingCustomer ? `Modify CRM Record: ${editingCustomer.personalInfo.fullName}` : 'New Customer Onboarding'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="btn btn-outlined btn-sm">
              Back to Directory
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Personal Identification</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label>Full Corporate Name *</label>
                  <input name="fullName" required defaultValue={editingCustomer?.personalInfo?.fullName || ''} placeholder="John Doe" />
                </div>
                <div className="field">
                  <label>Phone Number *</label>
                  <input name="phone" required defaultValue={editingCustomer?.personalInfo?.phone || ''} placeholder="+1-555-0192" />
                </div>
                <div className="field">
                  <label>Corporate Email</label>
                  <input name="email" type="email" defaultValue={editingCustomer?.personalInfo?.email || ''} placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="field">
                    <label>Gender Prefix</label>
                    <select name="gender" defaultValue={editingCustomer?.personalInfo?.gender || 'male'}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Date of Birth</label>
                    <input name="dateOfBirth" type="date" defaultValue={editingCustomer?.personalInfo?.dateOfBirth || ''} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Billing & Delivery Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="field md:col-span-2">
                  <label>Street Line</label>
                  <input name="street" defaultValue={editingCustomer?.personalInfo?.address?.street || ''} placeholder="456 Oak View St" />
                </div>
                <div className="field">
                  <label>Postal Code</label>
                  <input name="postalCode" defaultValue={editingCustomer?.personalInfo?.address?.postalCode || ''} placeholder="62701" />
                </div>
                <div className="field">
                  <label>City</label>
                  <input name="city" defaultValue={editingCustomer?.personalInfo?.address?.city || ''} placeholder="Springfield" />
                </div>
                <div className="field">
                  <label>State / Region</label>
                  <input name="state" defaultValue={editingCustomer?.personalInfo?.address?.state || ''} placeholder="IL" />
                </div>
                <div className="field">
                  <label>Country Coordinate</label>
                  <input name="country" defaultValue={editingCustomer?.personalInfo?.address?.country || 'US'} placeholder="US" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Account Profile & Financial Parameters</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="field">
                  <label>Customer Tier</label>
                  <select name="customerType" defaultValue={editingCustomer?.businessInfo?.customerType || 'retail'}>
                    <option value="retail">Retail Client</option>
                    <option value="wholesale">Wholesale Corporate</option>
                    <option value="vip">VIP Premium</option>
                  </select>
                </div>
                <div className="field">
                  <label>Associated Organization</label>
                  <input name="companyName" defaultValue={editingCustomer?.businessInfo?.companyName || ''} placeholder="Acme LLC" />
                </div>
                <div className="field">
                  <label>Channel Origin</label>
                  <select name="source" defaultValue={editingCustomer?.businessInfo?.source || 'manual'}>
                    <option value="manual">Manual Entry</option>
                    <option value="referral">Corporate Referral</option>
                    <option value="online">Online Direct</option>
                    <option value="marketing">Digital Campaign</option>
                  </select>
                </div>
                <div className="field">
                  <label>Corporate Credit Limit</label>
                  <input name="creditLimit" type="number" step="0.01" defaultValue={editingCustomer?.financialInfo?.creditLimit || 0} />
                </div>
                <div className="field">
                  <label>Default Ledger Risk</label>
                  <select name="riskLevel" defaultValue={editingCustomer?.financialInfo?.riskLevel || 'low'}>
                    <option value="low">Low Risk Profile</option>
                    <option value="medium">Medium Risk Profile</option>
                    <option value="high">High Risk Profile</option>
                  </select>
                </div>
                <div className="field">
                  <label>Lifecycle Status</label>
                  <select name="status" defaultValue={editingCustomer?.status || 'active'}>
                    <option value="active">Active System Client</option>
                    <option value="inactive">Suspended / Inactive</option>
                    <option value="blocked">Collections / Blocked</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-neutral-150 dark:border-neutral-800 pt-4">
              <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-outlined">
                Cancel
              </button>
              <button type="submit" className="btn btn-filled">
                Confirm Save Account
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Customer Directory Dashboard */
        <div className="card">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
            <div>
              <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-50 font-display">Client Directory (CRM)</h3>
              <p className="text-xs text-neutral-400">Manage client relationships, spending velocity, credit limits, and loyalty factors.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportCSV} className="btn btn-outlined flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button onClick={handleOpenAdd} className="btn btn-filled flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold">
                <UserPlus className="w-4 h-4" /> onboard Customer
              </button>
            </div>
          </div>

          {/* Filtration Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-neutral-100/50 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-200/40 dark:border-neutral-800/40 mb-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search phone or name..."
                className="pl-9 py-1.5 text-xs rounded-lg"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div>
              <select
                className="py-1.5 text-xs rounded-lg"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Tiers (Type)</option>
                <option value="retail">Retail Client</option>
                <option value="wholesale">Wholesale Corporate</option>
                <option value="vip">VIP Premium</option>
              </select>
            </div>
            <div>
              <select
                className="py-1.5 text-xs rounded-lg"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Lifecycles</option>
                <option value="active">Active System Client</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <select
                className="py-1.5 text-xs rounded-lg font-semibold"
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortField(field as any);
                  setSortOrder(order as any);
                }}
              >
                <option value="fullName-asc">Sort Name (A-Z)</option>
                <option value="fullName-desc">Sort Name (Z-A)</option>
                <option value="totalSpent-desc">Sort Spend (High to Low)</option>
                <option value="totalSpent-asc">Sort Spend (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Central Directory Table List */}
          <div className="table-shell">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-500 tracking-wider">
                <tr>
                  <th className="p-3">Client ID</th>
                  <th className="p-3">Corporate Name</th>
                  <th className="p-3">Phone Line</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3 text-right">Spend Account</th>
                  <th className="p-3 text-right">Credit Line</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Lifecycle</th>
                  <th className="p-3 text-center">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-xs text-neutral-400">
                      No matching clients index logged. Use "onboard Customer" to onboard.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <td className="p-3 font-mono font-bold text-xs">{c.id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-50">
                          {c.personalInfo.fullName}
                        </div>
                        {c.businessInfo.companyName && (
                          <span className="text-[10px] uppercase font-semibold text-neutral-400">
                            {c.businessInfo.companyName}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-xs font-medium">{c.personalInfo.phone}</td>
                      <td className="p-3 text-xs text-neutral-400 truncate max-w-[140px]">{c.personalInfo.email || '—'}</td>
                      <td className="p-3 text-xs font-semibold uppercase tracking-wider">{c.businessInfo.customerType}</td>
                      <td className="p-3 text-right font-mono font-bold text-green-600">{formatMoney(c.financialInfo.totalSpent)}</td>
                      <td className="p-3 text-right font-mono text-neutral-500">{formatMoney(c.financialInfo.creditLimit)}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          c.financialInfo.riskLevel === 'low'
                            ? 'bg-green-50 text-green-700 dark:bg-green-950/20'
                            : c.financialInfo.riskLevel === 'high'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/20'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                        }`}>
                          {c.financialInfo.riskLevel}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`badge ${
                          c.status === 'active' ? 'badge-green' : c.status === 'blocked' ? 'badge-red' : 'badge-amber'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex gap-1.5">
                          <button onClick={() => handleOpenEdit(c)} className="btn btn-tonal btn-sm py-1 px-2.5 flex items-center gap-1" title="Edit Properties">
                            <Edit2 className="w-3.5 h-3.5" /> Modify
                          </button>
                          <button onClick={() => { if (confirm('Are you holding consent to remove this CRM profile permanently?')) onDeleteCustomer(c.id); }} className="btn btn-outlined btn-sm py-1 px-2.5 border-red-500/30 hover:border-red-500 text-red-500" title="Delete Profile">
                            <Trash2 className="w-3.5 h-3.5" /> Wipe
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination control footer */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-xs text-neutral-400">
                Displaying {Math.min(filteredCustomers.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredCustomers.length, currentPage * itemsPerPage)} of {filteredCustomers.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="btn btn-outlined btn-sm flex items-center py-1 px-2.5 disabled:opacity-40"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-xs font-semibold px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300">
                  {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="btn btn-outlined btn-sm flex items-center py-1 px-2.5 disabled:opacity-40"
                >
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
