'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useAuth } from '@/components/providers/AuthProvider';
import { X, Volume2, VolumeX, Monitor, Sun, Moon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEMES = [
  { id: 'wood', name: 'Wood', icon: Sun, description: 'Classic Wunderlist look with wood texture' },
  { id: 'minimal', name: 'Minimal', icon: Monitor, description: 'Clean white background' },
  { id: 'dark', name: 'Dark', icon: Moon, description: 'Easy on the eyes' },
] as const;

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, soundEnabled, setSoundEnabled } = useSettingsStore();
  const { profile, user } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
              w-full max-w-md bg-white rounded-xl shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--wl-divider)]">
              <h2 className="text-lg font-semibold text-[var(--wl-text-primary)]">
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-[var(--wl-sidebar-bg)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--wl-sidebar-count)]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Profile section */}
              <div className="flex items-center gap-3 p-3 bg-[var(--wl-sidebar-bg)] rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[var(--wl-red)] flex items-center justify-center text-white font-medium text-lg">
                  {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-[var(--wl-text-primary)]">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-sm text-[var(--wl-text-secondary)]">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Theme selection */}
              <div>
                <h3 className="text-sm font-medium text-[var(--wl-text-secondary)] mb-3">
                  Theme
                </h3>
                <div className="space-y-2">
                  {THEMES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg border transition-colors
                          ${isSelected
                            ? 'border-[var(--wl-red)] bg-red-50'
                            : 'border-[var(--wl-divider)] hover:border-[var(--wl-sidebar-count)]'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-[var(--wl-red)]' : 'text-[var(--wl-sidebar-count)]'}`} />
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${isSelected ? 'text-[var(--wl-red)]' : 'text-[var(--wl-text-primary)]'}`}>
                            {t.name}
                          </p>
                          <p className="text-xs text-[var(--wl-text-secondary)]">
                            {t.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[var(--wl-red)] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound toggle */}
              <div>
                <h3 className="text-sm font-medium text-[var(--wl-text-secondary)] mb-3">
                  Sounds
                </h3>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg border transition-colors
                    ${soundEnabled
                      ? 'border-[var(--wl-red)] bg-red-50'
                      : 'border-[var(--wl-divider)] hover:border-[var(--wl-sidebar-count)]'
                    }
                  `}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-[var(--wl-red)]" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-[var(--wl-sidebar-count)]" />
                  )}
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${soundEnabled ? 'text-[var(--wl-red)]' : 'text-[var(--wl-text-primary)]'}`}>
                      {soundEnabled ? 'Sounds enabled' : 'Sounds disabled'}
                    </p>
                    <p className="text-xs text-[var(--wl-text-secondary)]">
                      Play sounds when completing or deleting tasks
                    </p>
                  </div>
                  <div
                    className={`
                      w-10 h-6 rounded-full p-0.5 transition-colors
                      ${soundEnabled ? 'bg-[var(--wl-red)]' : 'bg-[var(--wl-divider)]'}
                    `}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white shadow"
                      animate={{ x: soundEnabled ? 16 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--wl-divider)]">
              <p className="text-xs text-center text-[var(--wl-sidebar-count)]">
                Handld Todo v0.1.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
