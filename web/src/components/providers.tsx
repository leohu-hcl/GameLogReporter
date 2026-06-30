'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/config/query-config';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>{children}</AuthProvider>
          {/* 全局 toast：跟随明暗主题（.dark class 由 ThemeProvider 控制） */}
          <Toaster position="top-right" richColors closeButton theme="system" />
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
