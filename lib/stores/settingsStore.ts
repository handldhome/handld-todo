import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'wood' | 'minimal' | 'dark';
  soundEnabled: boolean;
  sidebarCollapsed: boolean;
  setTheme: (theme: 'wood' | 'minimal' | 'dark') => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'wood',
      soundEnabled: true,
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    {
      name: 'handld-todo-settings',
    }
  )
);
