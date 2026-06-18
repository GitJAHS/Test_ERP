# Enterprise ERP System | Material You Corporate Edition

An enterprise-grade, client-first, offline-ready ERP built on **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. It runs completely in the web browser, utilizing **IndexedDB** as its primary robust database alongside **LocalStorage** as a high-velocity cache layer. It features Google Material Design 3 guidelines, dynamic custom corporate profiles, and real-time syncing with Google Drive backup files.

---

## 🚀 Target Deployment Features
- **100% Client-Side**: No back-end database servers (Postgres/MySQL) or Node runtimes required. Works natively on **GitHub Pages**, Vercel, Netlify, or AWS S3.
- **Offline First PWA**: Features native service-worker caches, install banners, and a persistent IndexedDB transaction layer, meaning the system compiles and opens securely in remote regions without internet access.
- **Dynamic Color Palettes (Material You)**: Theme modes (Light/Dark) and corporate branding accent colors dynamically propagate across all cards, KPI badges, buttons, and custom charts instantly.
- **Multi-Profile Corporate Switching**: Allows managers to instantiate separated ledger data, inventories, customer books, and audit trails for different business entities from a unified switcher.
- **Advanced Notification Center**: Visualizes heads-up sliding toasts with category icons, interactive progress bar countdowns, and a historical log for critical alerts.

---

## 📁 System Folder Structure
```
├── index.html                   # Core HTML entry & Google Sign-In wrapper
├── README.md                    # System Overview manual
├── LICENSE                      # MIT Open-Source corporate license
├── manifest.json                # PWA launcher definitions
├── service-worker.js            # Offline network caching engine
├── docs/                        # Dedicated technical resources
│   ├── INSTALLATION.md          # Setup & execution guides
│   ├── USER_GUIDE.md            # Client operating checklists
│   ├── ADMIN_GUIDE.md           # Business profiles & cloud backup settings
│   ├── DEVELOPER_GUIDE.md       # Architecture & schema customizations
│   ├── DATA_STRUCTURE.md        # DB model records contracts
│   ├── GITHUB_DEPLOYMENT.md     # Hosting deployments on GitHub Pages
│   └── CHANGELOG.md             # Compilation histories
├── src/                         # React App modules
    ├── db/
    │   └── indexedDB.ts         # IndexedDB Manager (Primary Database)
    ├── components/
    │   ├── CustomChart.tsx      # SVG chart vectors engine
    │   ├── AIAdvisor.tsx        # Automated scanning advisory panel
    │   ├── Reports.tsx          # Multi-tab audited totals graphs
    │   ├── CustomerModule.tsx   # CRM directory
    │   ├── ProductModule.tsx    # Inventory SKUs catalogs
    │   ├── InvoiceModule.tsx    # Invoices checkout desks, print & QR
    │   ├── FinanceModule.tsx    # Manual inflow/outflow bookkeeping
    │   ├── HRMModule.tsx        # Employees & Suppliers listings
    │   ├── ProcurementModule.tsx# Restoration POs, couriers & coupons
    │   ├── Settings.tsx         # Corporate configurations
    │   └── NotificationContext.tsx # Heads-up toasts & progress meters
    ├── types.ts                 # Full system model interfaces
    ├── index.css                # Stylesheets overrides & M3 transitions
    ├── main.tsx                 # Web index hook
    └── App.tsx                  # Controller layout & router orchestrator
```

---

## ⚡ Quick Start Instructions

Configure dependencies locally:
```bash
npm install
```

Start the system live in your browser:
```bash
npm run dev
```

Build static production modules in `/dist`:
```bash
npm run build
```

---

## 🛠 Legacy Migration Checklist

Converting legacy HTML code into this react build is fully standardized:
1. **Model Synchronization**: Legacy keys (`customers`, `products`, `invoices`, etc.) perfectly match `/src/types.ts` model schemas.
2. **IndexedDB Onboarding**: Storage manager processes load profiles automatically. No manual migrations are required; older databases migrate automatically.
3. **Logo Uploads**: Logos are converted to base64 and stored in local databases, meaning no network fetch is required.
