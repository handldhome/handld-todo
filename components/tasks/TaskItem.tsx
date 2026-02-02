'use client';

import { TaskCheckbox } from './TaskCheckbox';
import { TaskStar } from './TaskStar';
import { Calendar, ListChecks } from 'lucide-react';
import type { Task } from '@/types';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
  onToggleStar: () => void;
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function TaskItem({
  task,
  isSelected,
  onSelect,
  onToggleComplete,
  onToggleStar,
}: TaskItemProps) {
  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      onClick={onSelect}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer
        bg-white/80 backdrop-blur-sm border border-transparent
        transition-all duration-150
        ${isSelected
          ? 'border-[var(--wl-red)] shadow-sm'
          : 'hover:bg-white hover:shadow-sm'
        }
        ${task.is_completed ? 'opacity-60' : ''}
      `}
    >
      {/* Checkbox */}
      <TaskCheckbox
        checked={task.is_completed}
        onChange={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
      />

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <p
          className={`
            text-[15px] truncate
            ${task.is_completed
              ? 'text-[var(--wl-text-completed)] line-through'
              : 'text-[var(--wl-text-primary)]'
            }
          `}
        >
          {task.title}
        </p>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Due date */}
        {task.due_date && !task.is_completed && (
          <span
            className={`
              flex items-center gap-1 text-xs
              ${isOverdue(task.due_date)
                ? 'text-red-500'
                : 'text-[var(--wl-text-secondary)]'
              }
            `}
          >
            <Calendar className="w-3.5 h-3.5" />
            {formatDueDate(task.due_date)}
          </span>
        )}

        {/* Subtasks indicator */}
        {totalSubtasks > 0 && (
          <span className="flex items-center gap-1 text-xs text-[var(--wl-text-secondary)]">
            <ListChecks className="w-3.5 h-3.5" />
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}

        {/* Star */}
        <TaskStar
          starred={task.is_starred}
          onChange={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
        />
      </div>
    </div>
  );
}
