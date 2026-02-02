'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useAuth } from '@/components/providers/AuthProvider';
import { X, Volume2, VolumeX, Monitor, Sun, Moon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAVY = '#2A54A1';

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
            style={{ color: NAVY }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold" style={{ color: NAVY }}>
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: NAVY }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Profile section */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg" style={{ backgroundColor: NAVY }}>
                  {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium" style={{ color: NAVY }}>
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-sm" style={{ color: NAVY }}>
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Theme selection */}
              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: NAVY }}>
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
                            ? 'border-[#2A54A1] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-400'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" style={{ color: NAVY }} />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium" style={{ color: NAVY }}>
                            {t.name}
                          </p>
                          <p className="text-xs" style={{ color: NAVY }}>
                            {t.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: NAVY }}>
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
                <h3 className="text-sm font-medium mb-3" style={{ color: NAVY }}>
                  Sounds
                </h3>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg border transition-colors
                    ${soundEnabled
                      ? 'border-[#2A54A1] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400'
                    }
                  `}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5" style={{ color: NAVY }} />
                  ) : (
                    <VolumeX className="w-5 h-5" style={{ color: NAVY }} />
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: NAVY }}>
                      {soundEnabled ? 'Sounds enabled' : 'Sounds disabled'}
                    </p>
                    <p className="text-xs" style={{ color: NAVY }}>
                      Play sounds when completing or deleting tasks
                    </p>
                  </div>
                  <div
                    className="w-10 h-6 rounded-full p-0.5 transition-colors"
                    style={{ backgroundColor: soundEnabled ? NAVY : '#E5E5E5' }}
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
            <div className="p-4 border-t border-gray-200">
              <p className="text-xs text-center" style={{ color: NAVY }}>
                Handld Todo v0.1.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
