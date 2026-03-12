'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { getLocalToday } from '@/lib/dateUtils';
import {
  Calendar,
  Database,
  Briefcase,
  UserCheck,
  CheckSquare,
  Globe,
  Wrench,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Phone,
  RefreshCw,
  ExternalLink,
  Clock,
  X,
  Rocket,
  Circle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Video,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Link2,
} from 'lucide-react';

interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  city: string;
  humidity: number;
  wind: number;
}

interface UnscheduledJob {
  id: string;
  customerName: string;
  address: string;
  jobType: string;
  targetDate: string;
  status: string;
}

interface PendingQuote {
  id: string;
  customerName: string;
  phoneNumber: string;
  quoteLink: string;
  hoursAgo: number;
}

interface TodoTask {
  id: string;
  title: string;
  is_completed: boolean;
  is_starred: boolean;
  due_date: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  meetLink?: string;
  attendees?: Array<{ email: string; name?: string; status?: string }>;
}

interface ScheduledJob {
  id: string;
  customerName: string;
  address: string;
  service: string;
  serviceDetail: string;
  time: string | null;
  endTime: string | null;
  status: string;
  assignedTech: string[];
  confirmed: boolean;
}

const WEATHER_API_KEY = '5fef1daf633f6e100c89a58c25220c72';
const ZIP_CODE = '91103';

const tools = [
  { name: 'DATABASE', icon: Database, href: 'https://database.handldhome.com', key: 'd' },
  { name: 'SCHEDULE', icon: Calendar, href: 'https://schedule.handldhome.com/admin?key=alia&tab=schedule', key: 's' },
  { name: 'TECH SCHED', icon: Wrench, href: 'https://schedule.handldhome.com/admin?key=alia&tab=tech-schedules', key: 't' },
  { name: 'JOBS', icon: Briefcase, href: 'https://schedule.handldhome.com/admin?key=alia&tab=jobs', key: 'j' },
  { name: 'AVAIL', icon: UserCheck, href: 'https://schedule.handldhome.com/admin?key=alia&tab=availability', key: 'a' },
  { name: 'TODO', icon: CheckSquare, href: '/today', key: 'o' },
  { name: 'WEBSITE', icon: Globe, href: 'https://handldhome.com', key: 'w' },
  { name: 'PRO', icon: Rocket, href: 'https://pro.handldhome.com/admin', key: 'p' },
];

function getWeatherIcon(iconCode: string) {
  if (iconCode.includes('01')) return Sun;
  if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) return Cloud;
  if (iconCode.includes('09') || iconCode.includes('10')) return CloudRain;
  if (iconCode.includes('11')) return CloudLightning;
  if (iconCode.includes('13')) return CloudSnow;
  return Wind;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

