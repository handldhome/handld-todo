'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/stores/settingsStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore();

  useEffect(() => {
    // Remove all theme classes first
    document.body.classList.remove('theme-wood', 'theme-minimal', 'theme-dark');
    // Add the current theme class
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return <>{children}</>;
}
