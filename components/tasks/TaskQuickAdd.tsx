'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Plus } from 'lucide-react';
import type { SmartListType } from '@/types';

interface TaskQuickAddProps {
  listId?: string;
  listType?: SmartListType;
}

export function TaskQuickAdd({ listId, listType }: TaskQuickAddProps) {
  const [title, setTitle] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Get inbox list if needed
  const [effectiveListId, setEffectiveListId] = useState<string | undefined>(listId);

  useEffect(() => {
    if (listType === 'inbox' || listType === 'all' || listType === 'today') {
      supabase
        .from('lists')
        .select('id')
        .eq('is_inbox', true)
        .single()
        .then(({ data }) => {
          if (data) setEffectiveListId(data.id);
        });
    }
  }, [listType, supabase]);

  const createTask = useMutation({
    mutationFn: async (taskTitle: string) => {
      if (!effectiveListId || !user) throw new Error('No list selected');

      // Get highest position
      const { data: lastTask } = await supabase
        .from('tasks')
        .select('position')
        .eq('list_id', effectiveListId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const position = (lastTask?.position ?? -1) + 1;

      // Parse for starred flag
      const isStarred = taskTitle.includes('!starred');
      const cleanTitle = taskTitle.replace('!starred', '').trim();

      // Parse for date (simple natural language)
      let dueDate: string | null = null;
      const today = new Date();
      if (taskTitle.toLowerCase().includes('today')) {
        dueDate = today.toISOString().split('T')[0];
      } else if (taskTitle.toLowerCase().includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dueDate = tomorrow.toISOString().split('T')[0];
      }

      const { error } = await supabase.from('tasks').insert({
        list_id: effectiveListId,
        user_id: user.id,
        title: cleanTitle,
        is_starred: isStarred,
        due_date: dueDate || (listType === 'today' ? today.toISOString().split('T')[0] : null),
        position,
        is_completed: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setTitle('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskCounts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && !createTask.isPending) {
      createTask.mutate(title.trim());
    }
  };

  // Keyboard shortcut: 'n' to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' && !isFocused && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg
          bg-white/80 backdrop-blur-sm border
          transition-all duration-200
          ${isFocused
            ? 'border-[var(--wl-red)] shadow-sm'
            : 'border-transparent hover:bg-white hover:shadow-sm'
          }
        `}
      >
        <Plus className="w-5 h-5 text-[var(--wl-sidebar-count)]" />
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Add a task... (Press 'n' to focus)"
          className="flex-1 bg-transparent outline-none text-[15px] text-[var(--wl-text-primary)] placeholder:text-[var(--wl-sidebar-count)]"
          disabled={createTask.isPending}
        />
      </div>
    </form>
  );
}
