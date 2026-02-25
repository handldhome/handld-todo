'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { getLocalToday } from '@/lib/dateUtils';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { useKeyboardStore, DEFAULT_SHORTCUTS } from '@/lib/stores/keyboardStore';
import { CreateListModal } from '@/components/modals/CreateListModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { KeyboardShortcutsModal } from '@/components/modals/KeyboardShortcutsModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Inbox,
  ListTodo,
  Star,
  Calendar,
  CheckCircle2,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  Keyboard,
  GripVertical,
  LayoutGrid,
  Trash2,
} from 'lucide-react';
import type { List } from '@/types';

const smartLists = [
  { id: 'inbox', name: 'INBOX', icon: Inbox, path: '/inbox', key: '1' },
  { id: 'all', name: 'ALL', icon: ListTodo, path: '/all', key: '2' },
  { id: 'starred', name: 'STARRED', icon: Star, path: '/starred', key: '3' },
  { id: 'today', name: 'TODAY', icon: Calendar, path: '/today', key: '4' },
  { id: 'completed', name: 'DONE', icon: CheckCircle2, path: '/completed', key: '5' },
];

interface SortableListItemProps {
  list: List & { tasks: { count: number }[] };
  active: boolean;
  isEditing: boolean;
  editingListName: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  onEditingNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onStartEdit: (list: List & { tasks: { count: number }[] }) => void;
  onDelete: (list: List & { tasks: { count: number }[] }) => void;
  onCloseSidebar: () => void;
}

