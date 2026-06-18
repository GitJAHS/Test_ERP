/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ERPData, AppConfig } from '../types';
import { Settings2, Download, Upload, ShieldAlert, Cloud, HelpCircle } from 'lucide-react';

interface SettingsProps {
  config: AppConfig;
  googleToken: string | null;
  onSaveConfig: (cfg: AppConfig) => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onClearData: () => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
}

export function Settings({
  config,
  googleToken,
  onSaveConfig,
  onExportJSON,
  onImportJSON,
  onClearData,
  onGoogleSignIn,
  onGoogleSignOut,
}: SettingsProps) {
  const handleConfigSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const companyName = formData.get('companyName') as string;
    const companyAddress = formData.get('companyAddress') as string;
    const companyPhone = formData.get('companyPhone') as string;
    const currency = formData.get('currency') as string;
    const country = formData.get('country') as string;
    const themeMode = formData.get('themeMode') as 'light' | 'dark';
    const accentColor = formData.get('accentColor') as string;
    const googleClientId = formData.get('googleClientId') as string;

    const updatedConfig: AppConfig = {
      ...config,
      company: {
        name: companyName,
        address: companyAddress,
        phone: companyPhone,
      },
      currency: currency || 'USD',
      country: country || 'US',
      theme: {
        mode: themeMode,
        accentColor: accentColor || '#6750A4',
      },
      settings: {
        ...config.settings,
        googleClientId: googleClientId || '',
      },
    };

    onSaveConfig(updatedConfig);
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
      {/* Parameters Panel card */}
      <div className="card">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-6 text-neutral-850 dark:text-neutral-50">
          <Settings2 className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-lg font-display">System Configuration & Coordinates</h3>
        </div>

        <form onSubmit={handleConfigSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="field">
              <label>Corporate Name *</label>
              <input name="companyName" required defaultValue={config.company.name} placeholder="Acme Corp" />
            </div>

            <div className="field">
              <label>Commercial Phone</label>
              <input name="companyPhone" defaultValue={config.company.phone} placeholder="+1-555-0000" />
            </div>

            <div className="field md:col-span-2">
              <label>Headquarters Postal Billing Address</label>
              <input name="companyAddress" defaultValue={config.company.address} placeholder="123 Corporate Way, City, State" />
            </div>

            <div className="field">
              <label>Default Currency (ISO e.g. USD, BDT, EUR)</label>
              <input name="currency" defaultValue={config.currency} placeholder="USD" className="font-mono uppercase font-bold" />
            </div>

            <div className="field">
              <label>Origin Country</label>
              <input name="country" defaultValue={config.country} placeholder="US" />
            </div>

            <div className="field">
              <label>Theme Display Mode</label>
              <select name="themeMode" defaultValue={config.theme.mode}>
                <option value="light">Material You Light Theme</option>
                <option value="dark">Material You Dark Theme</option>
              </select>
            </div>

            <div className="field">
              <label>M3 Dynamic Accent Color Source</label>
              <div className="flex items-center gap-3">
                <input type="color" name="accentColor" defaultValue={config.theme.accentColor} className="w-12 h-10 p-0 rounded-lg cursor-pointer border border-neutral-200/50" />
                <span className="font-mono text-xs text-neutral-400 font-bold uppercase">{config.theme.accentColor}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex gap-3 justify-end">
            <button type="submit" className="btn btn-filled">
              Save Active Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Google Cloud Drive Sync System Component */}
      <div className="card">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/20">
            <Cloud className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-50 font-display">Google Drive Accounts synchronization</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
              Syncing active business profiles ledger state nodes securely inside files backups on Google Drive directories.
            </p>
          </div>
        </div>

        <form onSubmit={handleConfigSubmit} className="space-y-4">
          <div className="field max-w-xl">
            <label>Google API Client ID (gsi/client OAuth 2.0 Web Client)</label>
            <input
              name="googleClientId"
              defaultValue={config.settings?.googleClientId || ''}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
              className="font-mono text-xs"
            />
            <span className="text-[10px] text-neutral-400 leading-relaxed mt-1 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 flex-shrink-0" />
              Configure standard Client IDs at console.cloud.google.com under Auth registration credentials.
            </span>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs">
              Status State:{' '}
              {googleToken ? (
                <span className="text-green-600 font-bold bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
                  ✓ Linked Online
                </span>
              ) : (
                <span className="text-neutral-400 font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full uppercase text-[10px]">
                  Offline Cache
                </span>
              )}
            </div>

            {googleToken ? (
              <button type="button" onClick={onGoogleSignOut} className="btn btn-outlined text-xs py-1.5 px-3">
                Disconnect Cloud Drive
              </button>
            ) : (
              <button type="button" onClick={onGoogleSignIn} className="btn btn-filled flex items-center gap-1.5 text-xs py-1.5 px-3">
                Connect Google Account
              </button>
            )}
          </div>
        </form>
      </div>

      {/* JSON File Backup system */}
      <div className="card">
        <h3 className="font-bold text-neutral-900 dark:text-neutral-50 font-display mb-2">Backups System</h3>
        <p className="text-xs text-neutral-400 leading-relaxed mb-4">Export or import consolidated system nodes. Imports overwrite entire active databases.</p>

        <div className="flex flex-wrap gap-3">
          <button onClick={onExportJSON} className="btn btn-outlined text-xs flex items-center gap-1.5 py-1.5 px-3">
            <Download className="w-4 h-4" /> Download Backup Archive (JSON)
          </button>
          <label className="btn btn-tonal text-neutral-700 dark:text-neutral-200 text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer">
            <Upload className="w-4 h-4" /> Upload/Restore from File
            <input type="file" accept=".json" onChange={handleImportChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Purges warnings */}
      <div className="card border-red-500/10 hover:border-red-500/30 transition">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-50 font-display">System Database Purge Zone</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
              Instantly cleans local cache storage and discards records nodes. Accounts cannot be un-purged.
            </p>
            <button onClick={onClearData} className="btn btn-danger text-xs py-1.5 px-3 font-bold mt-3">
              Purge Database Collections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
