'use client';

import { motion } from 'framer-motion';
import { useSound } from '@/components/providers/SoundProvider';
import { Check } from 'lucide-react';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export function TaskCheckbox({ checked, onChange, disabled }: TaskCheckboxProps) {
  const { playComplete } = useSound();

  const handleClick = (e: React.MouseEvent) => {
    if (!checked) {
      playComplete();
    }
    onChange(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-5 h-5 rounded-full border-2 flex items-center justify-center
        transition-colors duration-200
        ${checked
          ? 'bg-[var(--wl-checkbox-checked)] border-[var(--wl-checkbox-checked)]'
          : 'border-[var(--wl-checkbox-border)] hover:border-[var(--wl-checkbox-checked)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {checked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </motion.div>
      )}
    </button>
  );
}
