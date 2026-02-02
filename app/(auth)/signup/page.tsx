'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

const NAVY = '#2A54A1';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: '', color: '', width: '0%' };
    if (pwd.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (pwd.length < 8) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
    if (pwd.length < 12 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    }
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/inbox');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8" style={{ color: NAVY }}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: NAVY }}>
          Create your account
        </h1>
        <p className="mt-2" style={{ color: NAVY }}>
          Start organizing your tasks today
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: NAVY }}>
            Full name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: NAVY }} />
            <input
              id="name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A54A1] focus:border-transparent"
              style={{ color: NAVY }}
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: NAVY }}>
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: NAVY }} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A54A1] focus:border-transparent"
              style={{ color: NAVY }}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: NAVY }}>
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: NAVY }} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A54A1] focus:border-transparent"
              style={{ color: NAVY }}
              placeholder="Create a password"
              required
            />
          </div>
          {password && (
            <div className="mt-2">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${passwordStrength.color} transition-all duration-300`}
                  style={{ width: passwordStrength.width }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: NAVY }}>
                {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: NAVY }}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: NAVY }}>
        Already have an account?{' '}
        <Link href="/login" className="hover:underline font-medium" style={{ color: NAVY }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
