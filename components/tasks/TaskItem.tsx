'use client';

import { TaskCheckbox } from './TaskCheckbox';
import { TaskStar } from './TaskStar';
import { Calendar, ListChecks } from 'lucide-react';
import { formatDueDate, isOverdue } from '@/lib/dateUtils';
import type { Task } from '@/types';

const NAVY = '#2A54A1';
const NAVY_COMPLETED = '#7A9BD4';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
  onToggleStar: () => void;
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
          ? 'border-[#2A54A1] shadow-sm'
          : 'hover:bg-white hover:shadow-sm'
        }
        ${task.is_completed ? 'opacity-60' : ''}
      `}
      style={{ color: NAVY }}
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
          className={`text-[15px] truncate ${task.is_completed ? 'line-through' : ''}`}
          style={{ color: task.is_completed ? NAVY_COMPLETED : NAVY }}
        >
          {task.title}
        </p>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Due date */}
        {task.due_date && !task.is_completed && (
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: isOverdue(task.due_date) ? '#DC2626' : NAVY }}
          >
            <Calendar className="w-3.5 h-3.5" />
            {formatDueDate(task.due_date)}
          </span>
        )}

        {/* Subtasks indicator */}
        {totalSubtasks > 0 && (
          <span className="flex items-center gap-1 text-xs" style={{ color: NAVY }}>
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
