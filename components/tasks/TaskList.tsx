'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { getLocalToday } from '@/lib/dateUtils';
import { TaskItem } from './TaskItem';
import { TaskQuickAdd } from './TaskQuickAdd';
import { TaskDetailPanel } from './TaskDetailPanel';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { useKeyboardStore } from '@/lib/stores/keyboardStore';
import { useSound } from '@/components/providers/SoundProvider';
import { ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react';
import type { Task, SmartListType, List } from '@/types';

type SortOption = 'date' | 'starred' | 'list' | 'created';

interface TaskListProps {
  listId?: string;
  listType?: SmartListType;
  title?: string;
}

export function TaskList({ listId, listType, title }: TaskListProps) {
  const { user } = useAuth();
  const { selectedTaskId, setSelectedTaskId } = useSidebarStore();
  const { enabled: keyboardEnabled } = useKeyboardStore();
  const { playComplete, playDelete } = useSound();
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const quickAddRef = useRef<HTMLInputElement>(null);
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

  // Fetch all lists for sorting by list name
  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lists')
        .select('*')
        .order('position');
      return data as List[];
    },
    enabled: !!user,
  });

  // Create a map of list IDs to names
  const listNameMap = lists.reduce((acc, list) => {
    acc[list.id] = list.is_inbox ? 'Inbox' : list.name;
    return acc;
  }, {} as Record<string, string>);

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
            query = query.eq('due_date', getLocalToday());
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

  // Sort tasks based on selected option
  const sortTasks = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          // Tasks with due dates first (soonest first), then tasks without dates
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        case 'starred':
          // Starred first, then by date
          if (a.is_starred && !b.is_starred) return -1;
          if (!a.is_starred && b.is_starred) return 1;
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        case 'list':
          // Sort by list name alphabetically
          const listA = listNameMap[a.list_id] || '';
          const listB = listNameMap[b.list_id] || '';
          return listA.localeCompare(listB);
        case 'created':
          // Most recently created first
          return b.created_at.localeCompare(a.created_at);
        default:
          return 0;
      }
    });
  };

  const sortedTasks = sortTasks(tasks);

  // All visible tasks (for keyboard navigation)
  const allTasks = [...sortedTasks, ...(showCompleted ? completedTasks : [])];

  // Get selected task
  const selectedTask = [...tasks, ...completedTasks].find(t => t.id === selectedTaskId);
  const selectedIndex = allTasks.findIndex(t => t.id === selectedTaskId);

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      if (variables.is_completed) {
        playComplete();
      }
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
      playDelete();
      setSelectedTaskId(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskCounts'] });
    },
  });

  const handleToggleComplete = useCallback((task: Task) => {
    updateTask.mutate({
      id: task.id,
      is_completed: !task.is_completed,
      completed_at: !task.is_completed ? new Date().toISOString() : null,
    });
  }, [updateTask]);

  const handleToggleStar = useCallback((task: Task) => {
    updateTask.mutate({
      id: task.id,
      is_starred: !task.is_starred,
    });
  }, [updateTask]);

  // Keyboard navigation
  useEffect(() => {
    if (!keyboardEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'n':
          e.preventDefault();
          quickAddRef.current?.focus();
          break;

        case 'j': // Next task
          e.preventDefault();
          if (allTasks.length === 0) return;
          if (selectedIndex === -1) {
            setSelectedTaskId(allTasks[0].id);
          } else if (selectedIndex < allTasks.length - 1) {
            setSelectedTaskId(allTasks[selectedIndex + 1].id);
          }
          break;

        case 'k': // Previous task
          e.preventDefault();
          if (allTasks.length === 0) return;
          if (selectedIndex === -1) {
            setSelectedTaskId(allTasks[allTasks.length - 1].id);
          } else if (selectedIndex > 0) {
            setSelectedTaskId(allTasks[selectedIndex - 1].id);
          }
          break;

        case 'x': // Toggle complete
          if (selectedTask) {
            e.preventDefault();
            handleToggleComplete(selectedTask);
          }
          break;

        case 's': // Toggle star
          if (selectedTask && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handleToggleStar(selectedTask);
          }
          break;

        case 'Delete':
        case 'Backspace':
          if (selectedTask && target.tagName !== 'INPUT') {
            e.preventDefault();
            if (confirm('Delete this task?')) {
              deleteTask.mutate(selectedTask.id);
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          setSelectedTaskId(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardEnabled, allTasks, selectedIndex, selectedTask, setSelectedTaskId, handleToggleComplete, handleToggleStar, deleteTask]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse" style={{ color: '#2A54A1' }}>
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
          <TaskQuickAdd ref={quickAddRef} listId={effectiveListId} listType={listType} />
        )}

        {/* Sort controls */}
        {tasks.length > 0 && (
          <div className="px-4 py-2 flex justify-end relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: '#2A54A1' }}
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort: {sortBy === 'date' ? 'Due Date' : sortBy === 'starred' ? 'Starred' : sortBy === 'list' ? 'List' : 'Created'}
            </button>
            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-4 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
                  <button
                    onClick={() => { setSortBy('date'); setShowSortMenu(false); }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 ${sortBy === 'date' ? 'font-medium' : ''}`}
                    style={{ color: '#2A54A1' }}
                  >
                    Due Date
                  </button>
                  <button
                    onClick={() => { setSortBy('starred'); setShowSortMenu(false); }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 ${sortBy === 'starred' ? 'font-medium' : ''}`}
                    style={{ color: '#2A54A1' }}
                  >
                    Starred First
                  </button>
                  <button
                    onClick={() => { setSortBy('list'); setShowSortMenu(false); }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 ${sortBy === 'list' ? 'font-medium' : ''}`}
                    style={{ color: '#2A54A1' }}
                  >
                    List
                  </button>
                  <button
                    onClick={() => { setSortBy('created'); setShowSortMenu(false); }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 ${sortBy === 'created' ? 'font-medium' : ''}`}
                    style={{ color: '#2A54A1' }}
                  >
                    Recently Created
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tasks */}
        <div className="flex-1 overflow-y-auto">
          {sortedTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-lg" style={{ color: '#2A54A1' }}>
                {listType === 'completed'
                  ? 'No completed tasks yet'
                  : 'No tasks yet. Press N to add one!'}
              </p>
              <p className="text-sm mt-2" style={{ color: '#2A54A1' }}>
                Press ? for keyboard shortcuts
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              <AnimatePresence mode="popLayout">
                {sortedTasks.map((task) => (
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
                      showListName={listType === 'all' || listType === 'starred' || listType === 'today'}
                      listName={listNameMap[task.list_id]}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Completed section */}
              {completedTasks.length > 0 && listType !== 'completed' && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                    style={{ color: '#2A54A1' }}
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
