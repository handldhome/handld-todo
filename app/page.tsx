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

const tools = [
  {
    name: 'Schedule',
    icon: Calendar,
    href: 'https://schedule.handldhome.com/admin?key=alia&tab=schedule',
    color: '#3B82F6', // blue
  },
  {
    name: 'Tech Schedules',
    icon: Wrench,
    href: 'https://schedule.handldhome.com/admin?key=alia&tab=tech-schedules',
    color: '#10B981', // green
  },
  {
    name: 'Jobs',
    icon: Briefcase,
    href: 'https://schedule.handldhome.com/admin?key=alia&tab=jobs',
    color: '#F59E0B', // amber
  },
  {
    name: 'Tech Availability',
    icon: UserCheck,
    href: 'https://schedule.handldhome.com/admin?key=alia&tab=availability',
    color: '#8B5CF6', // purple
  },
  {
    name: 'To Do',
    icon: CheckSquare,
    href: '/inbox',
    color: '#EC4899', // pink
  },
  {
    name: 'Website',
    icon: Globe,
    href: 'https://handldhome.com',
    color: '#6366F1', // indigo
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

export default function CommandCenter() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

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
