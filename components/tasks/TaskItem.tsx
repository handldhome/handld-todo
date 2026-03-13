'use client';

import { Calendar, ChevronRight, ListChecks, Star } from 'lucide-react';
import { formatDueDate, isOverdue } from '@/lib/dateUtils';
import type { Task } from '@/types';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
  onToggleStar: () => void;
  showListName?: boolean;
  showDueDate?: boolean;
  listName?: string;
}

export function TaskItem({
  task,
  isSelected,
  onSelect,
  onToggleComplete,
  onToggleStar,
  showListName,
  showDueDate = true,
  listName,
}: TaskItemProps) {
  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      onClick={onSelect}
      className={`
        flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3.5 sm:py-3 cursor-pointer border-l-2
        transition-colors active:bg-[#1a1a1a]
        ${isSelected
          ? 'bg-[#1a1a1a] border-[#FF6600]'
          : 'border-transparent hover:bg-[#111]'
        }
        ${task.is_completed ? 'opacity-50' : ''}
      `}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center
          ${task.is_completed
            ? 'bg-[#00D46A] border-[#00D46A]'
            : 'border-[#FF6600] bg-transparent hover:bg-[#FF6600]/20'
          }`}
      >
        {task.is_completed && (
          <span className="text-black text-[10px] font-bold">✓</span>
        )}
      </button>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${task.is_completed ? 'line-through text-[#555]' : 'text-white'}`}
        >
          {task.title}
        </span>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 shrink-0">
        {/* List name */}
        {showListName && listName && (
          <span className="hidden md:inline text-xs text-[#888] uppercase">{listName}</span>
        )}

        {/* Due date */}
        {showDueDate && task.due_date && !task.is_completed && (
          <span
            className={`flex items-center gap-1 text-[10px] sm:text-xs ${
              isOverdue(task.due_date) ? 'text-[#FF4444]' : 'text-[#888]'
            }`}
          >
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{formatDueDate(task.due_date).toUpperCase()}</span>
            <span className="sm:hidden">{formatDueDate(task.due_date).toUpperCase().replace('TOMORROW', 'TMR').replace('YESTERDAY', 'YEST')}</span>
          </span>
        )}

        {/* Subtasks indicator */}
        {totalSubtasks > 0 && (
          <span className="flex items-center gap-1 text-xs text-[#888]">
            <ListChecks className="w-3.5 h-3.5" />
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}

        {/* Star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
          className="p-1.5 -mr-1"
        >
          <Star
            className={`w-4 h-4 ${
              task.is_starred
                ? 'fill-[#FFB800] text-[#FFB800]'
                : 'text-[#555] hover:text-[#FFB800]'
            }`}
          />
        </button>

        {/* Mobile chevron */}
        <ChevronRight className="w-4 h-4 text-[#333] md:hidden" />
      </div>
    </div>
  );
}
