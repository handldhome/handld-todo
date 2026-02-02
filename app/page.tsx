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

      {/* Airtable Data Widgets */}
      <div className="max-w-5xl mx-auto px-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unscheduled Jobs Widget */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: NAVY }}>
              <Briefcase className="w-5 h-5 text-amber-500" />
              Unscheduled Jobs
              {!jobsLoading && !jobsError && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  {unscheduledJobs.length}
                </span>
              )}
            </h3>
            <a
              href="https://schedule.handldhome.com/admin?key=alia&tab=jobs"
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              View all <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {jobsLoading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : jobsError ? (
            <p className="text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {jobsError}
            </p>
          ) : unscheduledJobs.length === 0 ? (
            <p className="text-sm text-slate-400">No unscheduled jobs in the next 2 weeks</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {unscheduledJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="p-3 bg-slate-50 rounded-lg text-sm"
                >
                  <p className="font-medium" style={{ color: NAVY }}>
                    {job.customerName}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-slate-500 text-xs">
                    {job.targetDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(job.targetDate)}
                      </span>
                    )}
                    {job.jobType && (
                      <span>{job.jobType}</span>
                    )}
                  </div>
                  {job.address && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.address}
                    </p>
                  )}
                </div>
              ))}
              {unscheduledJobs.length > 5 && (
                <p className="text-xs text-slate-400 text-center pt-2">
                  +{unscheduledJobs.length - 5} more jobs
                </p>
              )}
            </div>
          )}
        </div>

        {/* Pending Quote Follow-ups Widget */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: NAVY }}>
              <AlertCircle className="w-5 h-5 text-red-500" />
              Quote Follow-ups
              {!quotesLoading && !quotesError && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  {pendingQuotes.length}
                </span>
              )}
            </h3>
          </div>

          {quotesLoading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : quotesError ? (
            <p className="text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {quotesError}
            </p>
          ) : pendingQuotes.length === 0 ? (
            <p className="text-sm text-slate-400">No quotes pending follow-up</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingQuotes.slice(0, 5).map((quote) => (
                <div
                  key={quote.id}
                  className="p-3 bg-red-50 rounded-lg text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium" style={{ color: NAVY }}>
                      {quote.customerName}
                    </p>
                    <span className="text-xs text-red-600">
                      {quote.hoursAgo}h ago
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {quote.phoneNumber && (
                      <a
                        href={`tel:${quote.phoneNumber}`}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
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
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Quote
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {pendingQuotes.length > 5 && (
                <p className="text-xs text-slate-400 text-center pt-2">
                  +{pendingQuotes.length - 5} more quotes
                </p>
              )}
            </div>
          )}
        </div>
      </div>

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

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-400">
        Handld Command Center
      </footer>
    </div>
  );
}
