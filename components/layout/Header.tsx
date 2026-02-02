'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { Menu, MoreHorizontal } from 'lucide-react';
import type { List } from '@/types';

const smartListTitles: Record<string, string> = {
  '/inbox': 'Inbox',
  '/all': 'All Tasks',
  '/starred': 'Starred',
  '/today': 'Today',
  '/completed': 'Completed',
};

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toggleSidebar, sidebarCollapsed } = useSettingsStore();
  const { setIsOpen } = useSidebarStore();
  const supabase = createClient();

  // Get list name if on a list page
  const listId = pathname.startsWith('/list/') ? pathname.split('/')[2] : null;

  const { data: list } = useQuery<List | null>({
    queryKey: ['list', listId],
    queryFn: async () => {
      const { data } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId!)
        .single();
      return data as List | null;
    },
    enabled: !!listId && !!user,
  });

  const title = list?.name || smartListTitles[pathname] || 'Tasks';

  return (
    <header className="h-14 bg-[var(--wl-red)] flex items-center px-4 gap-4 shrink-0">
      {/* Menu button (shows sidebar on mobile, toggles on desktop) */}
      <button
        onClick={() => {
          if (window.innerWidth < 768) {
            setIsOpen(true);
          } else {
            toggleSidebar();
          }
        }}
        className="p-1.5 rounded hover:bg-white/10 text-white transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <h1 className="flex-1 text-lg font-medium text-white truncate">
        {title}
      </h1>

      {/* More options */}
      <button className="p-1.5 rounded hover:bg-white/10 text-white transition-colors">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </header>
  );
}
