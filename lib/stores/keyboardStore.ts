import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: 'navigation' | 'tasks' | 'lists' | 'global';
}

export const DEFAULT_SHORTCUTS: Record<string, KeyboardShortcut> = {
  // Navigation
  'g i': { key: 'g i', description: 'Go to Inbox', category: 'navigation' },
  'g a': { key: 'g a', description: 'Go to All Tasks', category: 'navigation' },
  'g s': { key: 'g s', description: 'Go to Starred', category: 'navigation' },
  'g t': { key: 'g t', description: 'Go to Today', category: 'navigation' },
  'g c': { key: 'g c', description: 'Go to Completed', category: 'navigation' },

  // Task actions
  'n': { key: 'n', description: 'New task', category: 'tasks' },
  'j': { key: 'j', description: 'Move down / Next task', category: 'tasks' },
  'k': { key: 'k', description: 'Move up / Previous task', category: 'tasks' },
  'x': { key: 'x', description: 'Toggle complete', category: 'tasks' },
  's': { key: 's', description: 'Toggle star', category: 'tasks' },
  'Enter': { key: 'Enter', description: 'Open task details', category: 'tasks' },
  'Escape': { key: 'Escape', description: 'Close panel / Deselect', category: 'tasks' },
  'Delete': { key: 'Delete', description: 'Delete task', category: 'tasks' },
  'Backspace': { key: 'Backspace', description: 'Delete task', category: 'tasks' },

  // Lists
  'l': { key: 'l', description: 'Create new list', category: 'lists' },

  // Global
  '?': { key: '?', description: 'Show keyboard shortcuts', category: 'global' },
  ',': { key: ',', description: 'Open settings', category: 'global' },
};

interface KeyboardState {
  enabled: boolean;
  showShortcutsModal: boolean;
  setEnabled: (enabled: boolean) => void;
  setShowShortcutsModal: (show: boolean) => void;
}

export const useKeyboardStore = create<KeyboardState>()(
  persist(
    (set) => ({
      enabled: true,
      showShortcutsModal: false,
      setEnabled: (enabled) => set({ enabled }),
      setShowShortcutsModal: (showShortcutsModal) => set({ showShortcutsModal }),
    }),
    {
      name: 'handld-todo-keyboard',
    }
  )
);
