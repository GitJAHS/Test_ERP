# Enterprise ERP | Changelog

Log of core engineering changes and feature additions.

## [v2.0.0] — 2026-06-18
This release represents an enterprise-grade transform of the legacy single-file ERP prototype into a production-grade, modular, offline-first client application.

### Major visual redesign
- **Dynamic Accent Color system**: Fully implemented Google Material You theme capabilities. Theme details and accent colors update CSS variables dynamically.
- **Card Surfaces**: Integrated glassmorphic elevated containers with rounded angles and distinct elevations.
- **Top Bar**: Introduced live connection checks (blinking dots for Online/Offline state), active business profile switcher dropdown, dynamic clock synchronization, and a custom heads-up notifications log.
- **Sidebar Integration**: Integrated modern M3 navigation rails supporting mobile drawer triggers.

### Architecture scaling
- **Primary IndexedDB**: Migrated primary database storage keys into IndexedDB Transactions while retaining LocalStorage as high-velocity caches. Complete works-offline integrity.
- **Advanced Notification center**: Built out dynamic slide-from-top notifications supporting timer gauges, progress bars, and historical logging centers.
- **Enterprise Reports Engine**: Added multi-tab visualizations (Pie, Line, Area, and Bar curves) that run completely offline without relying on bulk networks.
- **Refined HRM & Procurement**: Organized individual modules into React TypeScript directories with size catalogs, coupon validations, and automated restock triggers.
- **Complete Documentation**: Produced Installation guides, admin guide, user manuals, and GitHub Pages instructions.
