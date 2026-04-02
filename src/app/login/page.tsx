'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push('/dashboard');
    } else {
      if (result?.error && result.error !== 'CredentialsSignin') {
        setError(result.error);
      } else {
        setError('Invalid email or password');
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-fade-in">
      <div className="card w-full max-w-md p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white flex items-center justify-center p-2">
          <Image src="/logo.png" alt="HustleTrack" width={64} height={64} className="object-contain w-full h-full" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1 gradient-text">HustleTrack</h1>
        <p className="text-center text-white/60 mb-8">Track your side hustle income</p>

        <form action={handleSubmit} className="space-y-5">
          {registered && (
            <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Account created! Please sign in.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-white/70 mb-2">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              className="glass-input"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-white/70 mb-2">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="glass-input pr-12"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-white/60 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-purple-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card w-full max-w-md p-8 animate-pulse">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/10" />
          <div className="h-8 w-40 mx-auto bg-white/10 rounded mb-2" />
          <div className="h-4 w-48 mx-auto bg-white/10 rounded mb-8" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
