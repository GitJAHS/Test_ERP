/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, XCircle, Info, Bell, X, Trash2 } from 'lucide-react';

export type NotificationType = 'success' | 'warn' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  title?: string;
  type: NotificationType;
  category?: string;
  duration?: number; // ms
  timestamp: string;
  isRead: boolean;
}

interface NotificationContextProps {
  notifications: ToastMessage[];
  addNotification: (message: string, type?: NotificationType, options?: { title?: string; category?: string; duration?: number }) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<ToastMessage[]>(() => {
    try {
      const saved = localStorage.getItem('erp_system_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    localStorage.setItem('erp_system_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (
    message: string,
    type: NotificationType = 'info',
    options?: { title?: string; category?: string; duration?: number }
  ) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const duration = options?.duration || (type === 'error' ? 6000 : 4000);

    const newNotification: ToastMessage = {
      id,
      message,
      type,
      title: options?.title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warn' ? 'Warning' : 'Information'),
      category: options?.category || 'System',
      isRead: false,
      timestamp,
      duration,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50 logs
    setToasts((prev) => [...prev, newNotification]);

    try {
      // Direct beep sound effect for accessibility
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'success' ? 780 : type === 'error' ? 220 : type === 'warn' ? 440 : 660, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {}
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setToasts([]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        markAsRead,
        markAllAsRead,
        unreadCount,
      }}
    >
      {children}

      {/* Floating Heads-Up Banner Display System */}
      <div 
        id="toast-container" 
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none md:max-w-md"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void; key?: any }) {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4000;

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(left);
      if (elapsed >= duration) {
        clearInterval(timer);
        onDismiss();
      }
    }, 30);

    return () => clearInterval(timer);
  }, [duration, onDismiss]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[#2e7d32] dark:text-[#a5d6a7]" />,
    warn: <AlertTriangle className="w-5 h-5 text-[#e65100] dark:text-[#ffcc80]" />,
    error: <XCircle className="w-5 h-5 text-[#c62828] dark:text-[#ef9a9a]" />,
    info: <Info className="w-5 h-5 text-[#1565c0] dark:text-[#90caf9]" />,
  };

  const styleClass = {
    success: 'border-l-4 border-l-[#2e7d32] bg-[#f1f8e9] dark:bg-[#1b2f15]',
    warn: 'border-l-4 border-l-[#e65100] bg-[#fff3e0] dark:bg-[#2d1b09]',
    error: 'border-l-4 border-l-[#c62828] bg-[#ffebee] dark:bg-[#2e1515]',
    info: 'border-l-4 border-l-[#1565c0] bg-[#e3f2fd] dark:bg-[#0c233c]',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88, y: -20, transition: { duration: 0.2 } }}
      className={`relative flex flex-col pointer-events-auto w-full p-4 rounded-xl shadow-lg border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-md overflow-hidden ${styleClass[toast.type]}`}
    >
      <div className="flex gap-3 items-start justify-between">
        <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
              {toast.category}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <span className="text-xs font-medium text-neutral-400">Now</span>
          </div>
          <h5 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 mt-0.5">
            {toast.title}
          </h5>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
            {toast.message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition"
        >
          <X className="w-4 h-4 text-neutral-500 dark:text-neutral-300" />
        </button>
      </div>

      {/* Dynamic Progress Indicator Meter */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
        <div
          className={`h-full opacity-60 transition-all duration-[30ms] linear ${
            toast.type === 'success' ? 'bg-[#2e7d32]' : toast.type === 'error' ? 'bg-[#c62828]' : toast.type === 'warn' ? 'bg-[#e65100]' : 'bg-[#1565c0]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
