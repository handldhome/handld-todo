'use client';

import { useState, useEffect } from 'react';
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
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [newSubtask, setNewSubtask] = useState('');
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Sync state with task prop
  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes || '');
    setDueDate(task.due_date || '');
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

  // Handle date change
  const handleDateChange = (value: string) => {
    setDueDate(value);
    onUpdate({ due_date: value || null });
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
      className="w-[400px] h-full bg-white border-l border-[var(--wl-divider)] flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--wl-divider)]">
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
          className="flex-1 text-lg font-medium text-[var(--wl-text-primary)] bg-transparent outline-none"
        />
        <TaskStar
          starred={task.is_starred}
          onChange={() => onUpdate({ is_starred: !task.is_starred })}
        />
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-[var(--wl-sidebar-bg)] transition-colors"
        >
          <X className="w-5 h-5 text-[var(--wl-sidebar-count)]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Due Date */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--wl-text-secondary)]">
            <Calendar className="w-4 h-4" />
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--wl-divider)] rounded-lg text-sm text-[var(--wl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--wl-red)] focus:border-transparent"
          />
        </div>

        {/* Move to List */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--wl-text-secondary)]">
            <FolderOpen className="w-4 h-4" />
            List
          </label>
          <select
            value={task.list_id}
            onChange={(e) => handleListChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--wl-divider)] rounded-lg text-sm text-[var(--wl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--wl-red)] focus:border-transparent"
          >
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.is_inbox ? 'Inbox' : list.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subtasks */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--wl-text-secondary)]">
            <ListChecks className="w-4 h-4" />
            Subtasks
            {totalSubtasks > 0 && (
              <span className="text-xs text-[var(--wl-sidebar-count)]">
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
                  className="flex items-center gap-2 group"
                >
                  <button
                    onClick={() => updateSubtask.mutate({
                      id: subtask.id,
                      is_completed: !subtask.is_completed,
                    })}
                    className="shrink-0"
                  >
                    {subtask.is_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--wl-checkbox-checked)]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[var(--wl-checkbox-border)]" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      subtask.is_completed
                        ? 'text-[var(--wl-text-completed)] line-through'
                        : 'text-[var(--wl-text-primary)]'
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask.mutate(subtask.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--wl-sidebar-count)] hover:text-red-500 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add subtask input */}
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[var(--wl-sidebar-count)] shrink-0" />
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add subtask..."
              className="flex-1 text-sm text-[var(--wl-text-primary)] placeholder:text-[var(--wl-sidebar-count)] bg-transparent outline-none py-1"
            />
            {newSubtask.trim() && (
              <button
                type="submit"
                disabled={createSubtask.isPending}
                className="text-xs text-[var(--wl-red)] hover:text-[var(--wl-red-dark)] font-medium"
              >
                Add
              </button>
            )}
          </form>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--wl-text-secondary)]">
            <FileText className="w-4 h-4" />
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={4}
            className="w-full px-3 py-2 border border-[var(--wl-divider)] rounded-lg text-sm text-[var(--wl-text-primary)] placeholder:text-[var(--wl-sidebar-count)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--wl-red)] focus:border-transparent"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--wl-divider)]">
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete task
        </button>
        <p className="mt-3 text-xs text-[var(--wl-sidebar-count)]">
          Created {new Date(task.created_at).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}
