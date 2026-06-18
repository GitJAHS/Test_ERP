/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Supplier } from '../types';
import { Search, Plus, Edit2, Trash2, Download, Package, ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import { CustomChart, ChartDataPoint } from './CustomChart';

interface ProductModuleProps {
  products: Product[];
  suppliers: Supplier[];
  currency: string;
  onSaveProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export function ProductModule({
  products,
  suppliers,
  currency,
  onSaveProduct,
  onDeleteProduct,
}: ProductModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<'sku' | 'name' | 'available' | 'salePrice'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Forms System
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Pagination Controls
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get('name') as string;
    const barcode = formData.get('barcode') as string;
    const size = formData.get('size') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const brand = formData.get('brand') as string;

    const costPrice = parseFloat(formData.get('costPrice') as string) || 0;
    const salePrice = parseFloat(formData.get('salePrice') as string) || 0;
    const taxRate = parseFloat(formData.get('taxRate') as string) || 0;
    const discount = parseFloat(formData.get('discount') as string) || 0;

    const isNew = !editingProduct;
    // Quantity in creation or preserve existing inventory ledger
    const quantity = isNew ? (parseInt(formData.get('quantity') as string) || 0) : (editingProduct?.stock?.quantity || 0);
    const reserved = editingProduct?.stock?.reserved || 0;
    const available = quantity - reserved;

    const reorderLevel = parseInt(formData.get('reorderLevel') as string) || 10;
    const warehouseLocation = formData.get('warehouseLocation') as string;
    const supplierId = formData.get('supplierId') as string || null;
    const status = formData.get('status') as string;

    const updatedProduct: Product = {
      id: editingProduct?.id || `PROD-${Date.now().toString(36).toUpperCase()}`,
      sku: editingProduct?.sku || `SKU-${Date.now().toString(36).substring(4).toUpperCase()}`,
      barcode,
      basicInfo: { name, description, category, brand, size, notes: '' },
      pricing: { costPrice, salePrice, taxRate, discount },
      stock: { quantity, reserved, available, reorderLevel, warehouseLocation },
      supplierId: supplierId === '__none__' ? null : supplierId,
      status,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    onSaveProduct(updatedProduct);
    setIsFormOpen(false);
  };

  // Compile Categories select
  const categories = Array.from(new Set(products.map((p) => p.basicInfo.category).filter(Boolean)));

  // File CSV Exporting Routine
  const handleExportCSV = () => {
    const headers = ['SKU', 'Bar Code', 'Name', 'Category', 'Cost Price', 'Sale Price', 'Stock Available', 'Warehouse Bin', 'Status'];
    const rows = filteredProducts.map((p) => [
      p.sku,
      p.barcode || '—',
      p.basicInfo.name,
      p.basicInfo.category,
      p.pricing.costPrice,
      p.pricing.salePrice,
      p.stock.available,
      p.stock.warehouseLocation || '—',
      p.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering & Sort Logic
  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.basicInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));

      const matchCategory = filterCategory === 'all' || p.basicInfo.category === filterCategory;
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;

      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'sku') comparison = a.sku.localeCompare(b.sku);
      if (sortField === 'name') comparison = a.basicInfo.name.localeCompare(b.basicInfo.name);
      if (sortField === 'available') comparison = a.stock.available - b.stock.available;
      if (sortField === 'salePrice') comparison = a.pricing.salePrice - b.pricing.salePrice;

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Compile inventory dynamic chart data (Top 5 Active Stock Levels)
  const chartPoints: ChartDataPoint[] = products
    .filter((p) => p.status === 'active')
    .slice(0, 6)
    .map((p) => ({
      label: p.basicInfo.name.substring(0, 15),
      value: p.stock.available,
    }));

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {isFormOpen ? (
        /* Inventory Editing Form Panels */
        <div className="card max-w-4xl mx-auto">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 font-display">
              {editingProduct ? `Edit SKU Properties: ${editingProduct.basicInfo.name}` : 'onboard New Warehouse SKU'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="btn btn-outlined btn-sm">
              Back to Catalog
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">General specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label>Product Nomenclature *</label>
                  <input name="name" required defaultValue={editingProduct?.basicInfo?.name || ''} placeholder="Premium Leather Loafers" />
                </div>
                <div className="field">
                  <label>Barcode / GTIN</label>
                  <input name="barcode" defaultValue={editingProduct?.barcode || ''} placeholder="079357418" />
                </div>
                <div className="field md:col-span-2">
                  <label>Size Matrices (Comma separated values)</label>
                  <input name="size" defaultValue={editingProduct?.basicInfo?.size || ''} placeholder="7, 8, 9, 10, 11" />
                </div>
                <div className="field">
                  <label>Category Group</label>
                  <input name="category" defaultValue={editingProduct?.basicInfo?.category || ''} placeholder="Footwear" />
                </div>
                <div className="field">
                  <label>Manufacture Brand</label>
                  <input name="brand" defaultValue={editingProduct?.basicInfo?.brand || ''} placeholder="Acme Brands" />
                </div>
                <div className="field md:col-span-2">
                  <label>Brief Descriptive Text</label>
                  <input name="description" defaultValue={editingProduct?.basicInfo?.description || ''} placeholder="Comfortable fit everyday wear loafers" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Financial Margins & Taxes</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="field">
                  <label>Supplier Cost Price *</label>
                  <input name="costPrice" type="number" step="0.01" required defaultValue={editingProduct?.pricing?.costPrice || 0} />
                </div>
                <div className="field">
                  <label>Customer Sale Price *</label>
                  <input name="salePrice" type="number" step="0.01" required defaultValue={editingProduct?.pricing?.salePrice || 0} />
                </div>
                <div className="field">
                  <label>Standard Tax Rate (%)</label>
                  <input name="taxRate" type="number" step="0.01" defaultValue={editingProduct?.pricing?.taxRate || 0} />
                </div>
                <div className="field">
                  <label>Voucher Discount (%)</label>
                  <input name="discount" type="number" step="0.01" defaultValue={editingProduct?.pricing?.discount || 0} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Warehousing & Logistical Placement</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="field">
                  <label>Initial Quantity {editingProduct && '(Managed via transactions)'}</label>
                  <input
                    name="quantity"
                    type="number"
                    disabled={!!editingProduct}
                    defaultValue={editingProduct?.stock?.quantity || 0}
                    className="disabled:opacity-60 disabled:bg-neutral-100"
                  />
                </div>
                <div className="field">
                  <label>Buffer Limit (Reorder)</label>
                  <input name="reorderLevel" type="number" defaultValue={editingProduct?.stock?.reorderLevel || 10} />
                </div>
                <div className="field">
                  <label>Warehouse Bin Location</label>
                  <input name="warehouseLocation" defaultValue={editingProduct?.stock?.warehouseLocation || ''} placeholder="Aisle-C, Tier-2" />
                </div>
                <div className="field">
                  <label>Target Supplier Link</label>
                  <select name="supplierId" defaultValue={editingProduct?.supplierId || '__none__'}>
                    <option value="__none__">— Select Registered —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="field max-w-sm">
              <label>Inventory Lifecycle State</label>
              <select name="status" defaultValue={editingProduct?.status || 'active'}>
                <option value="active">Active Catalog SKU</option>
                <option value="inactive">Suspended Catalog SKU</option>
                <option value="discontinued">Permanently Discontinued</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 border-t border-neutral-150 dark:border-neutral-800 pt-4">
              <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-outlined">
                Cancel
              </button>
              <button type="submit" className="btn btn-filled">
                Confirm Register SKU
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Catalog Dashboard List */
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2 flex flex-col justify-between">
              <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-50 font-display">Warehouse Stock Index</h3>
                  <p className="text-xs text-neutral-400">Add SKUs, assign warehouse bins, evaluate buffer minimum safety levels, and adjust tax brackets.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportCSV} className="btn btn-outlined flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                  <button onClick={handleOpenAdd} className="btn btn-filled flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold">
                    <Plus className="w-4 h-4" /> onboard SKU
                  </button>
                </div>
              </div>

              {/* Filtering widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-neutral-100/50 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-200/40 dark:border-neutral-800/40 mb-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search SKU or name..."
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
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
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
                    <option value="active">Active Catalog SKU</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
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
                    <option value="name-asc">Nomenclature (A-Z)</option>
                    <option value="name-desc">Nomenclature (Z-A)</option>
                    <option value="available-asc">By Stock (Low to High)</option>
                    <option value="available-desc">By Stock (High to Low)</option>
                    <option value="salePrice-desc">By Price (High to Low)</option>
                  </select>
                </div>
              </div>

              {/* Central Catalog Table List */}
              <div className="table-shell">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-500 tracking-wider">
                    <tr>
                      <th className="p-3">SKU Id</th>
                      <th className="p-3">Product Nomenclature</th>
                      <th className="p-3">Sizing Grid</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Procure Cost</th>
                      <th className="p-3 text-right">Voucher Value</th>
                      <th className="p-3 text-right">Available Volume (Total)</th>
                      <th className="p-3">Location Bin</th>
                      <th className="p-3">status</th>
                      <th className="p-3 text-center">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-xs text-neutral-400">
                          No matching inventory logged. Click "onboard SKU" to create.
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((p) => {
                        const isLow = p.stock.available < p.stock.reorderLevel;
                        return (
                          <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                            <td className="p-3 font-mono font-bold text-xs">{p.sku}</td>
                            <td className="p-3">
                              <div className="font-semibold text-neutral-900 dark:text-neutral-50">
                                {p.basicInfo.name}
                              </div>
                            </td>
                            <td className="p-3 text-xs text-neutral-400">{p.basicInfo.size || '—'}</td>
                            <td className="p-3 text-xs text-neutral-500">{p.basicInfo.category}</td>
                            <td className="p-3 text-right font-mono text-neutral-400">{formatMoney(p.pricing.costPrice)}</td>
                            <td className="p-3 text-right font-mono font-bold text-[#6750A4] dark:text-[#D0BCFF]">{formatMoney(p.pricing.salePrice)}</td>
                            <td className="p-3 text-right">
                              <span className={`font-mono font-bold ${isLow ? 'text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded-md' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                {p.stock.available}
                              </span>
                              <span className="text-neutral-400 font-medium text-xs"> / {p.stock.quantity}</span>
                            </td>
                            <td className="p-3 text-xs text-neutral-400 font-medium">{p.stock.warehouseLocation || '—'}</td>
                            <td className="p-3">
                              <span className={`badge ${
                                p.status === 'active' ? 'badge-green' : 'badge-red'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="inline-flex gap-1.5">
                                <button onClick={() => handleOpenEdit(p)} className="btn btn-tonal btn-sm py-1 px-2.5 flex items-center gap-1" title="Edit Properties">
                                  <Edit2 className="w-3.5 h-3.5" /> Modify
                                </button>
                                <button onClick={() => { if (confirm('Are you holding consent to wipe this SKU from catalogs?')) onDeleteProduct(p.id); }} className="btn btn-outlined btn-sm py-1 px-2.5 border-red-500/30 hover:border-red-500 text-red-500" title="Delete Profile">
                                  <Trash2 className="w-3.5 h-3.5" /> Wipe
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

              {/* Simple Pagination control footer */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">
                    Displaying {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredProducts.length, currentPage * itemsPerPage)} of {filteredProducts.length}
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

            {/* Micro Inventory Graph visualization panel */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 mb-1">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold font-display text-sm">Levels Overview</h3>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Real-time visualization metrics tracking leading active SKU balances.
                </p>
              </div>

              {chartPoints.length > 0 ? (
                <div className="my-6 flex-1 flex items-center justify-center">
                  <CustomChart title="Warehouse Stock Bar" data={chartPoints} type="bar" color="#6750A4" secondaryColor="#EFB8C8" />
                </div>
              ) : (
                <div className="my-12 text-center text-xs text-neutral-400">
                  Insufficient SKU records found to compile.
                </div>
              )}

              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>Unique Stock SKUs: <strong>{products.length} Items</strong></span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  {products.filter((p) => p.stock.available < p.stock.reorderLevel).length} Low levels
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