function SortableListItem({
  list,
  active,
  isEditing,
  editingListName,
  editInputRef,
  onEditingNameChange,
  onSaveEdit,
  onEditKeyDown,
  onStartEdit,
  onDelete,
  onCloseSidebar,
}: SortableListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const count = list.tasks?.[0]?.count || 0;

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 px-2 py-1.5 bg-[#1a1a1a] border border-[#FF6600]"
      >
        <div className="w-2 h-2" style={{ backgroundColor: list.color }} />
        <input
          ref={editInputRef}
          type="text"
          value={editingListName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={onEditKeyDown}
          className="flex-1 text-xs text-white bg-transparent outline-none uppercase"
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 group relative border-l-2 ${
        active ? 'bg-[#1a1a1a] border-[#FF6600]' : 'border-transparent hover:bg-[#111]'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="w-3 h-3 text-[#555]" />
      </div>
      <Link
        href={`/list/${list.id}`}
        onClick={onCloseSidebar}
        className="flex-1 flex items-center gap-2 min-w-0"
      >
        <div className="w-2 h-2" style={{ backgroundColor: list.color }} />
        <span className="flex-1 text-xs text-white truncate uppercase">{list.name}</span>
        {count > 0 && (
          <span className="text-[10px] text-[#888]">{count}</span>
        )}
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#333] text-[#888] hover:text-[#FF6600]"
      >
        <Settings className="w-3 h-3" />
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full z-20 bg-[#111] border border-[#333] py-1 min-w-[100px]">
            <button
              onClick={() => {
                onStartEdit(list);
                setShowMenu(false);
              }}
              className="w-full px-3 py-1 text-left text-[10px] text-white hover:bg-[#1a1a1a] uppercase"
            >
              Rename
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this list and all its tasks?')) {
                  onDelete(list);
                }
                setShowMenu(false);
              }}
              className="w-full px-3 py-1 text-left text-[10px] text-[#FF4444] hover:bg-[#1a1a1a] uppercase"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isOpen, setIsOpen, setSelectedTaskId } = useSidebarStore();
  const { enabled: keyboardEnabled, setShowShortcutsModal } = useKeyboardStore();
  const { theme, setTheme } = useSettingsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch lists
  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*, tasks:tasks(count)')
        .eq('is_inbox', false)
        .order('position');

      if (error) throw error;
      return data as (List & { tasks: { count: number }[] })[];
    },
    enabled: !!user,
  });

  const { data: taskCounts } = useQuery({
    queryKey: ['taskCounts'],
    queryFn: async () => {
      const { data: inboxList } = await supabase
        .from('lists')
        .select('id')
        .eq('is_inbox', true)
        .single() as { data: { id: string } | null };

      const counts: Record<string, number> = {};

      if (inboxList) {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', inboxList.id)
          .eq('is_completed', false);
        counts.inbox = count || 0;
      }

      const { count: allCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', false);
      counts.all = allCount || 0;

      const { count: starredCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_starred', true)
        .eq('is_completed', false);
      counts.starred = starredCount || 0;

      // Today count (includes overdue tasks)
      const { count: todayCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lte('due_date', getLocalToday())
        .eq('is_completed', false);
      counts.today = todayCount || 0;

      const { count: completedCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true);
      counts.completed = completedCount || 0;

      return counts;
    },
    enabled: !!user,
  });

  const updateList = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('lists')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setEditingListId(null);
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('list_id', id);
      if (tasksError) throw tasksError;

      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.push('/today');
    },
  });

  const reorderLists = useMutation({
    mutationFn: async (reorderedLists: { id: string; position: number }[]) => {
      for (const list of reorderedLists) {
        const { error } = await supabase
          .from('lists')
          .update({ position: list.position })
          .eq('id', list.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      const reordered = arrayMove(lists, oldIndex, newIndex);
      reorderLists.mutate(
        reordered.map((list, index) => ({ id: list.id, position: index }))
      );
    }
  };

  const startEditing = (list: List & { tasks: { count: number }[] }) => {
    setEditingListId(list.id);
    setEditingListName(list.name);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const saveEdit = () => {
    if (editingListId && editingListName.trim()) {
      updateList.mutate({ id: editingListId, name: editingListName.trim() });
    }
    setEditingListId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditingListId(null);
  };

  const allNavigationItems = [
    ...smartLists.map(s => s.path),
    ...lists.map(l => `/list/${l.id}`),
  ];

  // Keyboard shortcuts
  useEffect(() => {
    if (!keyboardEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
      } else if (e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      } else if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowCreateModal(true);
      } else if (e.key === 'Escape') {
        setSelectedTaskId(null);
        setIsOpen(false);
      } else if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        const currentIndex = allNavigationItems.findIndex(path => pathname === path);
        if (currentIndex !== -1) {
          const newIndex = e.key === ']'
            ? (currentIndex + 1) % allNavigationItems.length
            : (currentIndex - 1 + allNavigationItems.length) % allNavigationItems.length;
          router.push(allNavigationItems[newIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardEnabled, pathname, router, allNavigationItems, setSelectedTaskId, setIsOpen]);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-2 left-2 z-50 p-2 bg-[#111] border border-[#333] md:hidden"
      >
        {isOpen ? <X className="w-5 h-5 text-[#FF6600]" /> : <Menu className="w-5 h-5 text-[#FF6600]" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-30 md:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-[220px] bg-[#0a0a0a] border-r border-[#333]
        flex flex-col
        transform transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-3 border-b border-[#333]">
          <Link href="/" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-[#FF6600]" />
            <span className="text-[#FF6600] font-bold text-sm tracking-wider">HANDLD</span>
          </Link>
        </div>

        {/* Smart Lists */}
        <div className="p-2 border-b border-[#333]">
          <div className="text-[9px] text-[#555] uppercase tracking-wider px-2 mb-1">Views</div>
          {smartLists.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            const count = taskCounts?.[item.id] || 0;

            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={closeSidebar}
                className={`flex items-center gap-2 px-2 py-1.5 border-l-2 ${
                  active ? 'bg-[#1a1a1a] border-[#FF6600]' : 'border-transparent hover:bg-[#111]'
                }`}
              >
                <span className="text-[#FF6600] text-[9px] font-bold w-3">{item.key}</span>
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#FF6600]' : 'text-[#888]'}`} />
                <span className={`flex-1 text-xs uppercase ${active ? 'text-white' : 'text-[#888]'}`}>
                  {item.name}
                </span>
                {count > 0 && (
                  <span className={`text-[10px] ${active ? 'text-[#FF6600]' : 'text-[#555]'}`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Custom Lists */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[9px] text-[#555] uppercase tracking-wider">Lists</span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-0.5 hover:bg-[#333] text-[#888] hover:text-[#FF6600]"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={lists.map(l => l.id)} strategy={verticalListSortingStrategy}>
              {lists.map((list) => (
                <SortableListItem
                  key={list.id}
                  list={list}
                  active={pathname === `/list/${list.id}`}
                  isEditing={editingListId === list.id}
                  editingListName={editingListName}
                  editInputRef={editInputRef}
                  onEditingNameChange={setEditingListName}
                  onSaveEdit={saveEdit}
                  onEditKeyDown={handleEditKeyDown}
                  onStartEdit={startEditing}
                  onDelete={(l) => deleteList.mutate(l.id)}
                  onCloseSidebar={closeSidebar}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[#333]">
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-[#888] hover:text-white hover:bg-[#111]"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="text-xs uppercase">Shortcuts</span>
            <span className="ml-auto text-[9px] text-[#555]">?</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-[#888] hover:text-white hover:bg-[#111]"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="text-xs uppercase">Settings</span>
            <span className="ml-auto text-[9px] text-[#555]">,</span>
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-[#FF4444] hover:bg-[#111]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-xs uppercase">Logout</span>
          </button>
        </div>
      </aside>

      {/* Modals */}
      <CreateListModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <KeyboardShortcutsModal />
    </>
  );
}
