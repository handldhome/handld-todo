'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { useKeyboardStore } from '@/lib/stores/keyboardStore';
import { CreateListModal } from '@/components/modals/CreateListModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { KeyboardShortcutsModal } from '@/components/modals/KeyboardShortcutsModal';
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
  Keyboard,
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
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore();
  const { isOpen, setIsOpen } = useSidebarStore();
  const { enabled: keyboardEnabled, setShowShortcutsModal } = useKeyboardStore();
  const [showCreateList, setShowCreateList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const pendingKey = useRef<string | null>(null);
  const pendingTimeout = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Global keyboard shortcuts
  useEffect(() => {
    if (!keyboardEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle 'g' prefix for navigation
      if (pendingKey.current === 'g') {
        if (pendingTimeout.current) {
          clearTimeout(pendingTimeout.current);
          pendingTimeout.current = null;
        }
        pendingKey.current = null;

        switch (e.key) {
          case 'i':
            e.preventDefault();
            router.push('/inbox');
            return;
          case 'a':
            e.preventDefault();
            router.push('/all');
            return;
          case 's':
            e.preventDefault();
            router.push('/starred');
            return;
          case 't':
            e.preventDefault();
            router.push('/today');
            return;
          case 'c':
            e.preventDefault();
            router.push('/completed');
            return;
        }
      }

      // Start 'g' sequence
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        pendingKey.current = 'g';
        pendingTimeout.current = setTimeout(() => {
          pendingKey.current = null;
        }, 500);
        return;
      }

      // Single key shortcuts
      switch (e.key) {
        case '?':
          e.preventDefault();
          setShowShortcutsModal(true);
          break;
        case ',':
          e.preventDefault();
          setShowSettings(true);
          break;
        case 'l':
          e.preventDefault();
          setShowCreateList(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
      }
    };
  }, [keyboardEnabled, router, setShowShortcutsModal]);

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
          w-[240px] bg-[var(--wl-sidebar-bg)] border-r border-[var(--wl-divider)]
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${sidebarCollapsed ? 'md:-translate-x-full md:w-0' : ''}
        `}
      >
        {/* User header */}
        <div className="px-3 py-2.5 border-b border-[var(--wl-divider)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--wl-red)] flex items-center justify-center text-white text-sm font-medium">
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
        <nav className="flex-1 overflow-y-auto py-1">
          <div className="px-1.5 space-y-0.5">
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
                    flex items-center gap-2.5 px-2.5 py-2 rounded-md
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
          <div className="my-2 mx-3 border-t border-[var(--wl-divider)]" />

          {/* User lists */}
          <div className="px-1.5 space-y-0.5">
            {lists.map((list) => {
              const active = pathname === `/list/${list.id}`;
              const count = list.tasks?.[0]?.count || 0;

              return (
                <Link
                  key={list.id}
                  href={`/list/${list.id}`}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-2.5 px-2.5 py-2 rounded-md
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
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md
                text-[var(--wl-sidebar-count)] hover:bg-[var(--wl-sidebar-selected)]/50
                transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Create new list</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-1.5 py-1.5 border-t border-[var(--wl-divider)]">
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md
              text-[var(--wl-sidebar-count)] hover:bg-[var(--wl-sidebar-selected)]/50
              transition-colors"
          >
            <Keyboard className="w-4 h-4" />
            <span className="text-sm">Shortcuts</span>
            <kbd className="ml-auto text-xs px-1.5 py-0.5 bg-[var(--wl-divider)] rounded">?</kbd>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md
              text-[var(--wl-sidebar-count)] hover:bg-[var(--wl-sidebar-selected)]/50
              transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
            <kbd className="ml-auto text-xs px-1.5 py-0.5 bg-[var(--wl-divider)] rounded">,</kbd>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md
              text-[var(--wl-sidebar-count)] hover:bg-[var(--wl-sidebar-selected)]/50
              transition-colors"
          >
            <LogOut className="w-4 h-4" />
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
      <KeyboardShortcutsModal />
    </>
  );
}
