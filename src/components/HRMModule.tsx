/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Employee, Supplier, Sale } from '../types';
import { Search, Plus, Edit2, Trash2, Phone, Mail, Award, CheckCircle, ShieldAlert, Star } from 'lucide-react';

interface HRMProps {
  employees: Employee[];
  suppliers: Supplier[];
  sales: Sale[];
  currency: string;
  onSaveEmployee: (emp: Employee) => void;
  onSaveSupplier: (supp: Supplier) => void;
  onDeleteEmployee: (id: string) => void;
  onDeleteSupplier: (id: string) => void;
}

export function HRMModule({
  employees,
  suppliers,
  sales,
  currency,
  onSaveEmployee,
  onSaveSupplier,
  onDeleteEmployee,
  onDeleteSupplier,
}: HRMProps) {
  const [activeSegment, setActiveSegment] = useState<'employees' | 'suppliers'>('employees');
  const [query, setQuery] = useState('');

  // Form System
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  };

  // Compile salesperson analytics mapping from sales registry
  const compileEmployeeSales = () => {
    const map: { [empId: string]: { totalValue: number; count: number; lastDate: string } } = {};

    sales.forEach((s) => {
      const empId = s.seller?.id;
      if (!empId) return;

      if (!map[empId]) {
        map[empId] = { totalValue: 0, count: 0, lastDate: '' };
      }
      map[empId].totalValue += s.totalAmount;
      map[empId].count += 1;
      if (!map[empId].lastDate || new Date(s.date) > new Date(map[empId].lastDate)) {
        map[empId].lastDate = s.date;
      }
    });

    return map;
  };

  const salespeopleAnalyticMap = compileEmployeeSales();

  const handleOpenAddEmp = () => {
    setEditingEmployee(null);
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const handleOpenEditEmp = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const handleOpenAddSupp = () => {
    setEditingEmployee(null);
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const handleOpenEditSupp = (supp: Supplier) => {
    setEditingSupplier(supp);
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (activeSegment === 'employees') {
      const fullName = formData.get('fullName') as string;
      const phone = formData.get('phone') as string;
      const email = formData.get('email') as string;
      const NID = formData.get('NID') as string;
      const fatherName = formData.get('fatherName') as string;
      const motherName = formData.get('motherName') as string;
      const address = formData.get('address') as string;

      const department = formData.get('department') as string;
      const role = formData.get('role') as string;
      const status = formData.get('status') as string;
      const salary = parseFloat(formData.get('salary') as string) || 0;
      const joinDateInput = formData.get('joinDate') as string;
      const joinDate = joinDateInput ? new Date(joinDateInput).toISOString() : null;

      const empRecord: Employee = {
        id: editingEmployee?.id || `EMP-${Date.now().toString(36).toUpperCase()}`,
        personalInfo: { fullName, phone, email, NID, fatherName, motherName, address },
        jobInfo: { department, role, status, salary, joinDate },
        attendance: editingEmployee?.attendance || [],
        payroll: editingEmployee?.payroll || [],
      };
      onSaveEmployee(empRecord);
    } else {
      const name = formData.get('name') as string;
      const company = formData.get('company') as string;
      const phone = formData.get('phone') as string;
      const email = formData.get('email') as string;
      const address = formData.get('address') as string;
      const paymentTerms = formData.get('paymentTerms') as string;
      const rating = parseInt(formData.get('rating') as string) || 5;

      const suppRecord: Supplier = {
        id: editingSupplier?.id || `SUPP-${Date.now().toString(36).toUpperCase()}`,
        name,
        company,
        phone,
        email,
        address,
        suppliedProducts: editingSupplier?.suppliedProducts || [],
        paymentTerms,
        rating,
      };
      onSaveSupplier(suppRecord);
    }
    setIsFormOpen(false);
  };

  const filteredEmployees = employees.filter((e) => {
    return (
      e.personalInfo.fullName.toLowerCase().includes(query.toLowerCase()) ||
      e.jobInfo.role.toLowerCase().includes(query.toLowerCase()) ||
      e.id.toLowerCase().includes(query.toLowerCase())
    );
  });

  const filteredSuppliers = suppliers.filter((s) => {
    return (
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.company.toLowerCase().includes(query.toLowerCase()) ||
      s.id.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Switch segments headers */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveSegment('employees');
              setQuery('');
              setIsFormOpen(false);
            }}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'employees' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            Employee HR Rosters
          </button>
          <button
            onClick={() => {
              setActiveSegment('suppliers');
              setQuery('');
              setIsFormOpen(false);
            }}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'suppliers' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            Supply Vendors Index
          </button>
        </div>

        {!isFormOpen && (
          <button
            onClick={activeSegment === 'employees' ? handleOpenAddEmp : handleOpenAddSupp}
            className="btn btn-filled flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <Plus className="w-4 h-4" /> onboard {activeSegment === 'employees' ? 'Employee' : 'Supplier'}
          </button>
        )}
      </div>

      {isFormOpen ? (
        /* Form Layers for Employees / Suppliers */
        <div className="card max-w-4xl mx-auto w-full">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-6 font-display">
            {activeSegment === 'employees'
              ? editingEmployee
                ? `Modify Staff Profile: ${editingEmployee.personalInfo.fullName}`
                : 'onboard New Employee'
              : editingSupplier
              ? `Edit Supplier Registry: ${editingSupplier.name}`
              : 'Add New Supplier Vendor'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeSegment === 'employees' ? (
              <>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Personal Profiles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="field">
                      <label>Full Employee Name *</label>
                      <input name="fullName" required defaultValue={editingEmployee?.personalInfo?.fullName || ''} placeholder="Jane Doe" />
                    </div>
                    <div className="field">
                      <label>National ID Number (NID) *</label>
                      <input name="NID" required defaultValue={editingEmployee?.personalInfo?.NID || ''} placeholder="084935299" />
                    </div>
                    <div className="field">
                      <label>Contact Phone</label>
                      <input name="phone" defaultValue={editingEmployee?.personalInfo?.phone || ''} placeholder="+1-555-0104" />
                    </div>
                    <div className="field">
                      <label>Email Address</label>
                      <input name="email" type="email" defaultValue={editingEmployee?.personalInfo?.email || ''} placeholder="jane@example.com" />
                    </div>
                    <div className="field">
                      <label>Father's Name</label>
                      <input name="fatherName" defaultValue={editingEmployee?.personalInfo?.fatherName || ''} />
                    </div>
                    <div className="field">
                      <label>Mother's Name</label>
                      <input name="motherName" defaultValue={editingEmployee?.personalInfo?.motherName || ''} />
                    </div>
                    <div className="field md:col-span-2">
                      <label>Current Address</label>
                      <input name="address" defaultValue={editingEmployee?.personalInfo?.address || ''} placeholder="123 Oak St, Chicago, IL" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Role & Payroll Specs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="field">
                      <label>Department</label>
                      <input name="department" defaultValue={editingEmployee?.jobInfo?.department || ''} placeholder="Sales / Logistics" />
                    </div>
                    <div className="field">
                      <label>Assigned Corporate Title / Role</label>
                      <input name="role" defaultValue={editingEmployee?.jobInfo?.role || 'Employee'} placeholder="Salesperson / Admin" />
                    </div>
                    <div className="field">
                      <label>Base Salary Scale ({currency})</label>
                      <input name="salary" type="number" step="0.01" defaultValue={editingEmployee?.jobInfo?.salary || 0} />
                    </div>
                    <div className="field">
                      <label>Date of Hired</label>
                      <input type="date" name="joinDate" defaultValue={editingEmployee?.jobInfo?.joinDate?.slice(0, 10) || ''} />
                    </div>
                    <div className="field">
                      <label>Lifecycle status</label>
                      <select name="status" defaultValue={editingEmployee?.jobInfo?.status || 'active'}>
                        <option value="active">Active Staff</option>
                        <option value="inactive">Inactive / On leave</option>
                        <option value="terminated">Terminated / Resigned</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label>Representative Vendor Name *</label>
                  <input name="name" required defaultValue={editingSupplier?.name || ''} placeholder="Global Distribution inc" />
                </div>
                <div className="field">
                  <label>Consolidated Company Group Name</label>
                  <input name="company" defaultValue={editingSupplier?.company || ''} placeholder="Global Supplies Corp" />
                </div>
                <div className="field">
                  <label>Commercial Phone</label>
                  <input name="phone" defaultValue={editingSupplier?.phone || ''} placeholder="+1-555-0921" />
                </div>
                <div className="field">
                  <label>Inflow Email</label>
                  <input name="email" type="email" defaultValue={editingSupplier?.email || ''} placeholder="inquire@globalsupplies.com" />
                </div>
                <div className="field md:col-span-2">
                  <label>Operating Main Depot Address</label>
                  <input name="address" defaultValue={editingSupplier?.address || ''} placeholder="Aisle-B Logistics complex, NY" />
                </div>
                <div className="field">
                  <label>Payment Terms Window</label>
                  <input name="paymentTerms" defaultValue={editingSupplier?.paymentTerms || 'Net 30'} placeholder="Net 30 / COD" />
                </div>
                <div className="field">
                  <label>Reliability Rating (0 - 5 Stars)</label>
                  <select name="rating" defaultValue={editingSupplier?.rating || 5}>
                    <option value={5}>⭐⭐⭐⭐ State Premium (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ Stable Good (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ Fair Average (3 Stars)</option>
                    <option value={2}>⭐⭐ Needs attention (2 Stars)</option>
                    <option value={1}>⭐ Unreliable (1 Star)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingEmployee(null);
                  setEditingSupplier(null);
                }}
                className="btn btn-outlined"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-filled">
                Confirm Register Profile
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Boards lists */
        <div className="card">
          <div className="relative max-w-sm mb-4">
            <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={activeSegment === 'employees' ? 'Search employee name or role...' : 'Search supplier company...'}
              className="pl-9 py-1.5 text-xs rounded-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {activeSegment === 'employees' ? (
            <div className="space-y-6">
              {/* Employee table directory */}
              <div className="table-shell">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-500 tracking-wider">
                    <tr>
                      <th className="p-3">Staff ID</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">NID Number</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Assigned Role</th>
                      <th className="p-3 text-right">Base Salary Scale</th>
                      <th className="p-3">Hired Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-xs text-neutral-400">
                          Empty rosters registered.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((e) => (
                        <tr key={e.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                          <td className="p-3 font-mono font-bold text-xs">{e.id}</td>
                          <td className="p-3">
                            <div className="font-semibold text-neutral-900 dark:text-neutral-50">{e.personalInfo.fullName}</div>
                            <span className="text-[10px] text-neutral-400 font-mono">{e.personalInfo.phone || 'No phone'}</span>
                          </td>
                          <td className="p-3 text-xs text-neutral-400">{e.personalInfo.NID}</td>
                          <td className="p-3 text-xs text-neutral-500 font-medium">{e.jobInfo.department || '—'}</td>
                          <td className="p-3 text-xs font-semibold">{e.jobInfo.role}</td>
                          <td className="p-3 text-right font-mono font-bold text-neutral-800 dark:text-neutral-200">{formatMoney(e.jobInfo.salary)}</td>
                          <td className="p-3 text-xs text-neutral-400">{e.jobInfo.joinDate ? new Date(e.jobInfo.joinDate).toLocaleDateString() : '—'}</td>
                          <td className="p-3">
                            <span className={`badge ${e.jobInfo.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                              {e.jobInfo.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex gap-1.5">
                              <button onClick={() => handleOpenEditEmp(e)} className="btn btn-tonal btn-sm py-1 px-2 flex items-center gap-1" title="Modifier Profile">
                                <Edit2 className="w-3.5 h-3.5" /> Modify
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Discard staff profile from active indexes?')) onDeleteEmployee(e.id);
                                }}
                                className="btn btn-outlined btn-sm py-1 px-2 border-red-500/10 hover:border-red-500 text-red-500"
                                title="Wipe profile"
                              >
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

              {/* Staff Rep tracking sales reports list */}
              {employees.some((e) => salespeopleAnalyticMap[e.id]) && (
                <div className="p-5 rounded-2xl bg-neutral-100/30 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm mt-4">
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 mb-3 font-display flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600 animate-bounce-slow" /> Staff Rep performance indexes
                  </h4>
                  <div className="table-shell">
                    <table className="w-full text-left text-sm whitespace-nowrap bg-white dark:bg-neutral-950">
                      <thead className="bg-[#f0edf5] dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-600 tracking-wider">
                        <tr>
                          <th className="p-3">Employee Name</th>
                          <th className="p-3">Department Position</th>
                          <th className="p-3 text-right">Total Aggregate Sales</th>
                          <th className="p-3 text-center">Voucher Units Released</th>
                          <th className="p-3">Last transaction Stamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {employees
                          .filter((e) => salespeopleAnalyticMap[e.id])
                          .map((e) => {
                            const analytics = salespeopleAnalyticMap[e.id];
                            return (
                              <tr key={e.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                <td className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">{e.personalInfo.fullName}</td>
                                <td className="p-3 text-xs text-neutral-400">{e.jobInfo.role}</td>
                                <td className="p-3 text-right font-mono font-bold text-green-600">{formatMoney(analytics.totalValue)}</td>
                                <td className="p-3 text-center text-xs font-semibold">{analytics.count} Ledgers</td>
                                <td className="p-3 text-xs text-neutral-400">{new Date(analytics.lastDate).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Suppliers Table */
            <div className="table-shell">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-500 tracking-wider">
                  <tr>
                    <th className="p-3">Vendor ID</th>
                    <th className="p-3">Representative Partner</th>
                    <th className="p-3">Consolidated Group</th>
                    <th className="p-3">Phone Line</th>
                    <th className="p-3">Support Email</th>
                    <th className="p-3">Depot Location address</th>
                    <th className="p-3">payment Terms</th>
                    <th className="p-3">Vendor Reliability</th>
                    <th className="p-3 text-center">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-xs text-neutral-400">
                        No suppliers indexes registered.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="p-3 font-mono font-bold text-xs">{s.id}</td>
                        <td className="p-3 font-bold text-neutral-900 dark:text-neutral-50">{s.name}</td>
                        <td className="p-3 text-xs text-neutral-400 font-semibold">{s.company || '—'}</td>
                        <td className="p-3 font-medium text-xs">
                          {s.phone ? (
                            <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-purple-600 hover:underline">
                              <Phone className="w-3 h-3" /> {s.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3 text-xs text-neutral-400">
                          {s.email ? (
                            <a href={`mailto:${s.email}`} className="flex items-center gap-1 hover:underline">
                              <Mail className="w-3 h-3 text-neutral-400" /> {s.email}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3 text-xs text-neutral-400 max-w-[130px] truncate">{s.address || '—'}</td>
                        <td className="p-3 text-xs font-semibold font-mono uppercase text-neutral-500">{s.paymentTerms}</td>
                        <td className="p-3 text-xs">
                          <div className="flex text-amber-500 gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < s.rating ? 'fill-current' : 'opacity-20'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-center items-center">
                          <div className="inline-flex gap-1.5">
                            <button onClick={() => handleOpenEditSupp(s)} className="btn btn-tonal btn-sm py-1 px-2 flex items-center gap-1" title="Modifier Supplier">
                              <Edit2 className="w-3.5 h-3.5" /> Modify
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Consent to discard this supplier vendor?')) onDeleteSupplier(s.id);
                              }}
                              className="btn btn-outlined btn-sm py-1 px-2 border-red-500/10 hover:border-red-500 text-red-500"
                              title="Wipe record"
                            >
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
          )}
        </div>
      )}
    </div>
  );
}
