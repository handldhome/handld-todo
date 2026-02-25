'use client';

import { useState, useEffect, forwardRef, useRef, useImperativeHandle } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Plus } from 'lucide-react';
import type { SmartListType } from '@/types';

interface TaskQuickAddProps {
  listId?: string;
  listType?: SmartListType;
}

export const TaskQuickAdd = forwardRef<HTMLInputElement, TaskQuickAddProps>(
  function TaskQuickAdd({ listId, listType }, ref) {
    const [title, setTitle] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const { user } = useAuth();
    const supabase = createClient();
    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const [effectiveListId, setEffectiveListId] = useState<string | undefined>(listId);

    useEffect(() => {
      if (listType === 'inbox' || listType === 'all' || listType === 'today') {
        supabase
          .from('lists')
          .select('id')
          .eq('is_inbox', true)
          .single()
          .then(({ data }) => {
            if (data) setEffectiveListId(data.id as string);
          });
      }
    }, [listType, supabase]);

    const createTask = useMutation({
      mutationFn: async (taskTitle: string) => {
        if (!effectiveListId || !user) throw new Error('No list selected');

        const { data: lastTask } = await supabase
          .from('tasks')
          .select('position')
          .eq('list_id', effectiveListId)
          .order('position', { ascending: false })
          .limit(1)
          .single() as { data: { position: number } | null };

        const position = (lastTask?.position ?? -1) + 1;

        const isStarred = taskTitle.includes('!starred');
        const cleanTitle = taskTitle.replace('!starred', '').trim();

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

    const handleContainerClick = () => {
      inputRef.current?.focus();
    };

    return (
      <form onSubmit={handleSubmit} className="p-3 border-b border-[#333]">
        <div
          onClick={handleContainerClick}
          className={`
            flex items-center gap-3 px-4 py-3 cursor-text
            bg-[#111] border transition-colors
            ${isFocused ? 'border-[#FF6600]' : 'border-[#333] hover:border-[#555]'}
          `}
        >
          <Plus className="w-5 h-5 text-[#FF6600]" />
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Add task... (press N)"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-[#555]"
            disabled={createTask.isPending}
          />
        </div>
      </form>
    );
  }
);
