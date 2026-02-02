'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Loader2 } from 'lucide-react';

const NAVY = '#2A54A1';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
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

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setError(null);
        alert('Check your email for the magic link!');
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
          Welcome back
        </h1>
        <p className="mt-2" style={{ color: NAVY }}>
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Enter your password"
              required
            />
          </div>
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
          Sign in
        </button>
      </form>

      <div className="mt-4">
        <button
          onClick={handleMagicLink}
          disabled={isLoading}
          className="w-full py-2 px-4 border border-gray-200 hover:bg-gray-50 font-medium rounded-lg transition-colors disabled:opacity-50"
          style={{ color: NAVY }}
        >
          Send magic link
        </button>
      </div>

      <p className="mt-6 text-center text-sm" style={{ color: NAVY }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="hover:underline font-medium" style={{ color: NAVY }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
