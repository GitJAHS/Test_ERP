/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ERPData,
  Customer,
  Product,
  Invoice,
  Sale,
  Income,
  Expense,
  Employee,
  Supplier,
  Purchase,
  Delivery,
  Offer,
  AppConfig,
  BusinessProfile,
  AuditLogEntry,
} from './types';
import { IndexedDBManager } from './db/indexedDB';
import { NotificationProvider, useNotifications } from './components/NotificationContext';
import { CustomChart } from './components/CustomChart';
import { AIAdvisor } from './components/AIAdvisor';
import { Reports } from './components/Reports';
import { CustomerModule } from './components/CustomerModule';
import { ProductModule } from './components/ProductModule';
import { InvoiceModule } from './components/InvoiceModule';
import { FinanceModule } from './components/FinanceModule';
import { HRMModule } from './components/HRMModule';
import { ProcurementModule } from './components/ProcurementModule';
import { Settings } from './components/Settings';
import {
  Search,
  Bell,
  Menu,
  Sun,
  Moon,
  Building,
  User,
  Zap,
  Globe,
  PlusCircle,
  HelpCircle,
  LogOut,
  FolderLock,
  Layers,
  CheckCircle,
  Clock,
  Printer,
  ChevronLeft,
  X,
  History,
  TrendingUp,
  Trash2,
} from 'lucide-react';

const INITIAL_DEFAULT_DATA: ERPData = {
  customers: [],
  products: [],
  invoices: [],
  sales: [],
  finance: { income: [], expenses: [] },
  employees: [],
  suppliers: [],
  purchases: [],
  deliveries: [],
  offers: [],
  reports: [],
  auditLog: [],
  config: {
    company: {
      name: 'Acme Corp',
      address: '123 Main St, Springfield, IL 62701',
      phone: '+1-555-0000',
    },
    language: 'en',
    country: 'US',
    currency: 'USD',
    timezone: 'America/New_York',
    theme: {
      mode: 'light',
      accentColor: '#6750A4',
    },
    settings: {
      autoBackup: true,
      performanceMode: 'standard',
      googleClientId: '',
    },
    logo: null,
  },
};

export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

