'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAVY = '#2A54A1';

const COLORS = [
  '#D64545', // Red (Wunderlist)
  '#E67E22', // Orange
  '#F1C40F', // Yellow
  '#27AE60', // Green
  '#3498DB', // Blue
  '#9B59B6', // Purple
  '#E91E63', // Pink
  '#607D8B', // Gray
];

export function CreateListModal({ isOpen, onClose }: CreateListModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  const createList = useMutation({
    mutationFn: async () => {
      // Get the max position for ordering
      const { data: lists } = await supabase
        .from('lists')
        .select('position')
        .eq('user_id', user!.id)
        .order('position', { ascending: false })
        .limit(1) as { data: { position: number }[] | null };

      const nextPosition = (lists?.[0]?.position ?? 0) + 1;

      const { data, error } = await supabase
        .from('lists')
        .insert({
          user_id: user!.id,
          name: name.trim(),
          color,
          icon: 'list',
          position: nextPosition,
          is_inbox: false,
          is_smart: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      onClose();
      setName('');
      setColor(COLORS[0]);
      // Navigate to the new list
      router.push(`/list/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createList.mutate();
    }
  };

  const handleClose = () => {
    onClose();
    setName('');
    setColor(COLORS[0]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold" style={{ color: NAVY }}>
                  Create new list
                </h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: NAVY }} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Name input */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: NAVY }}>
                    List name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter list name..."
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-[#2A54A1] focus:border-transparent"
                    style={{ color: NAVY }}
                  />
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: c }}
                      >
                        {color === c && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm" style={{ color: NAVY }}>
                    {name || 'List preview'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors"
                  style={{ color: NAVY }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || createList.isPending}
                  className="px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: NAVY }}
                >
                  {createList.isPending ? 'Creating...' : 'Create list'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
