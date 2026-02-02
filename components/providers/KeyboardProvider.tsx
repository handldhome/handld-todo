'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useKeyboardStore } from '@/lib/stores/keyboardStore';
import { useSidebarStore } from '@/lib/stores/sidebarStore';

interface KeyboardProviderProps {
  children: React.ReactNode;
  onNewTask?: () => void;
  onToggleComplete?: () => void;
  onToggleStar?: () => void;
  onDeleteTask?: () => void;
  onNextTask?: () => void;
  onPrevTask?: () => void;
  onOpenSettings?: () => void;
  onCreateList?: () => void;
}

export function KeyboardProvider({
  children,
  onNewTask,
  onToggleComplete,
  onToggleStar,
  onDeleteTask,
  onNextTask,
  onPrevTask,
  onOpenSettings,
  onCreateList,
}: KeyboardProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { enabled, setShowShortcutsModal } = useKeyboardStore();
  const { selectedTaskId, setSelectedTaskId } = useSidebarStore();
  const pendingKey = useRef<string | null>(null);
  const pendingTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to blur inputs
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      const key = e.key;

      // Handle 'g' prefix for navigation
      if (pendingKey.current === 'g') {
        if (pendingTimeout.current) {
          clearTimeout(pendingTimeout.current);
          pendingTimeout.current = null;
        }
        pendingKey.current = null;

        switch (key) {
          case 'i':
            e.preventDefault();
            router.push('/inbox');
            return;
          case 'a':
            e.preventDefault();
            router.push('/all');
            return;
          case 's':
            e.preventDefault();
            router.push('/starred');
            return;
          case 't':
            e.preventDefault();
            router.push('/today');
            return;
          case 'c':
            e.preventDefault();
            router.push('/completed');
            return;
        }
      }

      // Start 'g' sequence
      if (key === 'g' && !e.metaKey && !e.ctrlKey) {
        pendingKey.current = 'g';
        pendingTimeout.current = setTimeout(() => {
          pendingKey.current = null;
        }, 500);
        return;
      }

      // Single key shortcuts
      switch (key) {
        case 'n':
          e.preventDefault();
          onNewTask?.();
          break;

        case 'j':
          e.preventDefault();
          onNextTask?.();
          break;

        case 'k':
          e.preventDefault();
          onPrevTask?.();
          break;

        case 'x':
          if (selectedTaskId) {
            e.preventDefault();
            onToggleComplete?.();
          }
          break;

        case 's':
          if (selectedTaskId && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onToggleStar?.();
          }
          break;

        case 'Enter':
          // Open task details is handled by selecting (done via j/k)
          break;

        case 'Escape':
          e.preventDefault();
          setSelectedTaskId(null);
          break;

        case 'Delete':
        case 'Backspace':
          if (selectedTaskId) {
            e.preventDefault();
            onDeleteTask?.();
          }
          break;

        case 'l':
          e.preventDefault();
          onCreateList?.();
          break;

        case '?':
          e.preventDefault();
          setShowShortcutsModal(true);
          break;

        case ',':
          e.preventDefault();
          onOpenSettings?.();
          break;
      }
    },
    [
      enabled,
      router,
      selectedTaskId,
      setSelectedTaskId,
      setShowShortcutsModal,
      onNewTask,
      onToggleComplete,
      onToggleStar,
      onDeleteTask,
      onNextTask,
      onPrevTask,
      onOpenSettings,
      onCreateList,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
      }
    };
  }, [handleKeyDown]);

  return <>{children}</>;
}
