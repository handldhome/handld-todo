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

const NAVY = '#2A54A1';
const NAVY_LIGHT = '#7A9BD4';

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
      className="w-[800px] h-full bg-white border-l border-gray-200 flex flex-col shrink-0"
      style={{ color: NAVY }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
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
          className="flex-1 text-lg font-medium bg-transparent outline-none"
          style={{ color: NAVY }}
        />
        <TaskStar
          starred={task.is_starred}
          onChange={() => onUpdate({ is_starred: !task.is_starred })}
        />
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" style={{ color: NAVY }} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Due Date */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}>
            <Calendar className="w-4 h-4" />
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2A54A1] focus:border-transparent"
            style={{ color: NAVY }}
          />
        </div>

        {/* Recurrence */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}>
            <Repeat className="w-4 h-4" />
            Repeat
          </label>
          <select
            value={recurrence}
            onChange={(e) => handleRecurrenceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2A54A1] focus:border-transparent"
            style={{ color: NAVY }}
          >
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
            <option value="custom">Custom...</option>
          </select>
          {recurrence && (
            <p className="text-xs" style={{ color: NAVY }}>
              This task will repeat {recurrence === 'daily' ? 'every day' :
                recurrence === 'weekly' ? 'every week' :
                recurrence === 'monthly' ? 'every month' :
                recurrence === 'annually' ? 'every year' : 'on a custom schedule'}
            </p>
          )}
        </div>

        {/* Move to List */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}>
            <FolderOpen className="w-4 h-4" />
            List
          </label>
          <select
            value={task.list_id}
            onChange={(e) => handleListChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2A54A1] focus:border-transparent"
            style={{ color: NAVY }}
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
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}>
            <ListChecks className="w-4 h-4" />
            Subtasks
            {totalSubtasks > 0 && (
              <span className="text-xs" style={{ color: NAVY }}>
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
                      <CheckCircle2 className="w-4 h-4" style={{ color: NAVY }} />
                    ) : (
                      <Circle className="w-4 h-4" style={{ color: NAVY }} />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${subtask.is_completed ? 'line-through' : ''}`}
                    style={{ color: subtask.is_completed ? NAVY_LIGHT : NAVY }}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask.mutate(subtask.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                    style={{ color: NAVY }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add subtask input */}
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
            <Plus
              className="w-4 h-4 shrink-0 cursor-pointer"
              style={{ color: NAVY }}
              onClick={() => subtaskInputRef.current?.focus()}
            />
            <input
              ref={subtaskInputRef}
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add subtask..."
              className="flex-1 text-sm bg-transparent outline-none py-1"
              style={{ color: NAVY }}
            />
            {newSubtask.trim() && (
              <button
                type="submit"
                disabled={createSubtask.isPending}
                className="text-xs font-medium"
                style={{ color: NAVY }}
              >
                Add
              </button>
            )}
          </form>
        </div>

        {/* Link */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}>
            <Link2 className="w-4 h-4" />
            Link
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Add a link (e.g., Airtable quote viewer)..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2A54A1] focus:border-transparent"
            style={{ color: NAVY }}
          />
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs hover:underline"
              style={{ color: NAVY }}
            >
              Open link
              <span className="text-[10px]">↗</span>
            </a>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}>
            <FileText className="w-4 h-4" />
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2A54A1] focus:border-transparent"
            style={{ color: NAVY }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete task
        </button>
        <p className="mt-3 text-xs" style={{ color: NAVY }}>
          Created {new Date(task.created_at).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}