export default function CommandCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unscheduledJobs, setUnscheduledJobs] = useState<UnscheduledJob[]>([]);
  const [pendingQuotes, setPendingQuotes] = useState<PendingQuote[]>([]);
  const [todayTasks, setTodayTasks] = useState<TodoTask[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [dismissedQuotes, setDismissedQuotes] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarNeedsAuth, setCalendarNeedsAuth] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [scheduledJobsLoading, setScheduledJobsLoading] = useState(true);

  const supabase = createClient();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getCurrentTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts for tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Don't trigger if modifier keys are pressed
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const tool = tools.find(t => t.key === e.key.toLowerCase());
      if (tool) {
        e.preventDefault();
        if (tool.href.startsWith('/')) {
          router.push(tool.href);
        } else {
          window.open(tool.href, '_blank');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Sync follow-ups to tasks
  const syncFollowUps = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/airtable/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`+${data.result.created} SYNCED`);
        fetchTodayTasks();
      } else {
        setSyncResult('SYNC ERR');
      }
    } catch {
      setSyncResult('SYNC FAIL');
    } finally {
      setSyncing(false);
    }
  };

  // Fetch today's tasks (including overdue)
  const fetchTodayTasks = async () => {
    if (!user) return;
    try {
      const today = getLocalToday();
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, is_completed, is_starred, due_date')
        .lte('due_date', today)
        .order('is_completed', { ascending: true })
        .order('due_date', { ascending: true })
        .order('position');

      if (error) throw error;
      setTodayTasks(data || []);
    } catch {
      setTasksError('ERR');
    } finally {
      setTasksLoading(false);
    }
  };

  // Toggle task completion
  const toggleTaskComplete = async (task: TodoTask) => {
    const newStatus = !task.is_completed;
    setTodayTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t)
    );

    const { error } = await supabase
      .from('tasks')
      .update({
        is_completed: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    if (error) {
      setTodayTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, is_completed: !newStatus } : t)
      );
    }
  };

  useEffect(() => {
    if (user) {
      syncFollowUps();
      fetchTodayTasks();
    }
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem('dismissedQuotes');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedQuotes(new Set(parsed));
      } catch {}
    }
  }, []);

  const dismissQuote = (quoteId: string) => {
    const newDismissed = new Set(dismissedQuotes);
    newDismissed.add(quoteId);
    setDismissedQuotes(newDismissed);
    localStorage.setItem('dismissedQuotes', JSON.stringify([...newDismissed]));
  };

  const visibleQuotes = pendingQuotes.filter(q => !dismissedQuotes.has(q.id));

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?zip=${ZIP_CODE},us&appid=${WEATHER_API_KEY}&units=imperial`
        );
        const data = await res.json();
        setWeather({
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          city: data.name,
          humidity: data.main.humidity,
          wind: Math.round(data.wind.speed),
        });
      } catch {}
      finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  useEffect(() => {
    async function fetchUnscheduledJobs() {
      try {
        const res = await fetch('/api/airtable/unscheduled-jobs');
        const data = await res.json();
        if (data.error) {
          setJobsError('ERR');
        } else {
          setUnscheduledJobs(data.jobs || []);
        }
      } catch {
        setJobsError('ERR');
      } finally {
        setJobsLoading(false);
      }
    }
    fetchUnscheduledJobs();
  }, []);

  useEffect(() => {
    async function fetchPendingQuotes() {
      try {
        const res = await fetch('/api/airtable/pending-quotes');
        const data = await res.json();
        if (data.error) {
          setQuotesError('ERR');
        } else {
          setPendingQuotes(data.quotes || []);
        }
      } catch {
        setQuotesError('ERR');
      } finally {
        setQuotesLoading(false);
      }
    }
    fetchPendingQuotes();
  }, []);

  // Fetch calendar events
  useEffect(() => {
    async function fetchCalendarEvents() {
      try {
        const res = await fetch('/api/google/calendar');
        const data = await res.json();
        if (data.needsAuth) {
          setCalendarNeedsAuth(true);
        } else if (data.events) {
          setCalendarEvents(data.events);
          setCalendarNeedsAuth(false);
        }
      } catch {
        console.error('Failed to fetch calendar');
      } finally {
        setCalendarLoading(false);
      }
    }
    fetchCalendarEvents();
  }, []);

  // Fetch today's scheduled jobs
  useEffect(() => {
    async function fetchScheduledJobs() {
      try {
        const res = await fetch('/api/airtable/todays-jobs');
        const data = await res.json();
        if (data.jobs) {
          setScheduledJobs(data.jobs);
        }
      } catch {
        console.error('Failed to fetch scheduled jobs');
      } finally {
        setScheduledJobsLoading(false);
      }
    }
    fetchScheduledJobs();
  }, []);

  const formatEventTime = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${startTime} - ${endTime}`;
  };

  const WeatherIcon = weather ? getWeatherIcon(weather.icon) : Cloud;
  const incompleteTasks = todayTasks.filter(t => !t.is_completed);
  const completedTasks = todayTasks.filter(t => t.is_completed);

  return (
    <div className="min-h-screen bg-black text-white p-2 md:p-4">
      {/* Header Bar */}
      <header className="flex items-center justify-between border border-[#333] bg-[#111] px-4 py-3 mb-3">
        <div className="flex items-center gap-4">
          <span className="text-[#FF6600] font-bold text-xl tracking-wider">HANDLD</span>
          <span className="text-[#888] text-sm hidden md:inline">COMMAND CENTER</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#00D4FF] text-base font-medium">{currentTime}</span>
          <span className="text-[#888] text-sm hidden md:inline">{getCurrentDate()}</span>
          <Activity className="w-5 h-5 text-[#00D46A]" />
        </div>
      </header>

      {/* Tools Row */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <a
              key={tool.name}
              href={tool.href}
              target={tool.href.startsWith('/') ? '_self' : '_blank'}
              rel={tool.href.startsWith('/') ? undefined : 'noopener noreferrer'}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#333] hover:border-[#FF6600] hover:bg-[#1a1a1a] transition-colors min-w-fit group"
            >
              <span className="text-[#888] text-xs font-medium w-4 group-hover:text-[#FF6600]">{tool.key.toUpperCase()}</span>
              <Icon className="w-5 h-5 text-[#FF6600]" />
              <span className="text-white text-sm">{tool.name}</span>
            </a>
          );
        })}
      </div>

      {/* Weather Bar */}
      <div className="flex items-center justify-between border border-[#333] bg-[#111] px-4 py-3 mb-3">
        {loading ? (
          <span className="text-[#888] text-sm">LOADING WEATHER...</span>
        ) : weather ? (
          <>
            <div className="flex items-center gap-4">
              <WeatherIcon className="w-6 h-6 text-[#FFB800]" />
              <span className="text-[#FFB800] text-2xl font-bold">{weather.temp}°F</span>
              <span className="text-[#888] text-sm uppercase hidden sm:inline">{weather.description}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[#888] hidden md:inline">FEELS: <span className="text-white">{weather.feels_like}°F</span></span>
              <span className="text-[#888] hidden md:inline">WIND: <span className="text-white">{weather.wind}MPH</span></span>
              <span className="text-[#00D4FF]">{weather.city.toUpperCase()}</span>
            </div>
          </>
        ) : (
          <span className="text-[#FF4444] text-sm">WEATHER UNAVAILABLE</span>
        )}
      </div>

      {/* Main Grid - 2x2 Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Panel 1: Calendar */}
        <div className="border border-[#333] bg-[#0a0a0a]">
          <div className="bg-[#00D4FF] text-black px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wide">TODAY&apos;S SCHEDULE</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">{calendarEvents.length + scheduledJobs.length}</span>
              {!calendarNeedsAuth && (
                <Clock className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {calendarLoading ? (
              <div className="p-4 text-[#888] text-sm">LOADING CALENDAR...</div>
            ) : calendarNeedsAuth ? (
              <div className="p-4">
                <p className="text-[#888] text-sm mb-3">Connect Google Calendar to see your meetings</p>
                <a
                  href="/api/google/auth"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-black text-sm font-bold hover:bg-[#00B8E0] transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  CONNECT GOOGLE CALENDAR
                </a>
              </div>
            ) : calendarEvents.length === 0 ? (
              <div className="p-4 text-[#888] text-sm">NO MEETINGS TODAY</div>
            ) : (
              calendarEvents.map((event, i) => (
                <div key={event.id} className={`border-b border-[#222] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#111]'}`}>
                  <div
                    className="px-4 py-3 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                    onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-[#00D4FF] text-xs font-medium whitespace-nowrap">
                          {formatEventTime(event.start, event.end)}
                        </span>
                        <span className="text-white text-sm truncate">{event.title}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {event.meetLink && <Video className="w-4 h-4 text-[#00D46A]" />}
                        {expandedEventId === event.id ? (
                          <ChevronUp className="w-4 h-4 text-[#888]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#888]" />
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedEventId === event.id && (
                    <div className="px-4 pb-3 space-y-2 border-t border-[#222] pt-2 bg-[#111]">
                      {event.location && (
                        <div className="flex items-center gap-2 text-xs text-[#888]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.meetLink && (
                        <a
                          href={event.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-[#00D46A] hover:underline"
                        >
                          <Video className="w-3.5 h-3.5" />
                          JOIN MEETING
                        </a>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-start gap-2 text-xs text-[#888]">
                          <Users className="w-3.5 h-3.5 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {event.attendees.slice(0, 5).map((a, idx) => (
                              <span key={idx} className="bg-[#222] px-1.5 py-0.5 rounded">
                                {a.name || a.email}
                              </span>
                            ))}
                            {event.attendees.length > 5 && (
                              <span className="text-[#888]">+{event.attendees.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      {event.description && (
                        <p className="text-xs text-[#888] line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            {/* Today's Scheduled Jobs */}
            {scheduledJobsLoading ? (
              <div className="p-4 text-[#888] text-sm border-t border-[#333]">LOADING JOBS...</div>
            ) : scheduledJobs.length > 0 && (
              <>
                <div className="px-4 py-2 bg-[#111] text-[#FF6600] text-xs font-bold border-t border-[#333] flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5" />
                  WORK SCHEDULED ({scheduledJobs.length})
                </div>
                {scheduledJobs.map((job, i) => (
                  <div key={job.id} className={`px-4 py-3 border-b border-[#222] ${i % 2 === 0 ? 'bg-[#0d0800]' : 'bg-[#111]'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {job.time && (
                          <span className="text-[#00D4FF] text-xs font-medium whitespace-nowrap">
                            {job.time}{job.endTime ? ` - ${job.endTime}` : ''}
                          </span>
                        )}
                        <span className="text-white text-sm truncate">{job.customerName}</span>
                      </div>
                      <span className={`text-xs ml-2 ${job.status === 'Completed' ? 'text-[#00D46A]' : job.status === 'In Progress' ? 'text-[#00D4FF]' : 'text-[#888]'}`}>
                        {job.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[#FF6600] text-xs">{job.service}{job.serviceDetail ? ` - ${job.serviceDetail}` : ''}</span>
                    </div>
                    {job.address && (
                      <div className="flex items-center gap-1.5 mt-1 text-[#888] text-xs">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{job.address}</span>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Panel 2: Today's Tasks */}
        <div className="border border-[#333] bg-[#0a0a0a]">
          <div className="bg-[#00D46A] text-black px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wide">TODAY&apos;S TASKS</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">{incompleteTasks.length}</span>
              <a href="/today">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {tasksLoading ? (
              <div className="p-4 text-[#888] text-sm">LOADING...</div>
            ) : tasksError ? (
              <div className="p-4 text-[#FF4444] text-sm">ERROR LOADING DATA</div>
            ) : todayTasks.length === 0 ? (
              <div className="p-4 text-[#888] text-sm">NO TASKS FOR TODAY</div>
            ) : (
              <>
                {incompleteTasks.map((task, i) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskComplete(task)}
                    className={`px-4 py-3 border-b border-[#222] cursor-pointer hover:bg-[#1a1a1a] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#111]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border border-[#00D46A] flex-shrink-0" />
                      <span className="text-white text-sm truncate">{task.title}</span>
                    </div>
                  </div>
                ))}
                {completedTasks.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-[#111] text-[#888] text-xs border-b border-[#222]">
                      COMPLETED ({completedTasks.length})
                    </div>
                    {completedTasks.slice(0, 3).map((task, i) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTaskComplete(task)}
                        className={`px-4 py-3 border-b border-[#222] cursor-pointer hover:bg-[#1a1a1a] opacity-50 ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#111]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-[#00D46A] flex-shrink-0 flex items-center justify-center text-black text-[10px] font-bold">✓</div>
                          <span className="text-[#888] text-sm truncate line-through">{task.title}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Panel 3: Unscheduled Jobs */}
        <div className="border border-[#333] bg-[#0a0a0a]">
          <div className="bg-[#FF6600] text-black px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wide">UNSCHEDULED JOBS</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">{unscheduledJobs.length}</span>
              <a href="https://schedule.handldhome.com/admin?key=alia&tab=jobs">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {jobsLoading ? (
              <div className="p-4 text-[#888] text-sm">LOADING...</div>
            ) : jobsError ? (
              <div className="p-4 text-[#FF4444] text-sm">ERROR LOADING DATA</div>
            ) : unscheduledJobs.length === 0 ? (
              <div className="p-4 text-[#888] text-sm">NO UNSCHEDULED JOBS</div>
            ) : (
              unscheduledJobs.map((job, i) => (
                <div key={job.id} className={`px-4 py-3 border-b border-[#222] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#111]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm truncate flex-1">{job.customerName}</span>
                    {job.targetDate && (
                      <span className="text-[#FFB800] text-xs ml-2">{formatDate(job.targetDate)}</span>
                    )}
                  </div>
                  {job.jobType && (
                    <div className="text-[#888] text-xs mt-1">{job.jobType}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel 4: Quote Follow-ups */}
        <div className="border border-[#333] bg-[#0a0a0a]">
          <div className="bg-[#FF4444] text-black px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wide">FOLLOW-UPS</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">{visibleQuotes.length}</span>
              <button
                onClick={syncFollowUps}
                disabled={syncing || !user}
                className="disabled:opacity-50"
                title="Sync to TODO"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          {syncResult && (
            <div className={`px-4 py-1.5 text-xs ${syncResult.includes('ERR') || syncResult.includes('FAIL') ? 'text-[#FF4444]' : 'text-[#00D46A]'}`}>
              {syncResult}
            </div>
          )}
          <div className="max-h-[40vh] overflow-y-auto">
            {quotesLoading ? (
              <div className="p-4 text-[#888] text-sm">LOADING...</div>
            ) : quotesError ? (
              <div className="p-4 text-[#FF4444] text-sm">ERROR LOADING DATA</div>
            ) : visibleQuotes.length === 0 ? (
              <div className="p-4 text-[#888] text-sm">NO PENDING FOLLOW-UPS</div>
            ) : (
              visibleQuotes.map((quote, i) => (
                <div key={quote.id} className={`px-4 py-3 border-b border-[#222] group ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#111]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm truncate flex-1">{quote.customerName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF4444] text-xs">{quote.hoursAgo}H AGO</span>
                      <button
                        onClick={() => dismissQuote(quote.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-[#888] hover:text-[#FF4444]" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    {quote.phoneNumber && (
                      <a href={`tel:${quote.phoneNumber}`} className="text-[#00D4FF] text-xs hover:underline flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {quote.phoneNumber}
                      </a>
                    )}
                    {quote.quoteLink && (
                      <a href={quote.quoteLink} target="_blank" rel="noopener noreferrer" className="text-[#00D4FF] text-xs hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        QUOTE
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-3 border border-[#333] bg-[#111] px-4 py-2.5 flex items-center justify-between text-xs">
        <span className="text-[#888]">HANDLD HOME SERVICES</span>
        <div className="flex items-center gap-4">
          <span className="text-[#888]">SYS: <span className="text-[#00D46A]">ONLINE</span></span>
          <span className="text-[#888]">API: <span className="text-[#00D46A]">OK</span></span>
          <TrendingUp className="w-4 h-4 text-[#00D46A]" />
        </div>
      </footer>
    </div>
  );
}
