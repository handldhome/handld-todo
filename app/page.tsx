'use client';

import Link from 'next/link';
import {
  Calendar,
  Users,
  Briefcase,
  UserCheck,
  CheckSquare,
  Globe,
  Wrench
} from 'lucide-react';

const NAVY = '#2A54A1';

const tools = [
  {
    name: 'Schedule',
    description: 'View and manage schedules',
    icon: Calendar,
    href: 'https://schedule.handldhome.com/?key=alia',
    external: true,
    color: '#3B82F6', // blue
  },
  {
    name: 'Tech Schedule',
    description: 'Technician scheduling',
    icon: Wrench,
    href: 'https://schedule.handldhome.com/?key=alia',
    external: true,
    color: '#10B981', // green
  },
  {
    name: 'Jobs List',
    description: 'View all jobs',
    icon: Briefcase,
    href: 'https://schedule.handldhome.com/?key=alia',
    external: true,
    color: '#F59E0B', // amber
  },
  {
    name: 'Tech Availability',
    description: 'Check tech availability',
    icon: UserCheck,
    href: 'https://schedule.handldhome.com/?key=alia',
    external: true,
    color: '#8B5CF6', // purple
  },
  {
    name: 'To Do',
    description: 'Tasks and reminders',
    icon: CheckSquare,
    href: '/inbox',
    external: false,
    color: '#EC4899', // pink
  },
  {
    name: 'Website',
    description: 'handldhome.com',
    icon: Globe,
    href: 'https://handldhome.com',
    external: true,
    color: '#6366F1', // indigo
  },
];

export default function CommandCenter() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="py-8 px-4 text-center">
        {/* Logo placeholder - replace src with actual logo */}
        <img
          src="/logo.png"
          alt="Handld"
          className="h-16 md:h-20 mx-auto mb-4"
        />
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide" style={{ color: NAVY }}>
          COMMAND
        </h1>
      </header>

      {/* Tools Grid */}
      <main className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <a
                key={tool.name}
                href={tool.href}
                className="group bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col items-center text-center"
              >
                <div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: `${tool.color}15` }}
                >
                  <Icon
                    className="w-8 h-8 md:w-10 md:h-10"
                    style={{ color: tool.color }}
                  />
                </div>
                <h2
                  className="text-lg md:text-xl font-semibold mb-1"
                  style={{ color: NAVY }}
                >
                  {tool.name}
                </h2>
                <p className="text-sm text-slate-500 hidden md:block">
                  {tool.description}
                </p>
              </a>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-400">
        Handld Command Center
      </footer>
    </div>
  );
}
