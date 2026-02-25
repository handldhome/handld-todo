'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { TaskCheckbox } from './TaskCheckbox';
import { TaskStar } from './TaskStar';
import {
  X,
  Calendar,
  FileText,
  Trash2,
  FolderOpen,
  ListChecks,
  Plus,
  Circle,
  CheckCircle2,
  Link2,
  Repeat,
} from 'lucide-react';
import type { Task, List, Subtask } from '@/types';

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
}

export function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  const [link, setLink] = useState(task.link || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [recurrence, setRecurrence] = useState(task.recurrence?.frequency || '');
  const [newSubtask, setNewSubtask] = useState('');
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Sync state with task prop
  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes || '');
    setLink(task.link || '');
    setDueDate(task.due_date || '');
    setRecurrence(task.recurrence?.frequency || '');
  }, [task]);

  // Fetch lists for move dropdown
  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lists')
        .select('*')
        .order('position');
      return data as List[];
    },
  });

  // Fetch subtasks
  const { data: subtasks = [] } = useQuery({
    queryKey: ['subtasks', task.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', task.id)
        .order('position');
      if (error) throw error;
      return data as Subtask[];
    },
  });

  // Create subtask mutation
  const createSubtask = useMutation({
    mutationFn: async (title: string) => {
      const nextPosition = subtasks.length;
      const { error } = await supabase
        .from('subtasks')
        .insert({
          task_id: task.id,
          title,
          is_completed: false,
          position: nextPosition,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewSubtask('');
    },
  });

  // Update subtask mutation
  const updateSubtask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subtask> & { id: string }) => {
      const { error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Delete subtask mutation
  const deleteSubtask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Auto-save title
  useEffect(() => {
    if (title !== task.title) {
      const timeout = setTimeout(() => {
        onUpdate({ title });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [title, task.title, onUpdate]);

  // Auto-save notes
  useEffect(() => {
    if (notes !== (task.notes || '')) {
      const timeout = setTimeout(() => {
        onUpdate({ notes: notes || null });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [notes, task.notes, onUpdate]);

  // Auto-save link
  useEffect(() => {
    if (link !== (task.link || '')) {
      const timeout = setTimeout(() => {
        onUpdate({ link: link || null });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [link, task.link, onUpdate]);

  // Handle date change
  const handleDateChange = (value: string) => {
    setDueDate(value);
    onUpdate({ due_date: value || null });
  };

  // Handle recurrence change
  const handleRecurrenceChange = (value: string) => {
    setRecurrence(value);
    if (value) {
      onUpdate({ recurrence: { frequency: value as 'daily' | 'weekly' | 'monthly' | 'annually' | 'custom' } });
    } else {
      onUpdate({ recurrence: null });
    }
  };

  // Handle list change
  const handleListChange = (listId: string) => {
    onUpdate({ list_id: listId });
  };

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete();
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtask.trim()) {
      createSubtask.mutate(newSubtask.trim());
    }
  };

  const completedSubtasks = subtasks.filter(s => s.is_completed).length;
  const totalSubtasks = subtasks.length;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="w-[800px] h-full border-l border-[#333] flex flex-col shrink-0"
      style={{ backgroundColor: '#0a0a0a', color: '#fff' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#333]" style={{ backgroundColor: '#111' }}>
        <TaskCheckbox
          checked={task.is_completed}
          onChange={() => onUpdate({
            is_completed: !task.is_completed,
            completed_at: !task.is_completed ? new Date().toISOString() : null,
          })}
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-lg font-medium outline-none border-0"
          style={{ backgroundColor: 'transparent', color: '#fff' }}
        />
        <TaskStar
          starred={task.is_starred}
          onChange={() => onUpdate({ is_starred: !task.is_starred })}
        />
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[#222] transition-colors"
        >
          <X className="w-5 h-5 text-[#888] hover:text-[#FF6600]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ backgroundColor: '#0a0a0a' }}>
        {/* Due Date */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[#FF6600]">
            <Calendar className="w-4 h-4" />
            DUE DATE
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => handleDateChange(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
            className="w-full px-3 py-2 border border-[#333] text-sm cursor-pointer"
            style={{ backgroundColor: '#111', color: '#fff', colorScheme: 'dark' }}
          />
        </div>

        {/* Recurrence */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[#FF6600]">
            <Repeat className="w-4 h-4" />
            REPEAT
          </label>
          <select
            value={recurrence}
            onChange={(e) => handleRecurrenceChange(e.target.value)}
            className="w-full px-3 py-2 border border-[#333] text-sm"
            style={{ backgroundColor: '#111', color: '#fff' }}
          >
            <option value="" style={{ backgroundColor: '#111', color: '#fff' }}>No repeat</option>
            <option value="daily" style={{ backgroundColor: '#111', color: '#fff' }}>Daily</option>
            <option value="weekly" style={{ backgroundColor: '#111', color: '#fff' }}>Weekly</option>
            <option value="monthly" style={{ backgroundColor: '#111', color: '#fff' }}>Monthly</option>
            <option value="annually" style={{ backgroundColor: '#111', color: '#fff' }}>Annually</option>
            <option value="custom" style={{ backgroundColor: '#111', color: '#fff' }}>Custom...</option>
          </select>
          {recurrence && (
            <p className="text-xs text-[#888]">
              This task will repeat {recurrence === 'daily' ? 'every day' :
                recurrence === 'weekly' ? 'every week' :
                recurrence === 'monthly' ? 'every month' :
                recurrence === 'annually' ? 'every year' : 'on a custom schedule'}
            </p>
          )}
        </div>

        {/* Move to List */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[#FF6600]">
            <FolderOpen className="w-4 h-4" />
            LIST
          </label>
          <select
            value={task.list_id}
            onChange={(e) => handleListChange(e.target.value)}
            className="w-full px-3 py-2 border border-[#333] text-sm"
            style={{ backgroundColor: '#111', color: '#fff' }}
          >
            {lists.map((list) => (
              <option key={list.id} value={list.id} style={{ backgroundColor: '#111', color: '#fff' }}>
                {list.is_inbox ? 'Inbox' : list.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subtasks */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[#FF6600]">
            <ListChecks className="w-4 h-4" />
            SUBTASKS
            {totalSubtasks > 0 && (
              <span className="text-xs text-[#888]">
                ({completedSubtasks}/{totalSubtasks})
              </span>
            )}
          </label>

          {/* Subtask list */}
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {subtasks.map((subtask) => (
                <motion.div
                  key={subtask.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 group px-2 py-1 hover:bg-[#111]"
                >
                  <button
                    onClick={() => updateSubtask.mutate({
                      id: subtask.id,
                      is_completed: !subtask.is_completed,
                    })}
                    className="shrink-0"
                  >
                    {subtask.is_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#00D46A]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#FF6600]" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${subtask.is_completed ? 'line-through text-[#555]' : 'text-white'}`}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask.mutate(subtask.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#888] hover:text-[#FF4444] transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add subtask input */}
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2 border border-[#333] px-2 py-1 hover:border-[#555]" style={{ backgroundColor: '#0a0a0a' }}>
            <Plus
              className="w-4 h-4 shrink-0 cursor-pointer text-[#FF6600]"
              onClick={() => subtaskInputRef.current?.focus()}
            />
            <input
              ref={subtaskInputRef}
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add subtask..."
              className="flex-1 text-sm outline-none py-1 border-0"
              style={{ backgroundColor: 'transparent', color: '#fff' }}
            />
            {newSubtask.trim() && (
              <button
                type="submit"
                disabled={createSubtask.isPending}
                className="text-xs font-medium text-[#FF6600] hover:text-[#FFB800]"
              >
                ADD
              </button>
            )}
          </form>
        </div>

        {/* Link */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[#FF6600]">
            <Link2 className="w-4 h-4" />
            LINK
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Add a link (e.g., Airtable quote viewer)..."
            className="w-full px-3 py-2 border border-[#333] text-sm"
            style={{ backgroundColor: '#111', color: '#fff' }}
          />
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#00D4FF] hover:underline"
            >
              OPEN LINK
              <span className="text-[10px]">↗</span>
            </a>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[#FF6600]">
            <FileText className="w-4 h-4" />
            NOTES
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={4}
            className="w-full px-3 py-2 border border-[#333] text-sm resize-none"
            style={{ backgroundColor: '#111', color: '#fff' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#333]" style={{ backgroundColor: '#111' }}>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#FF4444] hover:bg-[#FF4444]/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          DELETE TASK
        </button>
        <p className="mt-3 text-xs" style={{ color: '#888' }}>
          CREATED {new Date(task.created_at).toLocaleDateString().toUpperCase()}
        </p>
      </div>
    </motion.div>
  );
}
