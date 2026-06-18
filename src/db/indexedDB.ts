/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ERPData } from '../types';

const DB_NAME = 'ERP_ENTERPRISE_DB';
const DB_VERSION = 1;
const STORE_NAME = 'profile_data';

export class IndexedDBManager {
  private static db: IDBDatabase | null = null;

  static async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB failed to open:', event);
        reject(new Error('IndexedDB initialization failed'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  private static async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error('Database is not initialized');
    const transaction = this.db.transaction(STORE_NAME, mode);
    return transaction.objectStore(STORE_NAME);
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const store = await this.getStore('readonly');
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          resolve((request.result as T) || null);
        };
        request.onerror = () => {
          console.error(`Error reading key ${key} from IndexedDB:`, request.error);
          reject(request.error);
        };
      });
    } catch (e) {
      // Fallback to localStorage if IndexedDB fails
      console.warn('IndexedDB getItem fallback to localStorage', e);
      const val = localStorage.getItem(key);
      try {
        return val ? JSON.parse(val) : null;
      } catch {
        return null;
      }
    }
  }

  static async setItem<T>(key: string, value: T): Promise<void> {
    // Immediate LocalStorage update (Cache layer)
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }

    // Secondary Primary IndexedDB update (Primary layer)
    try {
      const store = await this.getStore('readwrite');
      return new Promise<void>((resolve, reject) => {
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error(`Error writing key ${key} to IndexedDB:`, request.error);
          reject(request.error);
        };
      });
    } catch (e) {
      console.error('IndexedDB write failed:', e);
    }
  }

  static async deleteItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {}

    try {
      const store = await this.getStore('readwrite');
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB delete failed:', e);
    }
  }

  /**
   * Loads full active profile ERPData from IndexedDB, falling back to LocalStorage
   */
  static async loadProfileData(profileId: string, initialDefaultData: ERPData): Promise<ERPData> {
    const data = { ...initialDefaultData };
    const keys = Object.keys(initialDefaultData) as Array<keyof ERPData>;

    for (const key of keys) {
      const dbKey = `erp_${profileId}_${key}`;
      const savedValue = await this.getItem<any>(dbKey);
      if (savedValue !== null) {
        data[key] = savedValue;
      } else {
        // Fallback or seed to localStorage
        const localRaw = localStorage.getItem(dbKey);
        if (localRaw) {
          try {
            data[key] = JSON.parse(localRaw);
            // Write to IndexedDB so it remains primary
            await this.setItem(dbKey, data[key]);
          } catch {}
        }
      }
    }
    return data;
  }

  /**
   * Saves full active profile ERPData to both primary IndexedDB and LocalStorage cache
   */
  static async saveProfileData(profileId: string, data: ERPData): Promise<void> {
    const keys = Object.keys(data) as Array<keyof ERPData>;
    for (const key of keys) {
      const dbKey = `erp_${profileId}_${key}`;
      await this.setItem(dbKey, data[key]);
    }
  }
}
