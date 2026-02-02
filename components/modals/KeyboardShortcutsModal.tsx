'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardStore, DEFAULT_SHORTCUTS } from '@/lib/stores/keyboardStore';
import { X, Keyboard } from 'lucide-react';

export function KeyboardShortcutsModal() {
  const { showShortcutsModal, setShowShortcutsModal, enabled, setEnabled } = useKeyboardStore();

  const categories = {
    navigation: { title: 'Navigation', shortcuts: [] as typeof DEFAULT_SHORTCUTS[string][] },
    tasks: { title: 'Tasks', shortcuts: [] as typeof DEFAULT_SHORTCUTS[string][] },
    lists: { title: 'Lists', shortcuts: [] as typeof DEFAULT_SHORTCUTS[string][] },
    global: { title: 'Global', shortcuts: [] as typeof DEFAULT_SHORTCUTS[string][] },
  };

  Object.values(DEFAULT_SHORTCUTS).forEach((shortcut) => {
    categories[shortcut.category].shortcuts.push(shortcut);
  });

  return (
    <AnimatePresence>
      {showShortcutsModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcutsModal(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
              w-full max-w-2xl max-h-[80vh] bg-white rounded-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--wl-divider)]">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-[var(--wl-red)]" />
                <h2 className="text-lg font-semibold text-[var(--wl-text-primary)]">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1.5 rounded hover:bg-[var(--wl-sidebar-bg)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--wl-sidebar-count)]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Enable/disable toggle */}
              <div className="mb-6 p-3 bg-[var(--wl-sidebar-bg)] rounded-lg">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-[var(--wl-text-primary)]">
                    Enable keyboard shortcuts
                  </span>
                  <button
                    onClick={() => setEnabled(!enabled)}
                    className={`
                      w-10 h-6 rounded-full p-0.5 transition-colors
                      ${enabled ? 'bg-[var(--wl-red)]' : 'bg-[var(--wl-divider)]'}
                    `}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white shadow"
                      animate={{ x: enabled ? 16 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </label>
              </div>

              {/* Shortcuts grid */}
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(categories).map(([key, { title, shortcuts }]) => (
                  <div key={key}>
                    <h3 className="text-sm font-semibold text-[var(--wl-text-secondary)] mb-2 uppercase tracking-wide">
                      {title}
                    </h3>
                    <div className="space-y-1.5">
                      {shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between py-1"
                        >
                          <span className="text-sm text-[var(--wl-text-primary)]">
                            {shortcut.description}
                          </span>
                          <kbd className="px-2 py-1 text-xs font-mono bg-[var(--wl-sidebar-bg)] border border-[var(--wl-divider)] rounded">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--wl-divider)] bg-[var(--wl-sidebar-bg)]">
              <p className="text-xs text-center text-[var(--wl-sidebar-count)]">
                Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-[var(--wl-divider)] rounded">?</kbd> anytime to show this dialog
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
