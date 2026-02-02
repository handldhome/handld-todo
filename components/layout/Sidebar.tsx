'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { CreateListModal } from '@/components/modals/CreateListModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
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
  ChevronRight,
} from 'lucide-react';
import type { List } from '@/types';

const smartLists = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, path: '/inbox' },
  { id: 'all', name: 'All', icon: ListTodo, path: '/all' },
  { id: 'starred', name: 'Starred', icon: Star, path: '/starred' },
  { id: 'today', name: 'Today', icon: Calendar, path: '/today' },
  { id: 'completed', name: 'Completed', icon: CheckCircle2, path: '/completed' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore();
  const { isOpen, setIsOpen } = useSidebarStore();
  const [showCreateList, setShowCreateList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const supabase = createClient();

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

      // Inbox count
      if (inboxList) {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', inboxList.id)
          .eq('is_completed', false);
        counts.inbox = count || 0;
      }

      // All tasks count
      const { count: allCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', false);
      counts.all = allCount || 0;

      // Starred count
      const { count: starredCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_starred', true)
        .eq('is_completed', false);
      counts.starred = starredCount || 0;

      // Today count
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('due_date', today)
        .eq('is_completed', false);
      counts.today = todayCount || 0;

      // Completed count
      const { count: completedCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true);
      counts.completed = completedCount || 0;

      return counts;
    },
    enabled: !!user,
  });

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          w-[280px] bg-[var(--wl-sidebar-bg)] border-r border-[var(--wl-divider)]
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${sidebarCollapsed ? 'md:-translate-x-full md:w-0' : ''}
        `}
      >
        {/* User header */}
        <div className="p-4 border-b border-[var(--wl-divider)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--wl-red)] flex items-center justify-center text-white font-medium">
                {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--wl-sidebar-text)] truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-[var(--wl-sidebar-count)] truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 hover:bg-[var(--wl-divider)] rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smart lists */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-2 space-y-0.5">
            {smartLists.map((list) => {
              const Icon = list.icon;
              const count = taskCounts?.[list.id] || 0;
              const active = isActive(list.path);

              return (
                <Link
                  key={list.id}
                  href={list.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors
                    ${active
                      ? 'bg-[var(--wl-sidebar-selected)] shadow-sm'
                      : 'hover:bg-[var(--wl-sidebar-selected)]/50'
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      list.id === 'starred' && active
                        ? 'text-[var(--wl-star-active)]'
                        : active
                        ? 'text-[var(--wl-red)]'
                        : 'text-[var(--wl-sidebar-count)]'
                    }`}
                  />
                  <span className="flex-1 text-sm font-medium text-[var(--wl-sidebar-text)]">
                    {list.name}
                  </span>
                  {count > 0 && (
                    <span className="text-xs text-[var(--wl-sidebar-count)]">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 mx-4 border-t border-[var(--wl-divider)]" />

          {/* User lists */}
          <div className="px-2 space-y-0.5">
            {lists.map((list) => {
              const active = pathname === `/list/${list.id}`;
              const count = list.tasks?.[0]?.count || 0;

              return (
                <Link
                  key={list.id}
                  href={`/list/${list.id}`}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors
                    ${active
                      ? 'bg-[var(--wl-sidebar-selected)] shadow-sm'
                      : 'hover:bg-[var(--wl-sidebar-selected)]/50'
                    }
                  `}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-[var(--wl-sidebar-text)] truncate">
                    {list.name}
                  </span>
                  {count > 0 && (
                    <span className="text-xs text-[var(--wl-sidebar-count)]">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Create new list button */}
            <button
              onClick={() => setShowCreateList(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-[var(--wl-sidebar-count)] hover:bg-[var(--wl-sidebar-selected)]/50
                transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">Create new list</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-[var(--wl-divider)]">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-[var(--wl-sidebar-count)] hover:bg-[var(--wl-sidebar-selected)]/50
              transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-[var(--wl-sidebar-count)] hover:bg-[var(--wl-sidebar-selected)]/50
              transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-4 left-4 z-30 md:hidden
          w-12 h-12 rounded-full bg-[var(--wl-red)] text-white
          flex items-center justify-center shadow-lg
          ${isOpen ? 'hidden' : ''}
        `}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Modals */}
      <CreateListModal
        isOpen={showCreateList}
        onClose={() => setShowCreateList(false)}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
