'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { TaskItem } from './TaskItem';
import { TaskQuickAdd } from './TaskQuickAdd';
import { TaskDetailPanel } from './TaskDetailPanel';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Task, SmartListType } from '@/types';

interface TaskListProps {
  listId?: string;
  listType?: SmartListType;
  title?: string;
}

export function TaskList({ listId, listType, title }: TaskListProps) {
  const { user } = useAuth();
  const { selectedTaskId, setSelectedTaskId } = useSidebarStore();
  const [showCompleted, setShowCompleted] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Determine the actual list ID for inbox
  const { data: inboxList } = useQuery({
    queryKey: ['inboxList'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lists')
        .select('id')
        .eq('is_inbox', true)
        .single();
      return data;
    },
    enabled: !!user && listType === 'inbox',
  });

  const effectiveListId = listType === 'inbox' ? inboxList?.id : listId;

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', listType || listId],
    queryFn: async () => {
      let query = supabase.from('tasks').select('*, subtasks(*)');

      if (listType) {
        switch (listType) {
          case 'inbox':
            if (!inboxList?.id) return [];
            query = query.eq('list_id', inboxList.id);
            break;
          case 'all':
            // All non-completed tasks
            break;
          case 'starred':
            query = query.eq('is_starred', true);
            break;
          case 'today':
            const today = new Date().toISOString().split('T')[0];
            query = query.eq('due_date', today);
            break;
          case 'completed':
            query = query.eq('is_completed', true);
            break;
        }
      } else if (listId) {
        query = query.eq('list_id', listId);
      }

      // For completed view, show completed tasks; otherwise hide them
      if (listType !== 'completed') {
        query = query.eq('is_completed', false);
      }

      const { data, error } = await query.order('position');

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user && (!!listId || !!listType) && (listType !== 'inbox' || !!inboxList?.id),
  });

  // Fetch completed tasks count
  const { data: completedTasks = [] } = useQuery({
    queryKey: ['completedTasks', listType || listId],
    queryFn: async () => {
      let query = supabase.from('tasks').select('*, subtasks(*)').eq('is_completed', true);

      if (listType === 'inbox' && inboxList?.id) {
        query = query.eq('list_id', inboxList.id);
      } else if (listId) {
        query = query.eq('list_id', listId);
      }

      const { data, error } = await query.order('completed_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user && listType !== 'completed' && (!!listId || !!listType) && (listType !== 'inbox' || !!inboxList?.id),
  });

  // Get selected task
  const selectedTask = [...tasks, ...completedTasks].find(t => t.id === selectedTaskId);

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskCounts'] });
    },
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedTaskId(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskCounts'] });
    },
  });

  const handleToggleComplete = (task: Task) => {
    updateTask.mutate({
      id: task.id,
      is_completed: !task.is_completed,
      completed_at: !task.is_completed ? new Date().toISOString() : null,
    });
  };

  const handleToggleStar = (task: Task) => {
    updateTask.mutate({
      id: task.id,
      is_starred: !task.is_starred,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-[var(--wl-text-secondary)]">
          Loading tasks...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Task list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Quick add */}
        {listType !== 'completed' && (
          <TaskQuickAdd listId={effectiveListId} listType={listType} />
        )}

        {/* Tasks */}
        <div className="flex-1 overflow-y-auto">
          {tasks.length === 0 && completedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-[var(--wl-text-secondary)] text-lg">
                {listType === 'completed'
                  ? 'No completed tasks yet'
                  : 'No tasks yet. Add one above!'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              <AnimatePresence mode="popLayout">
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskItem
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      onSelect={() => setSelectedTaskId(task.id)}
                      onToggleComplete={() => handleToggleComplete(task)}
                      onToggleStar={() => handleToggleStar(task)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Completed section */}
              {completedTasks.length > 0 && listType !== 'completed' && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--wl-text-secondary)] hover:text-[var(--wl-text-primary)] transition-colors"
                  >
                    {showCompleted ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>Completed ({completedTasks.length})</span>
                  </button>

                  <AnimatePresence>
                    {showCompleted && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 mt-2">
                          {completedTasks.map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              isSelected={selectedTaskId === task.id}
                              onSelect={() => setSelectedTaskId(task.id)}
                              onToggleComplete={() => handleToggleComplete(task)}
                              onToggleStar={() => handleToggleStar(task)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTaskId(null)}
            onUpdate={(updates) => updateTask.mutate({ id: selectedTask.id, ...updates })}
            onDelete={() => deleteTask.mutate(selectedTask.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
