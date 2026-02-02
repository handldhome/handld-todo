'use client';

import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { SoundProvider } from './SoundProvider';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SoundProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SoundProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
