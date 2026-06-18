# Enterprise ERP | Database & Data Structure

This document describes the schema specifications of the data models stored in IndexedDB.

## Core collections

### 👤 Customer (CRM)
```typescript
interface Customer {
  id: string;                      // Key: "CUST-XXXXXX"
  createdAt: string;               // ISO datetime
  updatedAt: string;
  personalInfo: {
    fullName: string;
    phone: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  businessInfo: {
    customerType: 'retail' | 'wholesale' | 'vip' | string;
    companyName?: string;
    industry?: string;
    source: string;
  };
  financialInfo: {
    creditLimit: number;
    totalSpent: number;
    totalPaid: number;
    totalDue: number;
    loyaltyPoints: number;
    riskLevel: 'low' | 'medium' | 'high' | string;
  };
  status: 'active' | 'inactive' | 'blocked' | string;
}
```

### 📦 Product (Catalog SKUs)
```typescript
interface Product {
  id: string;                      // Key: "PROD-XXXXX"
  sku: string;                     // Code: "SKU-WIDGET..."
  barcode: string;
  basicInfo: {
    name: string;
    description: string;
    category: string;
    brand: string;
    size: string;                  // Comma-separated options e.g. "S,M,L"
    notes: string;
  };
  pricing: {
    costPrice: number;
    salePrice: number;
    taxRate: number;
    discount: number;
  };
  stock: {
    quantity: number;
    reserved: number;
    available: number;
    reorderLevel: number;
    warehouseLocation: string;     // Bin e.g. "Aisle-C, Tier-4"
  };
  supplierId: string | null;       // Key referencing Supplier
  status: 'active' | 'inactive' | 'discontinued';
}
```

### 🧾 Invoice
```typescript
interface Invoice {
  id: string;                      // Key: "INV-YYYYMMDD-XXXX"
  createdAt: string;
  customer: {
    customerId: string;
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  items: Array<{
    productId: string;
    name: string;
    size: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    subtotal: number;
  }>;
  calculations: {
    subTotal: number;
    totalDiscount: number;
    totalTax: number;
    grandTotal: number;
  };
  payment: {
    status: 'unpaid' | 'partial' | 'paid';
    method: string;
    paidAmount: number;
    dueAmount: number;
    transactionId: string;
  };
  status: 'draft' | 'issued' | 'partial' | 'paid';
  dueDate: string | null;
}
```
