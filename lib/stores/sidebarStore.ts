import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  selectedTaskId: string | null;
  setIsOpen: (isOpen: boolean) => void;
  toggle: () => void;
  setSelectedTaskId: (taskId: string | null) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false,
  selectedTaskId: null,
  setIsOpen: (isOpen) => set({ isOpen }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
}));
