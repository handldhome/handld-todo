'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  X,
  Calendar,
  FileText,
  Trash2,
  FolderOpen,
  ListChecks,
  Plus,
  Check,
  Star,
  Repeat,
} from 'lucide-react';
import type { Task, List, Subtask } from '@/types';

// Bloomberg terminal colors
const COLORS = {
  black: '#000000',
  dark: '#0a0a0a',
  panel: '#111111',
  border: '#333333',
  orange: '#FF6600',
  amber: '#FFB800',
  green: '#00D46A',
  red: '#FF4444',
  cyan: '#00D4FF',
  white: '#FFFFFF',
  gray: '#888888',
  grayDim: '#555555',
};

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

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes || '');
    setLink(task.link || '');
    setDueDate(task.due_date || '');
    setRecurrence(task.recurrence?.frequency || '');
  }, [task]);

  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      const { data } = await supabase.from('lists').select('*').order('position');
      return data as List[];
    },
  });

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

  const createSubtask = useMutation({
    mutationFn: async (subtaskTitle: string) => {
      const { error } = await supabase.from('subtasks').insert({
        task_id: task.id,
        title: subtaskTitle,
        is_completed: false,
        position: subtasks.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewSubtask('');
    },
  });

  const updateSubtask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subtask> & { id: string }) => {
      const { error } = await supabase.from('subtasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteSubtask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subtasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  useEffect(() => {
    if (title !== task.title) {
      const timeout = setTimeout(() => onUpdate({ title }), 500);
      return () => clearTimeout(timeout);
    }
  }, [title, task.title, onUpdate]);

  useEffect(() => {
    if (notes !== (task.notes || '')) {
      const timeout = setTimeout(() => onUpdate({ notes: notes || null }), 500);
      return () => clearTimeout(timeout);
    }
  }, [notes, task.notes, onUpdate]);

  useEffect(() => {
    if (link !== (task.link || '')) {
      const timeout = setTimeout(() => onUpdate({ link: link || null }), 500);
      return () => clearTimeout(timeout);
    }
  }, [link, task.link, onUpdate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDateChange = (value: string) => {
    setDueDate(value);
    onUpdate({ due_date: value || null });
  };

  const handleRecurrenceChange = (value: string) => {
    setRecurrence(value);
    onUpdate({ recurrence: value ? { frequency: value as 'daily' | 'weekly' | 'monthly' | 'annually' | 'custom' } : null });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) onDelete();
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtask.trim()) createSubtask.mutate(newSubtask.trim());
  };

  const completedSubtasks = subtasks.filter(s => s.is_completed).length;

  // Shared input styles
  const inputStyle: React.CSSProperties = {
    backgroundColor: COLORS.panel,
    color: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 0,
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '14px',
    padding: '8px 12px',
    width: '100%',
    colorScheme: 'dark',
  };

  const labelStyle: React.CSSProperties = {
    color: COLORS.orange,
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textTransform: 'uppercase',
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{
        width: '400px',
        height: '100%',
        backgroundColor: COLORS.dark,
        borderLeft: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        color: COLORS.white,
        fontFamily: "'SF Mono', Monaco, Consolas, monospace",
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        borderBottom: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.panel,
      }}>
        {/* Checkbox */}
        <button
          onClick={() => onUpdate({
            is_completed: !task.is_completed,
            completed_at: !task.is_completed ? new Date().toISOString() : null,
          })}
          style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${task.is_completed ? COLORS.green : COLORS.orange}`,
            backgroundColor: task.is_completed ? COLORS.green : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {task.is_completed && <Check size={12} color={COLORS.black} strokeWidth={3} />}
        </button>

        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            color: COLORS.white,
            border: 'none',
            outline: 'none',
            fontSize: '16px',
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
        />

        {/* Star */}
        <button
          onClick={() => onUpdate({ is_starred: !task.is_starred })}
          style={{ padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
        >
          <Star
            size={18}
            fill={task.is_starred ? COLORS.amber : 'none'}
            color={task.is_starred ? COLORS.amber : COLORS.grayDim}
          />
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
        >
          <X size={20} color={COLORS.gray} />
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: COLORS.dark,
      }}>
        {/* Due Date */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>
            <Calendar size={16} /> DUE DATE
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => handleDateChange(e.target.value)}
            style={{ ...inputStyle, marginTop: '8px', cursor: 'pointer' }}
          />
        </div>

        {/* Recurrence */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>
            <Repeat size={16} /> REPEAT
          </label>
          <select
            value={recurrence}
            onChange={(e) => handleRecurrenceChange(e.target.value)}
            style={{ ...inputStyle, marginTop: '8px', cursor: 'pointer' }}
          >
            <option value="" style={{ backgroundColor: COLORS.panel, color: COLORS.white }}>No repeat</option>
            <option value="daily" style={{ backgroundColor: COLORS.panel, color: COLORS.white }}>Daily</option>
            <option value="weekly" style={{ backgroundColor: COLORS.panel, color: COLORS.white }}>Weekly</option>
            <option value="monthly" style={{ backgroundColor: COLORS.panel, color: COLORS.white }}>Monthly</option>
            <option value="annually" style={{ backgroundColor: COLORS.panel, color: COLORS.white }}>Annually</option>
          </select>
        </div>

        {/* List */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>
            <FolderOpen size={16} /> LIST
          </label>
          <select
            value={task.list_id}
            onChange={(e) => onUpdate({ list_id: e.target.value })}
            style={{ ...inputStyle, marginTop: '8px', cursor: 'pointer' }}
          >
            {lists.map((list) => (
              <option key={list.id} value={list.id} style={{ backgroundColor: COLORS.panel, color: COLORS.white }}>
                {list.is_inbox ? 'Inbox' : list.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subtasks */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>
            <ListChecks size={16} /> SUBTASKS
            {subtasks.length > 0 && (
              <span style={{ color: COLORS.gray, fontWeight: 400 }}>
                ({completedSubtasks}/{subtasks.length})
              </span>
            )}
          </label>
          <div style={{ marginTop: '8px' }}>
            <AnimatePresence mode="popLayout">
              {subtasks.map((subtask) => (
                <motion.div
                  key={subtask.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    backgroundColor: COLORS.dark,
                  }}
                >
                  <button
                    onClick={() => updateSubtask.mutate({ id: subtask.id, is_completed: !subtask.is_completed })}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `2px solid ${subtask.is_completed ? COLORS.green : COLORS.orange}`,
                      backgroundColor: subtask.is_completed ? COLORS.green : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {subtask.is_completed && <Check size={10} color={COLORS.black} strokeWidth={3} />}
                  </button>
                  <span style={{
                    flex: 1,
                    color: subtask.is_completed ? COLORS.grayDim : COLORS.white,
                    textDecoration: subtask.is_completed ? 'line-through' : 'none',
                    fontSize: '14px',
                  }}>
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask.mutate(subtask.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={14} color={COLORS.gray} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <form onSubmit={handleAddSubtask} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              border: `1px solid ${COLORS.border}`,
              marginTop: '8px',
              backgroundColor: COLORS.dark,
            }}>
              <Plus size={16} color={COLORS.orange} />
              <input
                ref={subtaskInputRef}
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask..."
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: COLORS.white,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
              {newSubtask.trim() && (
                <button
                  type="submit"
                  style={{
                    color: COLORS.orange,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  ADD
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Link */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>
            <FileText size={16} /> LINK
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Add a link..."
            style={{ ...inputStyle, marginTop: '8px' }}
          />
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: COLORS.cyan, fontSize: '12px', marginTop: '4px', display: 'inline-block' }}
            >
              OPEN LINK ↗
            </a>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>
            <FileText size={16} /> NOTES
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={4}
            style={{ ...inputStyle, marginTop: '8px', resize: 'none' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.panel,
      }}>
        <button
          onClick={handleDelete}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: COLORS.red,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '8px',
          }}
        >
          <Trash2 size={16} /> DELETE TASK
        </button>
        <p style={{ color: COLORS.gray, fontSize: '11px', marginTop: '12px' }}>
          CREATED {new Date(task.created_at).toLocaleDateString().toUpperCase()}
        </p>
      </div>
    </motion.div>
  );
}
