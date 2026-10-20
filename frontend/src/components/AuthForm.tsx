'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Smartphone } from 'lucide-react';
import { auth } from '@/lib/api';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === 'register';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await auth.register({ name, email, password });
      } else {
        await auth.login({ email, password });
      }
      router.replace('/');
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Authentication request failed',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">
              iPhone Stock Manager
            </h1>
            <p className="text-sm text-slate-500">
              {isRegister ? 'Create an account to get started' : 'Sign in to your account'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label htmlFor="name" className="label">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="input"
                autoComplete="name"
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={isRegister ? 12 : undefined}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {isRegister && (
              <p className="mt-1.5 text-xs text-slate-500">
                Use at least 12 characters.
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full justify-center py-3 text-sm"
            disabled={submitting}
          >
            {submitting
              ? 'Processing...'
              : isRegister
                ? 'Create Account'
                : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <Link
            href={isRegister ? '/login' : '/register'}
            className="font-semibold text-orange-600 hover:text-orange-700"
          >
            {isRegister ? 'Sign In' : 'Register'}
          </Link>
        </p>
      </div>
    </main>
  );
}
