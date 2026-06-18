/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface CustomerPersonalInfo {
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  address: Address;
}

export interface CustomerBusinessInfo {
  customerType: 'retail' | 'wholesale' | 'vip' | string;
  companyName?: string;
  industry?: string;
  source: 'manual' | 'referral' | 'online' | 'marketing' | string;
}

export interface CustomerFinancialInfo {
  creditLimit: number;
  totalSpent: number;
  totalPaid: number;
  totalDue: number;
  loyaltyPoints: number;
  riskLevel: 'low' | 'medium' | 'high' | string;
}

export interface Customer {
  id: string;
  createdAt: string;
  updatedAt: string;
  personalInfo: CustomerPersonalInfo;
  businessInfo: CustomerBusinessInfo;
  financialInfo: CustomerFinancialInfo;
  status: 'active' | 'inactive' | 'blocked' | string;
}

export interface ProductBasicInfo {
  name: string;
  description: string;
  category: string;
  brand: string;
  size: string; // Comma-separated sizes e.g., "S,M,L"
  notes: string;
}

export interface ProductPricing {
  costPrice: number;
  salePrice: number;
  taxRate: number;
  discount: number;
}

export interface ProductStock {
  quantity: number;
  reserved: number;
  available: number;
  reorderLevel: number;
  warehouseLocation: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  basicInfo: ProductBasicInfo;
  pricing: ProductPricing;
  stock: ProductStock;
  supplierId: string | null;
  createdAt: string;
  status: 'active' | 'inactive' | 'discontinued' | string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
}

export interface InvoiceCalculations {
  subTotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
}

export interface InvoicePayment {
  status: 'unpaid' | 'partial' | 'paid' | string;
  method: 'cash' | 'bank' | 'mobile' | 'card' | 'cod' | string;
  paidAmount: number;
  dueAmount: number;
  transactionId: string;
}

export interface InvoicePromo {
  code: string;
  discountAmount: number;
  promoId: string;
}

export interface InvoiceSeller {
  id: string;
  name: string;
  role: string;
}

export interface Invoice {
  id: string;
  createdAt: string;
  updatedAt: string;
  businessId: string;
  customer: {
    customerId: string;
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  seller: InvoiceSeller | null;
  items: InvoiceItem[];
  calculations: InvoiceCalculations;
  payment: InvoicePayment;
  status: 'draft' | 'issued' | 'partial' | 'paid' | string;
  dueDate: string | null;
  promo: InvoicePromo | null;
  note: string;
  terms: string;
  termsApplied: boolean;
  stockDeducted: boolean;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  invoiceId: string;
  customerId: string;
  seller: InvoiceSeller | null;
  items: SaleItem[];
  totalAmount: number;
  profit: number;
  date: string;
  status: 'completed' | string;
}

export interface Income {
  id: string;
  source: 'invoice' | 'manual' | 'other' | string;
  amount: number;
  date: string;
  referenceId?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export interface FinanceData {
  income: Income[];
  expenses: Expense[];
}

export interface EmployeePersonalInfo {
  fullName: string;
  phone: string;
  email: string;
  NID: string;
  fatherName: string;
  motherName: string;
  address: string;
}

export interface EmployeeJobInfo {
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'terminated' | string;
  salary: number;
  joinDate: string | null;
}

export interface Employee {
  id: string;
  personalInfo: EmployeePersonalInfo;
  jobInfo: EmployeeJobInfo;
  attendance: any[];
  payroll: any[];
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  suppliedProducts: string[];
  paymentTerms: string;
  rating: number;
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  costPrice: number;
  size: string;
  notes: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  items: PurchaseItem[];
  totalCost: number;
  date: string;
  status: 'pending' | 'completed' | string;
  paymentMethod: string;
  transactionId: string;
}

export interface Delivery {
  id: string;
  invoiceId: string;
  customerId: string;
  address: string;
  status: 'pending' | 'shipped' | 'delivered' | string;
  tracking: any[];
  cost: number;
}

export interface Offer {
  id: string;
  name: string;
  promoCode: string;
  type: 'percentage' | 'fixed' | string;
  value: number;
  productId: string | null;
  startDate: string | null;
  expiryDate: string | null;
  status: 'active' | 'inactive' | string;
  createdAt: string;
}

export interface SavedReport {
  id: string;
  type: 'daily' | 'monthly' | 'custom' | string;
  data: {
    totalSales: number;
    totalProfit: number;
    totalExpense: number;
  };
  generatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}

export interface CompanyConfig {
  name: string;
  address: string;
  phone: string;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  accentColor: string;
}

export interface SystemSettings {
  autoBackup: boolean;
  performanceMode: 'standard' | 'high' | string;
  googleClientId: string;
}

export interface AppConfig {
  company: CompanyConfig;
  language: string;
  country: string;
  currency: string;
  timezone: string;
  theme: ThemeConfig;
  settings: SystemSettings;
  logo: string | null;
}

export interface BusinessProfile {
  id: string;
  name: string;
  createdAt: string;
}

export interface ERPData {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  sales: Sale[];
  finance: FinanceData;
  employees: Employee[];
  suppliers: Supplier[];
  purchases: Purchase[];
  deliveries: Delivery[];
  offers: Offer[];
  reports: SavedReport[];
  auditLog: AuditLogEntry[];
  config: AppConfig;
}