function AppContent() {
  const { notifications, addNotification, clearAllNotifications, markAllAsRead, unreadCount } = useNotifications();

  // Navigation Panel Routing state
  const [activePanel, setActivePanel] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Database Collections state
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('erp_activeProfileId') || '';
  });
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [erpData, setErpData] = useState<ERPData>(INITIAL_DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Topbar system status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Modals & Overlay triggers
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState<boolean>(false);
  const [isNotifHistoryOpen, setIsNotifHistoryOpen] = useState<boolean>(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // Print layout overlays state
  const [printLayoutInvoice, setPrintLayoutInvoice] = useState<Invoice | null>(null);
  const [printLayoutPurchase, setPrintLayoutPurchase] = useState<Purchase | null>(null);

  // Monitor network connection state on mount
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification('internet connection restored. Online sync engines reloaded.', 'success', { title: 'Network Online', category: 'System' });
    };
    const handleOffline = () => {
      setIsOnline(false);
      addNotification('Internet connection lost. Local primary IndexedDB database is active.', 'warn', { title: 'Network Offline', category: 'System' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Current timezone clock
    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
          ' ' +
          now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(clockTimer);
    };
  }, []);

  // Sync Google Drive tokens
  useEffect(() => {
    const storedToken = sessionStorage.getItem('erp_google_token');
    if (storedToken) {
      setGoogleToken(storedToken);
    }
  }, []);

  // Initialize and load business profiles from IndexedDB
  useEffect(() => {
    const bootDatabase = async () => {
      setIsLoading(true);
      try {
        await IndexedDBManager.init();

        // Load profile list
        let savedProfilesRaw = localStorage.getItem('erp_profiles');
        let profileList: BusinessProfile[] = [];

        if (savedProfilesRaw) {
          try {
            profileList = JSON.parse(savedProfilesRaw);
          } catch {}
        }

        if (profileList.length === 0) {
          // Initialize first default profile
          const initialProfile: BusinessProfile = {
            id: `PROF-${Date.now().toString(36).toUpperCase()}`,
            name: 'Acme General Headquarters',
            createdAt: new Date().toISOString(),
          };
          profileList = [initialProfile];
          localStorage.setItem('erp_profiles', JSON.stringify(profileList));
          localStorage.setItem('erp_activeProfileId', initialProfile.id);
          setActiveProfileId(initialProfile.id);
        }

        setProfiles(profileList);

        const activeId = localStorage.getItem('erp_activeProfileId') || profileList[0].id;
        setActiveProfileId(activeId);

        // Load specific profile ERP tables
        const loadedData = await IndexedDBManager.loadProfileData(activeId, INITIAL_DEFAULT_DATA);
        
        // Seed default parameters first time if database empty
        if (loadedData.customers.length === 0 && loadedData.products.length === 0) {
          loadedData.customers = [
            {
              id: 'CUST-001',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              personalInfo: {
                fullName: 'Johnathan Doe',
                phone: '+1-555-0101',
                email: 'johndoe@acme.com',
                gender: 'male',
                dateOfBirth: '1990-05-15',
                address: { street: '456 Oak Blv', city: 'Springfield', state: 'IL', country: 'US', postalCode: '62701' },
              },
              businessInfo: { customerType: 'retail', companyName: 'Doe Consulting LLC', industry: 'Logistics', source: 'online' },
              financialInfo: { creditLimit: 25000, totalSpent: 12000, totalPaid: 10000, totalDue: 2000, loyaltyPoints: 1200, riskLevel: 'low' },
              status: 'active',
            },
          ];

          loadedData.products = [
            {
              id: 'PROD-001',
              sku: 'SKU-WIDGET-01',
              barcode: '07935741829',
              basicInfo: { name: 'Titanium Core Widget', description: 'Heavy-duty industrial alloy hardware', category: 'Accessories', brand: 'Acme Hardware', size: 'S, M, L', notes: '' },
              pricing: { costPrice: 45.0, salePrice: 99.99, taxRate: 8.5, discount: 5.0 },
              stock: { quantity: 180, reserved: 0, available: 180, reorderLevel: 15, warehouseLocation: 'Aisle-4, Tier-2' },
              supplierId: 'SUPP-001',
              createdAt: new Date().toISOString(),
              status: 'active',
            },
          ];

          loadedData.suppliers = [
            {
              id: 'SUPP-001',
              name: 'Indus Distrib Corp',
              company: 'Industrial Sourcing LLC',
              phone: '+1-555-0941',
              email: 'procure@indusourcing.com',
              address: '500 Logistics Way, Chicago, IL',
              suppliedProducts: ['PROD-001'],
              paymentTerms: 'Net 30',
              rating: 5,
            },
          ];

          loadedData.invoices = [
            {
              id: 'INV-20250618-F4B3',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              businessId: loadedData.config.company.name,
              customer: { customerId: 'CUST-001', name: 'Johnathan Doe', phone: '+1-555-0101', email: 'johndoe@acme.com', address: '456 Oak Blv, Springfield, IL, 62701, US' },
              seller: { id: 'EMP-001', name: 'James Carter', role: 'Salesperson' },
              items: [{ productId: 'PROD-001', name: 'Titanium Core Widget', size: 'M', quantity: 2, unitPrice: 99.99, discount: 5.0, taxRate: 8.5, subtotal: 199.98 }],
              calculations: { subTotal: 199.98, totalDiscount: 10.0, totalTax: 16.15, grandTotal: 206.13 },
              payment: { status: 'paid', method: 'card', paidAmount: 206.13, dueAmount: 0, transactionId: 'TXN-84920' },
              status: 'paid',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              promo: null,
              note: 'Standard fulfillment delivery.',
              terms: 'Standard net terms applied.',
              termsApplied: true,
              stockDeducted: true,
            },
          ];

          loadedData.sales = [
            {
              id: 'SALE-84029',
              invoiceId: 'INV-20250618-F4B3',
              customerId: 'CUST-001',
              seller: { id: 'EMP-001', name: 'James Carter', role: 'Salesperson' },
              items: [{ productId: 'PROD-001', quantity: 2, price: 99.99 }],
              totalAmount: 206.13,
              profit: 106.13,
              date: new Date().toISOString(),
              status: 'completed',
            },
          ];

          loadedData.finance.income = [
            { id: 'INC-84029', source: 'invoice', amount: 206.13, date: new Date().toISOString(), referenceId: 'INV-20250618-F4B3' },
          ];

          loadedData.employees = [
            {
              id: 'EMP-001',
              personalInfo: { fullName: 'James Carter', phone: '+1-555-0104', email: 'james@acme.com', NID: '9834218', fatherName: 'Robert', motherName: 'Mary', address: '789 Pine Rd, Chicago, IL' },
              jobInfo: { department: 'Sales', role: 'Salesperson', status: 'active', salary: 4500, joinDate: new Date().toISOString() },
              attendance: [],
              payroll: [],
            },
          ];

          await IndexedDBManager.saveProfileData(activeId, loadedData);
        }

        setErpData(loadedData);
        applyM3DynamicColor(loadedData.config.theme.accentColor || '#6750A4', loadedData.config.theme.mode === 'dark');
      } catch (err) {
        console.error('Core Database initialization trace failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootDatabase();
  }, [activeProfileId]);

  // Apply M3 dynamic accent colors
  const applyM3DynamicColor = (accent: string, isDark: boolean) => {
    // Basic hex parsing to HSL
    const cleanHex = accent.replace(/^#/, '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    const hDeg = h * 360;
    const sPct = s * 100;
    const lPct = l * 100;

    // Helper to format HSL values cleanly for CSS injection
    const hsl = (hue: number, sat: number, light: number) => `hsl(${Math.round(hue % 360)}, ${Math.round(Math.max(0, Math.min(100, sat)))}%, ${Math.round(Math.max(0, Math.min(100, light)))}%)`;

    // Calculate palette tokens based on Material Design 3 guidelines
    const root = document.documentElement;

    if (!isDark) {
      root.style.setProperty('--md-primary', accent);
      root.style.setProperty('--md-on-primary', lPct > 70 ? '#1C1B1F' : '#FFFFFF');
      root.style.setProperty('--md-primary-container', hsl(hDeg, sPct * 0.4, 92));
      root.style.setProperty('--md-on-primary-container', hsl(hDeg, Math.min(100, sPct + 15), 15));
      
      // Secondary: related hue, lower saturation
      const secHue = (hDeg + 15) % 360;
      root.style.setProperty('--md-secondary', hsl(secHue, sPct * 0.4, 40));
      root.style.setProperty('--md-on-secondary', '#FFFFFF');
      root.style.setProperty('--md-secondary-container', hsl(secHue, sPct * 0.3, 90));
      root.style.setProperty('--md-on-secondary-container', hsl(secHue, sPct * 0.5, 15));
      
      // Tertiary: expressive shifted hue of +120 degrees
      const tertHue = (hDeg + 120) % 360;
      root.style.setProperty('--md-tertiary', hsl(tertHue, Math.min(100, sPct * 1.2), 43));
      root.style.setProperty('--md-on-tertiary', '#FFFFFF');
      root.style.setProperty('--md-tertiary-container', hsl(tertHue, sPct * 0.4, 92));
      root.style.setProperty('--md-on-tertiary-container', hsl(tertHue, sPct * 0.6, 12));
      
      // Background and Surfaces
      const surfHue = (hDeg + 5) % 360;
      root.style.setProperty('--md-background', hsl(surfHue, Math.min(10, sPct * 0.1), 98));
      root.style.setProperty('--md-on-background', hsl(surfHue, 8, 10));
      root.style.setProperty('--md-surface', hsl(surfHue, Math.min(8, sPct * 0.1), 97));
      root.style.setProperty('--md-on-surface', hsl(surfHue, 8, 12));
      root.style.setProperty('--md-surface-variant', hsl(hDeg, Math.min(12, sPct * 0.25), 90));
      root.style.setProperty('--md-on-surface-variant', hsl(hDeg, Math.min(20, sPct * 0.3), 30));
      
      root.style.setProperty('--md-outline', hsl(hDeg, Math.min(15, sPct * 0.2), 48));
      root.style.setProperty('--md-outline-variant', hsl(hDeg, Math.min(15, sPct * 0.15), 82));
    } else {
      root.style.setProperty('--md-primary', hsl(hDeg, sPct, 75));
      root.style.setProperty('--md-on-primary', hsl(hDeg, sPct, 18));
      root.style.setProperty('--md-primary-container', hsl(hDeg, sPct * 0.75, 28));
      root.style.setProperty('--md-on-primary-container', hsl(hDeg, sPct, 88));
      
      // Secondary
      const secHue = (hDeg + 15) % 360;
      root.style.setProperty('--md-secondary', hsl(secHue, sPct * 0.3, 72));
      root.style.setProperty('--md-on-secondary', hsl(secHue, sPct * 0.35, 15));
      root.style.setProperty('--md-secondary-container', hsl(secHue, sPct * 0.25, 28));
      root.style.setProperty('--md-on-secondary-container', hsl(secHue, sPct * 0.3, 88));
      
      // Tertiary
      const tertHue = (hDeg + 120) % 360;
      root.style.setProperty('--md-tertiary', hsl(tertHue, Math.min(100, sPct), 78));
      root.style.setProperty('--md-on-tertiary', hsl(tertHue, sPct, 18));
      root.style.setProperty('--md-tertiary-container', hsl(tertHue, sPct * 0.6, 28));
      root.style.setProperty('--md-on-tertiary-container', hsl(tertHue, sPct * 0.8, 88));
      
      // Background and Surfaces
      const surfHue = (hDeg + 5) % 360;
      root.style.setProperty('--md-background', hsl(surfHue, Math.min(12, sPct * 0.15), 8));
      root.style.setProperty('--md-on-background', hsl(surfHue, 5, 92));
      root.style.setProperty('--md-surface', hsl(surfHue, Math.min(12, sPct * 0.1), 10));
      root.style.setProperty('--md-on-surface', hsl(surfHue, 5, 90));
      root.style.setProperty('--md-surface-variant', hsl(hDeg, Math.min(15, sPct * 0.2), 22));
      root.style.setProperty('--md-on-surface-variant', hsl(hDeg, Math.min(15, sPct * 0.15), 78));
      
      root.style.setProperty('--md-outline', hsl(hDeg, Math.min(12, sPct * 0.15), 58));
      root.style.setProperty('--md-outline-variant', hsl(hDeg, Math.min(12, sPct * 0.12), 34));
    }

    document.body.classList.toggle('dark', isDark);
  };

  const toggleTheme = () => {
    const isDark = erpData.config.theme.mode === 'dark';
    const nextMode = isDark ? 'light' : 'dark';
    const updatedTheme = { ...erpData.config.theme, mode: nextMode as 'light' | 'dark' };
    setErpData((prev) => {
      const updated = { ...prev, config: { ...prev.config, theme: updatedTheme } };
      IndexedDBManager.setItem(`erp_${activeProfileId}_config`, updated.config);
      applyM3DynamicColor(updatedTheme.accentColor, nextMode === 'dark');
      return updated;
    });
    logAuditEntry('update', `Toggled system interface mode to ${nextMode}`);
    addNotification(`System theme converted to ${nextMode} style.`, 'info');
  };

  // Log automated auditing metrics
  const logAuditEntry = (action: string, details: string) => {
    const entry: AuditLogEntry = {
      id: `AUDIT-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      user: 'Administrator',
      role: 'admin',
      action,
      details,
    };

    setErpData((prev) => {
      const updatedLog = [entry, ...prev.auditLog].slice(0, 500); // Max 500 audit items
      const updated = { ...prev, auditLog: updatedLog };
      IndexedDBManager.setItem(`erp_${activeProfileId}_auditLog`, updatedLog);
      return updated;
    });
  };

  // Dynamic mutator callbacks
  const saveConfiguration = (newConfig: AppConfig) => {
    setErpData((prev) => {
      const updated = { ...prev, config: newConfig };
      IndexedDBManager.setItem(`erp_${activeProfileId}_config`, newConfig);
      applyM3DynamicColor(newConfig.theme.accentColor, newConfig.theme.mode === 'dark');
      return updated;
    });
    logAuditEntry('update', 'Updated core system coordinates settings');
    addNotification('Active corporate parameter indices saved successfully.', 'success', { title: 'Configuration Saved', category: 'Settings' });
  };

  const handleEntityStateMutator = <K extends keyof ERPData>(moduleKey: K, updatedCollection: ERPData[K], auditAction: string, auditDetail: string) => {
    setErpData((prev) => {
      const updated = { ...prev, [moduleKey]: updatedCollection };
      IndexedDBManager.setItem(`erp_${activeProfileId}_${moduleKey}`, updatedCollection);
      return updated;
    });
    logAuditEntry(auditAction, auditDetail);
  };

  // Google syncing triggers
  const handleGoogleSignIn = () => {
    const clientId = erpData.config.settings?.googleClientId;
    if (!clientId) {
      addNotification('GCloud OAuth registration client is absent. Go to Settings.', 'warn', { title: 'Authenticating Failed', category: 'Authentication' });
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (resp: any) => {
          if (resp.error) {
            addNotification(`Google Cloud Syncing handshake rejected: ${resp.error}`, 'error');
            return;
          }
          setGoogleToken(resp.access_token);
          sessionStorage.setItem('erp_google_token', resp.access_token);
          addNotification('Secure corporate sync link bound to Google Drive folders.', 'success', { title: 'Cloud Bound', category: 'System' });
          logAuditEntry('connect', 'Connected to GCloud accounts service');
        },
      });
      client.requestAccessToken();
    } catch (e) {
      addNotification('Google Sign-in client library initialization failed.', 'error');
    }
  };

  const handleGoogleSignOut = () => {
    setGoogleToken(null);
    sessionStorage.removeItem('erp_google_token');
    addNotification('Google Cloud Drive synchronization unlink completed.', 'info', { title: 'Cloud Unlinked', category: 'System' });
    logAuditEntry('disconnect', 'Disconnected Google Drive auth mapping');
  };

  // Create Business Profiles workflows
  const handleCreateProfile = (name: string) => {
    if (!name.trim()) return;
    const newProfile: BusinessProfile = {
      id: `PROF-${Date.now().toString(36).toUpperCase()}`,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextList = [...profiles, newProfile];
    setProfiles(nextList);
    localStorage.setItem('erp_profiles', JSON.stringify(nextList));
    localStorage.setItem('erp_activeProfileId', newProfile.id);
    setActiveProfileId(newProfile.id);

    addNotification(`Business Profile "${newProfile.name}" initialized.`, 'success', { title: 'Profile Created', category: 'System' });
    setIsProfileModalOpen(false);
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      addNotification('Cannot terminate final core business profile context.', 'warn');
      return;
    }

    const nextList = profiles.filter((p) => p.id !== id);
    setProfiles(nextList);
    localStorage.setItem('erp_profiles', JSON.stringify(nextList));

    // Sweep all localStorage indices key matched
    Object.keys(INITIAL_DEFAULT_DATA).forEach((key) => {
      localStorage.removeItem(`erp_${id}_${key}`);
    });

    if (activeProfileId === id) {
      const remainingId = nextList[0].id;
      localStorage.setItem('erp_activeProfileId', remainingId);
      setActiveProfileId(remainingId);
    }

    addNotification('Business profile sweep and ledger purge completed.', 'info');
    setIsProfileModalOpen(false);
  };

  // Imports / Exports
  const handleExportJSON = () => {
    const rawData: { [key: string]: any } = {};
    profiles.forEach((p) => {
      const recordsObj: { [key: string]: any } = {};
      Object.keys(INITIAL_DEFAULT_DATA).forEach((k) => {
        const rawItem = localStorage.getItem(`erp_${p.id}_${k}`);
        recordsObj[k] = rawItem ? JSON.parse(rawItem) : (INITIAL_DEFAULT_DATA as any)[k];
      });
      rawData[p.id] = recordsObj;
    });

    const exportBundle = {
      version: 2,
      profiles,
      activeProfileId,
      databases: rawData,
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Enterprise_ERP_Ledgers_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addNotification('Integrated corporate backup archive compiled.', 'success', { title: 'Backup Saved', category: 'Settings' });
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const payload = JSON.parse(e.target?.result as string);
        if (payload.version === 2 && payload.profiles && payload.databases) {
          if (confirm('Initiate complete import? This will discard ongoing ledger states.')) {
            // Sweep past databases
            localStorage.clear();

            setProfiles(payload.profiles);
            localStorage.setItem('erp_profiles', JSON.stringify(payload.profiles));
            localStorage.setItem('erp_activeProfileId', payload.activeProfileId);

            // Seed profiles data into IndexedDB and LocalStorage indices
            for (const profileId of Object.keys(payload.databases)) {
              const activeDB = payload.databases[profileId];
              for (const tbl of Object.keys(activeDB)) {
                await IndexedDBManager.setItem(`erp_${profileId}_${tbl}`, activeDB[tbl]);
              }
            }

            addNotification('Databases successfully imported. Reloading application shell...', 'success');
            setTimeout(() => location.reload(), 1500);
          }
        } else {
          addNotification('Incorrect or non-compliant backup format bundle uploaded.', 'error');
        }
      } catch {
        addNotification('Parsing backup file failed.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('Warning! This will clear ALL client cache, profiles, and IndexedDB files. Proceed?')) {
      localStorage.clear();
      indexedDB.deleteDatabase('ERP_ENTERPRISE_DB');
      addNotification('Collections permanently purged. Reloading application core.', 'info');
      setTimeout(() => location.reload(), 1500);
    }
  };

  // Direct print overlays triggering function
  const triggerPrintLayout = (inv: Invoice) => {
    setPrintLayoutInvoice(inv);
    setTimeout(() => {
      window.print();
      setPrintLayoutInvoice(null);
    }, 100);
  };

  const triggerPurchasePrint = (p: Purchase) => {
    setPrintLayoutPurchase(p);
    setTimeout(() => {
      window.print();
      setPrintLayoutPurchase(null);
    }, 100);
  };

  const triggerOverdueEmail = (inv: Invoice) => {
    const subject = `Corporate Invoice Settlement Reminder: ${inv.id}`;
    const mailtext = `Dear ${inv.customer.name},\n\nThis is a standard accounts reconciliation reminder regarding outstanding invoice ${inv.id} totaling ${formatMoney(inv.calculations.grandTotal, erpData.config.currency)}. Current ledger reports indicate a due of ${formatMoney(inv.payment.dueAmount, erpData.config.currency)} which is now overdue.\n\nPlease reconcile at your convenience.\n\nFinance Team\n${erpData.config.company.name}`;
    window.open(`mailto:${inv.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailtext)}`);
    addNotification('reconciliation dispatch prompt sent.', 'success', { title: 'Collection Sent', category: 'System' });
  };

  const formatMoney = (n: number, code: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(n);
  };

  // Total metrics calculations for dashboard KPIs
  const grossRevenuesSum = erpData.invoices.reduce((sum, inv) => sum + (inv.status !== 'draft' ? inv.calculations.grandTotal : 0), 0);
  const outstandingReceivablesSum = erpData.invoices.reduce((sum, inv) => sum + (inv.status !== 'draft' ? inv.payment.dueAmount : 0), 0);
  const settlementsRealizedSum = erpData.invoices.reduce((sum, inv) => sum + (inv.status !== 'draft' ? inv.payment.paidAmount : 0), 0);
  const totalOutflowsSpent = erpData.finance.expenses.reduce((sum, item) => sum + item.amount, 0);

  // Filter listings based on globalSearch
  const globalFilteredProducts = erpData.products.filter(p => p.basicInfo.name.toLowerCase().includes(globalSearch.toLowerCase()) || p.sku.toLowerCase().includes(globalSearch.toLowerCase()));
  const globalFilteredCustomers = erpData.customers.filter(c => c.personalInfo.fullName.toLowerCase().includes(globalSearch.toLowerCase()) || c.personalInfo.phone.includes(globalSearch));

  return (
    <>
      <div className={`flex h-screen overflow-hidden ${erpData.config.theme.mode === 'dark' ? 'dark' : ''} bg-neutral-50 dark:bg-[#141218] transition-colors duration-300 antialiased`}>
        {/* Navigation Rail Collapsible Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'w-64' : 'w-20'
          } flex-shrink-0 bg-white dark:bg-[#1c1b1f] border-r border-neutral-200/50 dark:border-neutral-800/60 shadow-lg flex flex-col justify-between transition-all duration-300 ease-in-out relative z-30`}
        >
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Nav Header */}
            <div className={`flex items-center gap-3 px-4 h-16 border-b border-neutral-200/30 dark:border-neutral-800/40 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-purple-600 dark:bg-purple-500 shadow-md flex items-center justify-center text-white font-bold text-sm">
                  {erpData.config.company.name.charAt(0)}
                </div>
                {isSidebarOpen && (
                  <span className="font-display font-bold text-neutral-900 dark:text-neutral-50 truncate tracking-tight text-sm">
                    {erpData.config.company.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1 px-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-500 hover:text-neutral-900 border border-neutral-250/20"
              >
                <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
              </button>
            </div>

            {/* Nav rails listings */}
            <nav className="flex-1 py-4 px-3 space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'customers', label: 'Customers CRM', icon: '👥' },
                { id: 'products', label: 'Products Stock', icon: '📦' },
                { id: 'invoices', label: 'Invoices Desk', icon: '🧾' },
                { id: 'finance', label: 'Finance ledger', icon: '🏦' },
                { id: 'employees', label: 'Employees HR', icon: '👷' },
                { id: 'purchaselist', label: 'Purchases Desk', icon: '📥' },
                { id: 'advisor', label: 'AI Advisor', icon: '🤖' },
                { id: 'reports', label: 'Audit Reports', icon: '📈' },
                { id: 'settings', label: 'Configurations', icon: '⚙️' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all ${
                    activePanel === item.id
                      ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-750 dark:text-purple-300 font-bold'
                      : 'text-neutral-500 dark:text-neutral-450 hover:bg-neutral-100/50 dark:hover:bg-neutral-850/40 hover:text-neutral-900'
                  } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {isSidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Footer of rails */}
          <div className="p-3 border-t border-neutral-100 dark:border-neutral-850">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-850 truncate transition ${
                isSidebarOpen ? 'justify-start' : 'justify-center'
              }`}
            >
              <Building className="w-5 h-5 text-purple-600 flex-shrink-0" />
              {isSidebarOpen && (
                <div className="text-left overflow-hidden">
                  <span className="text-xs font-bold block text-neutral-900 dark:text-neutral-50 truncate">
                    {profiles.find((p) => p.id === activeProfileId)?.name || 'Default entity'}
                  </span>
                  <span className="text-[10px] text-neutral-400 block font-semibold">Switcher Profiles</span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Central main canvas panel */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Glassmorphic TOP BAR */}
          <header className="h-16 flex-shrink-0 bg-white/70 dark:bg-[#1c1b1f]/70 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between px-6 gap-4 z-20 shadow-xs relative">
            <div className="flex items-center gap-4 flex-1">
              <span className="font-display font-bold text-neutral-950 dark:text-neutral-50 text-base capitalize tracking-tight">
                {activePanel} Module
              </span>

              {/* Dynamic global search tool */}
              <div className="relative max-w-xs w-full hidden md:block">
                <span className="absolute inset-y-0 left-3 flex items-center text-neutral-450 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Global search SKUs or CRM..."
                  className="pl-9 py-1.5 text-xs rounded-xl bg-neutral-100/50 border-none dark:bg-neutral-900"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Topbar Actions widgets */}
            <div className="flex items-center gap-3">
              {/* Connection blink dot details */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                  isOnline
                    ? 'border-green-200/50 text-green-700 bg-green-50 dark:bg-green-950/20'
                    : 'border-amber-200/50 text-amber-700 bg-amber-50 dark:bg-amber-950/20'
                }`}
                title={isOnline ? 'Internet bound connection online.' : 'Offline storage enabled.'}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline">{isOnline ? 'Online' : 'Local db-Only'}</span>
              </div>

              {/* Time displays */}
              <span className="text-[11px] font-mono text-neutral-450 font-semibold hidden sm:inline">{currentTime}</span>

              {/* Material You Expressive Theme Switcher Button */}
              <button
                onClick={toggleTheme}
                className="relative inline-flex h-8 w-[64px] shrink-0 cursor-pointer items-center rounded-full bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-250/35 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                aria-label="Toggle system theme"
              >
                {/* Slidable capsule handle */}
                <span
                  className={`${
                    erpData.config.theme.mode === 'dark' ? 'translate-x-[36px] bg-purple-600' : 'translate-x-1 bg-amber-500'
                  } pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md ring-0 transition-transform duration-300 ease-out flex items-center justify-center text-white`}
                >
                  {erpData.config.theme.mode === 'dark' ? (
                    <Moon className="w-3.5 h-3.5" />
                  ) : (
                    <Sun className="w-3.5 h-3.5" />
                  )}
                </span>
                
                {/* Background labels/icons */}
                <span className="absolute left-2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
                  <Sun className={`w-3.5 h-3.5 transition-opacity duration-300 ${erpData.config.theme.mode === 'light' ? 'opacity-0' : 'opacity-100'}`} />
                </span>
                <span className="absolute right-2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
                  <Moon className={`w-3.5 h-3.5 transition-opacity duration-300 ${erpData.config.theme.mode === 'dark' ? 'opacity-0' : 'opacity-100'}`} />
                </span>
              </button>

              {/* Quick Actions Trigger */}
              <button
                onClick={() => setIsQuickActionsOpen(true)}
                className="py-1 px-2.5 rounded-full font-bold text-xs bg-purple-600 text-white shrink-0 hover:bg-purple-700 transition flex items-center gap-1 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> Action
              </button>

              {/* Warnings Bell details */}
              <button
                onClick={() => setIsNotifHistoryOpen(true)}
                className="p-2 border border-neutral-250/20 rounded-full hover:bg-neutral-100 transition relative flex items-center justify-center text-neutral-500"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Profiles switch triggers */}
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="p-1 px-1.5 rounded-xl border border-neutral-250/20 text-xs font-bold flex items-center gap-1.5 text-neutral-600 hover:bg-neutral-100"
              >
                <Building className="w-4.5 h-4.5 text-purple-600" />
                <span className="hidden sm:inline max-w-[100px] truncate">{profiles.find((p) => p.id === activeProfileId)?.name}</span>
              </button>
            </div>
          </header>

          {/* Central responsive workspace scrolling area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Syncing databases assets...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel + globalSearch}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18 }}
                  className="h-full"
                >
                  {/* Global Search result panel overlay */}
                  {globalSearch.length > 0 ? (
                    <div className="card space-y-6">
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-150">
                        <h4 className="font-bold font-display text-neutral-900 dark:text-neutral-50">Filtered Multi-Indexes search ({globalFilteredProducts.length + globalFilteredCustomers.length})</h4>
                        <button onClick={() => setGlobalSearch('')} className="btn btn-outlined btn-sm">Clear Filter</button>
                      </div>

                      {/* Products found */}
                      {globalFilteredProducts.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">Matched Catalog SKUs</h5>
                          <div className="table-shell">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {globalFilteredProducts.map((p) => (
                                  <tr key={p.id}>
                                    <td className="p-3 font-bold font-mono text-xs">{p.sku}</td>
                                    <td className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">{p.basicInfo.name}</td>
                                    <td className="p-3 text-xs text-neutral-400">{p.basicInfo.category}</td>
                                    <td className="p-3 text-right font-mono font-bold text-green-600">{formatMoney(p.pricing.salePrice, erpData.config.currency)}</td>
                                    <td className="p-3 text-right font-mono font-medium">{p.stock.available} Left</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Customers found */}
                      {globalFilteredCustomers.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">Matched Customers Accounts</h5>
                          <div className="table-shell">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {globalFilteredCustomers.map((c) => (
                                  <tr key={c.id}>
                                    <td className="p-3 font-bold font-mono text-xs">{c.id}</td>
                                    <td className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">{c.personalInfo.fullName}</td>
                                    <td className="p-3 text-xs text-neutral-500">{c.personalInfo.phone}</td>
                                    <td className="p-3 text-xs text-neutral-400">{c.personalInfo.email}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {globalFilteredProducts.length === 0 && globalFilteredCustomers.length === 0 && (
                        <div className="p-8 text-center text-xs text-neutral-400">No records matching query indices found.</div>
                      )}
                    </div>
                  ) : (
                    /* General module switches */
                    <>
                      {activePanel === 'dashboard' && (
                        <div className="space-y-6">
                          {/* KPI Widget Dashboard Panels */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block font-sans">Accumulated Revenues</span>
                              <div className="text-2xl font-bold font-mono mt-1 text-neutral-950 dark:text-neutral-50">{formatMoney(grossRevenuesSum, erpData.config.currency)}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Funds Received (Paid)</span>
                              <div className="text-2xl font-bold font-mono mt-1 text-green-600">{formatMoney(settlementsRealizedSum, erpData.config.currency)}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Collections Overdue (Receivables)</span>
                              <div className="text-2xl font-bold font-mono mt-1 text-red-500">{formatMoney(outstandingReceivablesSum, erpData.config.currency)}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Outlays Disbursed (Costs)</span>
                              <div className="text-2xl font-bold font-mono mt-1 text-purple-650 dark:text-purple-400">{formatMoney(totalOutflowsSpent, erpData.config.currency)}</div>
                            </div>
                          </div>

                          {/* Charts breakdowns */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm lg:col-span-2">
                              <h3 className="font-bold text-neutral-950 dark:text-neutral-50 mb-3 font-display text-sm">Monthly Revenue Track</h3>
                              {erpData.sales.length > 0 ? (
                                <CustomChart
                                  title="Year Sales Curve"
                                  data={erpData.sales.slice(0, 10).map((s) => ({
                                    label: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                    value: s.totalAmount,
                                  }))}
                                  type="area"
                                  color="#6750A4"
                                />
                              ) : (
                                <div className="p-8 text-center text-xs text-neutral-400">Insufficiant metrics registered.</div>
                              )}
                            </div>

                            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
                              <h3 className="font-bold text-neutral-950 dark:text-neutral-50 mb-3 font-display text-sm">Profit Breakdown</h3>
                              <CustomChart
                                title="Finance Composition"
                                data={[
                                  { label: 'Revenues', value: grossRevenuesSum },
                                  { label: 'Expenses', value: totalOutflowsSpent },
                                ]}
                                type="pie"
                                color="#6750A4"
                                secondaryColor="#EFB8C8"
                              />
                            </div>
                          </div>

                          {/* Recent invoices logged table list */}
                          <div className="card">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 mb-4 font-display">Recent Invoices</h3>
                            <div className="table-shell">
                              <table className="w-full text-left text-sm whitespace-nowrap bg-white dark:bg-[#1c1b1f]">
                                <thead className="bg-[#f0edf5] dark:bg-neutral-800 text-xs font-bold uppercase text-neutral-600 tracking-wider">
                                  <tr>
                                    <th className="p-3">Invoice ID</th>
                                    <th className="p-3">Client details</th>
                                    <th className="p-3 text-right">Invoice Sum</th>
                                    <th className="p-3">Payment status</th>
                                    <th className="p-3">Date Dispatched</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                  {erpData.invoices.slice(0, 5).map((inv) => (
                                    <tr key={inv.id}>
                                      <td className="p-3 font-mono font-bold text-xs">{inv.id}</td>
                                      <td className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">{inv.customer.name}</td>
                                      <td className="p-3 text-right font-mono font-bold text-purple-600">{formatMoney(inv.calculations.grandTotal, erpData.config.currency)}</td>
                                      <td className="p-3">
                                        <span className="badge badge-green uppercase text-[9px] font-bold">{inv.status}</span>
                                      </td>
                                      <td className="p-3 text-xs text-neutral-400">{new Date(inv.createdAt).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                  {erpData.invoices.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="p-4 text-center text-xs text-neutral-400">Empty transaction registers.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {activePanel === 'customers' && (
                        <CustomerModule
                          customers={erpData.customers}
                          currency={erpData.config.currency}
                          onSaveCustomer={(cust) => {
                            const next = erpData.customers.some((c) => c.id === cust.id)
                              ? erpData.customers.map((c) => (c.id === cust.id ? cust : c))
                              : [...erpData.customers, cust];
                            handleEntityStateMutator('customers', next, 'update', `Onboarded/Updated Customer: ${cust.personalInfo.fullName}`);
                          }}
                          onDeleteCustomer={(id) => {
                            const next = erpData.customers.filter((c) => c.id !== id);
                            handleEntityStateMutator('customers', next, 'delete', `Removed Customer ID: ${id}`);
                          }}
                        />
                      )}

                      {activePanel === 'products' && (
                        <ProductModule
                          products={erpData.products}
                          suppliers={erpData.suppliers}
                          currency={erpData.config.currency}
                          onSaveProduct={(p) => {
                            const next = erpData.products.some((item) => item.id === p.id)
                              ? erpData.products.map((item) => (item.id === p.id ? p : item))
                              : [...erpData.products, p];
                            handleEntityStateMutator('products', next, 'update', `Onboarded/Updated Product: ${p.sku}`);
                          }}
                          onDeleteProduct={(id) => {
                            const next = erpData.products.filter((p) => p.id !== id);
                            handleEntityStateMutator('products', next, 'delete', `Removed Product: ${id}`);
                          }}
                        />
                      )}

                      {activePanel === 'invoices' && (
                        <InvoiceModule
                          invoices={erpData.invoices}
                          customers={erpData.customers}
                          products={erpData.products}
                          employees={erpData.employees}
                          offers={erpData.offers}
                          currency={erpData.config.currency}
                          configLogo={erpData.config.logo}
                          onSaveLogo={(logo) => {
                            setErpData((prev) => {
                              const updated = { ...prev, config: { ...prev.config, logo } };
                              IndexedDBManager.setItem(`erp_${activeProfileId}_config`, updated.config);
                              return updated;
                            });
                          }}
                          onSaveInvoice={(inv) => {
                            const isNew = !erpData.invoices.some((i) => i.id === inv.id);
                            const nextInvs = isNew ? [inv, ...erpData.invoices] : erpData.invoices.map((i) => (i.id === inv.id ? inv : i));
                            
                            let nextIncomes = [...erpData.finance.income];
                            if (inv.status === 'paid' && isNew) {
                              const newIncome: Income = {
                                id: `INC-${Date.now().toString(36).toUpperCase()}`,
                                source: 'invoice',
                                amount: inv.calculations.grandTotal,
                                date: new Date().toISOString(),
                                referenceId: inv.id,
                              };
                              nextIncomes = [newIncome, ...nextIncomes];
                            }

                            // Adjust stock levels
                            const nextProds = [...erpData.products];
                            if (isNew) {
                              inv.items.forEach((it) => {
                                const pIdx = nextProds.findIndex((p) => p.id === it.productId);
                                if (pIdx >= 0) {
                                  nextProds[pIdx].stock.quantity = Math.max(0, nextProds[pIdx].stock.quantity - it.quantity);
                                  nextProds[pIdx].stock.available = Math.max(0, nextProds[pIdx].stock.available - it.quantity);
                                }
                              });
                            }

                            setErpData((prev) => {
                              const updated = {
                                ...prev,
                                invoices: nextInvs,
                                products: nextProds,
                                finance: { ...prev.finance, income: nextIncomes }
                              };
                              IndexedDBManager.saveProfileData(activeProfileId, updated);
                              return updated;
                            });

                            logAuditEntry('create', `Created/Modified invoice: ${inv.id}`);
                          }}
                          onDeleteInvoice={(id) => {
                            const nextInvs = erpData.invoices.filter((i) => i.id !== id);
                            const nextSales = erpData.sales.filter((s) => s.invoiceId !== id);
                            const nextIncomes = erpData.finance.income.filter((inc) => inc.referenceId !== id);
                            setErpData((prev) => {
                              const updated = {
                                ...prev,
                                invoices: nextInvs,
                                sales: nextSales,
                                finance: { ...prev.finance, income: nextIncomes }
                              };
                              IndexedDBManager.saveProfileData(activeProfileId, updated);
                              return updated;
                            });
                            logAuditEntry('delete', `Wiped invoice: ${id}`);
                          }}
                          onPrintInvoice={triggerPrintLayout}
                          onMailInvoice={triggerOverdueEmail}
                        />
                      )}

                      {activePanel === 'finance' && (
                        <FinanceModule
                          finance={erpData.finance}
                          currency={erpData.config.currency}
                          onSaveIncome={(inc) => {
                            const nextList = [inc, ...erpData.finance.income];
                            setErpData((prev) => {
                              const updated = { ...prev, finance: { ...prev.finance, income: nextList } };
                              IndexedDBManager.setItem(`erp_${activeProfileId}_finance`, updated.finance);
                              return updated;
                            });
                          }}
                          onSaveExpense={(exp) => {
                            const nextList = [exp, ...erpData.finance.expenses];
                            setErpData((prev) => {
                              const updated = { ...prev, finance: { ...prev.finance, expenses: nextList } };
                              IndexedDBManager.setItem(`erp_${activeProfileId}_finance`, updated.finance);
                              return updated;
                            });
                          }}
                          onDeleteIncome={(id) => {
                            const nextList = erpData.finance.income.filter(inc => inc.id !== id);
                            setErpData((prev) => {
                              const updated = { ...prev, finance: { ...prev.finance, income: nextList } };
                              IndexedDBManager.setItem(`erp_${activeProfileId}_finance`, updated.finance);
                              return updated;
                            });
                          }}
                          onDeleteExpense={(id) => {
                            const nextList = erpData.finance.expenses.filter(exp => exp.id !== id);
                            setErpData((prev) => {
                              const updated = { ...prev, finance: { ...prev.finance, expenses: nextList } };
                              IndexedDBManager.setItem(`erp_${activeProfileId}_finance`, updated.finance);
                              return updated;
                            });
                          }}
                        />
                      )}

                      {activePanel === 'employees' && (
                        <HRMModule
                          employees={erpData.employees}
                          suppliers={erpData.suppliers}
                          sales={erpData.sales}
                          currency={erpData.config.currency}
                          onSaveEmployee={(emp) => {
                            const next = erpData.employees.some(item => item.id === emp.id)
                              ? erpData.employees.map(item => item.id === emp.id ? emp : item)
                              : [...erpData.employees, emp];
                            handleEntityStateMutator('employees', next, 'update', 'Updated employee staff rosters directories');
                          }}
                          onSaveSupplier={(supp) => {
                            const next = erpData.suppliers.some(item => item.id === supp.id)
                              ? erpData.suppliers.map(item => item.id === supp.id ? supp : item)
                              : [...erpData.suppliers, supp];
                            handleEntityStateMutator('suppliers', next, 'update', 'Updated supplier distribution vendors catalogs');
                          }}
                          onDeleteEmployee={(id) => handleEntityStateMutator('employees', erpData.employees.filter(e => e.id !== id), 'delete', 'Removed employee records')}
                          onDeleteSupplier={(id) => handleEntityStateMutator('suppliers', erpData.suppliers.filter(s => s.id !== id), 'delete', 'Discarded supplier listing')}
                        />
                      )}

                      {activePanel === 'purchaselist' && (
                        <ProcurementModule
                          purchases={erpData.purchases}
                          deliveries={erpData.deliveries}
                          offers={erpData.offers}
                          suppliers={erpData.suppliers}
                          products={erpData.products}
                          currency={erpData.config.currency}
                          onSavePurchase={(p) => {
                            const isNew = !erpData.purchases.some((item) => item.id === p.id);
                            const next = isNew ? [...erpData.purchases, p] : erpData.purchases.map((item) => item.id === p.id ? p : item);
                            
                            // Adjust stock if PO completed
                            if (p.status === 'completed' && isNew) {
                              p.items.forEach((it) => {
                                const pIdx = erpData.products.findIndex((p) => p.id === it.productId);
                                if (pIdx >= 0) {
                                  erpData.products[pIdx].stock.quantity += it.quantity;
                                  erpData.products[pIdx].stock.available += it.quantity;
                                }
                              });
                            }
                            
                            handleEntityStateMutator('purchases', next, 'update', `Registered Restock PO Order: ${p.id}`);
                          }}
                          onSaveDelivery={(d) => {
                            const next = erpData.deliveries.some((item) => item.id === d.id)
                              ? erpData.deliveries.map((item) => item.id === d.id ? d : item)
                              : [...erpData.deliveries, d];
                            handleEntityStateMutator('deliveries', next, 'update', 'Modified logistics delivery tracking');
                          }}
                          onSaveOffer={(o) => {
                            const next = erpData.offers.some((item) => item.id === o.id)
                              ? erpData.offers.map((item) => item.id === o.id ? o : item)
                              : [...erpData.offers, o];
                            handleEntityStateMutator('offers', next, 'update', 'Configured active voucher coupon promo code');
                          }}
                          onDeletePurchase={(id) => handleEntityStateMutator('purchases', erpData.purchases.filter(item => item.id !== id), 'delete', 'Wiped PO Order')}
                          onDeleteDelivery={(id) => handleEntityStateMutator('deliveries', erpData.deliveries.filter(item => item.id !== id), 'delete', 'Deleted delivery tracking')}
                          onDeleteOffer={(id) => handleEntityStateMutator('offers', erpData.offers.filter(item => item.id !== id), 'delete', 'Wounded promotional promo voucher')}
                          onPrintPurchase={triggerPurchasePrint}
                        />
                      )}

                      {activePanel === 'advisor' && (
                        <AIAdvisor
                          data={erpData}
                          currency={erpData.config.currency}
                          onNavigate={(panel) => setActivePanel(panel)}
                          triggerQuickPurchase={(prod) => {
                            const suggestedSupplier = prod.supplierId ? erpData.suppliers.find((s) => s.id === prod.supplierId) : null;
                            const reorderQty = prod.stock?.reorderLevel ? prod.stock.reorderLevel * 2 : 10;
                            const quickPO: Purchase = {
                              id: `PURCH-${Date.now().toString(36).toUpperCase()}`,
                              supplierId: suggestedSupplier?.id || erpData.suppliers[0]?.id || '',
                              items: [{ productId: prod.id, quantity: reorderQty, costPrice: prod.pricing.costPrice, size: prod.basicInfo.size.split(',')[0] || '', notes: 'AI Auto-generated reorder restock' }],
                              totalCost: reorderQty * prod.pricing.costPrice,
                              date: new Date().toISOString(),
                              status: 'pending',
                              paymentMethod: 'cash',
                              transactionId: '',
                            };
                            const nextPurchases = [quickPO, ...erpData.purchases];
                            handleEntityStateMutator('purchases', nextPurchases, 'create', `AI Auto-generated reorder restock for ${prod.basicInfo.name}`);
                            setActivePanel('purchaselist');
                            addNotification('Prefilled Purchase Order dispatched. Complete transaction upon arrival.', 'info');
                          }}
                        />
                      )}

                      {activePanel === 'reports' && (
                        <Reports
                          data={erpData}
                          currency={erpData.config.currency}
                          onGenerateReport={() => {
                            const report = {
                              id: `RPT-${Date.now().toString(36).toUpperCase()}`,
                              type: 'audit',
                              data: {
                                totalSales: grossRevenuesSum,
                                totalProfit: grossRevenuesSum - totalOutflowsSpent,
                                totalExpense: totalOutflowsSpent,
                              },
                              generatedAt: new Date().toISOString(),
                            };
                            const next = [...erpData.reports, report];
                            handleEntityStateMutator('reports', next, 'create', 'Generated dynamic corporate financial audit ledger');
                            addNotification('Finance audit logged successfully.', 'success');
                          }}
                        />
                      )}

                      {activePanel === 'settings' && (
                        <Settings
                          config={erpData.config}
                          googleToken={googleToken}
                          onSaveConfig={saveConfiguration}
                          onExportJSON={handleExportJSON}
                          onImportJSON={handleImportJSON}
                          onClearData={handleClearData}
                          onGoogleSignIn={handleGoogleSignIn}
                          onGoogleSignOut={handleGoogleSignOut}
                        />
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>

      {/* Business profiles switcher POP-UP overlay */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-0 animate-fade-in shadow-2xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 max-w-lg w-full mx-4 animate-slide-up">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h4 className="font-bold font-display text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
                <Building className="w-5 h-5 text-purple-600" /> Switch Corporate Profiles
              </h4>
              <button onClick={() => setIsProfileModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400 hover:text-neutral-950" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      p.id === activeProfileId
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20'
                        : 'border-neutral-200/50 hover:bg-neutral-50 dark:border-neutral-800/40'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-neutral-900 dark:text-neutral-50 block text-xs">{p.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono block">Profile ID: {p.id}</span>
                    </div>

                    <div className="flex gap-2">
                      {p.id !== activeProfileId && (
                        <button
                          onClick={() => {
                            localStorage.setItem('erp_activeProfileId', p.id);
                            setActiveProfileId(p.id);
                            setIsProfileModalOpen(false);
                            addNotification(`Switched entity mapping workspace context to "${p.name}".`, 'info');
                          }}
                          className="btn btn-filled btn-sm font-bold active-btn"
                        >
                          Select Workspace
                        </button>
                      )}
                      <button
                        disabled={profiles.length <= 1}
                        onClick={() => handleDeleteProfile(p.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 disabled:opacity-30 transition rounded-full"
                        title="Delete Profile and related local DB nodes"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Profiles creation trigger */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Onboard New Profile Entity</h5>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = (e.target as any).querySelector('input').value;
                    if (val) {
                      handleCreateProfile(val);
                      (e.target as any).reset();
                    }
                  }}
                  className="flex gap-2"
                >
                  <input placeholder="Enter business name e.g. Acme Footwear..." required className="flex-1 py-1.5 text-xs rounded-xl" />
                  <button type="submit" className="btn btn-filled text-xs py-1.5 px-3.5 font-bold shrink-0">Onboard Profile</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK OPERATIONS ACTIONS modal overlay */}
      {isQuickActionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-0 animate-fade-in shadow-2xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 max-w-sm w-full mx-4 animate-slide-up">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h4 className="font-bold font-display text-neutral-900 dark:text-neutral-50 text-sm">Quick Actions Desk</h4>
              <button onClick={() => setIsQuickActionsOpen(false)}>
                <X className="w-5 h-5 text-neutral-400 hover:text-neutral-950" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  setActivePanel('invoices');
                  setTimeout(() => {
                    addNotification('Redirected to invoices checkout desk. Use Create Invoice action button.', 'info');
                  }, 100);
                }}
                className="w-full p-3.5 rounded-xl border border-neutral-250/20 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition text-neutral-700 dark:text-neutral-200 font-semibold text-xs"
              >
                <span>🧾</span> Draft new Invoice checkout
              </button>
              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  setActivePanel('customers');
                  setTimeout(() => {
                    addNotification('Redirected to CRM client directories index.', 'info');
                  }, 100);
                }}
                className="w-full p-3.5 rounded-xl border border-neutral-250/20 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition text-neutral-700 dark:text-neutral-200 font-semibold text-xs"
              >
                <span>👥</span> onboard Customer Profile
              </button>
              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  setActivePanel('finance');
                  setTimeout(() => {
                    addNotification('Redirected to Bookkeeping desk. Use Add bookkeeping items trigger.', 'info');
                  }, 100);
                }}
                className="w-full p-3.5 rounded-xl border border-neutral-250/20 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition text-neutral-700 dark:text-neutral-200 font-semibold text-xs"
              >
                <span>🏦</span> Post dynamic Expenditure flow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS HISTORY CENTER MODAL OVERLAY */}
      {isNotifHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-0 animate-fade-in shadow-2xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 max-w-lg w-full mx-4 animate-slide-up flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h4 className="font-bold font-display text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
                <History className="w-5 h-5 text-purple-600 animate-spin-slow" /> Notifications Alerts history
              </h4>
              <button onClick={() => setIsNotifHistoryOpen(false)}>
                <X className="w-5 h-5 text-neutral-400 hover:text-neutral-950" />
              </button>
            </div>

            <div className="flex justify-between items-center mb-3">
              <button onClick={markAllAsRead} className="text-xs text-purple-650 hover:underline font-bold">Mark all read</button>
              <button onClick={clearAllNotifications} className="text-xs text-red-500 hover:underline flex items-center gap-1 font-bold">
                <Trash2 className="w-3.5 h-3.5" /> Clear Logs
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">Security history logs are empty.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border border-neutral-200/50 dark:border-neutral-800/40 relative ${
                      !n.isRead ? 'bg-purple-50/50 dark:bg-purple-950/20' : 'bg-white dark:bg-neutral-950'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1 pb-1">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">{n.category}</span>
                      <span className="text-[8px] text-neutral-450 font-mono font-medium">{new Date(n.timestamp).toLocaleString()}</span>
                    </div>
                    <h5 className="font-bold text-neutral-900 dark:text-neutral-50 text-xs">{n.title}</h5>
                    <p className="text-neutral-600 dark:text-neutral-350 text-[11px] leading-relaxed mt-1">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRINT INVOICE TEMPLATE (OFFLINE DEDICATED LAYER) ==================== */}
      {printLayoutInvoice && (
        <div className="absolute inset-0 bg-white text-black p-10 font-sans z-[99999] print-card border-none scrollbar-none w-full">
          <div className="flex justify-between items-start pb-6 border-b border-neutral-300">
            <div>
              {erpData.config.logo && <img src={erpData.config.logo} alt="Acme logo" className="max-h-16 max-w-xs mb-3 object-contain" />}
              <h2 className="text-xl font-bold tracking-tight uppercase">{erpData.config.company.name}</h2>
              <p className="text-xs mt-1 text-neutral-600">{erpData.config.company.address}</p>
              <p className="text-xs text-neutral-600">Phone: {erpData.config.company.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold tracking-widest uppercase">INVOICE</h1>
              <p className="font-mono font-bold mt-2">#{printLayoutInvoice.id}</p>
              <p className="text-xs text-neutral-500 mt-1">Date: {new Date(printLayoutInvoice.createdAt).toLocaleString()}</p>
              {printLayoutInvoice.dueDate && (
                <p className="text-xs text-neutral-500">Term Limit: {new Date(printLayoutInvoice.dueDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 my-8 text-sm">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-2">Billed To</h4>
              <h3 className="font-bold text-base text-neutral-900">{printLayoutInvoice.customer.name}</h3>
              <p className="text-xs text-neutral-600 mt-1 max-w-xs">{printLayoutInvoice.customer.address}</p>
              <p className="text-xs font-semibold mt-1">Phone: {printLayoutInvoice.customer.phone}</p>
            </div>
            <div className="text-right">
              <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-2">Checkout Details</h4>
              <p className="text-xs">Payment Method: <strong>{printLayoutInvoice.payment.method.toUpperCase()}</strong></p>
              <p className="text-xs font-mono mt-1">Ref Ref: <strong>{printLayoutInvoice.payment.transactionId || '—'}</strong></p>
              <p className="text-xs font-medium mt-1">Status State: <strong>{printLayoutInvoice.status.toUpperCase()}</strong></p>
            </div>
          </div>

          <table className="w-full border-collapse mt-8 text-xs text-left">
            <thead>
              <tr className="border-b-2 border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider">
                <th className="py-2">Item Product ID</th>
                <th className="py-2">specifications Details</th>
                <th className="py-2">Size</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right font-bold">Sum total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {printLayoutInvoice.items.map((it, idx) => (
                <tr key={idx} className="py-2.5">
                  <td className="py-3 font-mono font-bold">{it.productId}</td>
                  <td className="py-3 font-semibold">{it.name}</td>
                  <td className="py-3 text-neutral-500">{it.size || 'Standard'}</td>
                  <td className="py-3 text-right font-mono">{it.quantity}</td>
                  <td className="py-3 text-right font-mono">{formatMoney(it.unitPrice, erpData.config.currency)}</td>
                  <td className="py-3 text-right font-mono font-bold">{formatMoney(it.subtotal, erpData.config.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="w-full max-w-xs ml-auto space-y-1.5 border-t-2 border-neutral-300 pt-4 mt-6 text-xs font-semibold">
            <div className="flex justify-between">
              <span className="text-neutral-400">Sum Items Total:</span>
              <span className="font-mono">{formatMoney(printLayoutInvoice.calculations.subTotal, erpData.config.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Aggregate VAT Taxes:</span>
              <span className="font-mono">{formatMoney(printLayoutInvoice.calculations.totalTax, erpData.config.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900">
              <span>Grand Net Total:</span>
              <span className="font-mono">{formatMoney(printLayoutInvoice.calculations.grandTotal, erpData.config.currency)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Cash Settled:</span>
              <span className="font-mono">{formatMoney(printLayoutInvoice.payment.paidAmount, erpData.config.currency)}</span>
            </div>
            <div className="flex justify-between text-red-500 font-bold">
              <span>Arrears Remaining:</span>
              <span className="font-mono">{formatMoney(printLayoutInvoice.payment.dueAmount, erpData.config.currency)}</span>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-6 mt-16 flex items-center justify-between text-[10px] text-neutral-400 font-semibold font-mono">
            <span>Corporate Invoice Ref: {printLayoutInvoice.id}</span>
            <span>Thank you for choosing Acme Industries.</span>
          </div>
        </div>
      )}

      {/* ==================== PRINT PURCHASE ORDER TEMPLATE (OFFLINE DEDICATED LAYER) ==================== */}
      {printLayoutPurchase && (
        <div className="absolute inset-0 bg-white text-black p-10 font-sans z-[99999] print-card border-none scrollbar-none w-full">
          <div className="flex justify-between items-start pb-6 border-b border-neutral-300">
            <div>
              <h2 className="text-xl font-bold tracking-tight uppercase">{erpData.config.company.name}</h2>
              <p className="text-xs mt-1 text-neutral-600">{erpData.config.company.address}</p>
              <p className="text-xs text-neutral-600">Phone: {erpData.config.company.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold tracking-widest uppercase text-red-600">PURCHASE ORDER</h1>
              <p className="font-mono font-bold mt-2">#{printLayoutPurchase.id}</p>
              <p className="text-xs text-neutral-500 mt-1">Date: {new Date(printLayoutPurchase.date).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 my-8 text-sm">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-2">Supplier Vendor</h4>
              <h3 className="font-bold text-base text-neutral-900">
                {erpData.suppliers.find((s) => s.id === printLayoutPurchase.supplierId)?.name || 'Direct Vendor'}
              </h3>
              <p className="text-xs text-neutral-600 mt-1">
                {erpData.suppliers.find((s) => s.id === printLayoutPurchase.supplierId)?.address || 'Address unlisted'}
              </p>
              <p className="text-xs font-semibold mt-1">
                Phone: {erpData.suppliers.find((s) => s.id === printLayoutPurchase.supplierId)?.phone || '—'}
              </p>
            </div>
            <div className="text-right">
              <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-2">Procure parameters</h4>
              <p className="text-xs">Payment Method: <strong>{printLayoutPurchase.paymentMethod?.toUpperCase() || 'CASH'}</strong></p>
              <p className="text-xs font-mono mt-1">Ref Transaction ID: <strong>{printLayoutPurchase.transactionId || '—'}</strong></p>
              <p className="text-xs font-medium mt-1">Fulfillment State: <strong>{printLayoutPurchase.status.toUpperCase()}</strong></p>
            </div>
          </div>

          <table className="w-full border-collapse mt-8 text-xs text-left">
            <thead>
              <tr className="border-b-2 border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider">
                <th className="py-2">Item SKU ID</th>
                <th className="py-2">Product Description</th>
                <th className="py-2">Size</th>
                <th className="py-2 text-right">Procure Qty</th>
                <th className="py-2 text-right">Unit Cost</th>
                <th className="py-2 text-right font-bold">Sum total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {printLayoutPurchase.items.map((it, idx) => (
                <tr key={idx} className="py-2.5">
                  <td className="py-3 font-mono font-bold">{it.productId}</td>
                  <td className="py-3 font-semibold">{erpData.products.find(p => p.id === it.productId)?.basicInfo.name || 'Auto-created product'}</td>
                  <td className="py-3 text-neutral-500">{it.size || 'Standard'}</td>
                  <td className="py-3 text-right font-mono">{it.quantity}</td>
                  <td className="py-3 text-right font-mono">{formatMoney(it.costPrice, erpData.config.currency)}</td>
                  <td className="py-3 text-right font-mono font-bold">{formatMoney(it.quantity * it.costPrice, erpData.config.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="w-full max-w-xs ml-auto border-t-2 border-neutral-300 pt-4 mt-6 text-sm font-bold flex justify-between text-neutral-900">
            <span>Aggregate PO Cost:</span>
            <span className="font-mono">{formatMoney(printLayoutPurchase.totalCost, erpData.config.currency)}</span>
          </div>

          <div className="border-t border-neutral-200 pt-6 mt-16 flex items-center justify-between text-[11px] text-neutral-400 font-bold font-mono">
            <span>Corporate Purchase Order Ref: {printLayoutPurchase.id}</span>
            <span>Acme Procurement Center.</span>
          </div>
        </div>
      )}
    </>
  );
}
