'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface TaskStarProps {
  starred: boolean;
  onChange: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export function TaskStar({ starred, onChange, disabled }: TaskStarProps) {
  return (
    <motion.button
      onClick={onChange}
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      animate={starred ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.2 }}
      className={`
        p-1 transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#222]'}
      `}
    >
      <Star
        className={`w-4 h-4 transition-colors ${
          starred
            ? 'fill-[#FFB800] text-[#FFB800]'
            : 'text-[#555] hover:text-[#FFB800]'
        }`}
      />
    </motion.button>
  );
}
