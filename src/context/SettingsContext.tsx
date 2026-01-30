'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type PageSizeKey = 'logs' | 'users' | 'devices' | 'deviceSessions' | 'sessionLogs';

interface SettingsContextType {
  pageSizes: Record<PageSizeKey, number>;
  getPageSize: (key: PageSizeKey) => number;
  setPageSize: (key: PageSizeKey, size: number) => void;
  pageSizeOptions: number[];
}

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const PAGE_SIZE_STORAGE_KEY = 'pageSizes';
const DEFAULT_PAGE_SIZES: Record<PageSizeKey, number> = {
  logs: 20,
  users: 10,
  devices: 10,
  deviceSessions: 10,
  sessionLogs: 10,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [pageSizes, setPageSizes] = useState<Record<PageSizeKey, number>>(DEFAULT_PAGE_SIZES);

  useEffect(() => {
    const saved = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Partial<Record<PageSizeKey, number>>;
      const merged = { ...DEFAULT_PAGE_SIZES, ...parsed };
      setPageSizes(merged);
    } catch {
      setPageSizes(DEFAULT_PAGE_SIZES);
    }
  }, []);

  const setPageSize = (key: PageSizeKey, size: number) => {
    const normalized = Number(size);
    if (Number.isNaN(normalized) || normalized <= 0) return;
    setPageSizes((prev) => {
      const next = { ...prev, [key]: normalized };
      localStorage.setItem(PAGE_SIZE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const getPageSize = (key: PageSizeKey) => {
    return pageSizes[key] ?? DEFAULT_PAGE_SIZE;
  };

  const value = useMemo(
    () => ({
      pageSizes,
      getPageSize,
      setPageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
    [pageSizes]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
