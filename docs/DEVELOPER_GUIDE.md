# Enterprise ERP | Developer Guide

This document discusses the system architecture, file layouts, and customization instructions.

## Code Design Flow
The system is constructed as a 100% static single-page web app built on **React 18+** and **TypeScript** using **Vite** and **Tailwind CSS**. It does not require Node runtimes, MongoDB, or external cloud SQL servers.

## Code Directory Layout
```
/src
  ├── db                    # Database layer
  │   └── indexedDB.ts      # Primary persistent IndexedDB + LS cache
  ├── components            # Extractable, decoupled views
  │   ├── CustomChart.tsx   # Responsive, zero-dependency SVG graphs
  │   ├── AIAdvisor.tsx     # Smart proactive intelligence scans
  │   ├── Reports.tsx       # Finance summaries & reports
  │   ├── CustomerModule.tsx# CRM directory
  │   ├── ProductModule.tsx # Inventory indexes
  │   ├── InvoiceModule.tsx # Billing invoices, native QR & printing
  │   ├── FinanceModule.tsx # Manual bookkeeping
  │   ├── HRMModule.tsx     # Employees & Suppliers
  │   ├── ProcurementModule.tsx# PO replenishment, couriers & coupons
  │   ├── Settings.tsx      # System configs & backups
  │   └── NotificationContext.tsx # Heads-up toasts & progress meters
  ├── types.ts              # System-wide type contracts 
  ├── index.css             # Tailwind v4 directives & M3 theme variables
  ├── main.tsx              # Main entry hook
  └── App.tsx               # Orchestrator layout & navigation state
```

## Primary Storage Engine (`indexedDB.ts`)
The `IndexedDBManager` encapsulates asynchronous IndexedDB storage transactions. When changes are requested, they are saved synchronously inside LocalStorage (serving as high-speed render cache) and backed up asynchronously inside an IndexedDB store object. This avoids thread-blocking locks while preserving database durability across browser restarts.

## dynamic Color Theme (Material Design 3)
Material You styled variables (`--md-primary`, `--md-surface`, etc.) are mapped out in `/src/index.css`. Theme toggles or custom color edits update CSS custom properties dynamically inside the root document element.
