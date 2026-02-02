'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
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
  AlertCircle,
  Phone,
  RefreshCw,
  ExternalLink,
  Clock,
  MapPin,
} from 'lucide-react';

const NAVY = '#2A54A1';
const WEATHER_API_KEY = '5fef1daf633f6e100c89a58c25220c72';
const ZIP_CODE = '91103';

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

const tools = [
  {
    name: 'Schedule',
    icon: Calendar,
    href: 'https://schedule.handldhome.com/admin?key=alia&tab=schedule',
    color: '#3B82F6',
  },
  {
    name: 'Tech Schedules',
    icon: Wrench,
    href: 'https://schedule.handldhome.com/admin?key=alia&tab=tech-schedules',
    color: '#10B981',
  },
  {
    name: 'Jobs',
    icon: Briefcase,
    href: 'https://schedule.handldhome.com/admin?key=alia&tab=jobs',
    color: '#F59E0B',
  },
  {
    name: 'Tech Availability',
    icon: UserCheck,
    href: 'https://schedule.handldhome.com/admin?key=alia&tab=availability',
    color: '#8B5CF6',
  },
  {
    name: 'To Do',
    icon: CheckSquare,
    href: '/inbox',
    color: '#EC4899',
  },
  {
    name: 'Website',
    icon: Globe,
    href: 'https://handldhome.com',
    color: '#6366F1',
  },
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CommandCenter() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unscheduledJobs, setUnscheduledJobs] = useState<UnscheduledJob[]>([]);
  const [pendingQuotes, setPendingQuotes] = useState<PendingQuote[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [quotesError, setQuotesError] = useState<string | null>(null);

  // Fetch weather
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
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  // Fetch unscheduled jobs
  useEffect(() => {
    async function fetchUnscheduledJobs() {
      try {
        const res = await fetch('/api/airtable/unscheduled-jobs');
        const data = await res.json();
        if (data.error) {
          setJobsError(data.error);
        } else {
          setUnscheduledJobs(data.jobs || []);
        }
      } catch (error) {
        setJobsError('Failed to load jobs');
        console.error('Failed to fetch unscheduled jobs:', error);
      } finally {
        setJobsLoading(false);
      }
    }
    fetchUnscheduledJobs();
  }, []);

  // Fetch pending quotes
  useEffect(() => {
    async function fetchPendingQuotes() {
      try {
        const res = await fetch('/api/airtable/pending-quotes');
        const data = await res.json();
        if (data.error) {
          setQuotesError(data.error);
        } else {
          setPendingQuotes(data.quotes || []);
        }
      } catch (error) {
        setQuotesError('Failed to load quotes');
        console.error('Failed to fetch pending quotes:', error);
      } finally {
        setQuotesLoading(false);
      }
    }
    fetchPendingQuotes();
  }, []);

  const WeatherIcon = weather ? getWeatherIcon(weather.icon) : Cloud;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFF2' }}>
      {/* Header */}
      <header className="py-8 px-4 text-center">
        <img
          src="/logo.png"
          alt="Handld"
          className="h-32 md:h-44 mx-auto mb-3"
        />
        <h1 className="text-xl md:text-2xl font-semibold tracking-widest uppercase" style={{ color: NAVY }}>
          Command
        </h1>
      </header>

      {/* Weather Widget */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm flex items-center justify-between">
          {loading ? (
            <p className="text-slate-400">Loading weather...</p>
          ) : weather ? (
            <>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <WeatherIcon className="w-8 h-8 md:w-9 md:h-9 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold" style={{ color: NAVY }}>
                    {weather.temp}°F
                  </p>
                  <p className="text-sm text-slate-500 capitalize">
                    {weather.description}
                  </p>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm text-slate-500">{weather.city}</p>
                <p className="text-sm text-slate-400">
                  Feels like {weather.feels_like}°F • Wind {weather.wind} mph
                </p>
              </div>
            </>
          ) : (
            <p className="text-slate-400">Weather unavailable</p>
          )}
        </div>
      </div>

      {/* Main Content with Sidebars */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex gap-4">
          {/* Left Sidebar - Unscheduled Jobs */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm" style={{ color: NAVY }}>
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  Unscheduled
                  {!jobsLoading && !jobsError && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      {unscheduledJobs.length}
                    </span>
                  )}
                </h3>
                <a
                  href="https://schedule.handldhome.com/admin?key=alia&tab=jobs"
                  className="text-slate-400 hover:text-slate-600"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {jobsLoading ? (
                <p className="text-xs text-slate-400">Loading...</p>
              ) : jobsError ? (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Error loading
                </p>
              ) : unscheduledJobs.length === 0 ? (
                <p className="text-xs text-slate-400">No unscheduled jobs</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {unscheduledJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-2 bg-slate-50 rounded-lg text-xs"
                    >
                      <p className="font-medium truncate" style={{ color: NAVY }}>
                        {job.customerName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-slate-500">
                        {job.targetDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(job.targetDate)}
                          </span>
                        )}
                      </div>
                      {job.jobType && (
                        <p className="text-slate-400 mt-0.5">{job.jobType}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center - Tools Grid */}
          <main className="flex-1 min-w-0">
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
                  className="text-lg md:text-xl font-semibold"
                  style={{ color: NAVY }}
                >
                  {tool.name}
                </h2>
              </a>
            );
          })}
            </div>
          </main>

          {/* Right Sidebar - Quote Follow-ups */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm" style={{ color: NAVY }}>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Follow-ups
                  {!quotesLoading && !quotesError && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      {pendingQuotes.length}
                    </span>
                  )}
                </h3>
              </div>

              {quotesLoading ? (
                <p className="text-xs text-slate-400">Loading...</p>
              ) : quotesError ? (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Error loading
                </p>
              ) : pendingQuotes.length === 0 ? (
                <p className="text-xs text-slate-400">No pending follow-ups</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {pendingQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="p-2 bg-red-50 rounded-lg text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate" style={{ color: NAVY }}>
                          {quote.customerName}
                        </p>
                        <span className="text-red-600 shrink-0 ml-1">
                          {quote.hoursAgo}h
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        {quote.phoneNumber && (
                          <a
                            href={`tel:${quote.phoneNumber}`}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {quote.phoneNumber}
                          </a>
                        )}
                        {quote.quoteLink && (
                          <a
                            href={quote.quoteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Quote
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-400">
        Handld Command Center
      </footer>
    </div>
  );
}
